-- ============================================================================
-- MIGRATION : Correction assigned_by NULL + Sécurité RLS
-- Date : 2025-11-14
-- Auteur : Cascade AI
-- Description : 
--   1. Corriger assigned_by NULL
--   2. Ajouter colonnes de traçabilité (disabled_at, disabled_by)
--   3. Activer RLS sur user_modules
--   4. Créer fonction RPC de validation
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1 : Corriger assigned_by NULL
-- ============================================================================

-- Mettre à jour les assignations existantes avec un admin par défaut
UPDATE user_modules
SET assigned_by = (
  SELECT id FROM users 
  WHERE role IN ('admin_groupe', 'super_admin')
  ORDER BY created_at ASC
  LIMIT 1
)
WHERE assigned_by IS NULL;

-- Ajouter une contrainte NOT NULL (après avoir corrigé les données)
ALTER TABLE user_modules
ALTER COLUMN assigned_by SET NOT NULL;

-- ============================================================================
-- ÉTAPE 2 : Ajouter colonnes de traçabilité
-- ============================================================================

-- Colonnes pour soft delete
ALTER TABLE user_modules
ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS disabled_by UUID REFERENCES users(id);

-- Index pour performance sur les requêtes de modules actifs/désactivés
CREATE INDEX IF NOT EXISTS idx_user_modules_enabled 
ON user_modules(user_id, is_enabled) 
WHERE is_enabled = true;

CREATE INDEX IF NOT EXISTS idx_user_modules_disabled 
ON user_modules(user_id, is_enabled) 
WHERE is_enabled = false;

-- Index sur assigned_by pour traçabilité
CREATE INDEX IF NOT EXISTS idx_user_modules_assigned_by 
ON user_modules(assigned_by);

-- ============================================================================
-- ÉTAPE 3 : Activer RLS (Row Level Security)
-- ============================================================================

-- Activer RLS sur user_modules
ALTER TABLE user_modules ENABLE ROW LEVEL SECURITY;

-- Policy 1 : Les utilisateurs peuvent voir uniquement leurs propres modules
CREATE POLICY "users_view_own_modules"
ON user_modules
FOR SELECT
USING (
  auth.uid() = user_id
);

-- Policy 2 : Les Admin Groupe peuvent voir les modules de leur groupe
CREATE POLICY "admin_view_group_modules"
ON user_modules
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users u1, users u2
    WHERE u1.id = auth.uid()
    AND u2.id = user_modules.user_id
    AND u1.school_group_id = u2.school_group_id
    AND u1.role IN ('admin_groupe', 'super_admin')
  )
);

-- Policy 3 : Les Admin Groupe peuvent assigner des modules
CREATE POLICY "admin_assign_modules"
ON user_modules
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u1, users u2
    WHERE u1.id = auth.uid()
    AND u2.id = user_modules.user_id
    AND u1.school_group_id = u2.school_group_id
    AND u1.role IN ('admin_groupe', 'super_admin')
  )
);

-- Policy 4 : Les Admin Groupe peuvent mettre à jour les modules
CREATE POLICY "admin_update_modules"
ON user_modules
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users u1, users u2
    WHERE u1.id = auth.uid()
    AND u2.id = user_modules.user_id
    AND u1.school_group_id = u2.school_group_id
    AND u1.role IN ('admin_groupe', 'super_admin')
  )
);

-- Policy 5 : Les Admin Groupe peuvent supprimer les modules
CREATE POLICY "admin_delete_modules"
ON user_modules
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users u1, users u2
    WHERE u1.id = auth.uid()
    AND u2.id = user_modules.user_id
    AND u1.school_group_id = u2.school_group_id
    AND u1.role IN ('admin_groupe', 'super_admin')
  )
);

-- ============================================================================
-- ÉTAPE 4 : Fonction RPC pour assignation sécurisée
-- ============================================================================

CREATE OR REPLACE FUNCTION assign_module_with_validation(
  p_user_id UUID,
  p_module_id UUID,
  p_assigned_by UUID,
  p_permissions JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_group_id UUID;
  v_user_group_id UUID;
  v_module_available BOOLEAN;
  v_result JSONB;
BEGIN
  -- 1. Vérifier que l'admin existe et récupérer son groupe
  SELECT school_group_id INTO v_admin_group_id
  FROM users 
  WHERE id = p_assigned_by
  AND role IN ('admin_groupe', 'super_admin');
  
  IF v_admin_group_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non autorisé à assigner des modules';
  END IF;
  
  -- 2. Vérifier que l'utilisateur cible existe et récupérer son groupe
  SELECT school_group_id INTO v_user_group_id
  FROM users 
  WHERE id = p_user_id;
  
  IF v_user_group_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur cible introuvable';
  END IF;
  
  -- 3. Vérifier que l'admin et l'utilisateur sont du même groupe
  IF v_admin_group_id != v_user_group_id THEN
    RAISE EXCEPTION 'Admin et utilisateur doivent être du même groupe scolaire';
  END IF;
  
  -- 4. Vérifier que le module existe et est actif
  IF NOT EXISTS (
    SELECT 1 FROM modules
    WHERE id = p_module_id
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Module introuvable ou inactif';
  END IF;
  
  -- 5. Vérifier que le module est disponible pour le groupe
  SELECT EXISTS (
    SELECT 1 FROM group_module_configs
    WHERE school_group_id = v_admin_group_id
    AND module_id = p_module_id
    AND is_enabled = true
  ) INTO v_module_available;
  
  IF NOT v_module_available THEN
    RAISE EXCEPTION 'Module non disponible pour ce groupe scolaire';
  END IF;
  
  -- 6. Insérer ou mettre à jour l'assignation
  INSERT INTO user_modules (
    user_id,
    module_id,
    is_enabled,
    assigned_at,
    assigned_by,
    settings,
    access_count,
    last_accessed_at
  ) VALUES (
    p_user_id,
    p_module_id,
    true,
    NOW(),
    p_assigned_by,
    jsonb_build_object('permissions', p_permissions),
    0,
    NULL
  )
  ON CONFLICT (user_id, module_id) 
  DO UPDATE SET
    is_enabled = true,
    assigned_at = NOW(),
    assigned_by = p_assigned_by,
    settings = jsonb_build_object('permissions', p_permissions),
    disabled_at = NULL,
    disabled_by = NULL;
  
  -- 7. Retourner le résultat
  SELECT jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'module_id', p_module_id,
    'assigned_at', NOW()
  ) INTO v_result;
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Commentaire sur la fonction
COMMENT ON FUNCTION assign_module_with_validation IS 
'Assigne un module à un utilisateur avec validation complète des permissions et du groupe scolaire';

-- ============================================================================
-- ÉTAPE 5 : Fonction RPC pour révocation sécurisée
-- ============================================================================

CREATE OR REPLACE FUNCTION revoke_module_with_validation(
  p_user_id UUID,
  p_module_id UUID,
  p_revoked_by UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_group_id UUID;
  v_user_group_id UUID;
  v_result JSONB;
BEGIN
  -- 1. Vérifier que l'admin existe et récupérer son groupe
  SELECT school_group_id INTO v_admin_group_id
  FROM users 
  WHERE id = p_revoked_by
  AND role IN ('admin_groupe', 'super_admin');
  
  IF v_admin_group_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non autorisé à révoquer des modules';
  END IF;
  
  -- 2. Vérifier que l'utilisateur cible existe et récupérer son groupe
  SELECT school_group_id INTO v_user_group_id
  FROM users 
  WHERE id = p_user_id;
  
  IF v_user_group_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur cible introuvable';
  END IF;
  
  -- 3. Vérifier que l'admin et l'utilisateur sont du même groupe
  IF v_admin_group_id != v_user_group_id THEN
    RAISE EXCEPTION 'Admin et utilisateur doivent être du même groupe scolaire';
  END IF;
  
  -- 4. Soft delete : désactiver le module
  UPDATE user_modules
  SET 
    is_enabled = false,
    disabled_at = NOW(),
    disabled_by = p_revoked_by
  WHERE user_id = p_user_id
  AND module_id = p_module_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignation de module introuvable';
  END IF;
  
  -- 5. Retourner le résultat
  SELECT jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'module_id', p_module_id,
    'disabled_at', NOW()
  ) INTO v_result;
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Commentaire sur la fonction
COMMENT ON FUNCTION revoke_module_with_validation IS 
'Révoque un module d''un utilisateur avec validation complète des permissions et du groupe scolaire';

-- ============================================================================
-- ÉTAPE 6 : Vérifications finales
-- ============================================================================

-- Vérifier qu'il n'y a plus de assigned_by NULL
DO $$
DECLARE
  v_null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_null_count
  FROM user_modules
  WHERE assigned_by IS NULL;
  
  IF v_null_count > 0 THEN
    RAISE EXCEPTION 'Il reste % assignations avec assigned_by NULL', v_null_count;
  END IF;
  
  RAISE NOTICE '✅ Toutes les assignations ont un assigned_by valide';
END $$;

-- Afficher les statistiques
SELECT 
  'Total assignations' as metric,
  COUNT(*) as value
FROM user_modules
UNION ALL
SELECT 
  'Assignations actives',
  COUNT(*)
FROM user_modules
WHERE is_enabled = true
UNION ALL
SELECT 
  'Assignations désactivées',
  COUNT(*)
FROM user_modules
WHERE is_enabled = false;

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================

-- Logs
DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '✅ Migration terminée avec succès !';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '1. ✅ assigned_by NULL corrigé';
  RAISE NOTICE '2. ✅ Colonnes de traçabilité ajoutées';
  RAISE NOTICE '3. ✅ RLS activé sur user_modules';
  RAISE NOTICE '4. ✅ Fonction assign_module_with_validation créée';
  RAISE NOTICE '5. ✅ Fonction revoke_module_with_validation créée';
  RAISE NOTICE '============================================================================';
END $$;

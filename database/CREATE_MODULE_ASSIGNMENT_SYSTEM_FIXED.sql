-- ============================================
-- SYSTÈME D'ASSIGNATION DE MODULES - VERSION CORRIGÉE
-- Compatible avec les tables existantes (modules et business_categories)
-- ============================================

-- ============================================
-- 0. NETTOYAGE DES VUES EXISTANTES
-- ============================================
DROP VIEW IF EXISTS user_module_permissions CASCADE;

-- ============================================
-- 1. UTILISER business_categories EXISTANTE
-- ============================================
-- On n'a PAS besoin de créer module_categories car business_categories existe déjà
-- Les modules utilisent déjà category_id qui référence business_categories

-- ============================================
-- 2. TABLE: user_assigned_modules (Assignations directes)
-- ============================================
CREATE TABLE IF NOT EXISTS user_assigned_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  
  -- Permissions granulaires
  can_read BOOLEAN DEFAULT true,
  can_write BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  can_export BOOLEAN DEFAULT false,
  
  -- Métadonnées
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  notes TEXT,
  
  -- Contrainte d'unicité
  UNIQUE(user_id, module_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_assigned_modules_user_id ON user_assigned_modules(user_id);
CREATE INDEX IF NOT EXISTS idx_user_assigned_modules_module_id ON user_assigned_modules(module_id);
CREATE INDEX IF NOT EXISTS idx_user_assigned_modules_assigned_by ON user_assigned_modules(assigned_by);

-- ============================================
-- 3. TABLE: user_assigned_categories (Assignations par catégorie)
-- ============================================
CREATE TABLE IF NOT EXISTS user_assigned_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES business_categories(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  
  -- Permissions par défaut pour tous les modules de la catégorie
  default_can_read BOOLEAN DEFAULT true,
  default_can_write BOOLEAN DEFAULT false,
  default_can_delete BOOLEAN DEFAULT false,
  default_can_export BOOLEAN DEFAULT false,
  
  -- Métadonnées
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  notes TEXT,
  
  -- Contrainte d'unicité
  UNIQUE(user_id, category_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_assigned_categories_user_id ON user_assigned_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_user_assigned_categories_category_id ON user_assigned_categories(category_id);

-- ============================================
-- 4. VUE: user_module_permissions (Permissions complètes)
-- ============================================
-- Cette vue combine les assignations directes et par catégorie
-- IMPORTANT: Utilise business_categories existante
CREATE OR REPLACE VIEW user_module_permissions AS
-- Assignations directes
SELECT 
  uma.user_id,
  m.id AS module_id,
  m.name AS module_name,
  m.slug AS module_slug,
  bc.id AS category_id,
  bc.name AS category_name,
  'direct'::TEXT AS assignment_type,
  uma.can_read,
  uma.can_write,
  uma.can_delete,
  uma.can_export,
  uma.assigned_by,
  uma.assigned_at,
  uma.valid_until
FROM user_assigned_modules uma
JOIN modules m ON uma.module_id = m.id
LEFT JOIN business_categories bc ON m.category_id = bc.id
WHERE uma.valid_until IS NULL OR uma.valid_until > NOW()

UNION ALL

-- Assignations par catégorie
SELECT 
  uac.user_id,
  m.id AS module_id,
  m.name AS module_name,
  m.slug AS module_slug,
  bc.id AS category_id,
  bc.name AS category_name,
  'category'::TEXT AS assignment_type,
  uac.default_can_read AS can_read,
  uac.default_can_write AS can_write,
  uac.default_can_delete AS can_delete,
  uac.default_can_export AS can_export,
  uac.assigned_by,
  uac.assigned_at,
  uac.valid_until
FROM user_assigned_categories uac
JOIN business_categories bc ON uac.category_id = bc.id
JOIN modules m ON m.category_id = bc.id
WHERE (uac.valid_until IS NULL OR uac.valid_until > NOW())
  AND m.status = 'active';

-- ============================================
-- 5. FONCTION: assign_module_to_user
-- ============================================
CREATE OR REPLACE FUNCTION assign_module_to_user(
  p_user_id UUID,
  p_module_id UUID,
  p_assigned_by UUID,
  p_can_read BOOLEAN DEFAULT true,
  p_can_write BOOLEAN DEFAULT false,
  p_can_delete BOOLEAN DEFAULT false,
  p_can_export BOOLEAN DEFAULT false,
  p_valid_until TIMESTAMPTZ DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Vérifier si déjà assigné
  IF EXISTS (
    SELECT 1 FROM user_assigned_modules 
    WHERE user_id = p_user_id AND module_id = p_module_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Module déjà assigné à cet utilisateur'
    );
  END IF;

  -- Insérer l'assignation
  INSERT INTO user_assigned_modules (
    user_id, module_id, assigned_by,
    can_read, can_write, can_delete, can_export,
    valid_until, notes
  ) VALUES (
    p_user_id, p_module_id, p_assigned_by,
    p_can_read, p_can_write, p_can_delete, p_can_export,
    p_valid_until, p_notes
  );

  RETURN json_build_object(
    'success', true,
    'message', 'Module assigné avec succès'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. FONCTION: revoke_module_from_user
-- ============================================
CREATE OR REPLACE FUNCTION revoke_module_from_user(
  p_user_id UUID,
  p_module_id UUID
)
RETURNS JSON AS $$
BEGIN
  DELETE FROM user_assigned_modules
  WHERE user_id = p_user_id AND module_id = p_module_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Assignation non trouvée'
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'message', 'Module révoqué avec succès'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. FONCTION: assign_category_to_user
-- ============================================
CREATE OR REPLACE FUNCTION assign_category_to_user(
  p_user_id UUID,
  p_category_id UUID,
  p_assigned_by UUID,
  p_can_read BOOLEAN DEFAULT true,
  p_can_write BOOLEAN DEFAULT false,
  p_can_delete BOOLEAN DEFAULT false,
  p_can_export BOOLEAN DEFAULT false,
  p_valid_until TIMESTAMPTZ DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
BEGIN
  -- Vérifier si déjà assignée
  IF EXISTS (
    SELECT 1 FROM user_assigned_categories 
    WHERE user_id = p_user_id AND category_id = p_category_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Catégorie déjà assignée à cet utilisateur'
    );
  END IF;

  -- Insérer l'assignation
  INSERT INTO user_assigned_categories (
    user_id, category_id, assigned_by,
    default_can_read, default_can_write, default_can_delete, default_can_export,
    valid_until, notes
  ) VALUES (
    p_user_id, p_category_id, p_assigned_by,
    p_can_read, p_can_write, p_can_delete, p_can_export,
    p_valid_until, p_notes
  );

  RETURN json_build_object(
    'success', true,
    'message', 'Catégorie assignée avec succès'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. POLITIQUES RLS (Row Level Security)
-- ============================================

-- Activer RLS
ALTER TABLE user_assigned_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_assigned_categories ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can view their own assigned modules" ON user_assigned_modules;
DROP POLICY IF EXISTS "Admins can manage module assignments" ON user_assigned_modules;
DROP POLICY IF EXISTS "Users can view their own assigned categories" ON user_assigned_categories;
DROP POLICY IF EXISTS "Admins can manage category assignments" ON user_assigned_categories;

-- Politique pour user_assigned_modules
CREATE POLICY "Users can view their own assigned modules"
  ON user_assigned_modules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage module assignments"
  ON user_assigned_modules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin_groupe')
    )
  );

-- Politique pour user_assigned_categories
CREATE POLICY "Users can view their own assigned categories"
  ON user_assigned_categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage category assignments"
  ON user_assigned_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin_groupe')
    )
  );

-- ============================================
-- 9. COMMENTAIRES
-- ============================================
COMMENT ON TABLE user_assigned_modules IS 'Assignations directes de modules aux utilisateurs par les admins de groupe';
COMMENT ON TABLE user_assigned_categories IS 'Assignations de catégories complètes aux utilisateurs';
COMMENT ON VIEW user_module_permissions IS 'Vue consolidée des permissions utilisateurs sur les modules (directes + catégories)';
COMMENT ON FUNCTION assign_module_to_user IS 'Assigne un module à un utilisateur avec permissions granulaires';
COMMENT ON FUNCTION revoke_module_from_user IS 'Révoque l''accès d''un utilisateur à un module';
COMMENT ON FUNCTION assign_category_to_user IS 'Assigne une catégorie complète à un utilisateur';

-- ============================================
-- 10. VÉRIFICATION
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Système d''assignation de modules créé avec succès!';
  RAISE NOTICE '📦 Tables créées: user_assigned_modules, user_assigned_categories';
  RAISE NOTICE '👁️ Vue créée: user_module_permissions';
  RAISE NOTICE '⚙️ Fonctions créées: assign_module_to_user, revoke_module_from_user, assign_category_to_user';
  RAISE NOTICE '🔒 Politiques RLS activées';
END $$;

-- Afficher les statistiques
SELECT 
  'Modules disponibles' AS type,
  COUNT(*) AS count
FROM modules
UNION ALL
SELECT 
  'Catégories disponibles' AS type,
  COUNT(*) AS count
FROM business_categories;

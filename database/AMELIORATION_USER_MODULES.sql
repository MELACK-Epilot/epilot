/**
 * AMÉLIORATION TABLE user_modules
 * Ajout de colonnes essentielles pour une gestion optimale
 * React 19 Best Practices + Expert Database Design
 * 
 * @module AMELIORATION_USER_MODULES
 */

-- =====================================================
-- ÉTAPE 1 : Ajouter les colonnes manquantes
-- =====================================================

-- Colonne is_enabled (ESSENTIELLE pour activer/désactiver sans supprimer)
ALTER TABLE public.user_modules 
ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT true;

-- Colonne disabled_at (traçabilité)
ALTER TABLE public.user_modules 
ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMPTZ NULL;

-- Colonne disabled_by (qui a désactivé)
ALTER TABLE public.user_modules 
ADD COLUMN IF NOT EXISTS disabled_by UUID NULL;

-- Colonne settings (configuration personnalisée par utilisateur)
ALTER TABLE public.user_modules 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Colonne last_accessed_at (analytics)
ALTER TABLE public.user_modules 
ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ NULL;

-- Colonne access_count (analytics)
ALTER TABLE public.user_modules 
ADD COLUMN IF NOT EXISTS access_count INTEGER DEFAULT 0;

-- =====================================================
-- ÉTAPE 2 : Ajouter les contraintes foreign key
-- =====================================================

-- Contrainte pour disabled_by (avec vérification d'existence)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_modules_disabled_by_fkey'
  ) THEN
    ALTER TABLE public.user_modules 
    ADD CONSTRAINT user_modules_disabled_by_fkey 
    FOREIGN KEY (disabled_by) REFERENCES users(id) ON DELETE SET NULL;
    RAISE NOTICE '✅ Contrainte user_modules_disabled_by_fkey créée';
  ELSE
    RAISE NOTICE '⚠️ Contrainte user_modules_disabled_by_fkey existe déjà';
  END IF;
END $$;

-- =====================================================
-- ÉTAPE 3 : Créer les index pour performance
-- =====================================================

-- Index sur is_enabled (requêtes fréquentes)
CREATE INDEX IF NOT EXISTS idx_user_modules_is_enabled 
ON public.user_modules(is_enabled) 
WHERE is_enabled = true;

-- Index composite user_id + is_enabled (requête principale)
CREATE INDEX IF NOT EXISTS idx_user_modules_user_enabled 
ON public.user_modules(user_id, is_enabled) 
WHERE is_enabled = true;

-- Index sur last_accessed_at (analytics)
CREATE INDEX IF NOT EXISTS idx_user_modules_last_accessed 
ON public.user_modules(last_accessed_at DESC NULLS LAST);

-- =====================================================
-- ÉTAPE 4 : Créer les fonctions utilitaires
-- =====================================================

-- Fonction pour désactiver un module
CREATE OR REPLACE FUNCTION disable_user_module(
  p_user_id UUID,
  p_module_id UUID,
  p_disabled_by UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_modules
  SET 
    is_enabled = false,
    disabled_at = NOW(),
    disabled_by = p_disabled_by,
    updated_at = NOW()
  WHERE user_id = p_user_id 
  AND module_id = p_module_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour activer un module
CREATE OR REPLACE FUNCTION enable_user_module(
  p_user_id UUID,
  p_module_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_modules
  SET 
    is_enabled = true,
    disabled_at = NULL,
    disabled_by = NULL,
    updated_at = NOW()
  WHERE user_id = p_user_id 
  AND module_id = p_module_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour enregistrer l'accès à un module (analytics)
CREATE OR REPLACE FUNCTION track_module_access(
  p_user_id UUID,
  p_module_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE user_modules
  SET 
    last_accessed_at = NOW(),
    access_count = access_count + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id 
  AND module_id = p_module_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ÉTAPE 5 : Créer les triggers
-- =====================================================

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_user_modules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_modules_updated_at ON user_modules;
CREATE TRIGGER trigger_user_modules_updated_at
  BEFORE UPDATE ON user_modules
  FOR EACH ROW
  EXECUTE FUNCTION update_user_modules_updated_at();

-- =====================================================
-- ÉTAPE 6 : Créer les RLS Policies
-- =====================================================

-- Activer RLS
ALTER TABLE user_modules ENABLE ROW LEVEL SECURITY;

-- Policy : Utilisateur voit uniquement SES modules assignés
DROP POLICY IF EXISTS "Users see only their assigned modules" ON user_modules;
CREATE POLICY "Users see only their assigned modules" 
ON user_modules
FOR SELECT 
USING (user_id = auth.uid());

-- Policy : Admin Groupe peut voir les modules des users de son groupe
DROP POLICY IF EXISTS "Admin groupe sees group users modules" ON user_modules;
CREATE POLICY "Admin groupe sees group users modules" 
ON user_modules
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM users u1, users u2
    WHERE u1.id = auth.uid()
    AND u1.role = 'admin_groupe'
    AND u2.id = user_modules.user_id
    AND u1.school_group_id = u2.school_group_id
  )
);

-- Policy : Admin Groupe peut assigner/modifier modules aux users de son groupe
DROP POLICY IF EXISTS "Admin groupe can manage group users modules" ON user_modules;
CREATE POLICY "Admin groupe can manage group users modules" 
ON user_modules
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM users u1, users u2
    WHERE u1.id = auth.uid()
    AND u1.role = 'admin_groupe'
    AND u2.id = user_modules.user_id
    AND u1.school_group_id = u2.school_group_id
  )
);

-- Policy : Super Admin peut tout faire
DROP POLICY IF EXISTS "Super admin full access on user_modules" ON user_modules;
CREATE POLICY "Super admin full access on user_modules" 
ON user_modules
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

-- =====================================================
-- ÉTAPE 7 : Créer une vue pour les analytics
-- =====================================================

CREATE OR REPLACE VIEW user_modules_analytics AS
SELECT 
  um.user_id,
  u.first_name,
  u.last_name,
  u.email,
  u.role,
  um.module_id,
  m.name as module_name,
  m.slug as module_slug,
  um.is_enabled,
  um.assigned_at,
  um.last_accessed_at,
  um.access_count,
  CASE 
    WHEN um.last_accessed_at IS NULL THEN 'Jamais utilisé'
    WHEN um.last_accessed_at > NOW() - INTERVAL '7 days' THEN 'Actif'
    WHEN um.last_accessed_at > NOW() - INTERVAL '30 days' THEN 'Peu actif'
    ELSE 'Inactif'
  END as usage_status,
  DATE_PART('day', NOW() - um.assigned_at) as days_since_assignment
FROM user_modules um
JOIN users u ON um.user_id = u.id
JOIN modules m ON um.module_id = m.id
ORDER BY um.last_accessed_at DESC NULLS LAST;

-- =====================================================
-- ÉTAPE 8 : Créer des fonctions d'analytics
-- =====================================================

-- Fonction : Modules les plus utilisés
CREATE OR REPLACE FUNCTION get_most_used_modules(
  p_school_group_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  module_id UUID,
  module_name TEXT,
  total_users BIGINT,
  total_accesses BIGINT,
  avg_accesses NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    um.module_id,
    m.name as module_name,
    COUNT(DISTINCT um.user_id) as total_users,
    SUM(um.access_count) as total_accesses,
    ROUND(AVG(um.access_count), 2) as avg_accesses
  FROM user_modules um
  JOIN modules m ON um.module_id = m.id
  JOIN users u ON um.user_id = u.id
  WHERE um.is_enabled = true
  AND (p_school_group_id IS NULL OR u.school_group_id = p_school_group_id)
  GROUP BY um.module_id, m.name
  ORDER BY total_accesses DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction : Utilisateurs inactifs (modules non utilisés)
CREATE OR REPLACE FUNCTION get_inactive_user_modules(
  p_school_group_id UUID DEFAULT NULL,
  p_days_threshold INTEGER DEFAULT 30
)
RETURNS TABLE (
  user_id UUID,
  user_name TEXT,
  module_name TEXT,
  days_since_assignment INTEGER,
  never_accessed BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    um.user_id,
    u.first_name || ' ' || u.last_name as user_name,
    m.name as module_name,
    DATE_PART('day', NOW() - um.assigned_at)::INTEGER as days_since_assignment,
    (um.last_accessed_at IS NULL) as never_accessed
  FROM user_modules um
  JOIN users u ON um.user_id = u.id
  JOIN modules m ON um.module_id = m.id
  WHERE um.is_enabled = true
  AND (
    um.last_accessed_at IS NULL 
    OR um.last_accessed_at < NOW() - (p_days_threshold || ' days')::INTERVAL
  )
  AND (p_school_group_id IS NULL OR u.school_group_id = p_school_group_id)
  ORDER BY days_since_assignment DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ÉTAPE 9 : Vérification finale
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ AMÉLIORATION user_modules TERMINÉE !';
  RAISE NOTICE '';
  RAISE NOTICE '📋 COLONNES AJOUTÉES :';
  RAISE NOTICE '   - is_enabled (activation/désactivation)';
  RAISE NOTICE '   - disabled_at (traçabilité)';
  RAISE NOTICE '   - disabled_by (qui a désactivé)';
  RAISE NOTICE '   - settings (configuration personnalisée)';
  RAISE NOTICE '   - last_accessed_at (analytics)';
  RAISE NOTICE '   - access_count (analytics)';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 FONCTIONS CRÉÉES :';
  RAISE NOTICE '   - disable_user_module()';
  RAISE NOTICE '   - enable_user_module()';
  RAISE NOTICE '   - track_module_access()';
  RAISE NOTICE '   - get_most_used_modules()';
  RAISE NOTICE '   - get_inactive_user_modules()';
  RAISE NOTICE '';
  RAISE NOTICE '📊 VUES CRÉÉES :';
  RAISE NOTICE '   - user_modules_analytics';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 RLS POLICIES CRÉÉES :';
  RAISE NOTICE '   - Users see only their assigned modules';
  RAISE NOTICE '   - Admin groupe sees/manages group users modules';
  RAISE NOTICE '   - Super admin full access';
  RAISE NOTICE '';
  RAISE NOTICE '⚡ INDEX CRÉÉS :';
  RAISE NOTICE '   - idx_user_modules_is_enabled';
  RAISE NOTICE '   - idx_user_modules_user_enabled';
  RAISE NOTICE '   - idx_user_modules_last_accessed';
END $$;

-- =====================================================
-- ÉTAPE 10 : Afficher la structure finale
-- =====================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'user_modules'
ORDER BY ordinal_position;

-- ============================================
-- SYSTÈME D'ASSIGNATION DE MODULES
-- Permet d'assigner des modules aux utilisateurs avec permissions granulaires
-- ============================================

-- ============================================
-- 1. TABLE: module_categories (Catégories de modules)
-- ============================================
-- Note: Cette table peut déjà exister via business_categories
-- Si elle n'existe pas, créer une table dédiée

CREATE TABLE IF NOT EXISTS module_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#2A9D8F',
  icon TEXT DEFAULT 'package',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_module_categories_slug ON module_categories(slug);
CREATE INDEX IF NOT EXISTS idx_module_categories_is_active ON module_categories(is_active);

-- ============================================
-- 2. Mettre à jour la table modules si nécessaire
-- ============================================
-- Ajouter category_id si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'modules' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE modules ADD COLUMN category_id UUID REFERENCES module_categories(id) ON DELETE SET NULL;
    CREATE INDEX idx_modules_category_id ON modules(category_id);
  END IF;
END $$;

-- ============================================
-- 3. TABLE: user_assigned_modules (Assignations directes)
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
-- 4. TABLE: user_assigned_categories (Assignations par catégorie)
-- ============================================
CREATE TABLE IF NOT EXISTS user_assigned_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES module_categories(id) ON DELETE CASCADE,
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
-- 5. VUE: user_module_permissions (Permissions complètes)
-- ============================================
-- Cette vue combine les assignations directes et par catégorie
CREATE OR REPLACE VIEW user_module_permissions AS
-- Assignations directes
SELECT 
  uma.user_id,
  m.id AS module_id,
  m.name AS module_name,
  m.slug AS module_slug,
  mc.id AS category_id,
  mc.name AS category_name,
  'direct' AS assignment_type,
  uma.can_read,
  uma.can_write,
  uma.can_delete,
  uma.can_export,
  uma.assigned_by,
  uma.assigned_at,
  uma.valid_until
FROM user_assigned_modules uma
JOIN modules m ON uma.module_id = m.id
LEFT JOIN module_categories mc ON m.category_id = mc.id
WHERE uma.valid_until IS NULL OR uma.valid_until > NOW()

UNION ALL

-- Assignations par catégorie
SELECT 
  uac.user_id,
  m.id AS module_id,
  m.name AS module_name,
  m.slug AS module_slug,
  mc.id AS category_id,
  mc.name AS category_name,
  'category' AS assignment_type,
  uac.default_can_read AS can_read,
  uac.default_can_write AS can_write,
  uac.default_can_delete AS can_delete,
  uac.default_can_export AS can_export,
  uac.assigned_by,
  uac.assigned_at,
  uac.valid_until
FROM user_assigned_categories uac
JOIN module_categories mc ON uac.category_id = mc.id
JOIN modules m ON m.category_id = mc.id
WHERE (uac.valid_until IS NULL OR uac.valid_until > NOW())
  AND m.status = 'active';

-- ============================================
-- 6. FONCTION: assign_module_to_user
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
-- 7. FONCTION: revoke_module_from_user
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
-- 8. FONCTION: assign_category_to_user
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
-- 9. DONNÉES DE TEST (Catégories et Modules)
-- ============================================

-- Insérer des catégories de test
INSERT INTO module_categories (name, slug, description, color, icon) VALUES
('Gestion Académique', 'academique', 'Modules pour la gestion des cours, notes et examens', '#3B82F6', 'graduation-cap'),
('Gestion Administrative', 'administratif', 'Modules pour la gestion administrative de l''école', '#10B981', 'briefcase'),
('Gestion Financière', 'financier', 'Modules pour la comptabilité et les finances', '#F59E0B', 'dollar-sign'),
('Communication', 'communication', 'Modules de communication et notifications', '#8B5CF6', 'message-circle'),
('Ressources Humaines', 'rh', 'Modules pour la gestion du personnel', '#EC4899', 'users')
ON CONFLICT (slug) DO NOTHING;

-- Insérer des modules de test
INSERT INTO modules (name, slug, description, category_id, required_plan, status) 
SELECT 
  'Gestion des Élèves',
  'students',
  'Module de gestion des élèves et inscriptions',
  id,
  'gratuit',
  'active'
FROM module_categories WHERE slug = 'academique'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (name, slug, description, category_id, required_plan, status) 
SELECT 
  'Gestion des Notes',
  'grades',
  'Module de saisie et consultation des notes',
  id,
  'premium',
  'active'
FROM module_categories WHERE slug = 'academique'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (name, slug, description, category_id, required_plan, status) 
SELECT 
  'Gestion des Absences',
  'attendance',
  'Module de suivi des présences et absences',
  id,
  'gratuit',
  'active'
FROM module_categories WHERE slug = 'academique'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (name, slug, description, category_id, required_plan, status) 
SELECT 
  'Gestion des Emplois du Temps',
  'schedules',
  'Module de création et gestion des emplois du temps',
  id,
  'premium',
  'active'
FROM module_categories WHERE slug = 'academique'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (name, slug, description, category_id, required_plan, status) 
SELECT 
  'Gestion Financière',
  'finance',
  'Module de comptabilité et gestion financière',
  id,
  'pro',
  'active'
FROM module_categories WHERE slug = 'financier'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (name, slug, description, category_id, required_plan, status) 
SELECT 
  'Messagerie',
  'messaging',
  'Module de messagerie interne',
  id,
  'premium',
  'active'
FROM module_categories WHERE slug = 'communication'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO modules (name, slug, description, category_id, required_plan, status) 
SELECT 
  'Gestion du Personnel',
  'staff',
  'Module de gestion des employés',
  id,
  'pro',
  'active'
FROM module_categories WHERE slug = 'rh'
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 10. POLITIQUES RLS (Row Level Security)
-- ============================================

-- Activer RLS
ALTER TABLE user_assigned_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_assigned_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_categories ENABLE ROW LEVEL SECURITY;

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

-- Politique pour module_categories
CREATE POLICY "Everyone can view active categories"
  ON module_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage categories"
  ON module_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- ============================================
-- 11. COMMENTAIRES
-- ============================================
COMMENT ON TABLE user_assigned_modules IS 'Assignations directes de modules aux utilisateurs';
COMMENT ON TABLE user_assigned_categories IS 'Assignations de catégories complètes aux utilisateurs';
COMMENT ON TABLE module_categories IS 'Catégories de modules fonctionnels';
COMMENT ON VIEW user_module_permissions IS 'Vue consolidée des permissions utilisateurs sur les modules';
COMMENT ON FUNCTION assign_module_to_user IS 'Assigne un module à un utilisateur avec permissions';
COMMENT ON FUNCTION revoke_module_from_user IS 'Révoque l''accès d''un utilisateur à un module';
COMMENT ON FUNCTION assign_category_to_user IS 'Assigne une catégorie complète à un utilisateur';

-- ============================================
-- FIN DU SCRIPT
-- ============================================

-- Vérification
SELECT 'Système d''assignation de modules créé avec succès!' AS message;
SELECT COUNT(*) AS nb_categories FROM module_categories;
SELECT COUNT(*) AS nb_modules FROM modules;

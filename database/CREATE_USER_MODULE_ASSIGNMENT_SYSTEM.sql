-- ═══════════════════════════════════════════════════════════════════════════════
-- SYSTÈME D'AFFECTATION FLEXIBLE DES MODULES ET CATÉGORIES
-- ═══════════════════════════════════════════════════════════════════════════════
-- Version: 1.0
-- Date: 2025-01-04
-- Description: Système complet permettant à l'Admin de Groupe d'assigner
--              librement des modules/catégories aux utilisateurs avec isolation totale
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════
-- 1️⃣ TABLE : user_assigned_modules
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_assigned_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relations
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  
  -- Métadonnées d'affectation
  assigned_by UUID NOT NULL REFERENCES users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Permissions granulaires
  can_read BOOLEAN DEFAULT TRUE,
  can_write BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  can_export BOOLEAN DEFAULT FALSE,
  
  -- Période de validité
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  
  -- Audit
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contraintes
  CONSTRAINT unique_user_module UNIQUE(user_id, module_id),
  CONSTRAINT valid_period CHECK (valid_until IS NULL OR valid_until > valid_from)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_user_assigned_modules_user ON user_assigned_modules(user_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_assigned_modules_module ON user_assigned_modules(module_id);
CREATE INDEX IF NOT EXISTS idx_user_assigned_modules_assigned_by ON user_assigned_modules(assigned_by);
CREATE INDEX IF NOT EXISTS idx_user_assigned_modules_validity ON user_assigned_modules(valid_from, valid_until) WHERE is_active = TRUE;

COMMENT ON TABLE user_assigned_modules IS 'Modules assignés individuellement aux utilisateurs par l''admin de groupe';


-- ═══════════════════════════════════════════════════════════
-- 2️⃣ TABLE : user_assigned_categories
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_assigned_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relations
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES business_categories(id) ON DELETE CASCADE,
  
  -- Métadonnées
  assigned_by UUID NOT NULL REFERENCES users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Permissions par défaut pour tous les modules de la catégorie
  default_can_read BOOLEAN DEFAULT TRUE,
  default_can_write BOOLEAN DEFAULT FALSE,
  default_can_delete BOOLEAN DEFAULT FALSE,
  default_can_export BOOLEAN DEFAULT FALSE,
  
  -- Période de validité
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  
  -- Audit
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contraintes
  CONSTRAINT unique_user_category UNIQUE(user_id, category_id),
  CONSTRAINT valid_category_period CHECK (valid_until IS NULL OR valid_until > valid_from)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_assigned_categories_user ON user_assigned_categories(user_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_assigned_categories_category ON user_assigned_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_user_assigned_categories_assigned_by ON user_assigned_categories(assigned_by);

COMMENT ON TABLE user_assigned_categories IS 'Catégories assignées aux utilisateurs (donne accès à tous les modules de la catégorie)';


-- ═══════════════════════════════════════════════════════════
-- 3️⃣ TABLE : assignment_profiles (Templates réutilisables)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS assignment_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Propriétaire du profil
  school_group_id UUID NOT NULL REFERENCES school_groups(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  
  -- Informations du profil
  name VARCHAR(100) NOT NULL,
  description TEXT,
  role_suggestion VARCHAR(50),
  
  -- Métadonnées
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contraintes
  CONSTRAINT unique_profile_name_per_group UNIQUE(school_group_id, name)
);

CREATE INDEX IF NOT EXISTS idx_assignment_profiles_group ON assignment_profiles(school_group_id) WHERE is_active = TRUE;

COMMENT ON TABLE assignment_profiles IS 'Profils de modules réutilisables créés par l''admin (ex: "Enseignant Math")';


-- ═══════════════════════════════════════════════════════════
-- 4️⃣ TABLE : profile_modules
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS profile_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  profile_id UUID NOT NULL REFERENCES assignment_profiles(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  
  -- Permissions par défaut du profil
  can_read BOOLEAN DEFAULT TRUE,
  can_write BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  can_export BOOLEAN DEFAULT FALSE,
  
  CONSTRAINT unique_profile_module UNIQUE(profile_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_modules_profile ON profile_modules(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_modules_module ON profile_modules(module_id);


-- ═══════════════════════════════════════════════════════════
-- 🔐 ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════

-- user_assigned_modules
ALTER TABLE user_assigned_modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_groupe_manage_assignments" ON user_assigned_modules;
CREATE POLICY "admin_groupe_manage_assignments"
  ON user_assigned_modules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = user_assigned_modules.user_id
      AND u.school_group_id = (
        SELECT school_group_id FROM users 
        WHERE id = auth.uid() AND role = 'admin_groupe'
      )
    )
  );

DROP POLICY IF EXISTS "user_view_own_modules" ON user_assigned_modules;
CREATE POLICY "user_view_own_modules"
  ON user_assigned_modules FOR SELECT
  USING (
    user_id = auth.uid() 
    AND is_active = TRUE
    AND (valid_until IS NULL OR valid_until > NOW())
  );

DROP POLICY IF EXISTS "super_admin_view_all" ON user_assigned_modules;
CREATE POLICY "super_admin_view_all"
  ON user_assigned_modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- user_assigned_categories
ALTER TABLE user_assigned_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_groupe_manage_category_assignments" ON user_assigned_categories;
CREATE POLICY "admin_groupe_manage_category_assignments"
  ON user_assigned_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = user_assigned_categories.user_id
      AND u.school_group_id = (
        SELECT school_group_id FROM users 
        WHERE id = auth.uid() AND role = 'admin_groupe'
      )
    )
  );

DROP POLICY IF EXISTS "user_view_own_categories" ON user_assigned_categories;
CREATE POLICY "user_view_own_categories"
  ON user_assigned_categories FOR SELECT
  USING (
    user_id = auth.uid() 
    AND is_active = TRUE
    AND (valid_until IS NULL OR valid_until > NOW())
  );

-- assignment_profiles
ALTER TABLE assignment_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_groupe_manage_profiles" ON assignment_profiles;
CREATE POLICY "admin_groupe_manage_profiles"
  ON assignment_profiles FOR ALL
  USING (
    school_group_id = (
      SELECT school_group_id FROM users 
      WHERE id = auth.uid() AND role = 'admin_groupe'
    )
  );

-- profile_modules
ALTER TABLE profile_modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_groupe_manage_profile_modules" ON profile_modules;
CREATE POLICY "admin_groupe_manage_profile_modules"
  ON profile_modules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM assignment_profiles ap
      WHERE ap.id = profile_modules.profile_id
      AND ap.school_group_id = (
        SELECT school_group_id FROM users 
        WHERE id = auth.uid() AND role = 'admin_groupe'
      )
    )
  );


-- ═══════════════════════════════════════════════════════════
-- 📊 VUES SQL
-- ═══════════════════════════════════════════════════════════

-- Vue : Modules effectifs d'un utilisateur
CREATE OR REPLACE VIEW user_effective_modules AS
SELECT DISTINCT
  uam.user_id,
  uam.module_id,
  m.name AS module_name,
  m.slug AS module_slug,
  m.category_id,
  c.name AS category_name,
  'direct' AS assignment_type,
  uam.can_read,
  uam.can_write,
  uam.can_delete,
  uam.can_export,
  uam.assigned_by,
  uam.assigned_at,
  uam.valid_until
FROM user_assigned_modules uam
JOIN modules m ON m.id = uam.module_id
LEFT JOIN business_categories c ON c.id = m.category_id
WHERE uam.is_active = TRUE
  AND (uam.valid_until IS NULL OR uam.valid_until > NOW())

UNION

SELECT DISTINCT
  uac.user_id,
  m.id AS module_id,
  m.name AS module_name,
  m.slug AS module_slug,
  m.category_id,
  c.name AS category_name,
  'category' AS assignment_type,
  uac.default_can_read AS can_read,
  uac.default_can_write AS can_write,
  uac.default_can_delete AS can_delete,
  uac.default_can_export AS can_export,
  uac.assigned_by,
  uac.assigned_at,
  uac.valid_until
FROM user_assigned_categories uac
JOIN business_categories c ON c.id = uac.category_id
JOIN modules m ON m.category_id = c.id
WHERE uac.is_active = TRUE
  AND (uac.valid_until IS NULL OR uac.valid_until > NOW())
  AND m.status = 'active';

-- Vue : Permissions agrégées
CREATE OR REPLACE VIEW user_module_permissions AS
SELECT
  user_id,
  module_id,
  module_name,
  module_slug,
  category_id,
  category_name,
  BOOL_OR(can_read) AS can_read,
  BOOL_OR(can_write) AS can_write,
  BOOL_OR(can_delete) AS can_delete,
  BOOL_OR(can_export) AS can_export,
  MIN(assigned_at) AS first_assigned_at,
  MAX(valid_until) AS latest_valid_until
FROM user_effective_modules
GROUP BY user_id, module_id, module_name, module_slug, category_id, category_name;


-- ═══════════════════════════════════════════════════════════
-- ⚙️ FONCTIONS UTILITAIRES
-- ═══════════════════════════════════════════════════════════

-- Fonction : Assigner un module à un utilisateur
CREATE OR REPLACE FUNCTION assign_module_to_user(
  p_user_id UUID,
  p_module_id UUID,
  p_assigned_by UUID,
  p_can_read BOOLEAN DEFAULT TRUE,
  p_can_write BOOLEAN DEFAULT FALSE,
  p_can_delete BOOLEAN DEFAULT FALSE,
  p_can_export BOOLEAN DEFAULT FALSE,
  p_valid_until TIMESTAMPTZ DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_user_group_id UUID;
  v_admin_group_id UUID;
  v_module_plan VARCHAR(50);
  v_group_plan VARCHAR(50);
BEGIN
  SELECT school_group_id INTO v_user_group_id
  FROM users WHERE id = p_user_id;
  
  IF v_user_group_id IS NULL THEN
    RETURN json_build_object('success', FALSE, 'error', 'Utilisateur non trouvé');
  END IF;
  
  SELECT school_group_id INTO v_admin_group_id
  FROM users WHERE id = p_assigned_by AND role = 'admin_groupe';
  
  IF v_admin_group_id IS NULL OR v_admin_group_id != v_user_group_id THEN
    RETURN json_build_object('success', FALSE, 'error', 'Admin non autorisé');
  END IF;
  
  SELECT m.required_plan, sg.plan 
  INTO v_module_plan, v_group_plan
  FROM modules m
  CROSS JOIN school_groups sg
  WHERE m.id = p_module_id AND sg.id = v_user_group_id;
  
  INSERT INTO user_assigned_modules (
    user_id, module_id, assigned_by, can_read, can_write, can_delete, can_export, valid_until, notes
  ) VALUES (
    p_user_id, p_module_id, p_assigned_by, p_can_read, p_can_write, p_can_delete, p_can_export, p_valid_until, p_notes
  )
  ON CONFLICT (user_id, module_id) 
  DO UPDATE SET
    can_read = EXCLUDED.can_read,
    can_write = EXCLUDED.can_write,
    can_delete = EXCLUDED.can_delete,
    can_export = EXCLUDED.can_export,
    valid_until = EXCLUDED.valid_until,
    notes = EXCLUDED.notes,
    is_active = TRUE,
    updated_at = NOW();
  
  RETURN json_build_object('success', TRUE, 'message', 'Module assigné avec succès');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction : Révoquer un module
CREATE OR REPLACE FUNCTION revoke_module_from_user(
  p_user_id UUID,
  p_module_id UUID
)
RETURNS JSON AS $$
BEGIN
  UPDATE user_assigned_modules
  SET is_active = FALSE, updated_at = NOW()
  WHERE user_id = p_user_id AND module_id = p_module_id;
  
  IF FOUND THEN
    RETURN json_build_object('success', TRUE, 'message', 'Module révoqué');
  ELSE
    RETURN json_build_object('success', FALSE, 'error', 'Affectation non trouvée');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════
-- ✅ SCRIPT TERMINÉ
-- ═══════════════════════════════════════════════════════════

SELECT 'Système d''affectation des modules créé avec succès !' AS status;

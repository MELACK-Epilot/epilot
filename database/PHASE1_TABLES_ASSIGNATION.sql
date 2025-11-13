-- ============================================
-- PHASE 1 : TABLES D'ASSIGNATION MODULES
-- ============================================
-- Date: 4 Novembre 2025
-- Objectif: Créer les tables pour le système d'assignation
-- ============================================

BEGIN;

-- ============================================
-- 1️⃣ TABLE user_modules
-- Assignation des modules aux utilisateurs
-- ============================================
CREATE TABLE IF NOT EXISTS user_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Un utilisateur ne peut avoir le même module qu'une fois
  UNIQUE(user_id, module_id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_user_modules_user_id ON user_modules(user_id);
CREATE INDEX IF NOT EXISTS idx_user_modules_module_id ON user_modules(module_id);
CREATE INDEX IF NOT EXISTS idx_user_modules_assigned_by ON user_modules(assigned_by);

-- Commentaires
COMMENT ON TABLE user_modules IS 'Assignation des modules aux utilisateurs';
COMMENT ON COLUMN user_modules.user_id IS 'Utilisateur qui reçoit le module';
COMMENT ON COLUMN user_modules.module_id IS 'Module assigné';
COMMENT ON COLUMN user_modules.assigned_by IS 'Admin de groupe qui a fait l''assignation';

-- ============================================
-- 2️⃣ TABLE user_categories
-- Assignation des catégories aux utilisateurs
-- ============================================
CREATE TABLE IF NOT EXISTS user_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES business_categories(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Un utilisateur ne peut avoir la même catégorie qu'une fois
  UNIQUE(user_id, category_id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_user_categories_user_id ON user_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_user_categories_category_id ON user_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_user_categories_assigned_by ON user_categories(assigned_by);

-- Commentaires
COMMENT ON TABLE user_categories IS 'Assignation des catégories aux utilisateurs';
COMMENT ON COLUMN user_categories.user_id IS 'Utilisateur qui reçoit la catégorie';
COMMENT ON COLUMN user_categories.category_id IS 'Catégorie assignée';
COMMENT ON COLUMN user_categories.assigned_by IS 'Admin de groupe qui a fait l''assignation';

-- ============================================
-- 3️⃣ TABLE plan_modules
-- Modules disponibles selon le plan d'abonnement
-- ============================================
CREATE TABLE IF NOT EXISTS plan_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Un plan ne peut avoir le même module qu'une fois
  UNIQUE(plan_id, module_id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_plan_modules_plan_id ON plan_modules(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_modules_module_id ON plan_modules(module_id);

-- Commentaires
COMMENT ON TABLE plan_modules IS 'Modules disponibles selon le plan d''abonnement';
COMMENT ON COLUMN plan_modules.plan_id IS 'Plan d''abonnement';
COMMENT ON COLUMN plan_modules.module_id IS 'Module disponible dans ce plan';

-- ============================================
-- 4️⃣ TABLE plan_categories
-- Catégories disponibles selon le plan d'abonnement
-- ============================================
CREATE TABLE IF NOT EXISTS plan_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES business_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Un plan ne peut avoir la même catégorie qu'une fois
  UNIQUE(plan_id, category_id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_plan_categories_plan_id ON plan_categories(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_categories_category_id ON plan_categories(category_id);

-- Commentaires
COMMENT ON TABLE plan_categories IS 'Catégories disponibles selon le plan d''abonnement';
COMMENT ON COLUMN plan_categories.plan_id IS 'Plan d''abonnement';
COMMENT ON COLUMN plan_categories.category_id IS 'Catégorie disponible dans ce plan';

-- ============================================
-- 5️⃣ FONCTION : Trigger updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_user_modules_updated_at ON user_modules;
CREATE TRIGGER update_user_modules_updated_at
  BEFORE UPDATE ON user_modules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_categories_updated_at ON user_categories;
CREATE TRIGGER update_user_categories_updated_at
  BEFORE UPDATE ON user_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6️⃣ POLITIQUES RLS (Row Level Security)
-- ============================================

-- Activer RLS
ALTER TABLE user_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_categories ENABLE ROW LEVEL SECURITY;

-- Politique user_modules : Les utilisateurs voient leurs propres modules
DROP POLICY IF EXISTS "Users can view their own modules" ON user_modules;
CREATE POLICY "Users can view their own modules"
  ON user_modules FOR SELECT
  USING (auth.uid() = user_id);

-- Politique user_modules : Admin de groupe peut tout voir de son groupe
DROP POLICY IF EXISTS "Admin can view group modules" ON user_modules;
CREATE POLICY "Admin can view group modules"
  ON user_modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin_groupe')
    )
  );

-- Politique user_modules : Admin de groupe peut assigner
DROP POLICY IF EXISTS "Admin can assign modules" ON user_modules;
CREATE POLICY "Admin can assign modules"
  ON user_modules FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin_groupe')
    )
  );

-- Politique user_modules : Admin de groupe peut retirer
DROP POLICY IF EXISTS "Admin can remove modules" ON user_modules;
CREATE POLICY "Admin can remove modules"
  ON user_modules FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin_groupe')
    )
  );

-- Politiques similaires pour user_categories
DROP POLICY IF EXISTS "Users can view their own categories" ON user_categories;
CREATE POLICY "Users can view their own categories"
  ON user_categories FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin can view group categories" ON user_categories;
CREATE POLICY "Admin can view group categories"
  ON user_categories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin_groupe')
    )
  );

DROP POLICY IF EXISTS "Admin can assign categories" ON user_categories;
CREATE POLICY "Admin can assign categories"
  ON user_categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin_groupe')
    )
  );

DROP POLICY IF EXISTS "Admin can remove categories" ON user_categories;
CREATE POLICY "Admin can remove categories"
  ON user_categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin_groupe')
    )
  );

-- Politiques plan_modules : Lecture publique
DROP POLICY IF EXISTS "Anyone can view plan modules" ON plan_modules;
CREATE POLICY "Anyone can view plan modules"
  ON plan_modules FOR SELECT
  USING (true);

-- Politiques plan_categories : Lecture publique
DROP POLICY IF EXISTS "Anyone can view plan categories" ON plan_categories;
CREATE POLICY "Anyone can view plan categories"
  ON plan_categories FOR SELECT
  USING (true);

COMMIT;

-- ============================================
-- 7️⃣ VÉRIFICATION
-- ============================================
SELECT 
  'user_modules' as table_name,
  COUNT(*) as count
FROM user_modules

UNION ALL

SELECT 
  'user_categories',
  COUNT(*)
FROM user_categories

UNION ALL

SELECT 
  'plan_modules',
  COUNT(*)
FROM plan_modules

UNION ALL

SELECT 
  'plan_categories',
  COUNT(*)
FROM plan_categories;

-- ============================================
-- ✅ RÉSULTAT ATTENDU
-- ============================================
-- 4 tables créées avec 0 lignes chacune
-- Prêt pour l'assignation !

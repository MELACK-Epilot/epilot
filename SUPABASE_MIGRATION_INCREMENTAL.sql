-- ============================================
-- E-PILOT CONGO - MIGRATION SÉCURISÉE
-- Migration incrémentielle avec vérifications d'existence
-- ============================================

-- ============================================
-- FONCTION D'UTILITÉ POUR VÉRIFIER L'EXISTENCE
-- ============================================

-- Fonction pour vérifier si un type existe
CREATE OR REPLACE FUNCTION type_exists(p_type_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = p_type_name
  );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier si une table existe
CREATE OR REPLACE FUNCTION table_exists(p_table_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = p_table_name
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- NETTOYAGE CONDITIONNEL (uniquement si nécessaire)
-- ============================================

-- Supprimer les politiques RLS existantes (si elles existent)
DO $$
BEGIN
  IF table_exists('users') THEN
    DROP POLICY IF EXISTS "Super Admin can view all users" ON users;
    DROP POLICY IF EXISTS "Admin Groupe can view their group users" ON users;
    DROP POLICY IF EXISTS "Admin École can view their school users" ON users;
  END IF;

  IF table_exists('school_groups') THEN
    DROP POLICY IF EXISTS "Super Admin can view all school groups" ON school_groups;
    DROP POLICY IF EXISTS "Admin Groupe can view their groups" ON school_groups;
  END IF;
END $$;

-- Désactiver RLS temporairement
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS school_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS schools DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS business_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS modules DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications DISABLE ROW LEVEL SECURITY;

-- ============================================
-- CRÉATION CONDITIONNELLE DES ENUMS
-- ============================================

-- Créer les enums seulement s'ils n'existent pas
DO $$
BEGIN
  -- user_role enum
  IF NOT type_exists('user_role') THEN
    CREATE TYPE user_role AS ENUM (
      'super_admin',
      'admin_groupe',
      'admin_ecole',
      'enseignant',
      'cpe',
      'comptable'
    );
    RAISE NOTICE 'Type user_role créé';
  ELSE
    RAISE NOTICE 'Type user_role existe déjà, ignoré';
  END IF;

  -- subscription_plan enum
  IF NOT type_exists('subscription_plan') THEN
    CREATE TYPE subscription_plan AS ENUM (
      'gratuit',
      'premium',
      'pro',
      'institutionnel'
    );
    RAISE NOTICE 'Type subscription_plan créé';
  ELSE
    RAISE NOTICE 'Type subscription_plan existe déjà, ignoré';
  END IF;

  -- status enum
  IF NOT type_exists('status') THEN
    CREATE TYPE status AS ENUM (
      'active',
      'inactive',
      'suspended'
    );
    RAISE NOTICE 'Type status créé';
  ELSE
    RAISE NOTICE 'Type status existe déjà, ignoré';
  END IF;

  -- subscription_status enum
  IF NOT type_exists('subscription_status') THEN
    CREATE TYPE subscription_status AS ENUM (
      'active',
      'expired',
      'cancelled',
      'pending'
    );
    RAISE NOTICE 'Type subscription_status créé';
  ELSE
    RAISE NOTICE 'Type subscription_status existe déjà, ignoré';
  END IF;

END $$;

-- ============================================
-- CRÉATION CONDITIONNELLE DES TABLES
-- ============================================

-- Table users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'enseignant',
  school_group_id UUID,
  school_id UUID,
  status status NOT NULL DEFAULT 'active',
  avatar TEXT,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_school_group_id ON users(school_group_id);
CREATE INDEX IF NOT EXISTS idx_users_school_id ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Table school_groups
CREATE TABLE IF NOT EXISTS school_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  region TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  website TEXT,
  founded_year INTEGER CHECK (founded_year IS NULL OR (founded_year >= 1900 AND founded_year <= EXTRACT(YEAR FROM CURRENT_DATE))),
  description TEXT,
  logo TEXT,
  admin_id UUID REFERENCES users(id) ON DELETE RESTRICT,
  school_count INTEGER DEFAULT 0,
  student_count INTEGER DEFAULT 0,
  staff_count INTEGER DEFAULT 0,
  plan subscription_plan NOT NULL DEFAULT 'gratuit',
  status status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour school_groups
CREATE INDEX IF NOT EXISTS idx_school_groups_admin_id ON school_groups(admin_id);
CREATE INDEX IF NOT EXISTS idx_school_groups_plan ON school_groups(plan);
CREATE INDEX IF NOT EXISTS idx_school_groups_status ON school_groups(status);
CREATE INDEX IF NOT EXISTS idx_school_groups_region ON school_groups(region);

-- Table schools
CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  school_group_id UUID NOT NULL REFERENCES school_groups(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  student_count INTEGER DEFAULT 0,
  staff_count INTEGER DEFAULT 0,
  address TEXT,
  phone TEXT,
  email TEXT,
  status status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour schools
CREATE INDEX IF NOT EXISTS idx_schools_school_group_id ON schools(school_group_id);
CREATE INDEX IF NOT EXISTS idx_schools_admin_id ON schools(admin_id);
CREATE INDEX IF NOT EXISTS idx_schools_status ON schools(status);

-- Table plans
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug subscription_plan UNIQUE NOT NULL,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'FCFA',
  billing_period TEXT NOT NULL DEFAULT 'monthly',
  max_schools INTEGER NOT NULL DEFAULT 1,
  max_students INTEGER NOT NULL DEFAULT 100,
  max_staff INTEGER NOT NULL DEFAULT 10,
  features JSONB NOT NULL DEFAULT '[]',
  modules JSONB NOT NULL DEFAULT '[]',
  status status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour plans
CREATE INDEX IF NOT EXISTS idx_plans_slug ON plans(slug);
CREATE INDEX IF NOT EXISTS idx_plans_status ON plans(status);

-- Table subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_group_id UUID NOT NULL REFERENCES school_groups(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
  status subscription_status NOT NULL DEFAULT 'pending',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  auto_renew BOOLEAN DEFAULT true,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'FCFA',
  payment_method TEXT,
  last_payment_date TIMESTAMP WITH TIME ZONE,
  next_payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_school_group_id ON subscriptions(school_group_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON subscriptions(end_date);

-- Table business_categories
CREATE TABLE IF NOT EXISTS business_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  status status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour business_categories
CREATE INDEX IF NOT EXISTS idx_business_categories_slug ON business_categories(slug);
CREATE INDEX IF NOT EXISTS idx_business_categories_status ON business_categories(status);

-- Table modules
CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  version TEXT NOT NULL DEFAULT '1.0.0',
  category_id UUID REFERENCES business_categories(id) ON DELETE SET NULL,
  icon TEXT,
  required_plan subscription_plan NOT NULL DEFAULT 'gratuit',
  features JSONB NOT NULL DEFAULT '[]',
  status status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour modules
CREATE INDEX IF NOT EXISTS idx_modules_slug ON modules(slug);
CREATE INDEX IF NOT EXISTS idx_modules_category_id ON modules(category_id);
CREATE INDEX IF NOT EXISTS idx_modules_required_plan ON modules(required_plan);
CREATE INDEX IF NOT EXISTS idx_modules_status ON modules(status);

-- Table activity_logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  details TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour activity_logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Table notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipient_role user_role,
  is_global BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'unread',
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Index pour notifications
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================
-- FONCTIONS & TRIGGERS
-- ============================================

-- Supprimer d'abord la fonction et ses dépendances si elle existe
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer les anciens triggers s'ils existent
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_school_groups_updated_at ON school_groups;
DROP TRIGGER IF EXISTS update_schools_updated_at ON schools;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;

-- Créer les nouveaux triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_school_groups_updated_at BEFORE UPDATE ON school_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLITIQUES RLS - USERS
-- ============================================

-- Supprimer les politiques existantes
DROP POLICY IF EXISTS "Super Admin can view all users" ON users;
DROP POLICY IF EXISTS "Admin Groupe can view their group users" ON users;
DROP POLICY IF EXISTS "Admin École can view their school users" ON users;

-- Super Admin peut tout voir
CREATE POLICY "Super Admin can view all users"
ON users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role = 'super_admin'
  )
);

-- Admin Groupe peut voir les utilisateurs de ses groupes
CREATE POLICY "Admin Groupe can view their group users"
ON users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role = 'admin_groupe'
    AND u.school_group_id = users.school_group_id
  )
);

-- Admin École peut voir les utilisateurs de son école
CREATE POLICY "Admin École can view their school users"
ON users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role = 'admin_ecole'
    AND u.school_id = users.school_id
  )
);

-- ============================================
-- POLITIQUES RLS - SCHOOL_GROUPS
-- ============================================

-- Supprimer les politiques existantes
DROP POLICY IF EXISTS "Super Admin can view all school groups" ON school_groups;
DROP POLICY IF EXISTS "Admin Groupe can view their groups" ON school_groups;

-- Super Admin peut tout voir
CREATE POLICY "Super Admin can view all school groups"
ON school_groups FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

-- Admin Groupe peut voir ses groupes
CREATE POLICY "Admin Groupe can view their groups"
ON school_groups FOR SELECT
TO authenticated
USING (
  admin_id = auth.uid()
);

-- ============================================
-- DONNÉES INITIALES (INSERT seulement s'il n'y en a pas)
-- ============================================

-- Insérer les plans par défaut seulement s'ils n'existent pas
INSERT INTO plans (name, slug, price, billing_period, max_schools, max_students, max_staff, features, modules)
SELECT 'Gratuit', 'gratuit', 0, 'monthly', 1, 100, 10,
  '["Gestion de base", "1 école", "100 élèves max"]'::jsonb,
  '["students", "attendance"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE slug = 'gratuit');

INSERT INTO plans (name, slug, price, billing_period, max_schools, max_students, max_staff, features, modules)
SELECT 'Premium', 'premium', 50000, 'monthly', 3, 500, 50,
  '["Gestion complète", "3 écoles", "500 élèves max", "Support prioritaire"]'::jsonb,
  '["students", "attendance", "grades", "finance"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE slug = 'premium');

INSERT INTO plans (name, slug, price, billing_period, max_schools, max_students, max_staff, features, modules)
SELECT 'Pro', 'pro', 150000, 'monthly', 10, 2000, 200,
  '["Gestion avancée", "10 écoles", "2000 élèves max", "Support 24/7", "API access"]'::jsonb,
  '["students", "attendance", "grades", "finance", "hr", "reports"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE slug = 'pro');

INSERT INTO plans (name, slug, price, billing_period, max_schools, max_students, max_staff, features, modules)
SELECT 'Institutionnel', 'institutionnel', 500000, 'monthly', 999, 999999, 9999,
  '["Gestion illimitée", "Écoles illimitées", "Support dédié", "Personnalisation"]'::jsonb,
  '["all"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE slug = 'institutionnel');

-- Insérer un super admin par défaut seulement s'il n'existe pas
INSERT INTO users (email, first_name, last_name, role, status)
SELECT 'admin@epilot.cg', 'Super', 'Admin', 'super_admin', 'active'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@epilot.cg');

-- ============================================
-- COMMENTAIRES
-- ============================================

COMMENT ON TABLE users IS 'Table des utilisateurs de la plateforme';
COMMENT ON TABLE school_groups IS 'Table des groupes scolaires (réseaux d''écoles)';
COMMENT ON TABLE schools IS 'Table des écoles individuelles';
COMMENT ON TABLE plans IS 'Table des plans d''abonnement';
COMMENT ON TABLE subscriptions IS 'Table des abonnements actifs';
COMMENT ON TABLE business_categories IS 'Table des catégories métiers';
COMMENT ON TABLE modules IS 'Table des modules fonctionnels';
COMMENT ON TABLE activity_logs IS 'Journal d''activité de la plateforme';
COMMENT ON TABLE notifications IS 'Table des notifications utilisateurs';

-- ============================================
-- NETTOYAGE DES FONCTIONS UTILITAIRES
-- ============================================

DROP FUNCTION IF EXISTS type_exists(TEXT);
DROP FUNCTION IF EXISTS table_exists(TEXT);

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Migration E-Pilot terminée avec succès !';
  RAISE NOTICE 'Base de données prête pour l''utilisation.';
END $$;

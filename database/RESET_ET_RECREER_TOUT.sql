-- ============================================
-- RESET COMPLET ET RECRÉATION
-- ============================================

-- ÉTAPE 1 : SUPPRIMER TOUTES LES DÉPENDANCES PROBLÉMATIQUES
-- Supprimer les policies qui référencent school_group_id
DROP POLICY IF EXISTS "school_groups_admin_groupe_select" ON school_groups;
DROP POLICY IF EXISTS "modules_admin_groupe_select" ON modules;
DROP POLICY IF EXISTS "admin_groupe_manage_assignments" ON user_assigned_modules;
DROP POLICY IF EXISTS "admin_groupe_manage_category_assignments" ON user_assigned_categories;
DROP POLICY IF EXISTS "admin_groupe_manage_profiles" ON assignment_profiles;
DROP POLICY IF EXISTS "admin_groupe_manage_profile_modules" ON profile_modules;

-- Supprimer la vue qui utilise school_group_id
DROP VIEW IF EXISTS school_groups_with_admin CASCADE;

-- Supprimer le trigger problématique
DROP TRIGGER IF EXISTS generate_school_code_trigger ON schools;

-- Supprimer les tables si elles existent (pour repartir de zéro)
DROP TABLE IF EXISTS system_alerts CASCADE;
DROP TABLE IF EXISTS fee_payments CASCADE;

-- ÉTAPE 2 : AJOUTER LES COLONNES MANQUANTES
-- Ajouter school_group_id à activity_logs
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS school_group_id UUID;

-- ÉTAPE 3 : CRÉER LES INDEX
CREATE INDEX IF NOT EXISTS idx_activity_logs_school_group_id ON activity_logs(school_group_id);
CREATE INDEX IF NOT EXISTS idx_schools_school_group_id ON schools(school_group_id);
CREATE INDEX IF NOT EXISTS idx_users_school_group_id ON users(school_group_id);

-- ÉTAPE 4 : CRÉER system_alerts
CREATE TABLE system_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_group_id UUID,
  school_id UUID,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  category TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  read_by UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_system_alerts_school_group_id ON system_alerts(school_group_id);
CREATE INDEX idx_system_alerts_school_id ON system_alerts(school_id);
CREATE INDEX idx_system_alerts_is_read ON system_alerts(is_read);
CREATE INDEX idx_system_alerts_severity ON system_alerts(severity);

-- ÉTAPE 5 : CRÉER fee_payments
CREATE TABLE fee_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_group_id UUID,
  school_id UUID NOT NULL,
  student_id UUID,
  fee_type TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'FCFA',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  due_date DATE NOT NULL,
  paid_date DATE,
  paid_amount DECIMAL(12, 2) DEFAULT 0,
  payment_method TEXT,
  reference TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_fee_payments_school_group_id ON fee_payments(school_group_id);
CREATE INDEX idx_fee_payments_school_id ON fee_payments(school_id);
CREATE INDEX idx_fee_payments_student_id ON fee_payments(student_id);
CREATE INDEX idx_fee_payments_status ON fee_payments(status);
CREATE INDEX idx_fee_payments_due_date ON fee_payments(due_date);

-- ÉTAPE 6 : RECRÉER LA VUE school_groups_with_admin
CREATE VIEW school_groups_with_admin AS
SELECT 
  sg.*,
  u.id AS admin_id,
  CONCAT(u.first_name, ' ', u.last_name) AS admin_name,
  u.email AS admin_email,
  u.phone AS admin_phone,
  u.avatar AS admin_avatar,
  u.status AS admin_status,
  u.last_login AS admin_last_login
FROM school_groups sg
LEFT JOIN users u ON u.school_group_id = sg.id AND u.role = 'admin_groupe'
ORDER BY sg.created_at DESC;

-- ÉTAPE 7 : RECRÉER LE TRIGGER
CREATE TRIGGER generate_school_code_trigger
BEFORE INSERT ON schools
FOR EACH ROW
EXECUTE FUNCTION generate_school_code();

-- ÉTAPE 8 : DÉSACTIVER RLS POUR DÉVELOPPEMENT
ALTER TABLE system_alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE schools DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE school_groups DISABLE ROW LEVEL SECURITY;

-- ============================================
-- FIN - TOUT EST NETTOYÉ ET RECRÉÉ !
-- ============================================

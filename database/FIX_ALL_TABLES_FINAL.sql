-- ============================================
-- CORRECTION COMPLÈTE - TOUTES LES TABLES
-- ============================================

-- ÉTAPE 1 : Désactiver uniquement les triggers utilisateur (pas les triggers système)
ALTER TABLE schools DISABLE TRIGGER USER;

-- ÉTAPE 2 : Ajouter school_group_id uniquement à activity_logs
-- (schools.school_group_id existe déjà - NOT NULL)
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS school_group_id UUID;

-- ÉTAPE 3 : Créer les index
CREATE INDEX IF NOT EXISTS idx_activity_logs_school_group_id ON activity_logs(school_group_id);
CREATE INDEX IF NOT EXISTS idx_schools_school_group_id ON schools(school_group_id);

-- ÉTAPE 4 : Créer system_alerts
CREATE TABLE IF NOT EXISTS system_alerts (
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

CREATE INDEX IF NOT EXISTS idx_system_alerts_school_group_id ON system_alerts(school_group_id);
CREATE INDEX IF NOT EXISTS idx_system_alerts_school_id ON system_alerts(school_id);
CREATE INDEX IF NOT EXISTS idx_system_alerts_is_read ON system_alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_system_alerts_severity ON system_alerts(severity);

-- ÉTAPE 5 : Créer fee_payments
CREATE TABLE IF NOT EXISTS fee_payments (
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

CREATE INDEX IF NOT EXISTS idx_fee_payments_school_group_id ON fee_payments(school_group_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_school_id ON fee_payments(school_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_student_id ON fee_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_status ON fee_payments(status);
CREATE INDEX IF NOT EXISTS idx_fee_payments_due_date ON fee_payments(due_date);

-- ÉTAPE 6 : Réactiver les triggers utilisateur
ALTER TABLE schools ENABLE TRIGGER USER;

-- ÉTAPE 7 : Désactiver RLS pour développement
ALTER TABLE system_alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE schools DISABLE ROW LEVEL SECURITY;

-- ============================================
-- FIN - TOUTES LES TABLES SONT CRÉÉES !
-- ============================================

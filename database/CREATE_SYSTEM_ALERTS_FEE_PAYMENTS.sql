-- ============================================
-- E-PILOT CONGO - TABLES MANQUANTES
-- system_alerts + fee_payments + RLS Policies
-- ============================================

-- ============================================
-- TABLE: system_alerts (Alertes Système)
-- ============================================
CREATE TABLE IF NOT EXISTS system_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_group_id UUID REFERENCES school_groups(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  category TEXT CHECK (category IN ('system', 'payment', 'user', 'school', 'security')),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  read_by UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour system_alerts
CREATE INDEX IF NOT EXISTS idx_system_alerts_school_group_id ON system_alerts(school_group_id);
CREATE INDEX IF NOT EXISTS idx_system_alerts_school_id ON system_alerts(school_id);
CREATE INDEX IF NOT EXISTS idx_system_alerts_severity ON system_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_system_alerts_is_read ON system_alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_system_alerts_created_at ON system_alerts(created_at DESC);

-- ============================================
-- TABLE: fee_payments (Paiements de Frais)
-- ============================================
CREATE TABLE IF NOT EXISTS fee_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_group_id UUID REFERENCES school_groups(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  fee_type TEXT NOT NULL CHECK (fee_type IN ('scolarite', 'inscription', 'cantine', 'transport', 'uniforme', 'materiel', 'activite', 'autre')),
  amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
  currency TEXT DEFAULT 'FCFA',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'partial', 'overdue', 'cancelled')),
  due_date DATE NOT NULL,
  paid_date DATE,
  paid_amount DECIMAL(12, 2) DEFAULT 0 CHECK (paid_amount >= 0),
  payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'mobile_money', 'check', 'card')),
  reference TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour fee_payments
CREATE INDEX IF NOT EXISTS idx_fee_payments_school_group_id ON fee_payments(school_group_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_school_id ON fee_payments(school_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_student_id ON fee_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_status ON fee_payments(status);
CREATE INDEX IF NOT EXISTS idx_fee_payments_due_date ON fee_payments(due_date);
CREATE INDEX IF NOT EXISTS idx_fee_payments_created_at ON fee_payments(created_at DESC);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Activer RLS
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES: system_alerts
-- ============================================

-- Super Admin : Accès complet
CREATE POLICY "Super Admin full access to system_alerts"
  ON system_alerts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Admin Groupe : Voir ses alertes
CREATE POLICY "Admin Groupe can view their system_alerts"
  ON system_alerts
  FOR SELECT
  TO authenticated
  USING (
    school_group_id IN (
      SELECT school_group_id FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin_groupe'
    )
  );

-- Admin Groupe : Marquer comme lu
CREATE POLICY "Admin Groupe can update their system_alerts"
  ON system_alerts
  FOR UPDATE
  TO authenticated
  USING (
    school_group_id IN (
      SELECT school_group_id FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin_groupe'
    )
  );

-- ============================================
-- POLICIES: fee_payments
-- ============================================

-- Super Admin : Accès complet
CREATE POLICY "Super Admin full access to fee_payments"
  ON fee_payments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Admin Groupe : Gérer les paiements de son groupe
CREATE POLICY "Admin Groupe can manage their fee_payments"
  ON fee_payments
  FOR ALL
  TO authenticated
  USING (
    school_group_id IN (
      SELECT school_group_id FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin_groupe'
    )
  );

-- Comptable : Voir et modifier les paiements de son école
CREATE POLICY "Comptable can manage school fee_payments"
  ON fee_payments
  FOR ALL
  TO authenticated
  USING (
    school_id IN (
      SELECT school_id FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'comptable'
    )
  );

-- ============================================
-- POLICIES: activity_logs
-- ============================================

-- Super Admin : Accès complet
CREATE POLICY "Super Admin full access to activity_logs"
  ON activity_logs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Admin Groupe : Voir les logs de son groupe
CREATE POLICY "Admin Groupe can view their activity_logs"
  ON activity_logs
  FOR SELECT
  TO authenticated
  USING (
    school_group_id IN (
      SELECT school_group_id FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin_groupe'
    )
  );

-- Utilisateurs : Voir leurs propres logs
CREATE POLICY "Users can view their own activity_logs"
  ON activity_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- COMMENTAIRES
-- ============================================

COMMENT ON TABLE system_alerts IS 'Alertes système pour les groupes scolaires';
COMMENT ON TABLE fee_payments IS 'Gestion des paiements de frais scolaires';

COMMENT ON COLUMN system_alerts.severity IS 'Niveau de gravité: info, warning, error, critical';
COMMENT ON COLUMN system_alerts.category IS 'Catégorie: system, payment, user, school, security';
COMMENT ON COLUMN fee_payments.fee_type IS 'Type de frais: scolarite, inscription, cantine, transport, etc.';
COMMENT ON COLUMN fee_payments.status IS 'Statut: pending, paid, partial, overdue, cancelled';

-- ============================================
-- FIN DU SCRIPT
-- ============================================

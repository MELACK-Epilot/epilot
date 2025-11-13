-- =====================================================
-- E-PILOT CONGO - PAIEMENTS & ALERTES
-- Gestion des paiements et système d'alertes
-- =====================================================

-- 1. TABLE: payments
-- Historique des paiements
-- =====================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  school_group_id UUID NOT NULL REFERENCES school_groups(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'FCFA',
  payment_method VARCHAR(30) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  transaction_id VARCHAR(100),
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT payments_currency_check CHECK (currency IN ('FCFA', 'EUR', 'USD')),
  CONSTRAINT payments_method_check CHECK (payment_method IN ('bank_transfer', 'mobile_money', 'card', 'cash')),
  CONSTRAINT payments_status_check CHECK (status IN ('pending', 'completed', 'failed', 'refunded'))
);

-- 2. TABLE: system_alerts
-- Alertes système pour le Super Admin
-- =====================================================
CREATE TABLE IF NOT EXISTS system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(30) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  entity_type VARCHAR(30),
  entity_id UUID,
  entity_name VARCHAR(200),
  action_required BOOLEAN DEFAULT false,
  action_url TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT system_alerts_type_check CHECK (type IN ('payment_overdue', 'subscription_expiring', 'trial_ending', 'quota_exceeded', 'security', 'system')),
  CONSTRAINT system_alerts_severity_check CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT system_alerts_entity_check CHECK (entity_type IN ('school_group', 'subscription', 'user', 'system'))
);

-- 3. INDEX
-- =====================================================
CREATE INDEX idx_payments_subscription ON payments(subscription_id);
CREATE INDEX idx_payments_school_group ON payments(school_group_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_invoice ON payments(invoice_number);
CREATE INDEX idx_payments_paid_at ON payments(paid_at);
CREATE INDEX idx_system_alerts_type ON system_alerts(type);
CREATE INDEX idx_system_alerts_severity ON system_alerts(severity);
CREATE INDEX idx_system_alerts_is_read ON system_alerts(is_read);
CREATE INDEX idx_system_alerts_entity ON system_alerts(entity_type, entity_id);
CREATE INDEX idx_system_alerts_created_at ON system_alerts(created_at DESC);

-- 4. TRIGGERS
-- =====================================================
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour générer un numéro de facture unique
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('invoice_sequence')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Séquence pour les numéros de facture
CREATE SEQUENCE IF NOT EXISTS invoice_sequence START 1;

CREATE TRIGGER generate_invoice_number_trigger
BEFORE INSERT ON payments
FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();

-- Fonction pour créer des alertes automatiques
CREATE OR REPLACE FUNCTION create_payment_alerts()
RETURNS TRIGGER AS $$
BEGIN
  -- Alerte si paiement échoué
  IF NEW.status = 'failed' AND OLD.status != 'failed' THEN
    INSERT INTO system_alerts (type, severity, title, message, entity_type, entity_id, entity_name, action_required, action_url)
    SELECT 
      'payment_overdue',
      'high',
      'Paiement échoué',
      'Le paiement de ' || NEW.amount || ' ' || NEW.currency || ' pour le groupe ' || sg.name || ' a échoué.',
      'school_group',
      NEW.school_group_id,
      sg.name,
      true,
      '/dashboard/subscriptions/' || NEW.subscription_id
    FROM school_groups sg WHERE sg.id = NEW.school_group_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_payment_alerts_trigger
AFTER UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION create_payment_alerts();

-- Fonction pour créer des alertes d'expiration d'abonnement
CREATE OR REPLACE FUNCTION create_subscription_expiry_alerts()
RETURNS void AS $$
BEGIN
  -- Alertes pour abonnements expirant dans 7 jours
  INSERT INTO system_alerts (type, severity, title, message, entity_type, entity_id, entity_name, action_required, action_url)
  SELECT 
    'subscription_expiring',
    'medium',
    'Abonnement expirant bientôt',
    'L''abonnement du groupe ' || sg.name || ' expire le ' || TO_CHAR(s.end_date, 'DD/MM/YYYY') || '.',
    'school_group',
    s.school_group_id,
    sg.name,
    true,
    '/dashboard/subscriptions/' || s.id
  FROM subscriptions s
  JOIN school_groups sg ON sg.id = s.school_group_id
  WHERE s.status = 'active'
    AND s.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
    AND NOT EXISTS (
      SELECT 1 FROM system_alerts sa 
      WHERE sa.entity_id = s.school_group_id 
        AND sa.type = 'subscription_expiring'
        AND sa.created_at > CURRENT_DATE - INTERVAL '7 days'
    );
  
  -- Alertes pour essais gratuits se terminant dans 3 jours
  INSERT INTO system_alerts (type, severity, title, message, entity_type, entity_id, entity_name, action_required, action_url)
  SELECT 
    'trial_ending',
    'high',
    'Période d''essai se termine',
    'La période d''essai du groupe ' || sg.name || ' se termine le ' || TO_CHAR(s.trial_end_date, 'DD/MM/YYYY') || '.',
    'school_group',
    s.school_group_id,
    sg.name,
    true,
    '/dashboard/subscriptions/' || s.id
  FROM subscriptions s
  JOIN school_groups sg ON sg.id = s.school_group_id
  WHERE s.status = 'trial'
    AND s.trial_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 days'
    AND NOT EXISTS (
      SELECT 1 FROM system_alerts sa 
      WHERE sa.entity_id = s.school_group_id 
        AND sa.type = 'trial_ending'
        AND sa.created_at > CURRENT_DATE - INTERVAL '3 days'
    );
END;
$$ LANGUAGE plpgsql;

-- 5. ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super Admin full access on payments" ON payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

CREATE POLICY "Super Admin full access on system_alerts" ON system_alerts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- 6. VUES UTILES
-- =====================================================

-- Vue: Statistiques financières globales
CREATE OR REPLACE VIEW financial_stats AS
SELECT 
  COUNT(DISTINCT s.id) as total_subscriptions,
  COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.id END) as active_subscriptions,
  COUNT(DISTINCT CASE WHEN s.status = 'trial' THEN s.id END) as trial_subscriptions,
  COUNT(DISTINCT CASE WHEN s.status = 'expired' THEN s.id END) as expired_subscriptions,
  COUNT(DISTINCT CASE WHEN s.status = 'cancelled' THEN s.id END) as cancelled_subscriptions,
  COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) as total_revenue,
  COALESCE(SUM(CASE WHEN p.status = 'completed' AND p.paid_at >= DATE_TRUNC('month', CURRENT_DATE) THEN p.amount ELSE 0 END), 0) as monthly_revenue,
  COALESCE(SUM(CASE WHEN p.status = 'completed' AND p.paid_at >= DATE_TRUNC('year', CURRENT_DATE) THEN p.amount ELSE 0 END), 0) as yearly_revenue,
  COUNT(DISTINCT CASE WHEN s.payment_status = 'overdue' THEN s.id END) as overdue_payments,
  COALESCE(SUM(CASE WHEN s.payment_status = 'overdue' THEN s.amount ELSE 0 END), 0) as overdue_amount
FROM subscriptions s
LEFT JOIN payments p ON p.subscription_id = s.id;

-- Vue: Statistiques par plan
CREATE OR REPLACE VIEW plan_stats AS
SELECT 
  p.id as plan_id,
  p.name as plan_name,
  p.slug as plan_slug,
  COUNT(DISTINCT s.id) as subscription_count,
  COALESCE(SUM(CASE WHEN pay.status = 'completed' THEN pay.amount ELSE 0 END), 0) as revenue,
  ROUND(COUNT(DISTINCT s.id)::NUMERIC / NULLIF((SELECT COUNT(*) FROM subscriptions), 0) * 100, 2) as percentage
FROM plans p
LEFT JOIN subscriptions s ON s.plan_id = p.id
LEFT JOIN payments pay ON pay.subscription_id = s.id
GROUP BY p.id, p.name, p.slug
ORDER BY subscription_count DESC;

-- Vue: Alertes non lues
CREATE OR REPLACE VIEW unread_alerts AS
SELECT 
  type,
  severity,
  COUNT(*) as count
FROM system_alerts
WHERE is_read = false
  AND resolved_at IS NULL
GROUP BY type, severity
ORDER BY 
  CASE severity
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END;

-- 7. COMMENTAIRES
-- =====================================================
COMMENT ON TABLE payments IS 'Historique des paiements des abonnements';
COMMENT ON TABLE system_alerts IS 'Alertes système pour le Super Admin';
COMMENT ON COLUMN payments.invoice_number IS 'Numéro de facture unique généré automatiquement';
COMMENT ON COLUMN system_alerts.action_required IS 'Indique si une action du Super Admin est requise';
COMMENT ON VIEW financial_stats IS 'Vue agrégée des statistiques financières globales';
COMMENT ON VIEW plan_stats IS 'Vue agrégée des statistiques par plan d''abonnement';
COMMENT ON VIEW unread_alerts IS 'Vue des alertes non lues groupées par type et sévérité';

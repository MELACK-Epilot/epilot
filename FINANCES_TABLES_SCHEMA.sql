-- ============================================
-- SCHÉMA SQL : TABLES FINANCES COMPLÈTES
-- ============================================
-- Description : Tables subscriptions, payments et vues analytics
-- Auteur : E-Pilot Congo
-- Date : 2025-01-30
-- ============================================

-- ============================================
-- 1. TABLE : subscriptions
-- ============================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  school_group_id UUID REFERENCES school_groups(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  
  -- Statut
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'pending', 'trial')),
  
  -- Dates
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  trial_end_date TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  -- Paiement
  billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'FCFA',
  
  -- Renouvellement automatique
  auto_renew BOOLEAN DEFAULT TRUE,
  next_billing_date TIMESTAMPTZ,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_subscriptions_school_group ON subscriptions(school_group_id);
CREATE INDEX idx_subscriptions_plan ON subscriptions(plan_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_end_date ON subscriptions(end_date);
CREATE INDEX idx_subscriptions_next_billing ON subscriptions(next_billing_date);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

-- ============================================
-- 2. TABLE : payments
-- ============================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  school_group_id UUID REFERENCES school_groups(id),
  
  -- Montant
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'FCFA',
  
  -- Méthode de paiement
  method VARCHAR(50) CHECK (method IN ('airtel_money', 'mtn_money', 'bank_transfer', 'cash', 'card', 'other')),
  provider VARCHAR(50), -- 'airtel', 'mtn', 'visa', 'mastercard', etc.
  
  -- Statut
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
  
  -- Informations transaction
  transaction_id VARCHAR(100) UNIQUE, -- ID externe (Airtel, MTN, etc.)
  reference VARCHAR(100) UNIQUE, -- Référence interne
  phone_number VARCHAR(20), -- Numéro Mobile Money
  account_number VARCHAR(50), -- Numéro de compte bancaire
  
  -- Dates
  paid_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  -- Remboursement
  refund_amount DECIMAL(10, 2),
  refund_reason TEXT,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_payments_subscription ON payments(subscription_id);
CREATE INDEX idx_payments_school_group ON payments(school_group_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_method ON payments(method);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX idx_payments_reference ON payments(reference);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX idx_payments_paid_at ON payments(paid_at DESC);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_updated_at();

-- ============================================
-- 3. VUE : financial_analytics
-- ============================================

CREATE OR REPLACE VIEW financial_analytics AS
SELECT
  DATE_TRUNC('month', p.created_at) AS month,
  sp.name AS plan_name,
  sp.slug AS plan_slug,
  sp.id AS plan_id,
  
  -- Compteurs
  COUNT(DISTINCT p.id) AS payment_count,
  COUNT(DISTINCT p.subscription_id) AS subscription_count,
  COUNT(DISTINCT p.school_group_id) AS group_count,
  
  -- Montants
  SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) AS total_revenue,
  AVG(CASE WHEN p.status = 'completed' THEN p.amount ELSE NULL END) AS avg_payment,
  MAX(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) AS max_payment,
  MIN(CASE WHEN p.status = 'completed' AND p.amount > 0 THEN p.amount ELSE NULL END) AS min_payment,
  
  -- Statuts
  COUNT(CASE WHEN p.status = 'completed' THEN 1 END) AS completed_payments,
  COUNT(CASE WHEN p.status = 'failed' THEN 1 END) AS failed_payments,
  COUNT(CASE WHEN p.status = 'pending' THEN 1 END) AS pending_payments,
  COUNT(CASE WHEN p.status = 'refunded' THEN 1 END) AS refunded_payments,
  SUM(CASE WHEN p.status = 'refunded' THEN p.refund_amount ELSE 0 END) AS total_refunded,
  
  -- Méthodes
  COUNT(CASE WHEN p.method = 'airtel_money' THEN 1 END) AS airtel_count,
  COUNT(CASE WHEN p.method = 'mtn_money' THEN 1 END) AS mtn_count,
  COUNT(CASE WHEN p.method = 'bank_transfer' THEN 1 END) AS bank_count,
  COUNT(CASE WHEN p.method = 'cash' THEN 1 END) AS cash_count,
  COUNT(CASE WHEN p.method = 'card' THEN 1 END) AS card_count,
  
  -- Taux de succès
  ROUND(
    (COUNT(CASE WHEN p.status = 'completed' THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
    2
  ) AS success_rate

FROM payments p
JOIN subscriptions s ON p.subscription_id = s.id
JOIN subscription_plans sp ON s.plan_id = sp.id
GROUP BY DATE_TRUNC('month', p.created_at), sp.name, sp.slug, sp.id
ORDER BY month DESC, total_revenue DESC;

-- ============================================
-- 4. VUE : subscription_stats
-- ============================================

CREATE OR REPLACE VIEW subscription_stats AS
SELECT
  sp.id AS plan_id,
  sp.name AS plan_name,
  sp.slug AS plan_slug,
  sp.price AS plan_price,
  
  -- Compteurs
  COUNT(*) AS total_subscriptions,
  COUNT(CASE WHEN s.status = 'active' THEN 1 END) AS active_subscriptions,
  COUNT(CASE WHEN s.status = 'trial' THEN 1 END) AS trial_subscriptions,
  COUNT(CASE WHEN s.status = 'expired' THEN 1 END) AS expired_subscriptions,
  COUNT(CASE WHEN s.status = 'cancelled' THEN 1 END) AS cancelled_subscriptions,
  COUNT(CASE WHEN s.status = 'pending' THEN 1 END) AS pending_subscriptions,
  
  -- Revenus
  SUM(CASE WHEN s.status = 'active' THEN s.amount ELSE 0 END) AS monthly_revenue,
  SUM(CASE WHEN s.status = 'active' AND s.billing_cycle = 'yearly' THEN s.amount ELSE 0 END) AS yearly_revenue,
  
  -- Dates
  MIN(s.start_date) AS first_subscription_date,
  MAX(s.start_date) AS last_subscription_date,
  
  -- Taux de rétention
  ROUND(
    (COUNT(CASE WHEN s.status = 'active' THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
    2
  ) AS retention_rate,
  
  -- Taux de churn
  ROUND(
    (COUNT(CASE WHEN s.status = 'cancelled' THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
    2
  ) AS churn_rate

FROM subscriptions s
JOIN subscription_plans sp ON s.plan_id = sp.id
GROUP BY sp.id, sp.name, sp.slug, sp.price
ORDER BY monthly_revenue DESC;

-- ============================================
-- 5. FONCTION : generate_payment_reference
-- ============================================

CREATE OR REPLACE FUNCTION generate_payment_reference()
RETURNS VARCHAR AS $$
DECLARE
  v_reference VARCHAR;
BEGIN
  v_reference := 'PAY-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
  RETURN v_reference;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. FONCTION : check_subscription_expiry
-- ============================================

CREATE OR REPLACE FUNCTION check_subscription_expiry()
RETURNS void AS $$
BEGIN
  -- Marquer les abonnements expirés
  UPDATE subscriptions
  SET status = 'expired'
  WHERE status = 'active'
  AND end_date < NOW();
  
  -- Créer des notifications pour les abonnements qui expirent dans 7 jours
  INSERT INTO notifications (
    school_group_id,
    type,
    title,
    message,
    data
  )
  SELECT
    s.school_group_id,
    'subscription_expiring',
    '⚠️ Abonnement bientôt expiré',
    format('Votre abonnement "%s" expire le %s. Pensez à le renouveler.', 
      sp.name,
      TO_CHAR(s.end_date, 'DD/MM/YYYY')
    ),
    jsonb_build_object(
      'subscription_id', s.id,
      'plan_name', sp.name,
      'end_date', s.end_date
    )
  FROM subscriptions s
  JOIN subscription_plans sp ON s.plan_id = sp.id
  WHERE s.status = 'active'
  AND s.end_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
  AND NOT EXISTS (
    SELECT 1 FROM notifications
    WHERE school_group_id = s.school_group_id
    AND type = 'subscription_expiring'
    AND created_at > NOW() - INTERVAL '24 hours'
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. TRIGGER : Notification sur paiement complété
-- ============================================

CREATE OR REPLACE FUNCTION notify_payment_completed()
RETURNS TRIGGER AS $$
DECLARE
  v_group_id UUID;
  v_plan_name VARCHAR;
BEGIN
  -- Récupérer les infos
  SELECT s.school_group_id, sp.name
  INTO v_group_id, v_plan_name
  FROM subscriptions s
  JOIN subscription_plans sp ON s.plan_id = sp.id
  WHERE s.id = NEW.subscription_id;
  
  -- Créer notification si paiement complété
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    INSERT INTO notifications (
      school_group_id,
      type,
      title,
      message,
      data
    ) VALUES (
      v_group_id,
      'payment_success',
      '✅ Paiement réussi',
      format('Votre paiement de %s FCFA pour le plan "%s" a été confirmé.', 
        NEW.amount,
        v_plan_name
      ),
      jsonb_build_object(
        'payment_id', NEW.id,
        'amount', NEW.amount,
        'method', NEW.method,
        'reference', NEW.reference
      )
    );
  END IF;
  
  -- Notification si paiement échoué
  IF NEW.status = 'failed' AND (OLD.status IS NULL OR OLD.status != 'failed') THEN
    INSERT INTO notifications (
      school_group_id,
      type,
      title,
      message,
      data
    ) VALUES (
      v_group_id,
      'payment_failed',
      '❌ Paiement échoué',
      format('Votre paiement de %s FCFA a échoué. Veuillez réessayer.', NEW.amount),
      jsonb_build_object(
        'payment_id', NEW.id,
        'amount', NEW.amount,
        'error', NEW.error_message
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_payment_completed
  AFTER INSERT OR UPDATE OF status ON payments
  FOR EACH ROW
  EXECUTE FUNCTION notify_payment_completed();

-- ============================================
-- 8. POLITIQUES RLS
-- ============================================

-- Subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super Admin can view all subscriptions"
ON subscriptions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

CREATE POLICY "Admin Groupe can view their subscriptions"
ON subscriptions FOR SELECT
TO authenticated
USING (
  school_group_id IN (
    SELECT id FROM school_groups
    WHERE admin_id = auth.uid()
  )
);

CREATE POLICY "Super Admin can manage all subscriptions"
ON subscriptions FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

-- Payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super Admin can view all payments"
ON payments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

CREATE POLICY "Admin Groupe can view their payments"
ON payments FOR SELECT
TO authenticated
USING (
  school_group_id IN (
    SELECT id FROM school_groups
    WHERE admin_id = auth.uid()
  )
);

CREATE POLICY "Super Admin can manage all payments"
ON payments FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

-- ============================================
-- 9. COMMENTAIRES
-- ============================================

COMMENT ON TABLE subscriptions IS 'Abonnements des groupes scolaires aux plans';
COMMENT ON TABLE payments IS 'Historique des paiements (Mobile Money, virement, espèces)';
COMMENT ON VIEW financial_analytics IS 'Analytics financiers agrégés par mois et par plan';
COMMENT ON VIEW subscription_stats IS 'Statistiques des abonnements par plan';
COMMENT ON FUNCTION generate_payment_reference IS 'Génère une référence unique pour un paiement';
COMMENT ON FUNCTION check_subscription_expiry IS 'Vérifie et marque les abonnements expirés (à exécuter via cron)';

-- ============================================
-- FIN DU SCHÉMA
-- ============================================

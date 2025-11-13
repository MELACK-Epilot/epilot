-- ============================================
-- SCHÉMA COMPLET FINANCES E-PILOT CONGO
-- Tables: payments, financial_stats (vue), plan_stats (vue)
-- ============================================

-- ============================================
-- 1. TABLE PAYMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relations
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  school_group_id UUID NOT NULL REFERENCES school_groups(id) ON DELETE CASCADE,
  
  -- Informations de facturation
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  transaction_id VARCHAR(100) UNIQUE,
  
  -- Montant
  amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
  currency VARCHAR(10) NOT NULL DEFAULT 'FCFA',
  
  -- Méthode de paiement
  payment_method VARCHAR(50) NOT NULL,
  payment_provider VARCHAR(50),
  
  -- Statut
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  
  -- Dates
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  
  -- Métadonnées
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Contraintes
  CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
  CONSTRAINT valid_currency CHECK (currency IN ('FCFA', 'USD', 'EUR')),
  CONSTRAINT valid_payment_method CHECK (payment_method IN ('mobile_money', 'bank_transfer', 'cash', 'card', 'cheque'))
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_payments_subscription ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_school_group ON payments(school_group_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payments(paid_at);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_number);
CREATE INDEX IF NOT EXISTS idx_payments_transaction ON payments(transaction_id);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_updated_at();

-- ============================================
-- 2. VUE FINANCIAL_STATS
-- ============================================

CREATE OR REPLACE VIEW financial_stats AS
SELECT
  -- Abonnements
  COUNT(DISTINCT s.id) AS total_subscriptions,
  COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.id END) AS active_subscriptions,
  COUNT(DISTINCT CASE WHEN s.status = 'pending' THEN s.id END) AS pending_subscriptions,
  COUNT(DISTINCT CASE WHEN s.status = 'expired' THEN s.id END) AS expired_subscriptions,
  COUNT(DISTINCT CASE WHEN s.status = 'cancelled' THEN s.id END) AS cancelled_subscriptions,
  COUNT(DISTINCT CASE WHEN s.status = 'trial' THEN s.id END) AS trial_subscriptions,
  
  -- Revenus totaux
  COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) AS total_revenue,
  
  -- Revenus mensuels (30 derniers jours)
  COALESCE(SUM(CASE 
    WHEN p.status = 'completed' 
    AND p.paid_at >= NOW() - INTERVAL '30 days' 
    THEN p.amount 
    ELSE 0 
  END), 0) AS monthly_revenue,
  
  -- Revenus annuels (365 derniers jours)
  COALESCE(SUM(CASE 
    WHEN p.status = 'completed' 
    AND p.paid_at >= NOW() - INTERVAL '365 days' 
    THEN p.amount 
    ELSE 0 
  END), 0) AS yearly_revenue,
  
  -- Paiements en retard
  COUNT(DISTINCT CASE 
    WHEN p.status = 'pending' 
    AND p.due_date < NOW() 
    THEN p.id 
  END) AS overdue_payments,
  
  COALESCE(SUM(CASE 
    WHEN p.status = 'pending' 
    AND p.due_date < NOW() 
    THEN p.amount 
    ELSE 0 
  END), 0) AS overdue_amount,
  
  -- Revenus ce mois (mois calendaire)
  COALESCE(SUM(CASE 
    WHEN p.status = 'completed' 
    AND DATE_TRUNC('month', p.paid_at) = DATE_TRUNC('month', NOW()) 
    THEN p.amount 
    ELSE 0 
  END), 0) AS current_month_revenue,
  
  -- Revenus mois dernier
  COALESCE(SUM(CASE 
    WHEN p.status = 'completed' 
    AND DATE_TRUNC('month', p.paid_at) = DATE_TRUNC('month', NOW() - INTERVAL '1 month') 
    THEN p.amount 
    ELSE 0 
  END), 0) AS last_month_revenue,
  
  -- Croissance
  CASE 
    WHEN SUM(CASE 
      WHEN p.status = 'completed' 
      AND DATE_TRUNC('month', p.paid_at) = DATE_TRUNC('month', NOW() - INTERVAL '1 month') 
      THEN p.amount 
      ELSE 0 
    END) > 0 
    THEN (
      (SUM(CASE 
        WHEN p.status = 'completed' 
        AND DATE_TRUNC('month', p.paid_at) = DATE_TRUNC('month', NOW()) 
        THEN p.amount 
        ELSE 0 
      END) - SUM(CASE 
        WHEN p.status = 'completed' 
        AND DATE_TRUNC('month', p.paid_at) = DATE_TRUNC('month', NOW() - INTERVAL '1 month') 
        THEN p.amount 
        ELSE 0 
      END)) / SUM(CASE 
        WHEN p.status = 'completed' 
        AND DATE_TRUNC('month', p.paid_at) = DATE_TRUNC('month', NOW() - INTERVAL '1 month') 
        THEN p.amount 
        ELSE 0 
      END)
    ) * 100
    ELSE 0 
  END AS revenue_growth,
  
  -- Revenu moyen par groupe
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.school_group_id END) > 0 
    THEN COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) / 
         COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.school_group_id END)
    ELSE 0 
  END AS average_revenue_per_group,
  
  -- Taux de churn (annulés / total)
  CASE 
    WHEN COUNT(DISTINCT s.id) > 0 
    THEN (COUNT(DISTINCT CASE WHEN s.status = 'cancelled' THEN s.id END)::DECIMAL / COUNT(DISTINCT s.id)) * 100
    ELSE 0 
  END AS churn_rate

FROM subscriptions s
LEFT JOIN payments p ON s.id = p.subscription_id;

-- ============================================
-- 3. VUE PLAN_STATS
-- ============================================

CREATE OR REPLACE VIEW plan_stats AS
SELECT
  sp.id AS plan_id,
  sp.name AS plan_name,
  sp.slug AS plan_slug,
  sp.price,
  COUNT(DISTINCT s.id) AS subscription_count,
  COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) AS revenue,
  CASE 
    WHEN (SELECT SUM(CASE WHEN p2.status = 'completed' THEN p2.amount ELSE 0 END) FROM payments p2) > 0
    THEN (COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) / 
          (SELECT SUM(CASE WHEN p2.status = 'completed' THEN p2.amount ELSE 0 END) FROM payments p2)) * 100
    ELSE 0
  END AS percentage,
  COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.id END) AS active_count,
  COUNT(DISTINCT CASE WHEN s.status = 'cancelled' THEN s.id END) AS cancelled_count
FROM subscription_plans sp
LEFT JOIN subscriptions s ON sp.id = s.plan_id
LEFT JOIN payments p ON s.id = p.subscription_id
GROUP BY sp.id, sp.name, sp.slug, sp.price
ORDER BY revenue DESC;

-- ============================================
-- 4. RLS POLICIES
-- ============================================

-- Activer RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Super Admin : accès total
CREATE POLICY "Super Admin full access payments" ON payments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Admin École : voir seulement les paiements de son groupe
CREATE POLICY "School Admin read own payments" ON payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin_ecole'
      AND users.school_group_id = payments.school_group_id
    )
  );

-- Lecture publique pour les vues (authentifiés)
GRANT SELECT ON financial_stats TO authenticated;
GRANT SELECT ON plan_stats TO authenticated;

-- ============================================
-- 5. FONCTIONS UTILITAIRES
-- ============================================

-- Fonction pour générer un numéro de facture
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS VARCHAR AS $$
DECLARE
  next_number INT;
  invoice_number VARCHAR;
BEGIN
  -- Obtenir le prochain numéro
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 9) AS INT)), 0) + 1
  INTO next_number
  FROM payments
  WHERE invoice_number LIKE 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-%';
  
  -- Formater : INV-2025-00001
  invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(next_number::TEXT, 5, '0');
  
  RETURN invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour marquer les paiements en retard
CREATE OR REPLACE FUNCTION mark_overdue_payments()
RETURNS void AS $$
BEGIN
  UPDATE payments
  SET 
    status = 'overdue',
    updated_at = NOW()
  WHERE 
    status = 'pending'
    AND due_date < NOW()
    AND due_date IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. DONNÉES DE TEST (OPTIONNEL)
-- ============================================

-- Insérer quelques paiements de test
-- INSERT INTO payments (subscription_id, school_group_id, invoice_number, amount, payment_method, status, paid_at)
-- SELECT 
--   s.id,
--   s.school_group_id,
--   generate_invoice_number(),
--   sp.price,
--   'mobile_money',
--   'completed',
--   NOW() - (random() * INTERVAL '90 days')
-- FROM subscriptions s
-- JOIN subscription_plans sp ON s.plan_id = sp.id
-- WHERE s.status = 'active'
-- LIMIT 20;

-- ============================================
-- NOTES D'UTILISATION
-- ============================================

-- 1. Créer un paiement :
-- INSERT INTO payments (subscription_id, school_group_id, invoice_number, amount, payment_method, status)
-- VALUES ('uuid-subscription', 'uuid-group', generate_invoice_number(), 25000, 'mobile_money', 'pending');

-- 2. Marquer comme payé :
-- UPDATE payments SET status = 'completed', paid_at = NOW() WHERE id = 'uuid-payment';

-- 3. Rembourser :
-- UPDATE payments SET status = 'refunded', refunded_at = NOW() WHERE id = 'uuid-payment';

-- 4. Voir les stats :
-- SELECT * FROM financial_stats;
-- SELECT * FROM plan_stats;

-- 5. Marquer les paiements en retard (à exécuter quotidiennement) :
-- SELECT mark_overdue_payments();

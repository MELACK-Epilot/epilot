-- =====================================================
-- CONFIGURATION COMPLÈTE DASHBOARD E-PILOT CONGO
-- Vues, Fonctions RPC et Realtime
-- =====================================================

-- =====================================================
-- 1. VUE: payments_enriched
-- Paiements avec toutes les relations
-- =====================================================
CREATE OR REPLACE VIEW payments_enriched AS
SELECT 
  p.id,
  p.invoice_number,
  p.amount,
  p.currency,
  p.status,
  p.payment_method,
  p.transaction_id,
  p.due_date,
  p.paid_at,
  p.validated_at,
  p.refunded_at,
  p.refund_reason,
  p.notes,
  p.created_at,
  p.updated_at,
  
  -- Relations
  sg.id as school_group_id,
  sg.name as school_group_name,
  
  s.id as subscription_id,
  s.status as subscription_status,
  
  sp.id as plan_id,
  sp.name as plan_name,
  sp.slug as plan_slug,
  
  -- Statut détaillé
  CASE 
    WHEN p.status = 'completed' THEN 'completed'
    WHEN p.status = 'pending' AND p.due_date < NOW() THEN 'overdue'
    WHEN p.status = 'pending' THEN 'pending'
    WHEN p.status = 'failed' THEN 'failed'
    WHEN p.status = 'refunded' THEN 'refunded'
    ELSE p.status
  END as detailed_status

FROM payments p
LEFT JOIN subscriptions s ON p.subscription_id = s.id
LEFT JOIN school_groups sg ON s.school_group_id = sg.id
LEFT JOIN subscription_plans sp ON s.plan_id = sp.id;

-- =====================================================
-- 2. VUE: payment_statistics
-- Statistiques globales des paiements
-- =====================================================
CREATE OR REPLACE VIEW payment_statistics AS
SELECT 
  COUNT(*) as total_payments,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
  COUNT(*) FILTER (WHERE status = 'refunded') as refunded_count,
  COUNT(*) FILTER (WHERE status = 'pending' AND due_date < NOW()) as overdue_count,
  
  COALESCE(SUM(amount), 0) as total_amount,
  COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as completed_amount,
  COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) as pending_amount,
  COALESCE(SUM(amount) FILTER (WHERE status = 'pending' AND due_date < NOW()), 0) as overdue_amount,
  COALESCE(SUM(amount) FILTER (WHERE status = 'refunded'), 0) as refunded_amount

FROM payments;

-- =====================================================
-- 3. VUE: payment_monthly_stats
-- Statistiques mensuelles des paiements
-- =====================================================
CREATE OR REPLACE VIEW payment_monthly_stats AS
SELECT 
  TO_CHAR(DATE_TRUNC('month', paid_at), 'YYYY-MM') as month,
  TO_CHAR(DATE_TRUNC('month', paid_at), 'Mon YYYY') as month_label,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
  COALESCE(SUM(amount), 0) as total_amount,
  COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as completed_amount
FROM payments
WHERE paid_at IS NOT NULL
GROUP BY DATE_TRUNC('month', paid_at)
ORDER BY DATE_TRUNC('month', paid_at) DESC;

-- =====================================================
-- 4. VUE: financial_stats
-- Statistiques financières globales
-- =====================================================
CREATE OR REPLACE VIEW financial_stats AS
SELECT 
  -- MRR (Monthly Recurring Revenue)
  COALESCE(SUM(
    CASE 
      WHEN sp.billing_period = 'monthly' THEN sp.price
      WHEN sp.billing_period = 'yearly' THEN sp.price / 12
      ELSE 0
    END
  ), 0) as mrr,
  
  -- ARR (Annual Recurring Revenue)
  COALESCE(SUM(
    CASE 
      WHEN sp.billing_period = 'monthly' THEN sp.price * 12
      WHEN sp.billing_period = 'yearly' THEN sp.price
      ELSE 0
    END
  ), 0) as arr,
  
  -- Nombre d'abonnements actifs
  COUNT(*) FILTER (WHERE s.status = 'active') as active_subscriptions,
  
  -- Nombre d'abonnements expirés
  COUNT(*) FILTER (WHERE s.status = 'expired') as expired_subscriptions,
  
  -- Nombre d'abonnements annulés
  COUNT(*) FILTER (WHERE s.status = 'cancelled') as cancelled_subscriptions,
  
  -- Revenus totaux (paiements complétés)
  (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed') as total_revenue

FROM subscriptions s
LEFT JOIN subscription_plans sp ON s.plan_id = sp.id;

-- =====================================================
-- 5. VUE: expenses_enriched
-- Dépenses avec toutes les relations
-- =====================================================
CREATE OR REPLACE VIEW expenses_enriched AS
SELECT 
  e.id,
  e.title,
  e.description,
  e.amount,
  e.currency,
  e.category,
  e.status,
  e.payment_method,
  e.receipt_url,
  e.expense_date,
  e.approved_at,
  e.approved_by,
  e.created_at,
  e.updated_at,
  
  -- Relations
  sg.id as school_group_id,
  sg.name as school_group_name,
  
  u.id as created_by_id,
  u.first_name || ' ' || u.last_name as created_by_name

FROM expenses e
LEFT JOIN school_groups sg ON e.school_group_id = sg.id
LEFT JOIN users u ON e.created_by = u.id;

-- =====================================================
-- 6. VUE: expense_statistics
-- Statistiques des dépenses
-- =====================================================
CREATE OR REPLACE VIEW expense_statistics AS
SELECT 
  COUNT(*) as total_expenses,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'paid') as paid_count,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
  
  COALESCE(SUM(amount), 0) as total_amount,
  COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) as pending_amount,
  COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0) as paid_amount,
  COALESCE(SUM(amount) FILTER (WHERE status = 'cancelled'), 0) as cancelled_amount,
  
  -- Mois en cours
  COALESCE(SUM(amount) FILTER (
    WHERE DATE_TRUNC('month', expense_date) = DATE_TRUNC('month', NOW())
  ), 0) as current_month_amount,
  
  -- Moyenne
  COALESCE(AVG(amount), 0) as average_expense,
  
  -- Taux de paiement
  CASE 
    WHEN COUNT(*) > 0 THEN 
      (COUNT(*) FILTER (WHERE status = 'paid')::FLOAT / COUNT(*)::FLOAT * 100)
    ELSE 0
  END as payment_rate

FROM expenses;

-- =====================================================
-- 7. VUE: expenses_by_category
-- Dépenses groupées par catégorie
-- =====================================================
CREATE OR REPLACE VIEW expenses_by_category AS
SELECT 
  category,
  COUNT(*) as count,
  COALESCE(SUM(amount), 0) as total_amount,
  COALESCE(AVG(amount), 0) as average_amount
FROM expenses
WHERE status != 'cancelled'
GROUP BY category
ORDER BY total_amount DESC;

-- =====================================================
-- 8. VUE: expenses_monthly
-- Dépenses mensuelles
-- =====================================================
CREATE OR REPLACE VIEW expenses_monthly AS
SELECT 
  TO_CHAR(DATE_TRUNC('month', expense_date), 'YYYY-MM') as month,
  TO_CHAR(DATE_TRUNC('month', expense_date), 'Mon YYYY') as month_label,
  COUNT(*) as count,
  COALESCE(SUM(amount), 0) as total_amount,
  COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0) as paid_amount
FROM expenses
WHERE expense_date IS NOT NULL
GROUP BY DATE_TRUNC('month', expense_date)
ORDER BY DATE_TRUNC('month', expense_date) DESC;

-- =====================================================
-- 9. FONCTION RPC: get_dashboard_stats
-- Statistiques pour le dashboard Super Admin
-- =====================================================
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_school_groups', (SELECT COUNT(*) FROM school_groups WHERE status = 'active'),
    'active_users', (SELECT COUNT(*) FROM users WHERE status = 'active'),
    'estimated_mrr', (SELECT COALESCE(mrr, 0) FROM financial_stats),
    'critical_subscriptions', (
      SELECT COUNT(*) 
      FROM subscriptions 
      WHERE status = 'active' 
      AND end_date < NOW() + INTERVAL '7 days'
    ),
    'total_revenue', (SELECT COALESCE(total_revenue, 0) FROM financial_stats),
    'active_subscriptions', (SELECT COALESCE(active_subscriptions, 0) FROM financial_stats)
  ) INTO result;
  
  RETURN result;
END;
$$;

-- =====================================================
-- 10. FONCTION RPC: get_financial_kpis
-- KPIs financiers avancés
-- =====================================================
CREATE OR REPLACE FUNCTION get_financial_kpis()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  v_active_subs INTEGER;
  v_total_groups INTEGER;
  v_mrr NUMERIC;
  v_cancelled_subs INTEGER;
  v_arpu NUMERIC;
  v_conversion_rate NUMERIC;
  v_churn_rate NUMERIC;
  v_ltv NUMERIC;
BEGIN
  -- Récupérer les données
  SELECT 
    active_subscriptions,
    mrr,
    cancelled_subscriptions
  INTO v_active_subs, v_mrr, v_cancelled_subs
  FROM financial_stats;
  
  SELECT COUNT(*) INTO v_total_groups FROM school_groups;
  
  -- Calculer ARPU
  IF v_active_subs > 0 THEN
    v_arpu := v_mrr / v_active_subs;
  ELSE
    v_arpu := 0;
  END IF;
  
  -- Calculer taux de conversion
  IF v_total_groups > 0 THEN
    v_conversion_rate := (v_active_subs::FLOAT / v_total_groups::FLOAT) * 100;
  ELSE
    v_conversion_rate := 0;
  END IF;
  
  -- Calculer churn rate
  IF (v_active_subs + v_cancelled_subs) > 0 THEN
    v_churn_rate := (v_cancelled_subs::FLOAT / (v_active_subs + v_cancelled_subs)::FLOAT) * 100;
  ELSE
    v_churn_rate := 0;
  END IF;
  
  -- Calculer LTV
  IF v_churn_rate > 0 THEN
    v_ltv := v_arpu / (v_churn_rate / 100);
  ELSE
    v_ltv := v_arpu * 12; -- 1 an par défaut
  END IF;
  
  -- Construire le résultat
  SELECT json_build_object(
    'arpu', ROUND(v_arpu, 2),
    'conversion_rate', ROUND(v_conversion_rate, 2),
    'churn_rate', ROUND(v_churn_rate, 2),
    'ltv', ROUND(v_ltv, 2),
    'active_subscriptions_count', v_active_subs,
    'total_groups_count', v_total_groups,
    'canceled_subscriptions_count', v_cancelled_subs,
    'monthly_revenue', ROUND(v_mrr, 2)
  ) INTO result;
  
  RETURN result;
END;
$$;

-- =====================================================
-- 11. ACTIVER REALTIME sur toutes les tables
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE payments;
ALTER PUBLICATION supabase_realtime ADD TABLE subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE school_groups;
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE subscription_plans;

-- =====================================================
-- 12. INDEXES pour performance
-- =====================================================

-- Payments
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payments(paid_at);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date);

-- Subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_school_group_id ON subscriptions(school_group_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON subscriptions(end_date);

-- Expenses
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_school_group_id ON expenses(school_group_id);

-- School Groups
CREATE INDEX IF NOT EXISTS idx_school_groups_status ON school_groups(status);

-- Users
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- =====================================================
-- 13. PERMISSIONS (RLS)
-- =====================================================

-- Les vues héritent des permissions des tables sous-jacentes
-- Assurez-vous que les RLS policies sont bien configurées

-- Fonction accessible à tous les utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_financial_kpis() TO authenticated;

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================

-- Vérification
SELECT 'Configuration terminée avec succès!' as status;

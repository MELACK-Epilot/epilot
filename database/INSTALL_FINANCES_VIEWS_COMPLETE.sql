-- =====================================================
-- INSTALLATION COMPLÈTE - VUES FINANCIÈRES
-- =====================================================
-- Crée toutes les vues nécessaires pour la page Finances
-- Super Admin e-pilot
-- Date: 6 novembre 2025
-- =====================================================

-- =====================================================
-- VUE 1 : FINANCIAL_STATS (Dashboard Super Admin)
-- =====================================================

DROP VIEW IF EXISTS public.financial_stats CASCADE;

CREATE OR REPLACE VIEW public.financial_stats AS
WITH 
-- Calcul des abonnements
subscription_stats AS (
  SELECT 
    COUNT(*) as total_subscriptions,
    COUNT(*) FILTER (WHERE s.status = 'active') as active_subscriptions,
    COUNT(*) FILTER (WHERE s.status = 'pending') as pending_subscriptions,
    COUNT(*) FILTER (WHERE s.status = 'expired') as expired_subscriptions,
    COUNT(*) FILTER (WHERE s.status = 'cancelled') as cancelled_subscriptions,
    0 as trial_subscriptions,
    -- MRR (Monthly Recurring Revenue)
    COALESCE(SUM(
      CASE 
        WHEN s.status = 'active' THEN 
          CASE p.billing_period
            WHEN 'monthly' THEN p.price
            WHEN 'quarterly' THEN p.price / 3
            WHEN 'yearly' THEN p.price / 12
            ELSE 0
          END
        ELSE 0
      END
    ), 0) as mrr
  FROM public.subscriptions s
  LEFT JOIN public.plans p ON s.plan_id = p.id
),

-- Calcul des revenus
revenue_stats AS (
  SELECT 
    COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed'), 0) as total_revenue,
    COALESCE(SUM(fp.amount) FILTER (
      WHERE fp.status = 'completed' 
      AND fp.payment_date >= DATE_TRUNC('month', CURRENT_DATE)
    ), 0) as monthly_revenue,
    COALESCE(SUM(fp.amount) FILTER (
      WHERE fp.status = 'completed' 
      AND fp.payment_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
      AND fp.payment_date < DATE_TRUNC('month', CURRENT_DATE)
    ), 0) as monthly_revenue_previous,
    COALESCE(SUM(fp.amount) FILTER (
      WHERE fp.status = 'completed' 
      AND fp.payment_date >= DATE_TRUNC('year', CURRENT_DATE)
    ), 0) as yearly_revenue,
    COUNT(*) FILTER (WHERE fp.status = 'overdue') as overdue_payments,
    COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'overdue'), 0) as overdue_amount
  FROM public.fee_payments fp
),

-- Calcul des groupes
group_stats AS (
  SELECT 
    COUNT(DISTINCT school_group_id) as total_groups,
    CASE 
      WHEN COUNT(DISTINCT school_group_id) > 0 
      THEN (SELECT total_revenue FROM revenue_stats) / COUNT(DISTINCT school_group_id)
      ELSE 0
    END as average_revenue_per_group
  FROM public.schools
  WHERE school_group_id IS NOT NULL
),

-- Calcul churn et rétention
churn_stats AS (
  SELECT 
    COUNT(*) FILTER (
      WHERE s.status = 'active' 
      OR (s.status = 'cancelled' AND s.updated_at >= CURRENT_DATE - INTERVAL '30 days')
    ) as active_30_days_ago,
    COUNT(*) FILTER (
      WHERE s.status = 'cancelled' 
      AND s.updated_at >= CURRENT_DATE - INTERVAL '30 days'
    ) as churned_last_30_days,
    COUNT(*) FILTER (
      WHERE s.created_at >= CURRENT_DATE - INTERVAL '30 days'
    ) as new_last_30_days
  FROM public.subscriptions s
),

-- Calcul LTV
ltv_stats AS (
  SELECT 
    CASE 
      WHEN COUNT(DISTINCT s.school_group_id) > 0 
      THEN (SELECT total_revenue FROM revenue_stats) / COUNT(DISTINCT s.school_group_id)
      ELSE 0
    END as lifetime_value
  FROM public.subscriptions s
  WHERE s.status IN ('active', 'expired', 'cancelled')
)

-- Assemblage final
SELECT 
  -- Abonnements
  ss.total_subscriptions,
  ss.active_subscriptions,
  ss.pending_subscriptions,
  ss.expired_subscriptions,
  ss.cancelled_subscriptions,
  ss.trial_subscriptions,
  
  -- Revenus
  rs.total_revenue,
  rs.monthly_revenue,
  rs.yearly_revenue,
  rs.overdue_payments,
  rs.overdue_amount,
  
  -- MRR & ARR
  ss.mrr,
  ss.mrr * 12 as arr,
  
  -- Croissance
  CASE 
    WHEN rs.monthly_revenue_previous > 0 
    THEN ((rs.monthly_revenue - rs.monthly_revenue_previous) / rs.monthly_revenue_previous) * 100
    ELSE 0
  END as revenue_growth,
  
  -- Métriques
  gs.average_revenue_per_group,
  CASE 
    WHEN cs.active_30_days_ago > 0 
    THEN (cs.churned_last_30_days::DECIMAL / cs.active_30_days_ago) * 100
    ELSE 0
  END as churn_rate,
  CASE 
    WHEN cs.active_30_days_ago > 0 
    THEN ((cs.active_30_days_ago - cs.churned_last_30_days)::DECIMAL / cs.active_30_days_ago) * 100
    ELSE 0
  END as retention_rate,
  CASE 
    WHEN ss.total_subscriptions > 0 
    THEN (cs.new_last_30_days::DECIMAL / ss.total_subscriptions) * 100
    ELSE 0
  END as conversion_rate,
  ltv.lifetime_value,
  
  -- Période précédente
  rs.monthly_revenue_previous,
  
  -- Timestamp
  NOW() as last_updated

FROM subscription_stats ss
CROSS JOIN revenue_stats rs
CROSS JOIN group_stats gs
CROSS JOIN churn_stats cs
CROSS JOIN ltv_stats ltv;

COMMENT ON VIEW public.financial_stats IS 'Statistiques financières globales pour le dashboard Super Admin';

-- =====================================================
-- VUE 2 : PLAN_STATS (Page Plans & Tarifs)
-- =====================================================

DROP VIEW IF EXISTS public.plan_stats CASCADE;

CREATE OR REPLACE VIEW public.plan_stats AS
SELECT 
  p.id as plan_id,
  p.name as plan_name,
  p.slug as plan_slug,
  p.price,
  p.currency,
  p.billing_period,
  p.status as is_active,
  
  -- Abonnements
  COUNT(DISTINCT s.id) as subscription_count,
  COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'active') as active_subscriptions,
  0 as trial_subscriptions,
  COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'expired') as expired_subscriptions,
  
  -- Revenus
  COALESCE(SUM(
    CASE 
      WHEN s.status = 'active' THEN 
        CASE p.billing_period
          WHEN 'monthly' THEN p.price
          WHEN 'quarterly' THEN p.price / 3
          WHEN 'yearly' THEN p.price / 12
          ELSE 0
        END
      ELSE 0
    END
  ), 0) as mrr,
  
  COALESCE(SUM(
    CASE 
      WHEN s.status IN ('active', 'expired', 'cancelled') THEN p.price
      ELSE 0
    END
  ), 0) as revenue,
  
  -- Croissance
  COUNT(DISTINCT s.id) FILTER (
    WHERE s.created_at >= CURRENT_DATE - INTERVAL '30 days'
  ) as growth,
  
  -- Pourcentage
  CASE 
    WHEN (SELECT COUNT(*) FROM public.subscriptions) > 0 
    THEN (COUNT(DISTINCT s.id)::DECIMAL / (SELECT COUNT(*) FROM public.subscriptions)) * 100
    ELSE 0
  END as percentage,
  
  NOW() as last_updated

FROM public.plans p
LEFT JOIN public.subscriptions s ON s.plan_id = p.id

GROUP BY 
  p.id, p.name, p.slug, p.price, p.currency, p.billing_period, p.status

ORDER BY subscription_count DESC, p.price DESC;

COMMENT ON VIEW public.plan_stats IS 'Statistiques des plans d''abonnement';

-- =====================================================
-- VUE 3 : SUBSCRIPTION_STATS (Page Abonnements)
-- =====================================================

DROP VIEW IF EXISTS public.subscription_stats CASCADE;

CREATE OR REPLACE VIEW public.subscription_stats AS
SELECT 
  s.id as subscription_id,
  s.school_group_id,
  sg.name as school_group_name,
  s.plan_id,
  p.name as plan_name,
  p.slug as plan_slug,
  s.status,
  s.start_date,
  s.end_date,
  s.created_at,
  
  -- Calcul jours restants
  CASE 
    WHEN s.status = 'active' AND s.end_date > CURRENT_DATE 
    THEN EXTRACT(DAY FROM (s.end_date - CURRENT_DATE))::INTEGER
    ELSE 0
  END as days_remaining,
  
  -- Statut d'expiration
  CASE 
    WHEN s.status = 'expired' THEN 'expired'
    WHEN s.status = 'active' AND s.end_date <= CURRENT_DATE THEN 'expired_not_updated'
    WHEN s.status = 'active' AND s.end_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'expiring_soon'
    WHEN s.status = 'active' THEN 'active'
    WHEN s.status = 'cancelled' THEN 'cancelled'
    WHEN s.status = 'pending' THEN 'pending'
    ELSE 'other'
  END as expiration_status,
  
  -- Revenus
  p.price as plan_price,
  p.currency,
  p.billing_period,
  
  -- MRR de cet abonnement
  CASE 
    WHEN s.status = 'active' THEN 
      CASE p.billing_period
        WHEN 'monthly' THEN p.price
        WHEN 'quarterly' THEN p.price / 3
        WHEN 'yearly' THEN p.price / 12
        ELSE 0
      END
    ELSE 0
  END as mrr_contribution,
  
  NOW() as last_updated

FROM public.subscriptions s
JOIN public.school_groups sg ON s.school_group_id = sg.id
JOIN public.plans p ON s.plan_id = p.id

ORDER BY 
  CASE s.status
    WHEN 'active' THEN 1
    WHEN 'trial' THEN 2
    WHEN 'pending' THEN 3
    WHEN 'expired' THEN 4
    ELSE 5
  END,
  s.end_date ASC;

COMMENT ON VIEW public.subscription_stats IS 'Statistiques détaillées des abonnements avec statuts d''expiration';

-- =====================================================
-- VUE 4 : PAYMENT_STATS (Page Paiements)
-- =====================================================

DROP VIEW IF EXISTS public.payment_stats CASCADE;

CREATE OR REPLACE VIEW public.payment_stats AS
SELECT 
  fp.id as payment_id,
  fp.school_id,
  s.name as school_name,
  s.school_group_id,
  sg.name as school_group_name,
  fp.student_fee_id,
  fp.amount,
  fp.status,
  fp.payment_date,
  fp.payment_method,
  fp.created_at,
  
  -- Calcul retard
  CASE 
    WHEN fp.status = 'pending' AND fp.payment_date < CURRENT_DATE 
    THEN EXTRACT(DAY FROM (CURRENT_DATE - fp.payment_date))::INTEGER
    ELSE 0
  END as days_overdue,
  
  -- Statut détaillé
  CASE 
    WHEN fp.status = 'completed' THEN 'completed'
    WHEN fp.status = 'pending' AND fp.payment_date < CURRENT_DATE THEN 'overdue'
    WHEN fp.status = 'pending' AND fp.payment_date >= CURRENT_DATE THEN 'pending'
    WHEN fp.status = 'cancelled' THEN 'cancelled'
    WHEN fp.status = 'failed' THEN 'failed'
    ELSE 'unknown'
  END as detailed_status,
  
  NOW() as last_updated

FROM public.fee_payments fp
JOIN public.schools s ON fp.school_id = s.id
JOIN public.school_groups sg ON s.school_group_id = sg.id

ORDER BY 
  CASE fp.status
    WHEN 'pending' THEN 1
    WHEN 'completed' THEN 2
    ELSE 3
  END,
  fp.payment_date DESC;

COMMENT ON VIEW public.payment_stats IS 'Statistiques des paiements avec calcul automatique des retards';

-- =====================================================
-- TEST DES VUES
-- =====================================================

-- Test financial_stats
SELECT 'financial_stats' as vue, 
       mrr, arr, total_revenue, revenue_growth 
FROM public.financial_stats;

-- Test plan_stats
SELECT 'plan_stats' as vue, 
       COUNT(*) as nb_plans, 
       SUM(subscription_count) as total_subscriptions 
FROM public.plan_stats;

-- Test subscription_stats
SELECT 'subscription_stats' as vue, 
       COUNT(*) as nb_subscriptions,
       COUNT(*) FILTER (WHERE status = 'active') as actifs
FROM public.subscription_stats;

-- Test payment_stats
SELECT 'payment_stats' as vue, 
       COUNT(*) as nb_paiements,
       COUNT(*) FILTER (WHERE status = 'completed') as completes
FROM public.payment_stats;

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================

SELECT '✅ Toutes les vues financières créées avec succès !' as status,
       '📊 4 vues disponibles : financial_stats, plan_stats, subscription_stats, payment_stats' as info;

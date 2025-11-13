-- =====================================================
-- CORRECTION : FINANCIAL_STATS - UTILISER LA BONNE TABLE
-- =====================================================
-- Problème : La vue utilise 'subscriptions' mais la vraie table
--            peut être 'school_group_subscriptions'
-- Solution : Recréer la vue avec la bonne table
-- =====================================================

-- Étape 1 : Vérifier quelle table existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'school_group_subscriptions') THEN
    RAISE NOTICE '✅ Table school_group_subscriptions existe';
  ELSE
    RAISE NOTICE '⚠️  Table school_group_subscriptions n''existe PAS';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
    RAISE NOTICE '✅ Table subscriptions existe';
  ELSE
    RAISE NOTICE '⚠️  Table subscriptions n''existe PAS';
  END IF;
END $$;

-- Étape 2 : Supprimer l'ancienne vue
DROP VIEW IF EXISTS public.financial_stats CASCADE;

-- Étape 3 : Recréer la vue avec la bonne table
CREATE OR REPLACE VIEW public.financial_stats AS
WITH 
-- Calcul des abonnements (utilise school_group_subscriptions)
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
  FROM public.school_group_subscriptions s  -- ← TABLE CORRIGÉE
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
  FROM public.school_group_subscriptions s  -- ← TABLE CORRIGÉE
),

-- Calcul LTV
ltv_stats AS (
  SELECT 
    CASE 
      WHEN COUNT(DISTINCT s.school_group_id) > 0 
      THEN (SELECT total_revenue FROM revenue_stats) / COUNT(DISTINCT s.school_group_id)
      ELSE 0
    END as lifetime_value
  FROM public.school_group_subscriptions s  -- ← TABLE CORRIGÉE
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

COMMENT ON VIEW public.financial_stats IS 'Statistiques financières globales pour le dashboard Super Admin (utilise school_group_subscriptions)';

-- Étape 4 : Tester la vue
SELECT 
  '✅ VUE CORRIGÉE' as status,
  mrr,
  arr,
  total_revenue,
  monthly_revenue,
  revenue_growth,
  active_subscriptions,
  total_subscriptions
FROM public.financial_stats;

-- Étape 5 : Vérifier les données sources
SELECT 
  '📊 DONNÉES SOURCES' as info,
  (SELECT COUNT(*) FROM school_group_subscriptions) as total_abonnements,
  (SELECT COUNT(*) FROM school_group_subscriptions WHERE status = 'active') as abonnements_actifs,
  (SELECT COUNT(*) FROM plans) as total_plans,
  (SELECT COUNT(*) FROM fee_payments WHERE status = 'completed') as paiements_completes;

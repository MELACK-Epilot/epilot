-- =====================================================
-- VUE FINANCIAL_STATS - SUPER ADMIN DASHBOARD
-- =====================================================
-- Vue globale pour les KPIs financiers du Super Admin
-- Agrège toutes les données financières en temps réel
-- Date: 6 novembre 2025
-- =====================================================

-- 1. SUPPRIMER L'ANCIENNE VUE SI ELLE EXISTE
-- =====================================================

DROP VIEW IF EXISTS public.financial_stats CASCADE;

-- 2. CRÉER LA VUE FINANCIAL_STATS
-- =====================================================

CREATE OR REPLACE VIEW public.financial_stats AS
WITH 
-- Calcul des abonnements
subscription_stats AS (
  SELECT 
    COUNT(*) as total_subscriptions,
    COUNT(*) FILTER (WHERE status = 'active') as active_subscriptions,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_subscriptions,
    COUNT(*) FILTER (WHERE status = 'expired') as expired_subscriptions,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_subscriptions,
    COUNT(*) FILTER (WHERE status = 'trial') as trial_subscriptions,
    -- MRR (Monthly Recurring Revenue) = Somme des prix des abonnements actifs
    COALESCE(SUM(
      CASE 
        WHEN status = 'active' THEN 
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

-- Calcul des revenus (paiements)
revenue_stats AS (
  SELECT 
    -- Revenus totaux (tous les paiements complétés)
    COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as total_revenue,
    
    -- Revenus ce mois
    COALESCE(SUM(amount) FILTER (
      WHERE status = 'completed' 
      AND payment_date >= DATE_TRUNC('month', CURRENT_DATE)
    ), 0) as monthly_revenue,
    
    -- Revenus mois dernier
    COALESCE(SUM(amount) FILTER (
      WHERE status = 'completed' 
      AND payment_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
      AND payment_date < DATE_TRUNC('month', CURRENT_DATE)
    ), 0) as monthly_revenue_previous,
    
    -- Revenus cette année
    COALESCE(SUM(amount) FILTER (
      WHERE status = 'completed' 
      AND payment_date >= DATE_TRUNC('year', CURRENT_DATE)
    ), 0) as yearly_revenue,
    
    -- Paiements en retard
    COUNT(*) FILTER (WHERE status = 'overdue') as overdue_payments,
    COALESCE(SUM(amount) FILTER (WHERE status = 'overdue'), 0) as overdue_amount
  FROM public.fee_payments
),

-- Calcul des groupes scolaires
group_stats AS (
  SELECT 
    COUNT(DISTINCT school_group_id) as total_groups,
    -- Revenu moyen par groupe
    CASE 
      WHEN COUNT(DISTINCT school_group_id) > 0 
      THEN (SELECT total_revenue FROM revenue_stats) / COUNT(DISTINCT school_group_id)
      ELSE 0
    END as average_revenue_per_group
  FROM public.schools
  WHERE school_group_id IS NOT NULL
),

-- Calcul du churn et rétention (derniers 30 jours)
churn_stats AS (
  SELECT 
    -- Abonnements actifs il y a 30 jours
    COUNT(*) FILTER (
      WHERE status = 'active' 
      OR (status = 'cancelled' AND updated_at >= CURRENT_DATE - INTERVAL '30 days')
    ) as active_30_days_ago,
    
    -- Abonnements annulés dans les 30 derniers jours
    COUNT(*) FILTER (
      WHERE status = 'cancelled' 
      AND updated_at >= CURRENT_DATE - INTERVAL '30 days'
    ) as churned_last_30_days,
    
    -- Nouveaux abonnements dans les 30 derniers jours
    COUNT(*) FILTER (
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    ) as new_last_30_days
  FROM public.subscriptions
),

-- Calcul LTV (Lifetime Value)
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
  
  -- Croissance des revenus (%)
  CASE 
    WHEN rs.monthly_revenue_previous > 0 
    THEN ((rs.monthly_revenue - rs.monthly_revenue_previous) / rs.monthly_revenue_previous) * 100
    ELSE 0
  END as revenue_growth,
  
  -- Revenu moyen par groupe
  gs.average_revenue_per_group,
  
  -- Churn Rate (%)
  CASE 
    WHEN cs.active_30_days_ago > 0 
    THEN (cs.churned_last_30_days::DECIMAL / cs.active_30_days_ago) * 100
    ELSE 0
  END as churn_rate,
  
  -- Retention Rate (%)
  CASE 
    WHEN cs.active_30_days_ago > 0 
    THEN ((cs.active_30_days_ago - cs.churned_last_30_days)::DECIMAL / cs.active_30_days_ago) * 100
    ELSE 0
  END as retention_rate,
  
  -- Conversion Rate (nouveaux abonnements / total)
  CASE 
    WHEN ss.total_subscriptions > 0 
    THEN (cs.new_last_30_days::DECIMAL / ss.total_subscriptions) * 100
    ELSE 0
  END as conversion_rate,
  
  -- Lifetime Value
  ltv.lifetime_value,
  
  -- Données période précédente (pour comparaisons)
  rs.monthly_revenue_previous,
  gs.average_revenue_per_group as average_revenue_per_group_previous,
  
  -- Timestamp
  NOW() as last_updated

FROM subscription_stats ss
CROSS JOIN revenue_stats rs
CROSS JOIN group_stats gs
CROSS JOIN churn_stats cs
CROSS JOIN ltv_stats ltv;

-- 3. COMMENTAIRES
-- =====================================================

COMMENT ON VIEW public.financial_stats IS 'Vue globale des statistiques financières pour le dashboard Super Admin - Données temps réel';

-- 4. PERMISSIONS RLS
-- =====================================================

-- Seul le Super Admin peut voir cette vue
CREATE POLICY "Super Admin can view financial stats"
  ON public.financial_stats FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- 5. TEST DE LA VUE
-- =====================================================

SELECT 
  'MRR' as metric, 
  mrr as value,
  'FCFA' as unit
FROM public.financial_stats
UNION ALL
SELECT 
  'ARR' as metric, 
  arr as value,
  'FCFA' as unit
FROM public.financial_stats
UNION ALL
SELECT 
  'Revenus Totaux' as metric, 
  total_revenue as value,
  'FCFA' as unit
FROM public.financial_stats
UNION ALL
SELECT 
  'Croissance' as metric, 
  revenue_growth as value,
  '%' as unit
FROM public.financial_stats
UNION ALL
SELECT 
  'Abonnements Actifs' as metric, 
  active_subscriptions as value,
  'count' as unit
FROM public.financial_stats;

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================

SELECT '✅ Vue financial_stats créée avec succès !' as status;

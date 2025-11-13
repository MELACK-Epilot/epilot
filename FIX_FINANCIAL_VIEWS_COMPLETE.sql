-- ============================================
-- COHÉRENCE COMPLÈTE BDD ↔ DASHBOARD FINANCIER
-- Vue SQL avec comparaisons période précédente
-- ============================================

-- Sauvegarder les vues existantes (au cas où)
DROP VIEW IF EXISTS financial_stats_backup;
CREATE VIEW financial_stats_backup AS SELECT * FROM financial_stats;

DROP VIEW IF EXISTS plan_stats_backup;
CREATE VIEW plan_stats_backup AS SELECT * FROM plan_stats;

-- ============================================
-- 1. VUE FINANCIAL_STATS COMPLÈTE
-- Avec comparaisons période précédente
-- ============================================

-- Supprimer complètement la vue existante
DROP VIEW IF EXISTS financial_stats CASCADE;

CREATE VIEW financial_stats AS
WITH current_period AS (
  SELECT
    -- Abonnements actuels
    COUNT(DISTINCT s.id) AS total_subscriptions,
    COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.id END) AS active_subscriptions,
    COUNT(DISTINCT CASE WHEN s.status = 'pending' THEN s.id END) AS pending_subscriptions,
    COUNT(DISTINCT CASE WHEN s.status = 'expired' THEN s.id END) AS expired_subscriptions,
    COUNT(DISTINCT CASE WHEN s.status = 'cancelled' THEN s.id END) AS cancelled_subscriptions,
    
    -- Revenus actuels
    COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) AS total_revenue,
    
    -- MRR (30 derniers jours)
    COALESCE(SUM(CASE 
      WHEN p.status = 'completed' 
      AND p.paid_at >= NOW() - INTERVAL '30 days' 
      THEN p.amount 
      ELSE 0 
    END), 0) AS monthly_revenue,
    
    -- Revenus annuels
    COALESCE(SUM(CASE 
      WHEN p.status = 'completed' 
      AND p.paid_at >= NOW() - INTERVAL '365 days' 
      THEN p.amount 
      ELSE 0 
    END), 0) AS yearly_revenue,
    
    -- Paiements en retard
    COUNT(DISTINCT CASE 
      WHEN p.status = 'pending' 
      AND p.created_at < NOW() - INTERVAL '30 days'
      THEN p.id 
    END) AS overdue_payments,
    
    COALESCE(SUM(CASE 
      WHEN p.status = 'pending' 
      AND p.created_at < NOW() - INTERVAL '30 days'
      THEN p.amount 
      ELSE 0 
    END), 0) AS overdue_amount,
    
    -- Revenu moyen par groupe actif
    CASE 
      WHEN COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.school_group_id END) > 0 
      THEN COALESCE(SUM(CASE 
        WHEN p.status = 'completed' 
        AND p.paid_at >= NOW() - INTERVAL '30 days' 
        THEN p.amount 
        ELSE 0 
      END), 0) / NULLIF(COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.school_group_id END), 0)
      ELSE 0 
    END AS average_revenue_per_group,
    
    -- Taux de churn
    CASE 
      WHEN COUNT(DISTINCT s.id) > 0 
      THEN (COUNT(DISTINCT CASE WHEN s.status = 'cancelled' THEN s.id END)::DECIMAL / NULLIF(COUNT(DISTINCT s.id), 0)) * 100
      ELSE 0 
    END AS churn_rate,
    
    -- Taux de rétention
    CASE 
      WHEN COUNT(DISTINCT s.id) > 0 
      THEN 100 - (COUNT(DISTINCT CASE WHEN s.status = 'cancelled' THEN s.id END)::DECIMAL / NULLIF(COUNT(DISTINCT s.id), 0)) * 100
      ELSE 100 
    END AS retention_rate
    
  FROM subscriptions s
  LEFT JOIN payments p ON s.id = p.subscription_id
),
previous_period AS (
  SELECT
    -- Revenus mois précédent (30-60 jours en arrière)
    COALESCE(SUM(CASE 
      WHEN p.status = 'completed' 
      AND p.paid_at >= NOW() - INTERVAL '60 days'
      AND p.paid_at < NOW() - INTERVAL '30 days'
      THEN p.amount 
      ELSE 0 
    END), 0) AS monthly_revenue_previous,
    
    -- ARPU mois précédent
    CASE 
      WHEN COUNT(DISTINCT CASE 
        WHEN s.status = 'active' 
        AND s.created_at < NOW() - INTERVAL '30 days'
        THEN s.school_group_id 
      END) > 0 
      THEN COALESCE(SUM(CASE 
        WHEN p.status = 'completed' 
        AND p.paid_at >= NOW() - INTERVAL '60 days'
        AND p.paid_at < NOW() - INTERVAL '30 days'
        THEN p.amount 
        ELSE 0 
      END), 0) / NULLIF(COUNT(DISTINCT CASE 
        WHEN s.status = 'active' 
        AND s.created_at < NOW() - INTERVAL '30 days'
        THEN s.school_group_id 
      END), 0)
      ELSE 0 
    END AS average_revenue_per_group_previous,
    
    -- Churn rate mois précédent
    CASE 
      WHEN COUNT(DISTINCT CASE 
        WHEN s.created_at < NOW() - INTERVAL '30 days'
        THEN s.id 
      END) > 0 
      THEN (COUNT(DISTINCT CASE 
        WHEN s.status = 'cancelled' 
        AND s.updated_at >= NOW() - INTERVAL '60 days'
        AND s.updated_at < NOW() - INTERVAL '30 days'
        THEN s.id 
      END)::DECIMAL / NULLIF(COUNT(DISTINCT CASE 
        WHEN s.created_at < NOW() - INTERVAL '30 days'
        THEN s.id 
      END), 0)) * 100
      ELSE 0 
    END AS churn_rate_previous,
    
    -- Retention rate mois précédent
    CASE 
      WHEN COUNT(DISTINCT CASE 
        WHEN s.created_at < NOW() - INTERVAL '30 days'
        THEN s.id 
      END) > 0 
      THEN 100 - (COUNT(DISTINCT CASE 
        WHEN s.status = 'cancelled' 
        AND s.updated_at >= NOW() - INTERVAL '60 days'
        AND s.updated_at < NOW() - INTERVAL '30 days'
        THEN s.id 
      END)::DECIMAL / NULLIF(COUNT(DISTINCT CASE 
        WHEN s.created_at < NOW() - INTERVAL '30 days'
        THEN s.id 
      END), 0)) * 100
      ELSE 100 
    END AS retention_rate_previous
    
  FROM subscriptions s
  LEFT JOIN payments p ON s.id = p.subscription_id
)
SELECT
  -- Données actuelles
  cp.total_subscriptions,
  cp.active_subscriptions,
  cp.pending_subscriptions,
  cp.expired_subscriptions,
  cp.cancelled_subscriptions,
  0 AS trial_subscriptions,
  cp.total_revenue,
  cp.monthly_revenue,
  cp.yearly_revenue,
  cp.overdue_payments,
  cp.overdue_amount,
  
  -- MRR et ARR
  cp.monthly_revenue AS mrr,
  cp.monthly_revenue * 12 AS arr,
  
  -- Croissance revenus
  CASE 
    WHEN pp.monthly_revenue_previous > 0 
    THEN ((cp.monthly_revenue - pp.monthly_revenue_previous) / NULLIF(pp.monthly_revenue_previous, 0)) * 100
    ELSE 0 
  END AS revenue_growth,
  
  -- KPIs actuels
  cp.average_revenue_per_group,
  cp.churn_rate,
  cp.retention_rate,
  
  -- Taux de conversion (pending → active)
  CASE 
    WHEN (cp.pending_subscriptions + cp.active_subscriptions) > 0 
    THEN (cp.active_subscriptions::DECIMAL / NULLIF(cp.pending_subscriptions + cp.active_subscriptions, 0)) * 100
    ELSE 0 
  END AS conversion_rate,
  
  -- LTV (ARPU × 12 mois)
  cp.average_revenue_per_group * 12 AS lifetime_value,
  
  -- Données période précédente (pour comparaisons)
  pp.monthly_revenue_previous AS monthly_revenue_previous,
  pp.average_revenue_per_group_previous,
  pp.churn_rate_previous,
  pp.retention_rate_previous,
  
  -- LTV période précédente
  pp.average_revenue_per_group_previous * 12 AS lifetime_value_previous

FROM current_period cp
CROSS JOIN previous_period pp;

-- ============================================
-- 2. VUE PLAN_STATS COMPLÈTE
-- ============================================

DROP VIEW IF EXISTS plan_stats CASCADE;

CREATE VIEW plan_stats AS
SELECT
  sp.id AS plan_id,
  sp.name AS plan_name,
  sp.slug AS plan_slug,
  sp.price,
  COUNT(DISTINCT s.id) AS subscription_count,
  COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) AS revenue,
  
  -- Pourcentage du revenu total
  CASE 
    WHEN (SELECT SUM(CASE WHEN p2.status = 'completed' THEN p2.amount ELSE 0 END) FROM payments p2) > 0
    THEN (COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) / 
          NULLIF((SELECT SUM(CASE WHEN p2.status = 'completed' THEN p2.amount ELSE 0 END) FROM payments p2), 0)) * 100
    ELSE 0
  END AS percentage,
  
  -- Croissance (mois actuel vs mois précédent)
  CASE 
    WHEN SUM(CASE 
      WHEN p.status = 'completed' 
      AND p.paid_at >= NOW() - INTERVAL '60 days'
      AND p.paid_at < NOW() - INTERVAL '30 days'
      THEN p.amount 
      ELSE 0 
    END) > 0 
    THEN (
      (SUM(CASE 
        WHEN p.status = 'completed' 
        AND p.paid_at >= NOW() - INTERVAL '30 days'
        THEN p.amount 
        ELSE 0 
      END) - SUM(CASE 
        WHEN p.status = 'completed' 
        AND p.paid_at >= NOW() - INTERVAL '60 days'
        AND p.paid_at < NOW() - INTERVAL '30 days'
        THEN p.amount 
        ELSE 0 
      END)) / NULLIF(SUM(CASE 
        WHEN p.status = 'completed' 
        AND p.paid_at >= NOW() - INTERVAL '60 days'
        AND p.paid_at < NOW() - INTERVAL '30 days'
        THEN p.amount 
        ELSE 0 
      END), 0)
    ) * 100
    ELSE 0 
  END AS growth

FROM subscription_plans sp
LEFT JOIN subscriptions s ON sp.id = s.plan_id
LEFT JOIN payments p ON s.id = p.subscription_id
GROUP BY sp.id, sp.name, sp.slug, sp.price
ORDER BY revenue DESC;

-- ============================================
-- 3. PERMISSIONS
-- ============================================

GRANT SELECT ON financial_stats TO authenticated;
GRANT SELECT ON plan_stats TO authenticated;

-- ============================================
-- 4. TESTS DE VALIDATION
-- ============================================

-- Test 1: Vérifier les données actuelles
SELECT 
  'DONNÉES ACTUELLES' as type,
  total_subscriptions,
  active_subscriptions,
  mrr,
  arr,
  retention_rate,
  churn_rate,
  average_revenue_per_group,
  lifetime_value
FROM financial_stats;

-- Test 2: Vérifier les données période précédente
SELECT 
  'DONNÉES PÉRIODE PRÉCÉDENTE' as type,
  monthly_revenue_previous,
  average_revenue_per_group_previous,
  retention_rate_previous,
  churn_rate_previous,
  lifetime_value_previous
FROM financial_stats;

-- Test 3: Vérifier les calculs de variation
SELECT 
  'VARIATIONS' as type,
  revenue_growth as revenue_growth_pct,
  CASE 
    WHEN monthly_revenue_previous > 0 
    THEN ((average_revenue_per_group - average_revenue_per_group_previous) / NULLIF(average_revenue_per_group_previous, 0)) * 100
    ELSE 0 
  END as arpu_growth_pct,
  retention_rate - retention_rate_previous as retention_diff,
  churn_rate - churn_rate_previous as churn_diff
FROM financial_stats;

-- Test 4: Vérifier plan_stats
SELECT 
  'PLAN STATS' as type,
  plan_name,
  subscription_count,
  revenue,
  percentage,
  growth
FROM plan_stats
LIMIT 5;

-- ============================================
-- FIN DU SCRIPT
-- ============================================

-- Message de succès
DO $$
BEGIN
  RAISE NOTICE '✅ VUES CRÉÉES AVEC SUCCÈS !';
  RAISE NOTICE '✅ Cohérence complète BDD ↔ Dashboard implémentée';
  RAISE NOTICE '✅ Comparaisons période précédente disponibles';
  RAISE NOTICE '🚀 Dashboard prêt à utiliser !';
END $$;

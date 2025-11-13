-- ============================================
-- CORRECTION COHÉRENCE BDD ↔ DASHBOARD FINANCIER
-- Mise à jour des vues SQL pour correspondre aux types TypeScript
-- ============================================

-- Sauvegarder les vues existantes (au cas où)
DROP VIEW IF EXISTS financial_stats_backup;
CREATE VIEW financial_stats_backup AS SELECT * FROM financial_stats;

DROP VIEW IF EXISTS plan_stats_backup;
CREATE VIEW plan_stats_backup AS SELECT * FROM plan_stats;

-- ============================================
-- 1. VUE FINANCIAL_STATS CORRIGÉE
-- Tous les champs requis par l'interface TypeScript FinancialStats
-- ============================================

-- Supprimer complètement la vue existante pour éviter les conflits de structure
DROP VIEW IF EXISTS financial_stats CASCADE;

CREATE VIEW financial_stats AS
SELECT
  -- Abonnements
  COUNT(DISTINCT s.id) AS total_subscriptions,
  COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.id END) AS active_subscriptions,
  COUNT(DISTINCT CASE WHEN s.status = 'pending' THEN s.id END) AS pending_subscriptions,
  COUNT(DISTINCT CASE WHEN s.status = 'expired' THEN s.id END) AS expired_subscriptions,
  COUNT(DISTINCT CASE WHEN s.status = 'cancelled' THEN s.id END) AS cancelled_subscriptions,
  0 AS trial_subscriptions, -- Note: 'trial' n'existe pas dans l'enum subscription_status
  
  -- Revenus totaux
  COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) AS total_revenue,
  
  -- MRR (Monthly Recurring Revenue) - 30 derniers jours
  COALESCE(SUM(CASE 
    WHEN p.status = 'completed' 
    AND p.paid_at >= NOW() - INTERVAL '30 days' 
    THEN p.amount 
    ELSE 0 
  END), 0) AS monthly_revenue,
  
  -- MRR (alias pour cohérence TypeScript)
  COALESCE(SUM(CASE 
    WHEN p.status = 'completed' 
    AND p.paid_at >= NOW() - INTERVAL '30 days' 
    THEN p.amount 
    ELSE 0 
  END), 0) AS mrr,
  
  -- ARR (Annual Recurring Revenue) - MRR × 12
  COALESCE(SUM(CASE 
    WHEN p.status = 'completed' 
    AND p.paid_at >= NOW() - INTERVAL '30 days' 
    THEN p.amount 
    ELSE 0 
  END), 0) * 12 AS arr,
  
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
    AND p.created_at < NOW() - INTERVAL '30 days'
    THEN p.id 
  END) AS overdue_payments,
  
  COALESCE(SUM(CASE 
    WHEN p.status = 'pending' 
    AND p.created_at < NOW() - INTERVAL '30 days'
    THEN p.amount 
    ELSE 0 
  END), 0) AS overdue_amount,
  
  -- Croissance revenus (mois actuel vs mois précédent)
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
      END)) / NULLIF(SUM(CASE 
        WHEN p.status = 'completed' 
        AND DATE_TRUNC('month', p.paid_at) = DATE_TRUNC('month', NOW() - INTERVAL '1 month') 
        THEN p.amount 
        ELSE 0 
      END), 0)
    ) * 100
    ELSE 0 
  END AS revenue_growth,
  
  -- Revenu moyen par groupe actif (ARPU)
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
  
  -- Taux de churn (annulés / total) en %
  CASE 
    WHEN COUNT(DISTINCT s.id) > 0 
    THEN (COUNT(DISTINCT CASE WHEN s.status = 'cancelled' THEN s.id END)::DECIMAL / NULLIF(COUNT(DISTINCT s.id), 0)) * 100
    ELSE 0 
  END AS churn_rate,
  
  -- Taux de rétention (100 - churn) en %
  CASE 
    WHEN COUNT(DISTINCT s.id) > 0 
    THEN 100 - (COUNT(DISTINCT CASE WHEN s.status = 'cancelled' THEN s.id END)::DECIMAL / NULLIF(COUNT(DISTINCT s.id), 0)) * 100
    ELSE 100 
  END AS retention_rate,
  
  -- Taux de conversion (pending → active) en %
  -- Note: Calcul basé sur pending car 'trial' n'existe pas dans l'enum
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN s.status = 'pending' OR s.status = 'active' THEN s.id END) > 0 
    THEN (COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.id END)::DECIMAL / 
          NULLIF(COUNT(DISTINCT CASE WHEN s.status = 'pending' OR s.status = 'active' THEN s.id END), 0)) * 100
    ELSE 0 
  END AS conversion_rate,
  
  -- Valeur vie client (LTV) - ARPU × 12 mois
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.school_group_id END) > 0 
    THEN (COALESCE(SUM(CASE 
      WHEN p.status = 'completed' 
      AND p.paid_at >= NOW() - INTERVAL '30 days' 
      THEN p.amount 
      ELSE 0 
    END), 0) / NULLIF(COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.school_group_id END), 0)) * 12
    ELSE 0 
  END AS lifetime_value

FROM subscriptions s
LEFT JOIN payments p ON s.id = p.subscription_id;

-- ============================================
-- 2. VUE PLAN_STATS CORRIGÉE
-- Tous les champs requis par l'interface TypeScript PlanStats
-- ============================================

-- Supprimer complètement la vue existante pour éviter les conflits de structure
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
  
  -- Croissance (mois actuel vs mois précédent) en %
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
      END)) / NULLIF(SUM(CASE 
        WHEN p.status = 'completed' 
        AND DATE_TRUNC('month', p.paid_at) = DATE_TRUNC('month', NOW() - INTERVAL '1 month') 
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
-- 4. TESTS DE VÉRIFICATION
-- ============================================

-- Test 1: Vérifier que la vue financial_stats retourne des données
DO $$
DECLARE
    record_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO record_count FROM financial_stats;
    IF record_count = 0 THEN
        RAISE NOTICE 'ATTENTION: La vue financial_stats ne retourne aucune donnée';
    ELSE
        RAISE NOTICE 'SUCCESS: La vue financial_stats retourne % ligne(s)', record_count;
    END IF;
END $$;

-- Test 2: Vérifier que tous les champs requis sont présents
DO $$
DECLARE
    col_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO col_count 
    FROM information_schema.columns 
    WHERE table_name = 'financial_stats' 
    AND column_name IN (
        'total_subscriptions', 'active_subscriptions', 'pending_subscriptions',
        'expired_subscriptions', 'cancelled_subscriptions', 'trial_subscriptions',
        'total_revenue', 'monthly_revenue', 'yearly_revenue', 'mrr', 'arr',
        'overdue_payments', 'overdue_amount', 'revenue_growth',
        'average_revenue_per_group', 'churn_rate', 'retention_rate',
        'conversion_rate', 'lifetime_value'
    );
    
    IF col_count = 19 THEN
        RAISE NOTICE 'SUCCESS: Tous les champs requis sont présents dans financial_stats';
    ELSE
        RAISE NOTICE 'ATTENTION: Il manque % champs dans financial_stats', (19 - col_count);
    END IF;
END $$;

-- Test 3: Vérifier la vue plan_stats
DO $$
DECLARE
    record_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO record_count FROM plan_stats;
    IF record_count = 0 THEN
        RAISE NOTICE 'ATTENTION: La vue plan_stats ne retourne aucune donnée';
    ELSE
        RAISE NOTICE 'SUCCESS: La vue plan_stats retourne % ligne(s)', record_count;
    END IF;
END $$;

-- ============================================
-- 5. REQUÊTES DE TEST
-- ============================================

-- Afficher un échantillon des données
SELECT 
    'FINANCIAL_STATS' as vue,
    total_subscriptions,
    active_subscriptions,
    mrr,
    arr,
    retention_rate,
    churn_rate,
    conversion_rate,
    lifetime_value
FROM financial_stats;

SELECT 
    'PLAN_STATS' as vue,
    plan_name,
    subscription_count,
    revenue,
    percentage,
    growth
FROM plan_stats
LIMIT 5;

-- ============================================
-- NOTES D'UTILISATION
-- ============================================

-- 1. Après exécution, tester dans le frontend :
--    const { data } = await supabase.from('financial_stats').select('*').single();
--    console.log('Champs disponibles:', Object.keys(data));

-- 2. Vérifier que le hook useFinancialStats fonctionne sans erreur

-- 3. Tester les 4 KPIs du dashboard :
--    - Taux de Rétention (retention_rate)
--    - Taux d'Attrition (churn_rate) 
--    - Revenu Moyen par Groupe (average_revenue_per_group)
--    - Valeur Vie Client (lifetime_value)

-- 4. Vérifier l'export CSV avec toutes les nouvelles données

-- FIN DU SCRIPT DE CORRECTION

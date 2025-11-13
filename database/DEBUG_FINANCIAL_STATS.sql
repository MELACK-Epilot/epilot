-- =====================================================
-- SCRIPT DE DEBUG : FINANCIAL STATS
-- =====================================================
-- Vérifie pourquoi les KPIs ne récupèrent pas les vraies données
-- =====================================================

-- 1. Vérifier les abonnements
SELECT 
  '1. ABONNEMENTS' as section,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'active') as actifs,
  COUNT(*) FILTER (WHERE status = 'pending') as en_attente,
  COUNT(*) FILTER (WHERE status = 'expired') as expires,
  COUNT(*) FILTER (WHERE status = 'cancelled') as annules
FROM subscriptions;

-- 2. Vérifier les plans
SELECT 
  '2. PLANS' as section,
  p.name as plan,
  p.price,
  p.billing_period,
  COUNT(s.id) as nb_abonnements
FROM plans p
LEFT JOIN subscriptions s ON s.plan_id = p.id
GROUP BY p.id, p.name, p.price, p.billing_period
ORDER BY nb_abonnements DESC;

-- 3. Calcul MRR manuel
SELECT 
  '3. CALCUL MRR' as section,
  SUM(
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
  ) as mrr_calcule
FROM subscriptions s
LEFT JOIN plans p ON s.plan_id = p.id;

-- 4. Vérifier les paiements (fee_payments)
SELECT 
  '4. PAIEMENTS' as section,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'completed') as completes,
  SUM(amount) FILTER (WHERE status = 'completed') as total_revenue,
  SUM(amount) FILTER (
    WHERE status = 'completed' 
    AND payment_date >= DATE_TRUNC('month', CURRENT_DATE)
  ) as revenue_ce_mois
FROM fee_payments;

-- 5. Vérifier la vue financial_stats
SELECT 
  '5. VUE FINANCIAL_STATS' as section,
  mrr,
  arr,
  total_revenue,
  monthly_revenue,
  revenue_growth,
  active_subscriptions,
  total_subscriptions
FROM financial_stats;

-- 6. Vérifier si la vue existe
SELECT 
  '6. EXISTENCE VUE' as section,
  schemaname,
  viewname,
  viewowner
FROM pg_views 
WHERE viewname = 'financial_stats';

-- 7. Détail des abonnements actifs
SELECT 
  '7. DETAIL ABONNEMENTS ACTIFS' as section,
  s.id,
  sg.name as groupe,
  p.name as plan,
  p.price,
  p.billing_period,
  s.status,
  s.start_date,
  s.end_date
FROM subscriptions s
LEFT JOIN school_groups sg ON s.school_group_id = sg.id
LEFT JOIN plans p ON s.plan_id = p.id
WHERE s.status = 'active'
ORDER BY s.created_at DESC
LIMIT 10;

-- 8. Vérifier les colonnes de la table subscriptions
SELECT 
  '8. COLONNES SUBSCRIPTIONS' as section,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'subscriptions'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 9. Vérifier les colonnes de la table plans
SELECT 
  '9. COLONNES PLANS' as section,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'plans'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 10. Test de la jointure subscriptions <-> plans
SELECT 
  '10. TEST JOINTURE' as section,
  COUNT(*) as total_subscriptions,
  COUNT(p.id) as avec_plan,
  COUNT(*) - COUNT(p.id) as sans_plan
FROM subscriptions s
LEFT JOIN plans p ON s.plan_id = p.id;

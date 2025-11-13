-- =====================================================
-- VÉRIFICATION RAPIDE : MRR ET ARR
-- =====================================================

-- 1. Vérifier la vue financial_stats
SELECT 
  '1. FINANCIAL_STATS' as section,
  mrr,
  arr,
  total_revenue,
  monthly_revenue,
  active_subscriptions,
  total_subscriptions
FROM financial_stats;

-- 2. Vérifier les abonnements actifs
SELECT 
  '2. ABONNEMENTS ACTIFS' as section,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'active') as actifs
FROM school_group_subscriptions;

-- 3. Vérifier les plans et prix
SELECT 
  '3. PLANS ET PRIX' as section,
  sp.name,
  sp.price,
  sp.billing_period,
  COUNT(s.id) as nb_abonnements
FROM subscription_plans sp
LEFT JOIN school_group_subscriptions s ON s.plan_id = sp.id AND s.status = 'active'
GROUP BY sp.id, sp.name, sp.price, sp.billing_period;

-- 4. Calcul MRR manuel
SELECT 
  '4. CALCUL MRR MANUEL' as section,
  SUM(
    CASE sp.billing_period
      WHEN 'monthly' THEN sp.price
      WHEN 'quarterly' THEN sp.price / 3
      WHEN 'yearly' THEN sp.price / 12
      ELSE 0
    END
  ) as mrr_calcule
FROM school_group_subscriptions s
LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE s.status = 'active';

-- 5. Résumé
SELECT 
  '✅ RÉSUMÉ' as status,
  (SELECT COUNT(*) FROM school_group_subscriptions WHERE status = 'active') as abonnements_actifs,
  (SELECT mrr FROM financial_stats) as mrr_vue,
  (SELECT arr FROM financial_stats) as arr_vue,
  (SELECT mrr FROM financial_stats) * 12 as revenus_annuels;

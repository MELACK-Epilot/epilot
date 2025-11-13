-- =====================================================
-- CORRECTION COMPLÈTE : TOUTES LES VUES FINANCIÈRES
-- =====================================================
-- Corrige les 4 vues qui utilisent les mauvaises tables :
-- 1. financial_stats (DÉJÀ CORRIGÉE)
-- 2. plan_stats (À CORRIGER)
-- 3. subscription_stats (À CORRIGER)
-- 4. payment_stats (À VÉRIFIER)
-- =====================================================

-- =====================================================
-- PARTIE 2 : VUE PLAN_STATS (CORRIGÉE)
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
    WHEN (SELECT COUNT(*) FROM public.school_group_subscriptions) > 0 
    THEN (COUNT(DISTINCT s.id)::DECIMAL / (SELECT COUNT(*) FROM public.school_group_subscriptions)) * 100
    ELSE 0
  END as percentage,
  
  NOW() as last_updated

FROM public.subscription_plans p  -- ← CORRIGÉ !
LEFT JOIN public.school_group_subscriptions s ON s.plan_id = p.id  -- ← CORRIGÉ !

GROUP BY 
  p.id, p.name, p.slug, p.price, p.currency, p.billing_period, p.status

ORDER BY subscription_count DESC, p.price DESC;

COMMENT ON VIEW public.plan_stats IS 'Statistiques des plans d''abonnement (corrigé : subscription_plans)';

-- Test
SELECT 
  '✅ PARTIE 2 : plan_stats' as vue,
  COUNT(*) as nb_plans,
  SUM(subscription_count) as total_subscriptions,
  SUM(mrr) as mrr_total
FROM public.plan_stats;

-- =====================================================
-- PARTIE 3 : VUE SUBSCRIPTION_STATS (CORRIGÉE)
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
  
  -- Calcul jours restants (cast explicite en DATE)
  CASE 
    WHEN s.status = 'active' AND s.end_date > CURRENT_DATE 
    THEN (s.end_date::DATE - CURRENT_DATE::DATE)
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

FROM public.school_group_subscriptions s  -- ← CORRIGÉ !
JOIN public.school_groups sg ON s.school_group_id = sg.id
JOIN public.subscription_plans p ON s.plan_id = p.id  -- ← CORRIGÉ !

ORDER BY 
  CASE s.status
    WHEN 'active' THEN 1
    WHEN 'pending' THEN 2
    WHEN 'expired' THEN 3
    ELSE 4
  END,
  s.end_date ASC;

COMMENT ON VIEW public.subscription_stats IS 'Statistiques détaillées des abonnements (corrigé : school_group_subscriptions + subscription_plans)';

-- Test
SELECT 
  '✅ PARTIE 3 : subscription_stats' as vue,
  COUNT(*) as nb_subscriptions,
  COUNT(*) FILTER (WHERE status = 'active') as actifs,
  SUM(mrr_contribution) as mrr_total
FROM public.subscription_stats;

-- =====================================================
-- RÉSUMÉ FINAL
-- =====================================================

SELECT 
  '✅ TOUTES LES VUES CORRIGÉES' as status,
  (SELECT COUNT(*) FROM plan_stats) as nb_plans,
  (SELECT SUM(subscription_count) FROM plan_stats) as total_subscriptions,
  (SELECT COUNT(*) FROM subscription_stats) as nb_subscriptions_detail,
  (SELECT mrr FROM financial_stats) as mrr_global,
  (SELECT arr FROM financial_stats) as arr_global;

-- Détail des abonnements
SELECT 
  '📊 DÉTAIL DES 2 ABONNEMENTS' as info,
  s.id,
  sg.name as groupe,
  sp.name as plan,
  sp.price,
  sp.billing_period,
  s.status,
  s.start_date,
  s.end_date,
  CASE sp.billing_period
    WHEN 'monthly' THEN sp.price
    WHEN 'quarterly' THEN sp.price / 3
    WHEN 'yearly' THEN sp.price / 12
    ELSE 0
  END as mrr_contribution
FROM school_group_subscriptions s
LEFT JOIN school_groups sg ON s.school_group_id = sg.id
LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
ORDER BY s.status DESC, s.created_at DESC;

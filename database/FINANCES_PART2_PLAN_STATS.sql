-- =====================================================
-- PARTIE 2 : VUE PLAN_STATS
-- =====================================================
-- Statistiques des plans d'abonnement
-- Pour la page Plans & Tarifs
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

-- Test
SELECT 
  'plan_stats' as vue,
  COUNT(*) as nb_plans,
  SUM(subscription_count) as total_subscriptions
FROM public.plan_stats;

SELECT '✅ PARTIE 2 : Vue plan_stats créée avec succès !' as status;

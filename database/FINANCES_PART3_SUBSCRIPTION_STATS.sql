-- =====================================================
-- PARTIE 3 : VUE SUBSCRIPTION_STATS
-- =====================================================
-- Statistiques détaillées des abonnements
-- Pour la page Abonnements
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
  
  -- Calcul jours restants (CORRECTION : cast explicite en DATE)
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

FROM public.subscriptions s
JOIN public.school_groups sg ON s.school_group_id = sg.id
JOIN public.plans p ON s.plan_id = p.id

ORDER BY 
  CASE s.status
    WHEN 'active' THEN 1
    WHEN 'pending' THEN 2
    WHEN 'expired' THEN 3
    ELSE 4
  END,
  s.end_date ASC;

COMMENT ON VIEW public.subscription_stats IS 'Statistiques détaillées des abonnements avec statuts d''expiration';

-- Test
SELECT 
  'subscription_stats' as vue,
  COUNT(*) as nb_subscriptions,
  COUNT(*) FILTER (WHERE status = 'active') as actifs
FROM public.subscription_stats;

SELECT '✅ PARTIE 3 : Vue subscription_stats créée avec succès !' as status;

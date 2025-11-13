-- =====================================================
-- VUE PLAN_STATS - STATISTIQUES DES PLANS
-- =====================================================
-- Vue pour les statistiques des plans d'abonnement
-- Utilisée par la page Plans & Tarifs
-- Date: 6 novembre 2025
-- =====================================================

-- 1. SUPPRIMER L'ANCIENNE VUE SI ELLE EXISTE
-- =====================================================

DROP VIEW IF EXISTS public.plan_stats CASCADE;

-- 2. CRÉER LA VUE PLAN_STATS
-- =====================================================

CREATE OR REPLACE VIEW public.plan_stats AS
SELECT 
  p.id as plan_id,
  p.name as plan_name,
  p.slug as plan_slug,
  p.price,
  p.currency,
  p.billing_period,
  p.is_active,
  
  -- Nombre d'abonnements par plan
  COUNT(DISTINCT s.id) as subscription_count,
  COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'active') as active_subscriptions,
  COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'trial') as trial_subscriptions,
  COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'expired') as expired_subscriptions,
  
  -- Revenus générés par ce plan
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
  
  -- Croissance (nouveaux abonnements derniers 30 jours)
  COUNT(DISTINCT s.id) FILTER (
    WHERE s.created_at >= CURRENT_DATE - INTERVAL '30 days'
  ) as growth,
  
  -- Pourcentage du total
  CASE 
    WHEN (SELECT COUNT(*) FROM public.subscriptions) > 0 
    THEN (COUNT(DISTINCT s.id)::DECIMAL / (SELECT COUNT(*) FROM public.subscriptions)) * 100
    ELSE 0
  END as percentage,
  
  -- Métadonnées
  NOW() as last_updated

FROM public.plans p
LEFT JOIN public.subscriptions s ON s.plan_id = p.id

GROUP BY 
  p.id, 
  p.name, 
  p.slug, 
  p.price, 
  p.currency, 
  p.billing_period,
  p.is_active

ORDER BY subscription_count DESC, p.price DESC;

-- 3. COMMENTAIRES
-- =====================================================

COMMENT ON VIEW public.plan_stats IS 'Statistiques des plans d''abonnement avec revenus et nombre d''abonnements';

-- 4. PERMISSIONS RLS
-- =====================================================

-- Super Admin et Admin Groupe peuvent voir les stats
CREATE POLICY "Admins can view plan stats"
  ON public.plan_stats FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin_groupe')
    )
  );

-- 5. TEST DE LA VUE
-- =====================================================

SELECT 
  plan_name,
  subscription_count,
  active_subscriptions,
  mrr,
  revenue,
  percentage
FROM public.plan_stats
ORDER BY subscription_count DESC;

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================

SELECT '✅ Vue plan_stats créée avec succès !' as status;

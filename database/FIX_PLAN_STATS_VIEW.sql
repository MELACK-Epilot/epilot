-- Migration pour corriger la vue plan_stats
-- Problème : Les revenus par plan sont incorrects (ex: Gratuit affiche 25k)
-- Solution : Recalculer les revenus en se basant sur le prix du plan et le nombre d'abonnements actifs

DROP VIEW IF EXISTS plan_stats;

CREATE OR REPLACE VIEW plan_stats AS
SELECT
  sp.id,
  sp.name,
  sp.slug,
  sp.price,
  sp.is_active,
  sp.is_popular,
  
  -- Nombre total d'abonnements
  COUNT(s.id) as total_subscription_count,
  
  -- Nombre d'abonnements ACTIFS uniquement
  COUNT(s.id) FILTER (WHERE s.status = 'active') as active_subscription_count,
  
  -- Revenus Mensuels (MRR par plan)
  -- On prend le prix du plan * nombre d'abonnements actifs
  -- Si le plan est gratuit, c'est 0
  COALESCE(SUM(
    CASE 
      WHEN s.status = 'active' THEN 
        CASE 
          WHEN sp.billing_period = 'monthly' THEN sp.price
          WHEN sp.billing_period = 'yearly' THEN sp.price / 12
          ELSE 0
        END
      ELSE 0
    END
  ), 0) as monthly_revenue,
  
  -- Revenus Annuels (ARR par plan)
  COALESCE(SUM(
    CASE 
      WHEN s.status = 'active' THEN 
        CASE 
          WHEN sp.billing_period = 'monthly' THEN sp.price * 12
          WHEN sp.billing_period = 'yearly' THEN sp.price
          ELSE 0
        END
      ELSE 0
    END
  ), 0) as annual_revenue,
  
  -- Nombre de groupes actifs
  COUNT(DISTINCT s.school_group_id) FILTER (WHERE s.status = 'active') as active_groups_count

FROM subscription_plans sp
LEFT JOIN subscriptions s ON sp.id = s.plan_id
GROUP BY sp.id, sp.name, sp.slug, sp.price, sp.is_active, sp.is_popular, sp.billing_period;

-- Commentaire
COMMENT ON VIEW plan_stats IS 'Statistiques détaillées par plan : abonnements actifs et revenus réels (MRR/ARR)';

-- Vérification
SELECT name, price, active_subscription_count, monthly_revenue FROM plan_stats ORDER BY price;

-- Migration: Créer la vue plan_stats pour les statistiques des plans
-- Date: 2025-11-20
-- Description: Vue SQL pour calculer les statistiques des plans d'abonnement

-- Supprimer la vue si elle existe déjà
DROP VIEW IF EXISTS plan_stats;

-- Créer la vue plan_stats
CREATE OR REPLACE VIEW plan_stats AS
SELECT 
  sp.id,
  sp.name,
  sp.slug,
  sp.price,
  sp.is_active,
  sp.is_popular,
  -- Compter les abonnements actifs pour ce plan
  COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'active') as active_subscription_count,
  -- Compter tous les abonnements (actifs + inactifs)
  COUNT(DISTINCT s.id) as total_subscription_count,
  -- Calculer le revenu mensuel (MRR) pour ce plan
  -- Le prix vient du plan, multiplié par le nombre d'abonnements actifs
  sp.price * COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'active') as monthly_revenue,
  -- Calculer le revenu annuel (ARR) pour ce plan
  sp.price * COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'active') * 12 as annual_revenue,
  -- Compter les groupes scolaires utilisant ce plan
  COUNT(DISTINCT s.school_group_id) FILTER (WHERE s.status = 'active') as active_groups_count
FROM 
  subscription_plans sp
  LEFT JOIN subscriptions s ON s.plan_id = sp.id
GROUP BY 
  sp.id, sp.name, sp.slug, sp.price, sp.is_active, sp.is_popular
ORDER BY 
  sp.price ASC;

-- Créer une vue pour les statistiques globales
DROP VIEW IF EXISTS plan_global_stats;

CREATE OR REPLACE VIEW plan_global_stats AS
SELECT 
  -- Total de plans
  COUNT(DISTINCT sp.id) as total_plans,
  
  -- Plans actifs (is_active = true)
  COUNT(DISTINCT sp.id) FILTER (WHERE sp.is_active = true) as active_plans,
  
  -- Plans avec au moins un abonnement actif
  COUNT(DISTINCT sp.id) FILTER (WHERE EXISTS (
    SELECT 1 FROM subscriptions s 
    WHERE s.plan_id = sp.id AND s.status = 'active'
  )) as plans_with_subscriptions,
  
  -- Total d'abonnements actifs
  COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'active') as total_active_subscriptions,
  
  -- Total d'abonnements (tous statuts)
  COUNT(DISTINCT s.id) as total_subscriptions,
  
  -- Revenu mensuel total (MRR)
  -- Somme de (prix du plan × nombre d'abonnements actifs pour ce plan)
  COALESCE(SUM(
    CASE 
      WHEN s.status = 'active' THEN sp.price 
      ELSE 0 
    END
  ), 0) as total_mrr,
  
  -- Revenu annuel total (ARR)
  COALESCE(SUM(
    CASE 
      WHEN s.status = 'active' THEN sp.price * 12
      ELSE 0 
    END
  ), 0) as total_arr,
  
  -- Nombre de groupes scolaires avec abonnement actif
  COUNT(DISTINCT s.school_group_id) FILTER (WHERE s.status = 'active') as total_active_groups
FROM 
  subscription_plans sp
  LEFT JOIN subscriptions s ON s.plan_id = sp.id;

-- Ajouter des commentaires pour la documentation
COMMENT ON VIEW plan_stats IS 'Statistiques détaillées par plan d''abonnement';
COMMENT ON VIEW plan_global_stats IS 'Statistiques globales de tous les plans';

-- Accorder les permissions de lecture
GRANT SELECT ON plan_stats TO authenticated;
GRANT SELECT ON plan_global_stats TO authenticated;

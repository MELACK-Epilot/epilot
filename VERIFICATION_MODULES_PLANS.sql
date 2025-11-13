/**
 * =====================================================
 * VÉRIFICATION RAPIDE - Modules par Plan
 * =====================================================
 * 
 * Les catégories sont OK, vérifions les modules
 * Temps : 30 secondes
 * 
 * Date : 7 novembre 2025, 22:45 PM
 * =====================================================
 */

-- =====================================================
-- VÉRIFIER LES MODULES PAR PLAN
-- =====================================================

SELECT 
  sp.name as plan,
  sp.slug as plan_slug,
  COUNT(pm.module_id) as nb_modules
FROM subscription_plans sp
LEFT JOIN plan_modules pm ON pm.plan_id = sp.id
GROUP BY sp.id, sp.name, sp.slug
ORDER BY sp.price ASC;

-- =====================================================
-- SI nb_modules = 0 POUR UN PLAN, EXÉCUTER CECI :
-- =====================================================

/*
-- Assigner des modules au plan qui en manque
-- Exemple pour le plan "Premium"

INSERT INTO plan_modules (plan_id, module_id)
SELECT 
  (SELECT id FROM subscription_plans WHERE slug = 'premium'),
  id
FROM modules
WHERE status = 'active'
LIMIT 15
ON CONFLICT (plan_id, module_id) DO NOTHING;
*/

-- =====================================================
-- VÉRIFIER LES ABONNEMENTS ACTIFS
-- =====================================================

SELECT 
  sg.name as groupe,
  sgs.status as statut_abonnement,
  sp.name as plan,
  sp.slug as plan_slug,
  sgs.start_date,
  sgs.end_date
FROM school_group_subscriptions sgs
JOIN school_groups sg ON sg.id = sgs.school_group_id
JOIN subscription_plans sp ON sp.id = sgs.plan_id
WHERE sgs.status = 'active'
ORDER BY sgs.created_at DESC;

-- =====================================================
-- DIAGNOSTIC COMPLET POUR UN GROUPE SPÉCIFIQUE
-- =====================================================

SELECT 
  sg.name as groupe,
  sg.code as code_groupe,
  sgs.status as statut_abonnement,
  sp.name as plan,
  sp.slug as plan_slug,
  COUNT(DISTINCT pm.module_id) as modules_dans_plan,
  COUNT(DISTINCT pc.category_id) as categories_dans_plan
FROM school_groups sg
LEFT JOIN school_group_subscriptions sgs ON sgs.school_group_id = sg.id AND sgs.status = 'active'
LEFT JOIN subscription_plans sp ON sp.id = sgs.plan_id
LEFT JOIN plan_modules pm ON pm.plan_id = sp.id
LEFT JOIN plan_categories pc ON pc.plan_id = sp.id
GROUP BY sg.id, sg.name, sg.code, sgs.status, sp.name, sp.slug
ORDER BY sg.created_at DESC
LIMIT 5;

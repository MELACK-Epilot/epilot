/**
 * =====================================================
 * VÉRIFICATION FINALE COMPLÈTE
 * =====================================================
 * 
 * Vérifier que tout fonctionne correctement
 * 
 * Date : 8 novembre 2025, 00:05 AM
 * =====================================================
 */

-- =====================================================
-- ÉTAPE 1 : VÉRIFIER LES ABONNEMENTS
-- =====================================================

SELECT 
  sg.name as groupe,
  sg.code,
  sg.plan as plan_statique,
  sgs.status as statut_abonnement,
  sp.name as plan_abonnement,
  sp.slug as plan_slug,
  sgs.start_date,
  sgs.end_date
FROM school_groups sg
LEFT JOIN school_group_subscriptions sgs ON sgs.school_group_id = sg.id
LEFT JOIN subscription_plans sp ON sp.id = sgs.plan_id
WHERE sgs.status = 'active'
ORDER BY sg.name;

-- =====================================================
-- ÉTAPE 2 : VÉRIFIER LES MODULES ASSIGNÉS AUX GROUPES
-- =====================================================

SELECT 
  sg.name as groupe,
  sg.code,
  sp.name as plan,
  COUNT(DISTINCT gmc.module_id) FILTER (WHERE gmc.is_enabled = true) as modules_actifs,
  COUNT(DISTINCT gbc.category_id) FILTER (WHERE gbc.is_enabled = true) as categories_actives
FROM school_groups sg
JOIN school_group_subscriptions sgs ON sgs.school_group_id = sg.id AND sgs.status = 'active'
JOIN subscription_plans sp ON sp.id = sgs.plan_id
LEFT JOIN group_module_configs gmc ON gmc.school_group_id = sg.id
LEFT JOIN group_business_categories gbc ON gbc.school_group_id = sg.id
GROUP BY sg.id, sg.name, sg.code, sp.name
ORDER BY sg.name;

-- =====================================================
-- ÉTAPE 3 : VÉRIFIER LES MODULES DU PLAN
-- =====================================================

SELECT 
  sp.name as plan,
  sp.slug,
  COUNT(DISTINCT pm.module_id) as modules_dans_plan,
  COUNT(DISTINCT pc.category_id) as categories_dans_plan
FROM subscription_plans sp
LEFT JOIN plan_modules pm ON pm.plan_id = sp.id
LEFT JOIN plan_categories pc ON pc.plan_id = sp.id
WHERE sp.is_active = true
GROUP BY sp.id, sp.name, sp.slug
ORDER BY sp.price;

-- =====================================================
-- ÉTAPE 4 : DIAGNOSTIC POUR LE GROUPE "L'INTELIGENCE CELESTE"
-- =====================================================

SELECT 
  'Groupe' as type,
  sg.name as nom,
  sg.code,
  sg.plan::text as plan_statique
FROM school_groups sg
WHERE sg.name ILIKE '%INTELIGENCE%'

UNION ALL

SELECT 
  'Abonnement' as type,
  sp.name as nom,
  sgs.status as code,
  sp.slug as plan_statique
FROM school_group_subscriptions sgs
JOIN school_groups sg ON sg.id = sgs.school_group_id
JOIN subscription_plans sp ON sp.id = sgs.plan_id
WHERE sg.name ILIKE '%INTELIGENCE%'
  AND sgs.status = 'active'

UNION ALL

SELECT 
  'Modules assignés' as type,
  COUNT(*)::TEXT as nom,
  'actifs' as code,
  '' as plan_statique
FROM group_module_configs gmc
JOIN school_groups sg ON sg.id = gmc.school_group_id
WHERE sg.name ILIKE '%INTELIGENCE%'
  AND gmc.is_enabled = true

UNION ALL

SELECT 
  'Catégories assignées' as type,
  COUNT(*)::TEXT as nom,
  'actives' as code,
  '' as plan_statique
FROM group_business_categories gbc
JOIN school_groups sg ON sg.id = gbc.school_group_id
WHERE sg.name ILIKE '%INTELIGENCE%'
  AND gbc.is_enabled = true;

-- =====================================================
-- ÉTAPE 5 : DÉTAILS DES MODULES ASSIGNÉS
-- =====================================================

SELECT 
  sg.name as groupe,
  m.name as module,
  bc.name as categorie,
  gmc.is_enabled,
  gmc.enabled_at
FROM group_module_configs gmc
JOIN school_groups sg ON sg.id = gmc.school_group_id
JOIN modules m ON m.id = gmc.module_id
LEFT JOIN business_categories bc ON bc.id = m.category_id
WHERE sg.name ILIKE '%INTELIGENCE%'
ORDER BY gmc.enabled_at DESC
LIMIT 10;

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================

/*
ÉTAPE 1 : Devrait montrer 2 abonnements actifs
groupe                | code        | plan_statique | statut_abonnement | plan_abonnement | plan_slug
----------------------|-------------|---------------|-------------------|-----------------|-------------
L'INTELIGENCE SELESTE | E-PILOT-002 | institutionnel| active            | Institutionnel  | institutionnel
LE LIANO              | E-PILOT-001 | gratuit       | active            | Gratuit         | gratuit

ÉTAPE 2 : Devrait montrer les modules et catégories assignés
groupe                | code        | plan           | modules_actifs | categories_actives
----------------------|-------------|----------------|----------------|-------------------
L'INTELIGENCE SELESTE | E-PILOT-002 | Institutionnel | 47             | 8
LE LIANO              | E-PILOT-001 | Gratuit        | 44             | 1

ÉTAPE 3 : Devrait montrer les modules par plan
plan           | slug           | modules_dans_plan | categories_dans_plan
---------------|----------------|-------------------|---------------------
Gratuit        | gratuit        | 44                | 1
Premium        | premium        | 25                | 3
Pro            | pro            | 28                | 6
Institutionnel | institutionnel | 47                | 8

Si ÉTAPE 2 montre 0 modules :
❌ Les abonnements existent mais les TRIGGERS n'ont pas fonctionné
✅ Solution : Exécuter FIX_DISABLE_MODULE_LIMIT.sql

Si ÉTAPE 1 montre 0 abonnements :
❌ Les abonnements n'ont pas été créés
✅ Solution : Exécuter FIX_TOUS_LES_GROUPES.sql ÉTAPE 2
*/

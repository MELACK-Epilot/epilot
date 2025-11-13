/**
 * =====================================================
 * VÉRIFICATION COMPLÈTE - Cohérence du Système
 * =====================================================
 * 
 * Vérifier la cohérence depuis Super Admin et Admin Groupe
 * 
 * Date : 8 novembre 2025, 00:32 AM
 * =====================================================
 */

-- =====================================================
-- VUE 1 : SUPER ADMIN - Vue d'Ensemble des Groupes
-- =====================================================

SELECT 
  sg.name as groupe,
  sg.code,
  sg.status as statut_groupe,
  sgs.status as statut_abonnement,
  sp.name as plan,
  sp.slug as plan_slug,
  COUNT(DISTINCT gmc.module_id) FILTER (WHERE gmc.is_enabled = true) as modules_actifs,
  COUNT(DISTINCT gbc.category_id) FILTER (WHERE gbc.is_enabled = true) as categories_actives,
  sgs.start_date,
  sgs.end_date,
  CASE 
    WHEN sgs.end_date < NOW() THEN '⚠️ Expiré'
    WHEN sgs.end_date < NOW() + INTERVAL '30 days' THEN '⚠️ Expire bientôt'
    ELSE '✅ Actif'
  END as alerte
FROM school_groups sg
LEFT JOIN school_group_subscriptions sgs ON sgs.school_group_id = sg.id AND sgs.status = 'active'
LEFT JOIN subscription_plans sp ON sp.id = sgs.plan_id
LEFT JOIN group_module_configs gmc ON gmc.school_group_id = sg.id
LEFT JOIN group_business_categories gbc ON gbc.school_group_id = sg.id
WHERE sg.status = 'active'
GROUP BY sg.id, sg.name, sg.code, sg.status, sgs.status, sp.name, sp.slug, sgs.start_date, sgs.end_date
ORDER BY sg.name;

-- =====================================================
-- VUE 2 : ADMIN GROUPE - Détails de Mon Groupe
-- =====================================================

-- Remplacer 'E-PILOT-002' par le code de votre groupe
SELECT 
  sg.name as mon_groupe,
  sg.code,
  sp.name as mon_plan,
  sp.slug as plan_slug,
  sp.price as prix_mensuel,
  sp.currency as devise,
  COUNT(DISTINCT gmc.module_id) FILTER (WHERE gmc.is_enabled = true) as mes_modules_actifs,
  COUNT(DISTINCT gbc.category_id) FILTER (WHERE gbc.is_enabled = true) as mes_categories_actives,
  sgs.start_date as debut_abonnement,
  sgs.end_date as fin_abonnement,
  EXTRACT(DAY FROM (sgs.end_date - NOW())) as jours_restants
FROM school_groups sg
JOIN school_group_subscriptions sgs ON sgs.school_group_id = sg.id AND sgs.status = 'active'
JOIN subscription_plans sp ON sp.id = sgs.plan_id
LEFT JOIN group_module_configs gmc ON gmc.school_group_id = sg.id
LEFT JOIN group_business_categories gbc ON gbc.school_group_id = sg.id
WHERE sg.code = 'E-PILOT-002'
GROUP BY sg.id, sg.name, sg.code, sp.name, sp.slug, sp.price, sp.currency, sgs.start_date, sgs.end_date;

-- =====================================================
-- VUE 3 : COHÉRENCE - Modules du Plan vs Modules Assignés
-- =====================================================

SELECT 
  sg.name as groupe,
  sp.name as plan,
  COUNT(DISTINCT pm.module_id) as modules_dans_plan,
  COUNT(DISTINCT gmc.module_id) FILTER (WHERE gmc.is_enabled = true) as modules_assignes,
  CASE 
    WHEN COUNT(DISTINCT pm.module_id) = COUNT(DISTINCT gmc.module_id) FILTER (WHERE gmc.is_enabled = true) 
    THEN '✅ Cohérent'
    ELSE '⚠️ Incohérent'
  END as coherence
FROM school_groups sg
JOIN school_group_subscriptions sgs ON sgs.school_group_id = sg.id AND sgs.status = 'active'
JOIN subscription_plans sp ON sp.id = sgs.plan_id
LEFT JOIN plan_modules pm ON pm.plan_id = sp.id
LEFT JOIN group_module_configs gmc ON gmc.school_group_id = sg.id AND gmc.module_id = pm.module_id
WHERE sg.status = 'active'
GROUP BY sg.id, sg.name, sp.name
ORDER BY sg.name;

-- =====================================================
-- VUE 4 : TRIGGERS - État des Triggers Dynamiques
-- =====================================================

SELECT 
  trigger_name,
  event_object_table as table_name,
  action_timing as timing,
  event_manipulation as event,
  CASE 
    WHEN trigger_name LIKE '%auto_assign%' THEN '✅ Assignation automatique'
    WHEN trigger_name LIKE '%update_content%' THEN '✅ Changement de plan'
    WHEN trigger_name LIKE '%disable_content%' THEN '✅ Expiration'
    WHEN trigger_name LIKE '%module_limit%' THEN '✅ Vérification limite'
    ELSE '❓ Autre'
  END as fonction
FROM information_schema.triggers
WHERE event_object_table IN ('school_group_subscriptions', 'group_module_configs')
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- VUE 5 : HISTORIQUE - Derniers Changements de Plan
-- =====================================================

SELECT 
  sg.name as groupe,
  sp.name as plan,
  sgs.status,
  sgs.created_at as date_souscription,
  CASE 
    WHEN sgs.status = 'active' THEN '✅ Actif'
    WHEN sgs.status = 'expired' THEN '⏰ Expiré'
    WHEN sgs.status = 'cancelled' THEN '❌ Annulé'
    ELSE '❓ ' || sgs.status
  END as statut
FROM school_group_subscriptions sgs
JOIN school_groups sg ON sg.id = sgs.school_group_id
JOIN subscription_plans sp ON sp.id = sgs.plan_id
ORDER BY sgs.created_at DESC
LIMIT 10;

-- =====================================================
-- VUE 6 : MODULES - Top 10 Modules les Plus Utilisés
-- =====================================================

SELECT 
  m.name as module,
  bc.name as categorie,
  COUNT(DISTINCT gmc.school_group_id) as nb_groupes_utilisant,
  ROUND(COUNT(DISTINCT gmc.school_group_id)::NUMERIC / 
    (SELECT COUNT(DISTINCT school_group_id) FROM group_module_configs) * 100, 1) as pourcentage
FROM modules m
LEFT JOIN business_categories bc ON bc.id = m.category_id
LEFT JOIN group_module_configs gmc ON gmc.module_id = m.id AND gmc.is_enabled = true
WHERE m.status = 'active'
GROUP BY m.id, m.name, bc.name
ORDER BY nb_groupes_utilisant DESC
LIMIT 10;

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================

/*
VUE 1 : Super Admin - Vue d'ensemble
groupe                | plan           | modules_actifs | categories_actives | alerte
----------------------|----------------|----------------|--------------------|---------
L'INTELIGENCE CELESTE | Premium        | 25             | 3                  | ✅ Actif
LE LIANO              | Gratuit        | 44             | 1                  | ✅ Actif

VUE 2 : Admin Groupe - Mon groupe
mon_groupe            | mon_plan | mes_modules_actifs | mes_categories_actives | jours_restants
----------------------|----------|--------------------|-----------------------|---------------
L'INTELIGENCE CELESTE | Premium  | 25                 | 3                     | 365

VUE 3 : Cohérence
groupe                | plan    | modules_dans_plan | modules_assignes | coherence
----------------------|---------|-------------------|------------------|------------
L'INTELIGENCE CELESTE | Premium | 25                | 25               | ✅ Cohérent

VUE 4 : Triggers
trigger_name                      | table_name                  | fonction
----------------------------------|----------------------------|---------------------------
trigger_auto_assign_content       | school_group_subscriptions | ✅ Assignation automatique
trigger_update_content_on_change  | school_group_subscriptions | ✅ Changement de plan
check_module_limit_trigger        | group_module_configs       | ✅ Vérification limite

Si tous les résultats sont ✅ → Le système est cohérent et automatique
*/

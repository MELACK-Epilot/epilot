/**
 * =====================================================
 * VÉRIFICATION - État Actuel du Groupe
 * =====================================================
 * 
 * Vérifier l'état exact du groupe en base de données
 * 
 * Date : 8 novembre 2025, 00:36 AM
 * =====================================================
 */

-- =====================================================
-- ÉTAT COMPLET DU GROUPE
-- =====================================================

SELECT 
  sg.name as groupe,
  sg.code,
  sg.plan as plan_statique,
  sgs.status as statut_abonnement,
  sp.name as plan_abonnement_actif,
  sp.slug as plan_slug,
  COUNT(DISTINCT gmc.module_id) FILTER (WHERE gmc.is_enabled = true) as modules_actifs_bdd,
  COUNT(DISTINCT gbc.category_id) FILTER (WHERE gbc.is_enabled = true) as categories_actives_bdd,
  (SELECT COUNT(*) FROM plan_modules WHERE plan_id = sp.id) as modules_dans_plan,
  (SELECT COUNT(*) FROM plan_categories WHERE plan_id = sp.id) as categories_dans_plan
FROM school_groups sg
LEFT JOIN school_group_subscriptions sgs ON sgs.school_group_id = sg.id AND sgs.status = 'active'
LEFT JOIN subscription_plans sp ON sp.id = sgs.plan_id
LEFT JOIN group_module_configs gmc ON gmc.school_group_id = sg.id
LEFT JOIN group_business_categories gbc ON gbc.school_group_id = sg.id
WHERE sg.code = 'E-PILOT-002'
GROUP BY sg.id, sg.name, sg.code, sg.plan, sgs.status, sp.name, sp.slug, sp.id;

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================

/*
Si le plan est "Gratuit" :
plan_abonnement_actif | modules_actifs_bdd | modules_dans_plan
----------------------|--------------------|-----------------
Gratuit               | 25                 | 44

→ Incohérence : 25 modules actifs au lieu de 44
→ Solution : Réassigner les modules du plan Gratuit

Si le plan est "Premium" :
plan_abonnement_actif | modules_actifs_bdd | modules_dans_plan
----------------------|--------------------|-----------------
Premium               | 25                 | 25

→ Cohérent mais l'interface affiche "Gratuit"
→ Solution : Rafraîchir l'interface (cache)
*/

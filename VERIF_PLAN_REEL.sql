/**
 * =====================================================
 * VÉRIFICATION - Plan Réel en Base de Données
 * =====================================================
 * 
 * Vérifier quel plan est réellement enregistré
 * 
 * Date : 8 novembre 2025, 00:24 AM
 * =====================================================
 */

-- =====================================================
-- VÉRIFIER LE PLAN DANS school_group_subscriptions
-- =====================================================

SELECT 
  sg.name as groupe,
  sg.code,
  sg.plan as plan_statique_groupe,
  sgs.status as statut_abonnement,
  sp.name as plan_abonnement,
  sp.slug as plan_slug,
  sgs.created_at
FROM school_groups sg
JOIN school_group_subscriptions sgs ON sgs.school_group_id = sg.id
JOIN subscription_plans sp ON sp.id = sgs.plan_id
WHERE sg.code = 'E-PILOT-002'
  AND sgs.status = 'active'
ORDER BY sgs.created_at DESC;

-- =====================================================
-- VÉRIFIER TOUTES LES SUBSCRIPTIONS (HISTORIQUE)
-- =====================================================

SELECT 
  sg.name as groupe,
  sp.name as plan,
  sp.slug,
  sgs.status,
  sgs.created_at
FROM school_group_subscriptions sgs
JOIN school_groups sg ON sg.id = sgs.school_group_id
JOIN subscription_plans sp ON sp.id = sgs.plan_id
WHERE sg.code = 'E-PILOT-002'
ORDER BY sgs.created_at DESC;

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================

/*
Si le changement a été enregistré :
groupe                | plan_abonnement | plan_slug
----------------------|-----------------|----------
L'INTELIGENCE CELESTE | Premium         | premium

Si le changement n'a PAS été enregistré :
groupe                | plan_abonnement | plan_slug
----------------------|-----------------|----------
L'INTELIGENCE CELESTE | Institutionnel  | institutionnel

Dans ce cas, le changement de plan via l'interface n'a pas fonctionné.
*/

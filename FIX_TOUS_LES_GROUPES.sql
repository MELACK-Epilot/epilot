/**
 * =====================================================
 * CORRECTION COMPLÈTE - Tous les Groupes
 * =====================================================
 * 
 * Problème : Aucun groupe n'a d'abonnement actif
 * Solution : Créer des abonnements actifs pour tous les groupes
 * 
 * Date : 7 novembre 2025, 23:07 PM
 * =====================================================
 */

-- =====================================================
-- ÉTAPE 1 : DIAGNOSTIC - Voir l'état actuel
-- =====================================================

SELECT 
  sg.name as groupe,
  sg.code,
  sg.plan as plan_statique,
  sg.status as statut_groupe,
  sgs.status as statut_abonnement,
  sp.name as plan_abonnement
FROM school_groups sg
LEFT JOIN school_group_subscriptions sgs ON sgs.school_group_id = sg.id AND sgs.status = 'active'
LEFT JOIN subscription_plans sp ON sp.id = sgs.plan_id
ORDER BY sg.created_at DESC;

-- =====================================================
-- ÉTAPE 2 : CRÉER DES ABONNEMENTS POUR TOUS LES GROUPES
-- =====================================================

-- Cette requête crée un abonnement actif pour chaque groupe
-- qui n'en a pas encore, en utilisant le plan statique du groupe

INSERT INTO school_group_subscriptions (
  school_group_id,
  plan_id,
  status,
  start_date,
  end_date
)
SELECT 
  sg.id,
  sp.id,
  'active',
  NOW(),
  NOW() + INTERVAL '1 year'
FROM school_groups sg
JOIN subscription_plans sp ON sp.slug = sg.plan::text
WHERE NOT EXISTS (
    SELECT 1 FROM school_group_subscriptions sgs
    WHERE sgs.school_group_id = sg.id 
      AND sgs.status = 'active'
  )
  AND sg.status = 'active'
RETURNING 
  id,
  school_group_id,
  plan_id,
  status,
  start_date;

-- =====================================================
-- ÉTAPE 3 : VÉRIFIER LES ABONNEMENTS CRÉÉS
-- =====================================================

SELECT 
  sg.name as groupe,
  sg.code,
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
-- ÉTAPE 4 : VÉRIFIER LES MODULES ASSIGNÉS
-- =====================================================

-- Cette requête montre combien de modules ont été assignés
-- automatiquement par le TRIGGER

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
-- ÉTAPE 5 : DÉTAILS DES MODULES PAR GROUPE
-- =====================================================

-- Voir les 10 premiers modules de chaque groupe

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
WHERE gmc.is_enabled = true
ORDER BY sg.name, gmc.enabled_at DESC
LIMIT 20;

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================

/*
ÉTAPE 2 : Devrait retourner 2 lignes (2 abonnements créés)
id | school_group_id | plan_id | status | start_date
---|-----------------|---------|--------|------------
... | uuid-groupe-1  | uuid-plan | active | 2025-11-07...
... | uuid-groupe-2  | uuid-plan | active | 2025-11-07...

ÉTAPE 3 : Devrait montrer les 2 abonnements actifs
groupe                | code        | statut_abonnement | plan    | start_date          | end_date
----------------------|-------------|-------------------|---------|---------------------|---------------------
L'INTELIGENCE SELESTE | E-PILOT-002 | active            | Gratuit | 2025-11-07 23:07:00 | 2026-11-07 23:07:00
LE LIANO              | E-PILOT-001 | active            | Gratuit | 2025-11-07 23:07:00 | 2026-11-07 23:07:00

ÉTAPE 4 : Devrait montrer les modules assignés
groupe                | code        | plan    | modules_actifs | categories_actives
----------------------|-------------|---------|----------------|-------------------
L'INTELIGENCE SELESTE | E-PILOT-002 | Gratuit | 44             | 1
LE LIANO              | E-PILOT-001 | Gratuit | 44             | 1

Si vous voyez ces résultats :
✅ Les abonnements sont créés
✅ Les TRIGGERS ont fonctionné
✅ Les modules et catégories sont assignés
✅ Les Admin Groupe verront leurs modules

Rafraîchissez la page /dashboard/my-modules (F5)
*/

-- =====================================================
-- BONUS : SI BESOIN DE RÉINITIALISER
-- =====================================================

/*
-- ATTENTION : N'exécutez ceci QUE si vous voulez tout recommencer

-- Supprimer tous les abonnements (pour recommencer)
DELETE FROM school_group_subscriptions;

-- Supprimer toutes les assignations de modules
DELETE FROM group_module_configs;

-- Supprimer toutes les assignations de catégories
DELETE FROM group_business_categories;

-- Puis réexécutez l'ÉTAPE 2 pour tout recréer
*/

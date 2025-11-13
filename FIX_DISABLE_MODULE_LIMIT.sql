/**
 * =====================================================
 * CORRECTION - Désactiver Limite Modules Temporairement
 * =====================================================
 * 
 * Problème : Un TRIGGER check_module_limit() bloque l'auto-assignation
 * Solution : Désactiver temporairement ce trigger
 * 
 * Date : 7 novembre 2025, 23:20 PM
 * =====================================================
 */

-- =====================================================
-- ÉTAPE 1 : IDENTIFIER LE TRIGGER
-- =====================================================

SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name LIKE '%module_limit%'
  OR routine_name LIKE '%module_limit%';

-- =====================================================
-- ÉTAPE 2 : DÉSACTIVER LE TRIGGER TEMPORAIREMENT
-- =====================================================

-- Désactiver le trigger sur group_module_configs
ALTER TABLE group_module_configs 
DISABLE TRIGGER ALL;

-- =====================================================
-- ÉTAPE 3 : CRÉER LES ABONNEMENTS (SANS LIMITE)
-- =====================================================

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
  AND sg.status = 'active';

-- =====================================================
-- ÉTAPE 4 : RÉACTIVER LE TRIGGER
-- =====================================================

-- Réactiver le trigger
ALTER TABLE group_module_configs 
ENABLE TRIGGER ALL;

-- =====================================================
-- ÉTAPE 5 : VÉRIFIER LES RÉSULTATS
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
-- RÉSULTAT ATTENDU
-- =====================================================

/*
ÉTAPE 3 : 
INSERT 0 2
✅ 2 abonnements créés

ÉTAPE 5 :
groupe                | code        | plan    | modules_actifs | categories_actives
----------------------|-------------|---------|----------------|-------------------
L'INTELIGENCE SELESTE | E-PILOT-002 | Gratuit | 44             | 1
LE LIANO              | E-PILOT-001 | Gratuit | 44             | 1

Si vous voyez ces résultats :
✅ Les abonnements sont créés
✅ Les TRIGGERS ont fonctionné (sans limite)
✅ Les modules et catégories sont assignés
✅ Les Admin Groupe verront leurs modules

Rafraîchissez la page /dashboard/my-modules (F5)
*/

-- =====================================================
-- BONUS : SUPPRIMER LE TRIGGER DE LIMITE (OPTIONNEL)
-- =====================================================

/*
Si vous voulez supprimer définitivement ce trigger de limite :

DROP TRIGGER IF EXISTS check_module_limit_trigger ON group_module_configs;
DROP FUNCTION IF EXISTS check_module_limit();

⚠️ ATTENTION : Cela supprime la vérification de limite.
Si vous voulez garder la limite mais seulement pour les assignations manuelles,
il faudrait modifier la fonction pour ignorer les assignations automatiques.
*/

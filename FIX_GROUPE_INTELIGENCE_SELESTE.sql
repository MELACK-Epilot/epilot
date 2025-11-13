/**
 * =====================================================
 * CORRECTION - Groupe "L'INTELIGENCE SELESTE"
 * =====================================================
 * 
 * Problème : Le groupe a un plan "Gratuit" mais pas d'abonnement actif
 * Solution : Créer un abonnement actif
 * 
 * Date : 7 novembre 2025, 22:52 PM
 * =====================================================
 */

-- =====================================================
-- ÉTAPE 1 : VÉRIFIER LE GROUPE
-- =====================================================

SELECT 
  id,
  name,
  code,
  plan as plan_statique,
  status
FROM school_groups
WHERE code = 'E-PILOT-002'
  OR name ILIKE '%INTELIGENCE%';

-- =====================================================
-- ÉTAPE 2 : VÉRIFIER L'ABONNEMENT EXISTANT
-- =====================================================

SELECT 
  sgs.id,
  sg.name as groupe,
  sgs.status,
  sp.name as plan,
  sgs.start_date,
  sgs.end_date
FROM school_group_subscriptions sgs
JOIN school_groups sg ON sg.id = sgs.school_group_id
JOIN subscription_plans sp ON sp.id = sgs.plan_id
WHERE sg.code = 'E-PILOT-002'
  OR sg.name ILIKE '%INTELIGENCE%';

-- =====================================================
-- ÉTAPE 3 : CRÉER UN ABONNEMENT ACTIF
-- =====================================================

-- Si aucun abonnement n'existe, exécuter ceci :

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
CROSS JOIN subscription_plans sp
WHERE (sg.code = 'E-PILOT-002' OR sg.name ILIKE '%INTELIGENCE%')
  AND sp.slug = 'gratuit'
  AND NOT EXISTS (
    SELECT 1 FROM school_group_subscriptions sgs
    WHERE sgs.school_group_id = sg.id 
      AND sgs.status = 'active'
  )
LIMIT 1
RETURNING 
  id,
  school_group_id,
  plan_id,
  status,
  start_date;

-- =====================================================
-- ÉTAPE 4 : VÉRIFIER QUE LE TRIGGER A FONCTIONNÉ
-- =====================================================

-- Vérifier les modules assignés au groupe
SELECT 
  sg.name as groupe,
  m.name as module,
  gmc.is_enabled,
  gmc.enabled_at
FROM group_module_configs gmc
JOIN school_groups sg ON sg.id = gmc.school_group_id
JOIN modules m ON m.id = gmc.module_id
WHERE sg.code = 'E-PILOT-002'
  OR sg.name ILIKE '%INTELIGENCE%'
ORDER BY gmc.enabled_at DESC
LIMIT 10;

-- Vérifier les catégories assignées au groupe
SELECT 
  sg.name as groupe,
  bc.name as categorie,
  gbc.is_enabled,
  gbc.enabled_at
FROM group_business_categories gbc
JOIN school_groups sg ON sg.id = gbc.school_group_id
JOIN business_categories bc ON bc.id = gbc.category_id
WHERE sg.code = 'E-PILOT-002'
  OR sg.name ILIKE '%INTELIGENCE%'
ORDER BY gbc.enabled_at DESC;

-- =====================================================
-- ÉTAPE 5 : DIAGNOSTIC FINAL
-- =====================================================

SELECT 
  sg.name as groupe,
  sg.code,
  sgs.status as statut_abonnement,
  sp.name as plan,
  sp.slug as plan_slug,
  COUNT(DISTINCT gmc.module_id) FILTER (WHERE gmc.is_enabled = true) as modules_actifs,
  COUNT(DISTINCT gbc.category_id) FILTER (WHERE gbc.is_enabled = true) as categories_actives
FROM school_groups sg
LEFT JOIN school_group_subscriptions sgs ON sgs.school_group_id = sg.id AND sgs.status = 'active'
LEFT JOIN subscription_plans sp ON sp.id = sgs.plan_id
LEFT JOIN group_module_configs gmc ON gmc.school_group_id = sg.id
LEFT JOIN group_business_categories gbc ON gbc.school_group_id = sg.id
WHERE sg.code = 'E-PILOT-002'
  OR sg.name ILIKE '%INTELIGENCE%'
GROUP BY sg.id, sg.name, sg.code, sgs.status, sp.name, sp.slug;

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================

/*
Après exécution de l'ÉTAPE 3, vous devriez voir :

ÉTAPE 4 (modules) :
- 44 lignes avec is_enabled = true

ÉTAPE 4 (catégories) :
- 1 ligne avec is_enabled = true

ÉTAPE 5 (diagnostic) :
groupe                  | code        | statut_abonnement | plan    | modules_actifs | categories_actives
------------------------|-------------|-------------------|---------|----------------|-------------------
L'INTELIGENCE SELESTE   | E-PILOT-002 | active            | Gratuit | 44             | 1

Si vous voyez ces résultats, le problème est résolu !
Rafraîchissez la page /dashboard/my-modules (F5)
*/

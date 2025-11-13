/**
 * =====================================================
 * CORRECTION FINALE - L'INTELIGENCE CELESTE
 * =====================================================
 * 
 * Créer l'abonnement et assigner les modules/catégories
 * 
 * Date : 8 novembre 2025, 00:07 AM
 * =====================================================
 */

-- =====================================================
-- ÉTAPE 1 : DÉSACTIVER LES TRIGGERS UTILISATEUR
-- =====================================================

-- Désactiver uniquement les triggers utilisateur (pas les triggers système)
ALTER TABLE group_module_configs DISABLE TRIGGER USER;
ALTER TABLE group_business_categories DISABLE TRIGGER USER;

-- =====================================================
-- ÉTAPE 2 : CRÉER L'ABONNEMENT
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
CROSS JOIN subscription_plans sp
WHERE sg.code = 'E-PILOT-002'
  AND sp.slug = 'institutionnel'
  AND NOT EXISTS (
    SELECT 1 FROM school_group_subscriptions sgs
    WHERE sgs.school_group_id = sg.id 
      AND sgs.status = 'active'
  )
RETURNING 
  id,
  school_group_id,
  plan_id,
  status,
  start_date;

-- =====================================================
-- ÉTAPE 3 : ASSIGNER LES MODULES MANUELLEMENT
-- =====================================================

INSERT INTO group_module_configs (
  school_group_id,
  module_id,
  is_enabled,
  enabled_at
)
SELECT 
  sg.id,
  pm.module_id,
  true,
  NOW()
FROM school_groups sg
CROSS JOIN plan_modules pm
JOIN subscription_plans sp ON sp.id = pm.plan_id
WHERE sg.code = 'E-PILOT-002'
  AND sp.slug = 'institutionnel'
ON CONFLICT (school_group_id, module_id) 
DO UPDATE SET 
  is_enabled = true,
  enabled_at = NOW(),
  disabled_at = NULL;

-- =====================================================
-- ÉTAPE 4 : ASSIGNER LES CATÉGORIES MANUELLEMENT
-- =====================================================

INSERT INTO group_business_categories (
  school_group_id,
  category_id,
  is_enabled,
  enabled_at
)
SELECT 
  sg.id,
  pc.category_id,
  true,
  NOW()
FROM school_groups sg
CROSS JOIN plan_categories pc
JOIN subscription_plans sp ON sp.id = pc.plan_id
WHERE sg.code = 'E-PILOT-002'
  AND sp.slug = 'institutionnel'
ON CONFLICT (school_group_id, category_id) 
DO UPDATE SET 
  is_enabled = true,
  enabled_at = NOW(),
  disabled_at = NULL;

-- =====================================================
-- ÉTAPE 5 : RÉACTIVER LES TRIGGERS UTILISATEUR
-- =====================================================

ALTER TABLE group_module_configs ENABLE TRIGGER USER;
ALTER TABLE group_business_categories ENABLE TRIGGER USER;

-- =====================================================
-- ÉTAPE 6 : VÉRIFICATION
-- =====================================================

SELECT 
  sg.name as groupe,
  sp.name as plan,
  COUNT(DISTINCT gmc.module_id) FILTER (WHERE gmc.is_enabled = true) as modules_actifs,
  COUNT(DISTINCT gbc.category_id) FILTER (WHERE gbc.is_enabled = true) as categories_actives
FROM school_groups sg
JOIN school_group_subscriptions sgs ON sgs.school_group_id = sg.id AND sgs.status = 'active'
JOIN subscription_plans sp ON sp.id = sgs.plan_id
LEFT JOIN group_module_configs gmc ON gmc.school_group_id = sg.id
LEFT JOIN group_business_categories gbc ON gbc.school_group_id = sg.id
WHERE sg.code = 'E-PILOT-002'
GROUP BY sg.id, sg.name, sp.name;

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================

/*
ÉTAPE 2 : 
INSERT 0 1
✅ 1 abonnement créé

ÉTAPE 3 :
INSERT 0 47
✅ 47 modules assignés

ÉTAPE 4 :
INSERT 0 8
✅ 8 catégories assignées

ÉTAPE 6 :
groupe                | plan           | modules_actifs | categories_actives
----------------------|----------------|----------------|-------------------
L'INTELIGENCE CELESTE | Institutionnel | 47             | 8

Si vous voyez ces résultats :
✅ Abonnement créé
✅ 47 modules assignés
✅ 8 catégories assignées
✅ Rafraîchissez /dashboard/my-modules (F5)
✅ Les KPI devraient afficher 47 et 8
*/

/**
 * =====================================================
 * FORCER LA MISE À JOUR - Plan Premium
 * =====================================================
 * 
 * Mettre à jour manuellement les modules et catégories
 * pour correspondre au plan Premium
 * 
 * Date : 8 novembre 2025, 00:19 AM
 * =====================================================
 */

-- =====================================================
-- ÉTAPE 0 : SUPPRIMER LE TRIGGER PROBLÉMATIQUE
-- =====================================================

DROP TRIGGER IF EXISTS trigger_group_categories_updated_at ON group_business_categories;

-- =====================================================
-- ÉTAPE 1 : VÉRIFIER L'ÉTAT ACTUEL
-- =====================================================

SELECT 
  sg.name as groupe,
  sp.name as plan_actuel,
  sgs.plan_id,
  COUNT(DISTINCT gmc.module_id) FILTER (WHERE gmc.is_enabled = true) as modules_actifs,
  COUNT(DISTINCT gbc.category_id) FILTER (WHERE gbc.is_enabled = true) as categories_actives
FROM school_groups sg
JOIN school_group_subscriptions sgs ON sgs.school_group_id = sg.id AND sgs.status = 'active'
JOIN subscription_plans sp ON sp.id = sgs.plan_id
LEFT JOIN group_module_configs gmc ON gmc.school_group_id = sg.id
LEFT JOIN group_business_categories gbc ON gbc.school_group_id = sg.id
WHERE sg.code = 'E-PILOT-002'
GROUP BY sg.id, sg.name, sp.name, sgs.plan_id;

-- =====================================================
-- ÉTAPE 2 : DÉSACTIVER TOUS LES MODULES ACTUELS
-- =====================================================

UPDATE group_module_configs
SET 
  is_enabled = false,
  disabled_at = NOW()
WHERE school_group_id = (SELECT id FROM school_groups WHERE code = 'E-PILOT-002');

-- =====================================================
-- ÉTAPE 3 : DÉSACTIVER TOUTES LES CATÉGORIES ACTUELLES
-- =====================================================

UPDATE group_business_categories
SET 
  is_enabled = false,
  disabled_at = NOW()
WHERE school_group_id = (SELECT id FROM school_groups WHERE code = 'E-PILOT-002');

-- =====================================================
-- ÉTAPE 4 : ACTIVER LES MODULES DU PLAN PREMIUM
-- =====================================================

-- Récupérer le plan_id de Premium
DO $$
DECLARE
  v_group_id UUID;
  v_plan_id UUID;
BEGIN
  -- Récupérer l'ID du groupe
  SELECT id INTO v_group_id 
  FROM school_groups 
  WHERE code = 'E-PILOT-002';
  
  -- Récupérer l'ID du plan Premium depuis l'abonnement actif
  SELECT plan_id INTO v_plan_id
  FROM school_group_subscriptions
  WHERE school_group_id = v_group_id
    AND status = 'active';
  
  RAISE NOTICE 'Groupe ID: %', v_group_id;
  RAISE NOTICE 'Plan ID: %', v_plan_id;
  
  -- Activer les modules du plan
  UPDATE group_module_configs gmc
  SET 
    is_enabled = true,
    enabled_at = NOW(),
    disabled_at = NULL
  WHERE gmc.school_group_id = v_group_id
    AND gmc.module_id IN (
      SELECT module_id 
      FROM plan_modules 
      WHERE plan_id = v_plan_id
    );
  
  RAISE NOTICE '✅ Modules activés: %', (
    SELECT COUNT(*) 
    FROM group_module_configs 
    WHERE school_group_id = v_group_id 
      AND is_enabled = true
  );
  
  -- Activer les catégories du plan
  UPDATE group_business_categories gbc
  SET 
    is_enabled = true,
    enabled_at = NOW(),
    disabled_at = NULL
  WHERE gbc.school_group_id = v_group_id
    AND gbc.category_id IN (
      SELECT category_id 
      FROM plan_categories 
      WHERE plan_id = v_plan_id
    );
  
  RAISE NOTICE '✅ Catégories activées: %', (
    SELECT COUNT(*) 
    FROM group_business_categories 
    WHERE school_group_id = v_group_id 
      AND is_enabled = true
  );
END $$;

-- =====================================================
-- ÉTAPE 5 : VÉRIFICATION FINALE
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
ÉTAPE 5 : Vérification
groupe                | plan    | modules_actifs | categories_actives
----------------------|---------|----------------|-------------------
L'INTELIGENCE CELESTE | Premium | 25             | 3

Si vous voyez ces résultats :
✅ Modules : 47 → 25
✅ Catégories : 8 → 3
✅ Rafraîchissez /dashboard/my-modules (F5)
✅ Les KPI devraient afficher 25 et 3
*/

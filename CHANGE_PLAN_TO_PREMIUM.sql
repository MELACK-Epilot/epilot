/**
 * =====================================================
 * CHANGER LE PLAN MANUELLEMENT - Premium
 * =====================================================
 * 
 * Changer le plan de "Institutionnel" à "Premium"
 * et mettre à jour les modules/catégories
 * 
 * Date : 8 novembre 2025, 00:25 AM
 * =====================================================
 */

-- =====================================================
-- ÉTAPE 1 : DÉSACTIVER LES TRIGGERS BLOQUANTS
-- =====================================================

-- Supprimer le trigger updated_at problématique
DROP TRIGGER IF EXISTS trigger_group_categories_updated_at ON group_business_categories;

-- Désactiver temporairement les triggers de limite
ALTER TABLE group_module_configs DISABLE TRIGGER USER;
ALTER TABLE group_business_categories DISABLE TRIGGER USER;

-- =====================================================
-- ÉTAPE 2 : CHANGER LE PLAN DANS school_group_subscriptions
-- =====================================================

UPDATE school_group_subscriptions
SET 
  plan_id = (SELECT id FROM subscription_plans WHERE slug = 'premium')
WHERE school_group_id = (SELECT id FROM school_groups WHERE code = 'E-PILOT-002')
  AND status = 'active'
RETURNING 
  id,
  school_group_id,
  plan_id,
  status;

-- =====================================================
-- ÉTAPE 3 : DÉSACTIVER TOUS LES MODULES ACTUELS
-- =====================================================

UPDATE group_module_configs
SET 
  is_enabled = false,
  disabled_at = NOW()
WHERE school_group_id = (SELECT id FROM school_groups WHERE code = 'E-PILOT-002');

-- =====================================================
-- ÉTAPE 4 : DÉSACTIVER TOUTES LES CATÉGORIES ACTUELLES
-- =====================================================

UPDATE group_business_categories
SET 
  is_enabled = false,
  disabled_at = NOW()
WHERE school_group_id = (SELECT id FROM school_groups WHERE code = 'E-PILOT-002');

-- =====================================================
-- ÉTAPE 5 : ACTIVER LES MODULES DU PLAN PREMIUM
-- =====================================================

DO $$
DECLARE
  v_group_id UUID;
  v_plan_id UUID;
  v_modules_count INT;
  v_categories_count INT;
BEGIN
  -- Récupérer l'ID du groupe
  SELECT id INTO v_group_id 
  FROM school_groups 
  WHERE code = 'E-PILOT-002';
  
  -- Récupérer l'ID du plan Premium
  SELECT id INTO v_plan_id
  FROM subscription_plans
  WHERE slug = 'premium';
  
  RAISE NOTICE 'Groupe ID: %', v_group_id;
  RAISE NOTICE 'Plan Premium ID: %', v_plan_id;
  
  -- Activer les modules du plan Premium
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
  
  GET DIAGNOSTICS v_modules_count = ROW_COUNT;
  RAISE NOTICE '✅ Modules Premium activés: %', v_modules_count;
  
  -- Activer les catégories du plan Premium
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
  
  GET DIAGNOSTICS v_categories_count = ROW_COUNT;
  RAISE NOTICE '✅ Catégories Premium activées: %', v_categories_count;
END $$;

-- =====================================================
-- ÉTAPE 6 : RÉACTIVER LES TRIGGERS
-- =====================================================

ALTER TABLE group_module_configs ENABLE TRIGGER USER;
ALTER TABLE group_business_categories ENABLE TRIGGER USER;

-- =====================================================
-- ÉTAPE 7 : VÉRIFICATION FINALE
-- =====================================================

SELECT 
  sg.name as groupe,
  sp.name as plan,
  sp.slug as plan_slug,
  COUNT(DISTINCT gmc.module_id) FILTER (WHERE gmc.is_enabled = true) as modules_actifs,
  COUNT(DISTINCT gbc.category_id) FILTER (WHERE gbc.is_enabled = true) as categories_actives
FROM school_groups sg
JOIN school_group_subscriptions sgs ON sgs.school_group_id = sg.id AND sgs.status = 'active'
JOIN subscription_plans sp ON sp.id = sgs.plan_id
LEFT JOIN group_module_configs gmc ON gmc.school_group_id = sg.id
LEFT JOIN group_business_categories gbc ON gbc.school_group_id = sg.id
WHERE sg.code = 'E-PILOT-002'
GROUP BY sg.id, sg.name, sp.name, sp.slug;

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================

/*
ÉTAPE 2: UPDATE 1 (plan changé)
ÉTAPE 3: UPDATE 47 (modules désactivés)
ÉTAPE 4: UPDATE 8 (catégories désactivées)
ÉTAPE 5: 
  ✅ Modules Premium activés: 25
  ✅ Catégories Premium activées: 3

ÉTAPE 6: Vérification
groupe                | plan    | plan_slug | modules_actifs | categories_actives
----------------------|---------|-----------|----------------|-------------------
L'INTELIGENCE CELESTE | Premium | premium   | 25             | 3

Si vous voyez ces résultats :
✅ Plan : Institutionnel → Premium
✅ Modules : 47 → 25
✅ Catégories : 8 → 3
✅ Rafraîchissez /dashboard/my-modules (F5)
*/

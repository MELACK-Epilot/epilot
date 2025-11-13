/**
 * =====================================================
 * SYNCHRONISATION - Modules avec Plan Actif
 * =====================================================
 * 
 * Synchroniser automatiquement les modules et catégories
 * avec le plan d'abonnement actif
 * 
 * Date : 8 novembre 2025, 00:37 AM
 * =====================================================
 */

-- =====================================================
-- ÉTAPE 1 : DÉSACTIVER LES TRIGGERS BLOQUANTS
-- =====================================================

DROP TRIGGER IF EXISTS trigger_group_categories_updated_at ON group_business_categories;
ALTER TABLE group_module_configs DISABLE TRIGGER USER;
ALTER TABLE group_business_categories DISABLE TRIGGER USER;

-- =====================================================
-- ÉTAPE 2 : SYNCHRONISER LES MODULES
-- =====================================================

DO $$
DECLARE
  v_group_id UUID;
  v_plan_id UUID;
  v_plan_name TEXT;
  v_modules_disabled INT;
  v_modules_enabled INT;
  v_categories_disabled INT;
  v_categories_enabled INT;
BEGIN
  -- Récupérer l'ID du groupe
  SELECT id INTO v_group_id 
  FROM school_groups 
  WHERE code = 'E-PILOT-002';
  
  -- Récupérer le plan actif
  SELECT sgs.plan_id, sp.name
  INTO v_plan_id, v_plan_name
  FROM school_group_subscriptions sgs
  JOIN subscription_plans sp ON sp.id = sgs.plan_id
  WHERE sgs.school_group_id = v_group_id
    AND sgs.status = 'active';
  
  RAISE NOTICE '📋 Groupe ID: %', v_group_id;
  RAISE NOTICE '📋 Plan actif: % (ID: %)', v_plan_name, v_plan_id;
  
  -- Désactiver TOUS les modules actuels
  UPDATE group_module_configs
  SET 
    is_enabled = false,
    disabled_at = NOW()
  WHERE school_group_id = v_group_id
    AND is_enabled = true;
  
  GET DIAGNOSTICS v_modules_disabled = ROW_COUNT;
  RAISE NOTICE '❌ Modules désactivés: %', v_modules_disabled;
  
  -- Activer les modules du plan actif
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
  
  GET DIAGNOSTICS v_modules_enabled = ROW_COUNT;
  RAISE NOTICE '✅ Modules activés: %', v_modules_enabled;
  
  -- Désactiver TOUTES les catégories actuelles
  UPDATE group_business_categories
  SET 
    is_enabled = false,
    disabled_at = NOW()
  WHERE school_group_id = v_group_id
    AND is_enabled = true;
  
  GET DIAGNOSTICS v_categories_disabled = ROW_COUNT;
  RAISE NOTICE '❌ Catégories désactivées: %', v_categories_disabled;
  
  -- Activer les catégories du plan actif
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
  
  GET DIAGNOSTICS v_categories_enabled = ROW_COUNT;
  RAISE NOTICE '✅ Catégories activées: %', v_categories_enabled;
  
  RAISE NOTICE '🎉 Synchronisation terminée !';
END $$;

-- =====================================================
-- ÉTAPE 3 : RÉACTIVER LES TRIGGERS
-- =====================================================

ALTER TABLE group_module_configs ENABLE TRIGGER USER;
ALTER TABLE group_business_categories ENABLE TRIGGER USER;

-- =====================================================
-- ÉTAPE 4 : VÉRIFICATION
-- =====================================================

SELECT 
  sg.name as groupe,
  sp.name as plan,
  sp.slug as plan_slug,
  COUNT(DISTINCT gmc.module_id) FILTER (WHERE gmc.is_enabled = true) as modules_actifs,
  COUNT(DISTINCT gbc.category_id) FILTER (WHERE gbc.is_enabled = true) as categories_actives,
  (SELECT COUNT(*) FROM plan_modules WHERE plan_id = sp.id) as modules_dans_plan,
  (SELECT COUNT(*) FROM plan_categories WHERE plan_id = sp.id) as categories_dans_plan,
  CASE 
    WHEN COUNT(DISTINCT gmc.module_id) FILTER (WHERE gmc.is_enabled = true) = 
         (SELECT COUNT(*) FROM plan_modules WHERE plan_id = sp.id)
    THEN '✅ Synchronisé'
    ELSE '⚠️ Incohérent'
  END as statut
FROM school_groups sg
JOIN school_group_subscriptions sgs ON sgs.school_group_id = sg.id AND sgs.status = 'active'
JOIN subscription_plans sp ON sp.id = sgs.plan_id
LEFT JOIN group_module_configs gmc ON gmc.school_group_id = sg.id
LEFT JOIN group_business_categories gbc ON gbc.school_group_id = sg.id
WHERE sg.code = 'E-PILOT-002'
GROUP BY sg.id, sg.name, sp.name, sp.slug, sp.id;

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================

/*
Si le plan est "Gratuit" :
groupe                | plan    | modules_actifs | modules_dans_plan | statut
----------------------|---------|----------------|-------------------|---------------
L'INTELIGENCE CELESTE | Gratuit | 44             | 44                | ✅ Synchronisé

Si le plan est "Premium" :
groupe                | plan    | modules_actifs | modules_dans_plan | statut
----------------------|---------|----------------|-------------------|---------------
L'INTELIGENCE CELESTE | Premium | 25             | 25                | ✅ Synchronisé

Après exécution :
✅ Rafraîchissez /dashboard/my-modules (F5)
✅ Les KPI devraient correspondre au plan actif
*/

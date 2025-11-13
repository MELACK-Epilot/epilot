/**
 * =====================================================
 * DIAGNOSTIC RAPIDE - Pourquoi "Aucun module trouvé" ?
 * =====================================================
 * 
 * Exécutez ces requêtes dans l'ordre pour identifier le problème
 * Temps : 2 minutes
 * 
 * Date : 7 novembre 2025, 22:35 PM
 * =====================================================
 */

-- =====================================================
-- ÉTAPE 1 : VÉRIFIER LE GROUPE
-- =====================================================

DO $$
DECLARE
  v_group_count INTEGER;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ÉTAPE 1 : VÉRIFICATION DU GROUPE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  SELECT COUNT(*) INTO v_group_count FROM school_groups;
  RAISE NOTICE '📊 Nombre de groupes scolaires : %', v_group_count;
  
  IF v_group_count = 0 THEN
    RAISE WARNING '❌ PROBLÈME : Aucun groupe scolaire dans la base !';
    RAISE NOTICE '   → Solution : Créer un groupe scolaire';
  ELSE
    RAISE NOTICE '✅ Des groupes existent';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- Afficher les groupes
SELECT 
  id,
  name,
  code,
  plan,
  status
FROM school_groups
ORDER BY created_at DESC
LIMIT 5;

-- =====================================================
-- ÉTAPE 2 : VÉRIFIER LES ABONNEMENTS
-- =====================================================

DO $$
DECLARE
  v_subscription_count INTEGER;
  v_active_subscription_count INTEGER;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ÉTAPE 2 : VÉRIFICATION DES ABONNEMENTS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  SELECT COUNT(*) INTO v_subscription_count FROM school_group_subscriptions;
  RAISE NOTICE '📊 Nombre total d''abonnements : %', v_subscription_count;
  
  SELECT COUNT(*) INTO v_active_subscription_count 
  FROM school_group_subscriptions 
  WHERE status = 'active';
  RAISE NOTICE '📊 Abonnements actifs : %', v_active_subscription_count;
  
  IF v_subscription_count = 0 THEN
    RAISE WARNING '❌ PROBLÈME : Aucun abonnement dans school_group_subscriptions !';
    RAISE NOTICE '   → Solution : Créer un abonnement pour le groupe';
  ELSIF v_active_subscription_count = 0 THEN
    RAISE WARNING '⚠️ PROBLÈME : Aucun abonnement actif !';
    RAISE NOTICE '   → Solution : Activer un abonnement (status = ''active'')';
  ELSE
    RAISE NOTICE '✅ Des abonnements actifs existent';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- Afficher les abonnements
SELECT 
  sg.name as groupe,
  sgs.status as statut_abonnement,
  sp.name as plan,
  sp.slug as plan_slug,
  sgs.start_date,
  sgs.end_date
FROM school_group_subscriptions sgs
JOIN school_groups sg ON sg.id = sgs.school_group_id
JOIN subscription_plans sp ON sp.id = sgs.plan_id
ORDER BY sgs.created_at DESC
LIMIT 5;

-- =====================================================
-- ÉTAPE 3 : VÉRIFIER LES PLANS
-- =====================================================

DO $$
DECLARE
  v_plan_count INTEGER;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ÉTAPE 3 : VÉRIFICATION DES PLANS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  SELECT COUNT(*) INTO v_plan_count FROM subscription_plans WHERE is_active = true;
  RAISE NOTICE '📊 Nombre de plans actifs : %', v_plan_count;
  
  IF v_plan_count = 0 THEN
    RAISE WARNING '❌ PROBLÈME : Aucun plan actif !';
    RAISE NOTICE '   → Solution : Créer des plans d''abonnement';
  ELSE
    RAISE NOTICE '✅ Des plans actifs existent';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- Afficher les plans
SELECT 
  id,
  name,
  slug,
  price,
  is_active
FROM subscription_plans
ORDER BY price ASC;

-- =====================================================
-- ÉTAPE 4 : VÉRIFIER LES MODULES DES PLANS
-- =====================================================

DO $$
DECLARE
  v_plan_modules_count INTEGER;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ÉTAPE 4 : VÉRIFICATION MODULES DES PLANS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  SELECT COUNT(*) INTO v_plan_modules_count FROM plan_modules;
  RAISE NOTICE '📊 Nombre de liaisons plan-modules : %', v_plan_modules_count;
  
  IF v_plan_modules_count = 0 THEN
    RAISE WARNING '❌ PROBLÈME CRITIQUE : Aucun module assigné aux plans !';
    RAISE NOTICE '   → Solution : Modifier les plans via /dashboard/plans et assigner des modules';
    RAISE NOTICE '   → Ou exécuter : INSERT INTO plan_modules (plan_id, module_id) ...';
  ELSE
    RAISE NOTICE '✅ Des modules sont assignés aux plans';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- Afficher les modules par plan
SELECT 
  sp.name as plan,
  sp.slug as plan_slug,
  COUNT(pm.module_id) as nb_modules
FROM subscription_plans sp
LEFT JOIN plan_modules pm ON pm.plan_id = sp.id
GROUP BY sp.id, sp.name, sp.slug
ORDER BY sp.price ASC;

-- =====================================================
-- ÉTAPE 5 : VÉRIFIER LES CATÉGORIES DES PLANS
-- =====================================================

DO $$
DECLARE
  v_plan_categories_count INTEGER;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ÉTAPE 5 : VÉRIFICATION CATÉGORIES DES PLANS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  SELECT COUNT(*) INTO v_plan_categories_count FROM plan_categories;
  RAISE NOTICE '📊 Nombre de liaisons plan-catégories : %', v_plan_categories_count;
  
  IF v_plan_categories_count = 0 THEN
    RAISE WARNING '❌ PROBLÈME CRITIQUE : Aucune catégorie assignée aux plans !';
    RAISE NOTICE '   → Solution : Modifier les plans via /dashboard/plans et assigner des catégories';
    RAISE NOTICE '   → Ou exécuter : INSERT INTO plan_categories (plan_id, category_id) ...';
  ELSE
    RAISE NOTICE '✅ Des catégories sont assignées aux plans';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- Afficher les catégories par plan
SELECT 
  sp.name as plan,
  sp.slug as plan_slug,
  COUNT(pc.category_id) as nb_categories
FROM subscription_plans sp
LEFT JOIN plan_categories pc ON pc.plan_id = sp.id
GROUP BY sp.id, sp.name, sp.slug
ORDER BY sp.price ASC;

-- =====================================================
-- ÉTAPE 6 : VÉRIFIER LES MODULES DISPONIBLES
-- =====================================================

DO $$
DECLARE
  v_modules_count INTEGER;
  v_active_modules_count INTEGER;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ÉTAPE 6 : VÉRIFICATION MODULES DISPONIBLES';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  SELECT COUNT(*) INTO v_modules_count FROM modules;
  RAISE NOTICE '📊 Nombre total de modules : %', v_modules_count;
  
  SELECT COUNT(*) INTO v_active_modules_count FROM modules WHERE status = 'active';
  RAISE NOTICE '📊 Modules actifs : %', v_active_modules_count;
  
  IF v_modules_count = 0 THEN
    RAISE WARNING '❌ PROBLÈME : Aucun module dans la base !';
    RAISE NOTICE '   → Solution : Créer des modules';
  ELSIF v_active_modules_count = 0 THEN
    RAISE WARNING '⚠️ PROBLÈME : Aucun module actif !';
    RAISE NOTICE '   → Solution : Activer des modules (status = ''active'')';
  ELSE
    RAISE NOTICE '✅ Des modules actifs existent';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- =====================================================
-- ÉTAPE 7 : DIAGNOSTIC COMPLET POUR UN GROUPE
-- =====================================================

DO $$
DECLARE
  v_group_id UUID;
  v_group_name TEXT;
  v_has_subscription BOOLEAN;
  v_plan_id UUID;
  v_plan_name TEXT;
  v_modules_in_plan INTEGER;
  v_categories_in_plan INTEGER;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ÉTAPE 7 : DIAGNOSTIC COMPLET';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  -- Prendre le premier groupe
  SELECT id, name INTO v_group_id, v_group_name FROM school_groups LIMIT 1;
  
  IF v_group_id IS NULL THEN
    RAISE WARNING '❌ Aucun groupe à diagnostiquer';
    RETURN;
  END IF;
  
  RAISE NOTICE '🔍 Diagnostic pour le groupe : %', v_group_name;
  RAISE NOTICE '';
  
  -- Vérifier l'abonnement
  SELECT 
    sgs.plan_id,
    sp.name
  INTO v_plan_id, v_plan_name
  FROM school_group_subscriptions sgs
  JOIN subscription_plans sp ON sp.id = sgs.plan_id
  WHERE sgs.school_group_id = v_group_id
    AND sgs.status = 'active'
  LIMIT 1;
  
  IF v_plan_id IS NULL THEN
    RAISE WARNING '❌ PROBLÈME : Pas d''abonnement actif pour ce groupe';
    RAISE NOTICE '   → Solution : Créer un abonnement actif';
    RAISE NOTICE '';
    RAISE NOTICE '   Exemple SQL :';
    RAISE NOTICE '   INSERT INTO school_group_subscriptions (school_group_id, plan_id, status, start_date, end_date, billing_cycle)';
    RAISE NOTICE '   VALUES (''%'', (SELECT id FROM subscription_plans WHERE slug = ''premium''), ''active'', NOW(), NOW() + INTERVAL ''1 year'', ''monthly'');', v_group_id;
    RETURN;
  END IF;
  
  RAISE NOTICE '✅ Abonnement actif trouvé : %', v_plan_name;
  
  -- Vérifier les modules du plan
  SELECT COUNT(*) INTO v_modules_in_plan
  FROM plan_modules
  WHERE plan_id = v_plan_id;
  
  RAISE NOTICE '📦 Modules assignés au plan : %', v_modules_in_plan;
  
  IF v_modules_in_plan = 0 THEN
    RAISE WARNING '❌ PROBLÈME CRITIQUE : Le plan "%" n''a aucun module assigné !', v_plan_name;
    RAISE NOTICE '   → Solution : Modifier le plan via /dashboard/plans';
    RAISE NOTICE '   → Ou exécuter :';
    RAISE NOTICE '   INSERT INTO plan_modules (plan_id, module_id)';
    RAISE NOTICE '   SELECT ''%'', id FROM modules WHERE status = ''active'' LIMIT 10;', v_plan_id;
  END IF;
  
  -- Vérifier les catégories du plan
  SELECT COUNT(*) INTO v_categories_in_plan
  FROM plan_categories
  WHERE plan_id = v_plan_id;
  
  RAISE NOTICE '📂 Catégories assignées au plan : %', v_categories_in_plan;
  
  IF v_categories_in_plan = 0 THEN
    RAISE WARNING '❌ PROBLÈME CRITIQUE : Le plan "%" n''a aucune catégorie assignée !', v_plan_name;
    RAISE NOTICE '   → Solution : Modifier le plan via /dashboard/plans';
    RAISE NOTICE '   → Ou exécuter :';
    RAISE NOTICE '   INSERT INTO plan_categories (plan_id, category_id)';
    RAISE NOTICE '   SELECT ''%'', id FROM business_categories WHERE status = ''active'' LIMIT 5;', v_plan_id;
  END IF;
  
  RAISE NOTICE '';
  
  -- Résumé
  IF v_modules_in_plan > 0 AND v_categories_in_plan > 0 THEN
    RAISE NOTICE '✅ TOUT EST OK ! Le groupe devrait voir ses modules.';
    RAISE NOTICE '   Si ce n''est pas le cas, vérifiez les logs de la console navigateur.';
  ELSE
    RAISE WARNING '⚠️ ACTION REQUISE : Assignez des modules et catégories au plan "%"', v_plan_name;
  END IF;
  
  RAISE NOTICE '';
END $$;

-- =====================================================
-- RÉSUMÉ FINAL
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RÉSUMÉ DU DIAGNOSTIC';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Si "Aucun module trouvé", le problème est probablement :';
  RAISE NOTICE '';
  RAISE NOTICE '1️⃣ Pas d''abonnement actif → Créer un abonnement';
  RAISE NOTICE '2️⃣ Plan sans modules → Modifier le plan et assigner des modules';
  RAISE NOTICE '3️⃣ Plan sans catégories → Modifier le plan et assigner des catégories';
  RAISE NOTICE '';
  RAISE NOTICE 'Consultez les logs ci-dessus pour identifier le problème exact.';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

/**
 * DIAGNOSTIC RAPIDE - Plans, Modules & Catégories
 * Identifie rapidement pourquoi les modules/catégories ne s'affichent pas
 * 
 * Exécution : Copier-coller dans Supabase SQL Editor
 * Temps : ~5 secondes
 */

-- ============================================
-- PARTIE 1 : VÉRIFICATION DES TABLES
-- ============================================

DO $$
DECLARE
  v_plans_count INTEGER;
  v_categories_count INTEGER;
  v_modules_count INTEGER;
  v_plan_categories_count INTEGER;
  v_plan_modules_count INTEGER;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DIAGNOSTIC PLANS & MODULES';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  -- Compter les plans
  SELECT COUNT(*) INTO v_plans_count FROM subscription_plans WHERE is_active = true;
  RAISE NOTICE '📦 Plans actifs : %', v_plans_count;
  
  -- Compter les catégories
  SELECT COUNT(*) INTO v_categories_count FROM business_categories WHERE status = 'active';
  RAISE NOTICE '📂 Catégories actives : %', v_categories_count;
  
  -- Compter les modules
  SELECT COUNT(*) INTO v_modules_count FROM modules WHERE status = 'active';
  RAISE NOTICE '🔧 Modules actifs : %', v_modules_count;
  
  RAISE NOTICE '';
  RAISE NOTICE '--- Tables de liaison ---';
  
  -- Compter les liaisons plan-catégories
  SELECT COUNT(*) INTO v_plan_categories_count FROM plan_categories;
  RAISE NOTICE '🔗 Liaisons plan-catégories : %', v_plan_categories_count;
  
  -- Compter les liaisons plan-modules
  SELECT COUNT(*) INTO v_plan_modules_count FROM plan_modules;
  RAISE NOTICE '🔗 Liaisons plan-modules : %', v_plan_modules_count;
  
  RAISE NOTICE '';
  
  -- Diagnostic
  IF v_plan_categories_count = 0 THEN
    RAISE WARNING '⚠️ PROBLÈME : Aucune catégorie assignée aux plans !';
    RAISE NOTICE '   → Solution : Modifier un plan et assigner des catégories';
  END IF;
  
  IF v_plan_modules_count = 0 THEN
    RAISE WARNING '⚠️ PROBLÈME : Aucun module assigné aux plans !';
    RAISE NOTICE '   → Solution : Modifier un plan et assigner des modules';
  END IF;
  
  IF v_plan_categories_count > 0 AND v_plan_modules_count > 0 THEN
    RAISE NOTICE '✅ Les tables de liaison contiennent des données';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- ============================================
-- PARTIE 2 : DÉTAILS PAR PLAN
-- ============================================

SELECT 
  '📊 DÉTAILS PAR PLAN' as section;

SELECT 
  sp.name as "Plan",
  sp.slug as "Slug",
  sp.price as "Prix",
  COALESCE(cat_count.count, 0) as "Catégories",
  COALESCE(mod_count.count, 0) as "Modules",
  CASE 
    WHEN COALESCE(cat_count.count, 0) = 0 THEN '❌ Aucune catégorie'
    WHEN COALESCE(mod_count.count, 0) = 0 THEN '❌ Aucun module'
    ELSE '✅ OK'
  END as "Statut"
FROM subscription_plans sp
LEFT JOIN (
  SELECT plan_id, COUNT(*) as count
  FROM plan_categories
  GROUP BY plan_id
) cat_count ON cat_count.plan_id = sp.id
LEFT JOIN (
  SELECT plan_id, COUNT(*) as count
  FROM plan_modules
  GROUP BY plan_id
) mod_count ON mod_count.plan_id = sp.id
WHERE sp.is_active = true
ORDER BY sp.price ASC;

-- ============================================
-- PARTIE 3 : VÉRIFICATION FOREIGN KEYS
-- ============================================

SELECT 
  '🔗 FOREIGN KEYS - plan_categories' as section;

SELECT
  tc.constraint_name as "Contrainte",
  kcu.column_name as "Colonne",
  ccu.table_name as "Table référencée",
  ccu.column_name as "Colonne référencée"
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'plan_categories';

SELECT 
  '🔗 FOREIGN KEYS - plan_modules' as section;

SELECT
  tc.constraint_name as "Contrainte",
  kcu.column_name as "Colonne",
  ccu.table_name as "Table référencée",
  ccu.column_name as "Colonne référencée"
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'plan_modules';

-- ============================================
-- PARTIE 4 : EXEMPLE DE DONNÉES
-- ============================================

SELECT 
  '📋 EXEMPLE - Catégories assignées' as section;

SELECT 
  sp.name as "Plan",
  bc.name as "Catégorie",
  bc.icon as "Icône",
  bc.color as "Couleur"
FROM plan_categories pc
JOIN subscription_plans sp ON sp.id = pc.plan_id
JOIN business_categories bc ON bc.id = pc.category_id
LIMIT 10;

SELECT 
  '📋 EXEMPLE - Modules assignés' as section;

SELECT 
  sp.name as "Plan",
  m.name as "Module",
  m.is_core as "Core",
  m.is_premium as "Premium"
FROM plan_modules pm
JOIN subscription_plans sp ON sp.id = pm.plan_id
JOIN modules m ON m.id = pm.module_id
LIMIT 10;

-- ============================================
-- PARTIE 5 : VÉRIFICATION RLS
-- ============================================

SELECT 
  '🔒 POLICIES RLS - plan_categories' as section;

SELECT
  schemaname as "Schema",
  tablename as "Table",
  policyname as "Policy",
  permissive as "Permissive",
  roles as "Roles",
  cmd as "Command"
FROM pg_policies
WHERE tablename = 'plan_categories';

SELECT 
  '🔒 POLICIES RLS - plan_modules' as section;

SELECT
  schemaname as "Schema",
  tablename as "Table",
  policyname as "Policy",
  permissive as "Permissive",
  roles as "Roles",
  cmd as "Command"
FROM pg_policies
WHERE tablename = 'plan_modules';

-- ============================================
-- PARTIE 6 : RECOMMANDATIONS
-- ============================================

DO $$
DECLARE
  v_plan_categories_count INTEGER;
  v_plan_modules_count INTEGER;
  v_fk_count INTEGER;
  v_policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_plan_categories_count FROM plan_categories;
  SELECT COUNT(*) INTO v_plan_modules_count FROM plan_modules;
  
  SELECT COUNT(*) INTO v_fk_count
  FROM information_schema.table_constraints
  WHERE constraint_type = 'FOREIGN KEY'
    AND table_name IN ('plan_categories', 'plan_modules');
  
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE tablename IN ('plan_categories', 'plan_modules');
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RECOMMANDATIONS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  IF v_plan_categories_count = 0 OR v_plan_modules_count = 0 THEN
    RAISE NOTICE '🎯 ACTION REQUISE :';
    RAISE NOTICE '';
    RAISE NOTICE '1. Aller sur /dashboard/plans';
    RAISE NOTICE '2. Cliquer "Modifier" sur un plan';
    RAISE NOTICE '3. Onglet "Modules & Catégories"';
    RAISE NOTICE '4. Sélectionner catégories et modules';
    RAISE NOTICE '5. Cliquer "Enregistrer"';
    RAISE NOTICE '';
  END IF;
  
  IF v_fk_count < 4 THEN
    RAISE WARNING '⚠️ Foreign keys manquantes !';
    RAISE NOTICE '   → Exécuter le script de création des tables';
  END IF;
  
  IF v_policy_count < 2 THEN
    RAISE WARNING '⚠️ Policies RLS manquantes !';
    RAISE NOTICE '   → Activer RLS et créer les policies';
  END IF;
  
  IF v_plan_categories_count > 0 AND v_plan_modules_count > 0 AND v_fk_count >= 4 THEN
    RAISE NOTICE '✅ Configuration correcte !';
    RAISE NOTICE '';
    RAISE NOTICE 'Si les modules/catégories ne s''affichent toujours pas :';
    RAISE NOTICE '1. Ouvrir la console navigateur (F12)';
    RAISE NOTICE '2. Chercher les logs : "📊 Plans avec contenu récupérés"';
    RAISE NOTICE '3. Vérifier les erreurs Supabase';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FIN DU DIAGNOSTIC';
  RAISE NOTICE '========================================';
END $$;

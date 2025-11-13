-- =====================================================
-- VÉRIFICATION : TABLES PLANS
-- =====================================================
-- Vérifie si "plans" et "subscription_plans" existent
-- et laquelle contient les données
-- =====================================================

-- 1. Vérifier l'existence des tables
SELECT 
  '1. TABLES EXISTANTES' as section,
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as nb_colonnes
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('plans', 'subscription_plans')
ORDER BY table_name;

-- 2. Compter les enregistrements
SELECT '2. NOMBRE DE PLANS' as section;

-- Si "plans" existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'plans') THEN
    RAISE NOTICE '✅ Table "plans" existe avec % enregistrements', (SELECT COUNT(*) FROM plans);
  ELSE
    RAISE NOTICE '⚠️  Table "plans" n''existe PAS';
  END IF;
END $$;

-- Si "subscription_plans" existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_plans') THEN
    RAISE NOTICE '✅ Table "subscription_plans" existe avec % enregistrements', (SELECT COUNT(*) FROM subscription_plans);
  ELSE
    RAISE NOTICE '⚠️  Table "subscription_plans" n''existe PAS';
  END IF;
END $$;

-- 3. Comparer les structures
SELECT 
  '3. STRUCTURE "plans"' as section,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'plans'
  AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
  '3. STRUCTURE "subscription_plans"' as section,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'subscription_plans'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Vérifier les foreign keys
SELECT 
  '4. FOREIGN KEYS VERS PLANS' as section,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name IN ('plans', 'subscription_plans')
ORDER BY tc.table_name;

-- 5. Afficher les plans existants
SELECT 
  '5. PLANS DANS "subscription_plans"' as section,
  id,
  name,
  slug,
  price,
  billing_period,
  status
FROM subscription_plans
ORDER BY price;

-- 6. Test jointure school_group_subscriptions
SELECT 
  '6. TEST JOINTURE' as section,
  'subscription_plans' as table_utilisee,
  COUNT(*) as total_subscriptions,
  COUNT(sp.id) as avec_plan,
  COUNT(*) - COUNT(sp.id) as sans_plan
FROM school_group_subscriptions s
LEFT JOIN subscription_plans sp ON s.plan_id = sp.id;

-- 7. Recommandation
DO $$
DECLARE
  has_plans BOOLEAN;
  has_subscription_plans BOOLEAN;
  plans_count INT;
  subscription_plans_count INT;
BEGIN
  -- Vérifier existence
  has_plans := EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'plans');
  has_subscription_plans := EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_plans');
  
  IF has_subscription_plans THEN
    SELECT COUNT(*) INTO subscription_plans_count FROM subscription_plans;
    RAISE NOTICE '✅ RECOMMANDATION : Utiliser "subscription_plans" (% plans)', subscription_plans_count;
    RAISE NOTICE '   → Exécuter : FIX_FINANCIAL_STATS_CORRECT.sql';
  ELSIF has_plans THEN
    SELECT COUNT(*) INTO plans_count FROM plans;
    RAISE NOTICE '✅ RECOMMANDATION : Utiliser "plans" (% plans)', plans_count;
    RAISE NOTICE '   → Modifier la vue pour utiliser "plans"';
  ELSE
    RAISE NOTICE '❌ ERREUR : Aucune table de plans trouvée !';
  END IF;
END $$;

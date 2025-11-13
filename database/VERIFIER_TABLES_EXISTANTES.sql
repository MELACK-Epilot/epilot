-- ============================================
-- VÉRIFICATION DES TABLES EXISTANTES
-- ============================================
-- Objectif: Vérifier quelles tables existent déjà
-- ============================================

-- 1️⃣ Lister toutes les tables de la base
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2️⃣ Vérifier les tables critiques
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
    THEN '✅ users existe'
    ELSE '❌ users manquante'
  END as users_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') 
    THEN '✅ categories existe'
    ELSE '❌ categories manquante'
  END as categories_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'modules') 
    THEN '✅ modules existe'
    ELSE '❌ modules manquante'
  END as modules_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_plans') 
    THEN '✅ subscription_plans existe'
    ELSE '❌ subscription_plans manquante'
  END as plans_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'school_groups') 
    THEN '✅ school_groups existe'
    ELSE '❌ school_groups manquante'
  END as groups_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schools') 
    THEN '✅ schools existe'
    ELSE '❌ schools manquante'
  END as schools_status;

-- 3️⃣ Compter les lignes dans chaque table (si elle existe)
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  -- Categories
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN
    SELECT COUNT(*) INTO table_count FROM categories;
    RAISE NOTICE 'categories: % lignes', table_count;
  ELSE
    RAISE NOTICE 'categories: TABLE N''EXISTE PAS';
  END IF;
  
  -- Modules
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'modules') THEN
    SELECT COUNT(*) INTO table_count FROM modules;
    RAISE NOTICE 'modules: % lignes', table_count;
  ELSE
    RAISE NOTICE 'modules: TABLE N''EXISTE PAS';
  END IF;
  
  -- Subscription Plans
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_plans') THEN
    SELECT COUNT(*) INTO table_count FROM subscription_plans;
    RAISE NOTICE 'subscription_plans: % lignes', table_count;
  ELSE
    RAISE NOTICE 'subscription_plans: TABLE N''EXISTE PAS';
  END IF;
END $$;

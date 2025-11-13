-- Vérification des tables existantes pour les modules
-- À exécuter en premier pour identifier les vrais noms

-- 1. Lister toutes les tables contenant "module"
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%module%'
ORDER BY table_name;

-- 2. Lister toutes les tables contenant "categor"
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%categor%'
ORDER BY table_name;

-- 3. Lister toutes les tables principales
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'modules', 'business_modules',
  'categories', 'business_categories', 
  'module_categories',
  'group_module_configs',
  'plan_modules',
  'school_groups',
  'plans',
  'users'
)
ORDER BY table_name;

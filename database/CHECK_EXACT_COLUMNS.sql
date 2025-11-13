-- Vérification exacte des colonnes dans les tables critiques

-- 1. Colonnes de la table users
SELECT 
  'users' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- 2. Colonnes de la table school_groups  
SELECT 
  'school_groups' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'school_groups'
ORDER BY ordinal_position;

-- 3. Colonnes de la table group_module_configs
SELECT 
  'group_module_configs' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'group_module_configs'
ORDER BY ordinal_position;

-- 4. Vérifier les noms exacts des colonnes de relation
SELECT 
  t.table_name,
  c.column_name,
  c.data_type
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
AND t.table_name IN ('users', 'school_groups')
AND c.column_name LIKE '%group%'
ORDER BY t.table_name, c.column_name;

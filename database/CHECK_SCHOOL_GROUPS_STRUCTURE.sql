-- =====================================================
-- VÉRIFICATION : Structure de school_groups
-- =====================================================

-- Vérifier le type de la colonne 'plan'
SELECT 
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'school_groups'
  AND column_name = 'plan';

-- Vérifier si c'est un ENUM
SELECT 
  t.typname AS enum_name,
  e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname LIKE '%plan%'
ORDER BY e.enumsortorder;

-- Voir quelques exemples de données
SELECT 
  id,
  name,
  code,
  plan,
  pg_typeof(plan) AS type_de_plan
FROM school_groups
LIMIT 5;

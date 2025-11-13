-- =====================================================
-- VÉRIFICATION : Structure des tables
-- =====================================================

-- 1. Vérifier quelle table existe : plans OU subscription_plans ?
SELECT 
  table_name,
  'Existe' AS status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('plans', 'subscription_plans')
ORDER BY table_name;

-- 2. Structure de la table subscriptions
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'subscriptions'
ORDER BY ordinal_position;

-- 3. Vérifier les foreign keys de subscriptions
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'subscriptions'
  AND tc.constraint_type = 'FOREIGN KEY';

-- 4. Si la table 'plans' existe, voir sa structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'plans'
ORDER BY ordinal_position;

-- 5. Compter les données
SELECT 'plans' AS table_name, COUNT(*) AS count FROM plans
UNION ALL
SELECT 'subscription_plans' AS table_name, COUNT(*) FROM subscription_plans
UNION ALL
SELECT 'subscriptions' AS table_name, COUNT(*) FROM subscriptions;

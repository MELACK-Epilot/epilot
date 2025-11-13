-- ============================================================================
-- VÉRIFIER LES VALEURS DE STATUS DANS LA TABLE SUBSCRIPTIONS
-- ============================================================================

-- 1. Vérifier la structure de la table subscriptions
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_name = 'subscriptions' 
  AND column_name = 'status';

-- 2. Si c'est un ENUM, lister les valeurs possibles
SELECT 
  t.typname AS enum_name,
  e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'subscription_status'
ORDER BY e.enumsortorder;

-- 3. Lister les valeurs uniques actuellement dans la table
SELECT DISTINCT status, COUNT(*) as count
FROM subscriptions
GROUP BY status
ORDER BY count DESC;

-- 4. Vérifier si la table school_group_subscriptions existe (alternative)
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_name = 'school_group_subscriptions' 
  AND column_name = 'status';

-- 5. Si c'est un ENUM, lister les valeurs possibles
SELECT 
  t.typname AS enum_name,
  e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname LIKE '%subscription%status%'
ORDER BY t.typname, e.enumsortorder;

-- 6. Lister les valeurs uniques dans school_group_subscriptions
SELECT DISTINCT status, COUNT(*) as count
FROM school_group_subscriptions
GROUP BY status
ORDER BY count DESC;

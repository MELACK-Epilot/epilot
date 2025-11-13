-- =====================================================
-- VÉRIFICATION : COLONNES DE school_group_subscriptions
-- =====================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'school_group_subscriptions'
  AND table_schema = 'public'
ORDER BY ordinal_position;

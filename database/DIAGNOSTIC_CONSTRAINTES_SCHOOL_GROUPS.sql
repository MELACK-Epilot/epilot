-- =====================================================
-- DIAGNOSTIC : Contraintes sur la table school_groups
-- Date : 30 octobre 2025
-- =====================================================

-- 1. Lister toutes les contraintes sur school_groups
SELECT
  tc.constraint_name,
  tc.constraint_type,
  tc.table_name,
  kcu.column_name,
  pg_get_constraintdef(tc.oid) as constraint_definition
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'school_groups'
ORDER BY tc.constraint_name;

-- 2. Vérifier spécifiquement la contrainte check_website_format
SELECT
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conname = 'check_website_format';

-- 3. Voir les données actuelles qui pourraient poser problème
SELECT id, name, website, status
FROM school_groups
WHERE website IS NOT NULL
  AND website != ''
  AND (website NOT LIKE 'http://%' AND website NOT LIKE 'https://%');

-- 4. Voir tous les groupes pour diagnostiquer
SELECT id, name, website, status, updated_at
FROM school_groups
ORDER BY updated_at DESC
LIMIT 10;

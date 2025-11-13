-- ============================================================================
-- DIAGNOSTIC RLS - IDENTIFIER LES PROBLÈMES
-- ============================================================================
-- Exécuter ce script pour diagnostiquer les problèmes de sécurité
-- ============================================================================

-- 1. Vérifier si le bucket existe
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'school-logos';

-- 2. Vérifier les politiques Storage
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%school%'
ORDER BY policyname;

-- 3. Vérifier si RLS est activé sur la table schools
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'schools';

-- 4. Vérifier les politiques de la table schools
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'schools'
ORDER BY policyname;

-- 5. Vérifier les colonnes de la table schools
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'schools'
  AND column_name IN ('logo_url', 'departement', 'city', 'commune', 'code_postal', 'couleur_principale')
ORDER BY column_name;

-- 6. Vérifier les contraintes sur la table schools
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.schools'::regclass
ORDER BY conname;

-- ============================================================================
-- INTERPRÉTATION DES RÉSULTATS
-- ============================================================================
-- 
-- BUCKET :
-- - Si public = false → Les fichiers ne sont pas accessibles publiquement
-- - Si file_size_limit = 2097152 → Limite de 2 MB OK
-- 
-- POLITIQUES STORAGE :
-- - Il doit y avoir au moins 1 politique INSERT pour authenticated
-- - Si aucune politique → RLS bloque tout
-- 
-- TABLE SCHOOLS :
-- - Si rowsecurity = true → RLS est activé
-- - Il doit y avoir des politiques INSERT pour authenticated
-- - Si aucune politique → RLS bloque tout
-- 
-- COLONNES :
-- - Toutes les nouvelles colonnes doivent exister
-- - Si manquantes → Erreur 400 lors de l'insertion
-- 
-- ============================================================================

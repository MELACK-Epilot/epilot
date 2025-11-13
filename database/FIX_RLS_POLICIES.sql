-- ============================================================================
-- CORRECTION DES POLITIQUES RLS - STORAGE ET TABLE SCHOOLS
-- ============================================================================
-- Ce script corrige les politiques de sécurité pour permettre l'upload et l'insertion
-- ============================================================================

-- ============================================================================
-- PARTIE 1 : DÉSACTIVER TEMPORAIREMENT RLS SUR LE BUCKET (POUR TEST)
-- ============================================================================

-- Option 1 : Désactiver RLS sur le bucket storage (TEMPORAIRE - DÉVELOPPEMENT UNIQUEMENT)
UPDATE storage.buckets 
SET public = true 
WHERE id = 'school-logos';

-- ============================================================================
-- PARTIE 2 : POLITIQUES STORAGE PLUS PERMISSIVES
-- ============================================================================

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Public Access - Read school logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload school logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update school logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete school logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own school logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own school logos" ON storage.objects;

-- Créer des politiques plus permissives pour le développement
CREATE POLICY "Allow public read access to school logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'school-logos');

CREATE POLICY "Allow authenticated insert to school logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'school-logos');

CREATE POLICY "Allow authenticated update to school logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'school-logos');

CREATE POLICY "Allow authenticated delete to school logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'school-logos');

-- ============================================================================
-- PARTIE 3 : VÉRIFIER RLS SUR LA TABLE SCHOOLS
-- ============================================================================

-- Vérifier si RLS est activé sur la table schools
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'schools';

-- Si RLS est activé, créer/mettre à jour les politiques
DO $$
BEGIN
  -- Supprimer les anciennes politiques si elles existent
  DROP POLICY IF EXISTS "Enable read access for authenticated users" ON schools;
  DROP POLICY IF EXISTS "Enable insert for authenticated users" ON schools;
  DROP POLICY IF EXISTS "Enable update for authenticated users" ON schools;
  DROP POLICY IF EXISTS "Enable delete for authenticated users" ON schools;
  
  -- Créer des politiques permissives pour le développement
  CREATE POLICY "Enable read access for authenticated users"
  ON schools FOR SELECT
  TO authenticated
  USING (true);
  
  CREATE POLICY "Enable insert for authenticated users"
  ON schools FOR INSERT
  TO authenticated
  WITH CHECK (true);
  
  CREATE POLICY "Enable update for authenticated users"
  ON schools FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
  
  CREATE POLICY "Enable delete for authenticated users"
  ON schools FOR DELETE
  TO authenticated
  USING (true);
END $$;

-- ============================================================================
-- PARTIE 4 : ALTERNATIVE - DÉSACTIVER RLS TEMPORAIREMENT (DÉVELOPPEMENT)
-- ============================================================================

-- Si les politiques ne fonctionnent toujours pas, désactiver RLS temporairement
-- ATTENTION : À utiliser uniquement en développement !
-- ALTER TABLE schools DISABLE ROW LEVEL SECURITY;

-- Pour réactiver plus tard :
-- ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VÉRIFICATION FINALE
-- ============================================================================

-- Vérifier les politiques Storage
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
ORDER BY policyname;

-- Vérifier les politiques Schools
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'schools'
  AND schemaname = 'public'
ORDER BY policyname;

-- Vérifier le statut RLS
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('schools', 'objects')
ORDER BY tablename;

-- ============================================================================
-- RÉSULTAT ATTENDU
-- ============================================================================
-- 
-- ✅ Bucket school-logos : public = true
-- ✅ 4 politiques Storage créées (read, insert, update, delete)
-- ✅ 4 politiques Schools créées (select, insert, update, delete)
-- ✅ Toutes les politiques permettent l'accès aux utilisateurs authentifiés
-- 
-- ============================================================================

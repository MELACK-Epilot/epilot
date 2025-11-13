-- ============================================================================
-- CONFIGURATION BUCKET AVATARS - SUPABASE STORAGE
-- ============================================================================
-- Ce script configure le bucket pour les avatars des utilisateurs
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1 : CRÉER LE BUCKET AVATARS (SI N'EXISTE PAS)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true, -- Public pour permettre l'affichage des avatars
  2097152, -- 2 MB max
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']::text[];

-- ============================================================================
-- ÉTAPE 2 : SUPPRIMER LES ANCIENNES POLITIQUES
-- ============================================================================

DROP POLICY IF EXISTS "Public Access - Read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated insert to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete to avatars" ON storage.objects;

-- ============================================================================
-- ÉTAPE 3 : CRÉER LES POLITIQUES RLS POUR LE BUCKET AVATARS
-- ============================================================================

-- Politique 1 : Lecture publique (pour afficher les avatars)
CREATE POLICY "Allow public read access to avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Politique 2 : Upload pour utilisateurs authentifiés
CREATE POLICY "Allow authenticated insert to avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Politique 3 : Mise à jour pour utilisateurs authentifiés
CREATE POLICY "Allow authenticated update to avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

-- Politique 4 : Suppression pour utilisateurs authentifiés
CREATE POLICY "Allow authenticated delete to avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

-- ============================================================================
-- ÉTAPE 4 : VÉRIFIER LA CONFIGURATION
-- ============================================================================

-- Vérifier le bucket
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'avatars';

-- Vérifier les politiques
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%avatar%'
ORDER BY policyname;

-- ============================================================================
-- RÉSULTAT ATTENDU
-- ============================================================================
-- 
-- BUCKET :
-- ✅ id: avatars
-- ✅ public: true
-- ✅ file_size_limit: 2097152 (2 MB)
-- ✅ allowed_mime_types: image/jpeg, image/jpg, image/png, image/webp, image/gif
-- 
-- POLITIQUES :
-- ✅ Allow public read access to avatars (SELECT)
-- ✅ Allow authenticated insert to avatars (INSERT)
-- ✅ Allow authenticated update to avatars (UPDATE)
-- ✅ Allow authenticated delete to avatars (DELETE)
-- 
-- ============================================================================

-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================
-- 
-- 1. Le bucket est PUBLIC pour permettre l'affichage des avatars sans authentification
-- 2. Seuls les utilisateurs authentifiés peuvent upload/modifier/supprimer
-- 3. Limite de 2 MB par fichier
-- 4. Formats acceptés : JPEG, JPG, PNG, WebP, GIF
-- 
-- ============================================================================

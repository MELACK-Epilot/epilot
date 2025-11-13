-- ============================================
-- Créer le bucket Supabase Storage pour les logos d'écoles
-- E-Pilot Congo - Gestion des Écoles
-- ============================================

-- 1. Créer le bucket 'school-logos' (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'school-logos', 
  'school-logos', 
  true,
  2097152, -- 2 MB max
  ARRAY['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Politique : Lecture publique
CREATE POLICY "Public Access - Read school logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'school-logos');

-- 3. Politique : Upload (utilisateurs authentifiés uniquement)
CREATE POLICY "Authenticated users can upload school logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'school-logos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Politique : Mise à jour (propriétaire uniquement)
CREATE POLICY "Users can update own school logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'school-logos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Politique : Suppression (propriétaire uniquement)
CREATE POLICY "Users can delete own school logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'school-logos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. Vérification
SELECT * FROM storage.buckets WHERE id = 'school-logos';

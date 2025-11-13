-- ============================================================================
-- SETUP COMPLET FORMULAIRE ÉCOLES
-- ============================================================================
-- Script tout-en-un pour configurer la base de données
-- Exécuter ce script UNIQUE dans Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1 : AJOUTER LES COLONNES MANQUANTES À LA TABLE SCHOOLS
-- ============================================================================

-- Logo de l'école
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Couleur principale
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS couleur_principale VARCHAR(7) 
DEFAULT '#1D3557' 
CHECK (couleur_principale ~ '^#[0-9A-Fa-f]{6}$');

-- Localisation Congo-Brazzaville
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS departement VARCHAR(50),
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS commune VARCHAR(100),
ADD COLUMN IF NOT EXISTS code_postal VARCHAR(10);

-- ============================================================================
-- ÉTAPE 2 : CRÉER LES INDEX POUR PERFORMANCES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_schools_departement ON schools(departement);
CREATE INDEX IF NOT EXISTS idx_schools_city ON schools(city);
CREATE INDEX IF NOT EXISTS idx_schools_couleur ON schools(couleur_principale);

-- ============================================================================
-- ÉTAPE 3 : CRÉER LE BUCKET SUPABASE STORAGE POUR LES LOGOS
-- ============================================================================

-- Créer le bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'school-logos',
  'school-logos',
  true,
  2097152, -- 2 MB max
  ARRAY['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ÉTAPE 4 : CONFIGURER LES POLITIQUES D'ACCÈS STORAGE
-- ============================================================================

-- Politique 1 : Lecture publique des logos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public Access - Read school logos'
  ) THEN
    CREATE POLICY "Public Access - Read school logos"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'school-logos');
  END IF;
END $$;

-- Politique 2 : Upload pour utilisateurs authentifiés
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload school logos'
  ) THEN
    CREATE POLICY "Authenticated users can upload school logos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'school-logos');
  END IF;
END $$;

-- Politique 3 : Mise à jour pour utilisateurs authentifiés
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can update school logos'
  ) THEN
    CREATE POLICY "Authenticated users can update school logos"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'school-logos');
  END IF;
END $$;

-- Politique 4 : Suppression pour utilisateurs authentifiés
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can delete school logos'
  ) THEN
    CREATE POLICY "Authenticated users can delete school logos"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'school-logos');
  END IF;
END $$;

-- ============================================================================
-- ÉTAPE 5 : METTRE À JOUR LES ÉCOLES EXISTANTES AVEC COULEURS
-- ============================================================================

UPDATE schools
SET couleur_principale = (
  CASE (hashtext(id::text) % 10)
    WHEN 0 THEN '#1D3557'  -- Bleu E-Pilot
    WHEN 1 THEN '#2A9D8F'  -- Vert E-Pilot
    WHEN 2 THEN '#E9C46A'  -- Or E-Pilot
    WHEN 3 THEN '#E63946'  -- Rouge
    WHEN 4 THEN '#3B82F6'  -- Bleu Ciel
    WHEN 5 THEN '#10B981'  -- Vert Forêt
    WHEN 6 THEN '#8B5CF6'  -- Violet
    WHEN 7 THEN '#F59E0B'  -- Orange
    WHEN 8 THEN '#EC4899'  -- Rose
    ELSE '#6366F1'         -- Indigo
  END
)
WHERE couleur_principale IS NULL OR couleur_principale = '#1D3557';

-- ============================================================================
-- ÉTAPE 6 : AJOUTER DES COMMENTAIRES SUR LES COLONNES
-- ============================================================================

COMMENT ON COLUMN schools.logo_url IS 'URL du logo de l''école (Supabase Storage bucket: school-logos)';
COMMENT ON COLUMN schools.couleur_principale IS 'Couleur principale de l''école (format hex #RRGGBB)';
COMMENT ON COLUMN schools.departement IS 'Département du Congo-Brazzaville (12 départements)';
COMMENT ON COLUMN schools.city IS 'Ville de l''école (40+ villes)';
COMMENT ON COLUMN schools.commune IS 'Commune ou quartier de l''école';
COMMENT ON COLUMN schools.code_postal IS 'Code postal (optionnel)';

-- ============================================================================
-- ÉTAPE 7 : VÉRIFICATION FINALE
-- ============================================================================

-- Vérifier les colonnes ajoutées
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'schools'
  AND column_name IN ('logo_url', 'couleur_principale', 'departement', 'city', 'commune', 'code_postal')
ORDER BY column_name;

-- Vérifier le bucket créé
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'school-logos';

-- Vérifier les politiques Storage
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%school logos%';

-- ============================================================================
-- RÉSULTAT ATTENDU
-- ============================================================================
-- 
-- ✅ COLONNES AJOUTÉES :
-- - logo_url          | text         | YES | NULL
-- - couleur_principale| varchar(7)   | YES | '#1D3557'
-- - departement       | varchar(50)  | YES | NULL
-- - city              | varchar(100) | YES | NULL
-- - commune           | varchar(100) | YES | NULL
-- - code_postal       | varchar(10)  | YES | NULL
--
-- ✅ BUCKET CRÉÉ :
-- - id: school-logos
-- - public: true
-- - file_size_limit: 2097152 (2 MB)
-- - allowed_mime_types: {image/jpeg, image/png, image/svg+xml, image/webp}
--
-- ✅ POLITIQUES CRÉÉES :
-- - Public Access - Read school logos (SELECT)
-- - Authenticated users can upload school logos (INSERT)
-- - Authenticated users can update school logos (UPDATE)
-- - Authenticated users can delete school logos (DELETE)
--
-- ============================================================================
-- 🎉 SETUP TERMINÉ ! Le formulaire est maintenant prêt à fonctionner.
-- ============================================================================

-- Afficher un message de succès
DO $$
BEGIN
  RAISE NOTICE '✅ Setup formulaire écoles terminé avec succès !';
  RAISE NOTICE '📋 Colonnes ajoutées : logo_url, couleur_principale, departement, city, commune, code_postal';
  RAISE NOTICE '🗂️ Bucket créé : school-logos (2 MB max, PNG/JPG/SVG/WebP)';
  RAISE NOTICE '🔐 Politiques configurées : lecture publique, upload authentifié';
  RAISE NOTICE '🎨 Couleurs assignées aux écoles existantes';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Vous pouvez maintenant utiliser le formulaire de création d''écoles !';
END $$;

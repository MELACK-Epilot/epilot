-- ============================================================================
-- MISE À JOUR TABLE SCHOOLS - Ajout colonnes manquantes
-- ============================================================================
-- Ce script ajoute toutes les colonnes nécessaires pour le formulaire amélioré
-- Exécuter ce script dans Supabase SQL Editor
-- ============================================================================

-- 1. Ajouter la colonne logo_url
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 2. Ajouter la colonne couleur_principale
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS couleur_principale VARCHAR(7) 
DEFAULT '#1D3557' 
CHECK (couleur_principale ~ '^#[0-9A-Fa-f]{6}$');

-- 3. Ajouter les colonnes de localisation
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS departement VARCHAR(50),
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS commune VARCHAR(100),
ADD COLUMN IF NOT EXISTS code_postal VARCHAR(10);

-- 4. Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_schools_departement ON schools(departement);
CREATE INDEX IF NOT EXISTS idx_schools_city ON schools(city);
CREATE INDEX IF NOT EXISTS idx_schools_couleur ON schools(couleur_principale);

-- 5. Mettre à jour les écoles existantes avec une couleur par défaut
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

-- 6. Commentaires sur les colonnes
COMMENT ON COLUMN schools.logo_url IS 'URL du logo de l''école (Supabase Storage)';
COMMENT ON COLUMN schools.couleur_principale IS 'Couleur principale de l''école (format hex #RRGGBB)';
COMMENT ON COLUMN schools.departement IS 'Département du Congo-Brazzaville (12 départements)';
COMMENT ON COLUMN schools.city IS 'Ville de l''école';
COMMENT ON COLUMN schools.commune IS 'Commune ou quartier';
COMMENT ON COLUMN schools.code_postal IS 'Code postal (optionnel)';

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================
-- Vérifier que toutes les colonnes ont été ajoutées
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'schools'
  AND column_name IN ('logo_url', 'couleur_principale', 'departement', 'city', 'commune', 'code_postal')
ORDER BY column_name;

-- ============================================================================
-- RÉSULTAT ATTENDU
-- ============================================================================
-- ✅ logo_url          | text         | YES | NULL
-- ✅ couleur_principale| varchar(7)   | YES | '#1D3557'
-- ✅ departement       | varchar(50)  | YES | NULL
-- ✅ city              | varchar(100) | YES | NULL
-- ✅ commune           | varchar(100) | YES | NULL
-- ✅ code_postal       | varchar(10)  | YES | NULL
-- ============================================================================

-- =====================================================
-- MIGRATION : Ajout des champs manquants - school_groups
-- Date : 30 octobre 2025
-- Auteur : E-Pilot Congo 🇨🇬
-- =====================================================

-- =====================================================
-- 1. AJOUTER LES COLONNES MANQUANTES
-- =====================================================

ALTER TABLE school_groups
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS founded_year INTEGER,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS logo TEXT;

-- =====================================================
-- 2. AJOUTER LES CONTRAINTES
-- =====================================================

-- Contrainte sur l'année de création
ALTER TABLE school_groups
DROP CONSTRAINT IF EXISTS check_founded_year;

ALTER TABLE school_groups
ADD CONSTRAINT check_founded_year 
  CHECK (founded_year IS NULL OR (founded_year >= 1900 AND founded_year <= EXTRACT(YEAR FROM NOW())));

-- Contrainte sur le format du site web
ALTER TABLE school_groups
DROP CONSTRAINT IF EXISTS check_website_format;

ALTER TABLE school_groups
ADD CONSTRAINT check_website_format 
  CHECK (website IS NULL OR website ~ '^https?://');

-- Contrainte sur le format du téléphone
ALTER TABLE school_groups
DROP CONSTRAINT IF EXISTS check_phone_format;

ALTER TABLE school_groups
ADD CONSTRAINT check_phone_format 
  CHECK (phone IS NULL OR phone ~ '^\+?[0-9\s-]{8,20}$');

-- =====================================================
-- 3. AJOUTER DES INDEX POUR LA RECHERCHE
-- =====================================================

-- Index sur le nom (recherche fréquente)
CREATE INDEX IF NOT EXISTS idx_school_groups_name ON school_groups(name);

-- Index sur le code (recherche fréquente)
CREATE INDEX IF NOT EXISTS idx_school_groups_code ON school_groups(code);

-- Index déjà existants (vérification)
CREATE INDEX IF NOT EXISTS idx_school_groups_region ON school_groups(region);
CREATE INDEX IF NOT EXISTS idx_school_groups_city ON school_groups(city);
CREATE INDEX IF NOT EXISTS idx_school_groups_admin_id ON school_groups(admin_id);
CREATE INDEX IF NOT EXISTS idx_school_groups_plan ON school_groups(plan);
CREATE INDEX IF NOT EXISTS idx_school_groups_status ON school_groups(status);

-- =====================================================
-- 4. AJOUTER DES COMMENTAIRES
-- =====================================================

COMMENT ON COLUMN school_groups.address IS 'Adresse physique du groupe scolaire';
COMMENT ON COLUMN school_groups.phone IS 'Numéro de téléphone principal (format: +242XXXXXXXXX)';
COMMENT ON COLUMN school_groups.website IS 'Site web officiel (doit commencer par http:// ou https://)';
COMMENT ON COLUMN school_groups.founded_year IS 'Année de création du groupe scolaire';
COMMENT ON COLUMN school_groups.description IS 'Description détaillée du groupe scolaire';
COMMENT ON COLUMN school_groups.logo IS 'URL du logo du groupe scolaire (stocké dans Supabase Storage)';

-- =====================================================
-- 5. VÉRIFICATION
-- =====================================================

-- Afficher la structure de la table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'school_groups'
ORDER BY ordinal_position;

-- Compter le nombre de colonnes (devrait être 19)
SELECT COUNT(*) as total_columns
FROM information_schema.columns
WHERE table_name = 'school_groups';

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

-- Résultat attendu : 19 colonnes
-- 1. id (UUID)
-- 2. name (TEXT)
-- 3. code (TEXT)
-- 4. region (TEXT)
-- 5. city (TEXT)
-- 6. address (TEXT) ← NOUVEAU
-- 7. phone (TEXT) ← NOUVEAU
-- 8. website (TEXT) ← NOUVEAU
-- 9. founded_year (INTEGER) ← NOUVEAU
-- 10. description (TEXT) ← NOUVEAU
-- 11. logo (TEXT) ← NOUVEAU
-- 12. admin_id (UUID)
-- 13. school_count (INTEGER)
-- 14. student_count (INTEGER)
-- 15. staff_count (INTEGER)
-- 16. plan (subscription_plan)
-- 17. status (status)
-- 18. created_at (TIMESTAMP WITH TIME ZONE)
-- 19. updated_at (TIMESTAMP WITH TIME ZONE)

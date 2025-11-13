-- ============================================
-- E-PILOT CONGO - CORRECTION TABLE SCHOOL_GROUPS
-- Ajout des colonnes manquantes pour le formulaire
-- ============================================

-- Ajouter les colonnes manquantes à la table school_groups
ALTER TABLE school_groups
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS founded_year INTEGER,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS logo TEXT;

-- Ajouter des contraintes de validation
ALTER TABLE school_groups
ADD CONSTRAINT check_founded_year CHECK (founded_year IS NULL OR (founded_year >= 1900 AND founded_year <= EXTRACT(YEAR FROM CURRENT_DATE)));

-- Ajouter un commentaire
COMMENT ON COLUMN school_groups.address IS 'Adresse complète du groupe scolaire';
COMMENT ON COLUMN school_groups.phone IS 'Numéro de téléphone';
COMMENT ON COLUMN school_groups.website IS 'Site web officiel';
COMMENT ON COLUMN school_groups.founded_year IS 'Année de création';
COMMENT ON COLUMN school_groups.description IS 'Description/Histoire du groupe';
COMMENT ON COLUMN school_groups.logo IS 'Logo du groupe (base64 ou URL)';

-- Rendre admin_id nullable temporairement pour permettre la création
-- (sera rempli automatiquement par le système)
ALTER TABLE school_groups
ALTER COLUMN admin_id DROP NOT NULL;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Table school_groups corrigée avec succès !';
  RAISE NOTICE 'Colonnes ajoutées : address, phone, website, founded_year, description, logo';
  RAISE NOTICE 'Contrainte admin_id rendue nullable';
END $$;

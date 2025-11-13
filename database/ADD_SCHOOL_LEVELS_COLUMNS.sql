-- ============================================================================
-- MIGRATION : Ajout des colonnes de niveaux scolaires à la table schools
-- Date : 7 novembre 2025
-- ============================================================================

-- Vérifier si la table schools existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'schools') THEN
        RAISE EXCEPTION 'La table schools n''existe pas. Veuillez d''abord créer la table.';
    END IF;
END $$;

-- Ajouter les colonnes de niveaux d'enseignement si elles n'existent pas
DO $$ 
BEGIN
    -- Ajouter has_preschool
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'schools' 
        AND column_name = 'has_preschool'
    ) THEN
        ALTER TABLE schools ADD COLUMN has_preschool BOOLEAN DEFAULT false;
        RAISE NOTICE 'Colonne has_preschool ajoutée';
    ELSE
        RAISE NOTICE 'Colonne has_preschool existe déjà';
    END IF;

    -- Ajouter has_primary
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'schools' 
        AND column_name = 'has_primary'
    ) THEN
        ALTER TABLE schools ADD COLUMN has_primary BOOLEAN DEFAULT false;
        RAISE NOTICE 'Colonne has_primary ajoutée';
    ELSE
        RAISE NOTICE 'Colonne has_primary existe déjà';
    END IF;

    -- Ajouter has_middle
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'schools' 
        AND column_name = 'has_middle'
    ) THEN
        ALTER TABLE schools ADD COLUMN has_middle BOOLEAN DEFAULT false;
        RAISE NOTICE 'Colonne has_middle ajoutée';
    ELSE
        RAISE NOTICE 'Colonne has_middle existe déjà';
    END IF;

    -- Ajouter has_high
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'schools' 
        AND column_name = 'has_high'
    ) THEN
        ALTER TABLE schools ADD COLUMN has_high BOOLEAN DEFAULT false;
        RAISE NOTICE 'Colonne has_high ajoutée';
    ELSE
        RAISE NOTICE 'Colonne has_high existe déjà';
    END IF;
END $$;

-- Ajouter la contrainte : au moins un niveau doit être sélectionné
DO $$
BEGIN
    -- Supprimer la contrainte si elle existe déjà
    IF EXISTS (
        SELECT FROM pg_constraint 
        WHERE conname = 'at_least_one_level' 
        AND conrelid = 'schools'::regclass
    ) THEN
        ALTER TABLE schools DROP CONSTRAINT at_least_one_level;
        RAISE NOTICE 'Ancienne contrainte at_least_one_level supprimée';
    END IF;

    -- Ajouter la nouvelle contrainte
    ALTER TABLE schools ADD CONSTRAINT at_least_one_level 
        CHECK (has_preschool OR has_primary OR has_middle OR has_high);
    
    RAISE NOTICE 'Contrainte at_least_one_level ajoutée';
END $$;

-- Mettre à jour les écoles existantes pour avoir au moins le niveau Primaire par défaut
UPDATE schools 
SET has_primary = true 
WHERE NOT (has_preschool OR has_primary OR has_middle OR has_high);

-- Créer des index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_schools_has_preschool ON schools(has_preschool) WHERE has_preschool = true;
CREATE INDEX IF NOT EXISTS idx_schools_has_primary ON schools(has_primary) WHERE has_primary = true;
CREATE INDEX IF NOT EXISTS idx_schools_has_middle ON schools(has_middle) WHERE has_middle = true;
CREATE INDEX IF NOT EXISTS idx_schools_has_high ON schools(has_high) WHERE has_high = true;

-- Rafraîchir le cache du schéma PostgREST (CRITIQUE pour Supabase)
NOTIFY pgrst, 'reload schema';

-- Vérification finale
DO $$
DECLARE
    col_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'schools' 
    AND column_name IN ('has_preschool', 'has_primary', 'has_middle', 'has_high');
    
    IF col_count = 4 THEN
        RAISE NOTICE '✅ SUCCÈS : Les 4 colonnes de niveaux scolaires ont été ajoutées avec succès !';
    ELSE
        RAISE WARNING '⚠️ ATTENTION : Seulement % colonne(s) sur 4 ont été trouvées', col_count;
    END IF;
END $$;

-- Afficher un résumé
SELECT 
    'Migration terminée' AS status,
    COUNT(*) AS total_schools,
    SUM(CASE WHEN has_preschool THEN 1 ELSE 0 END) AS with_preschool,
    SUM(CASE WHEN has_primary THEN 1 ELSE 0 END) AS with_primary,
    SUM(CASE WHEN has_middle THEN 1 ELSE 0 END) AS with_middle,
    SUM(CASE WHEN has_high THEN 1 ELSE 0 END) AS with_high
FROM schools;

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================

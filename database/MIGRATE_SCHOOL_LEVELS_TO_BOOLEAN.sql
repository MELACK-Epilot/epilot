-- ============================================================================
-- MIGRATION : Conversion niveau_enseignement[] → colonnes booléennes
-- Date : 7 novembre 2025
-- ============================================================================

-- ÉTAPE 1 : Ajouter les colonnes booléennes (sans contrainte pour l'instant)
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
        RAISE NOTICE '✅ Colonne has_preschool ajoutée';
    ELSE
        RAISE NOTICE '⚠️ Colonne has_preschool existe déjà';
    END IF;

    -- Ajouter has_primary
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'schools' 
        AND column_name = 'has_primary'
    ) THEN
        ALTER TABLE schools ADD COLUMN has_primary BOOLEAN DEFAULT false;
        RAISE NOTICE '✅ Colonne has_primary ajoutée';
    ELSE
        RAISE NOTICE '⚠️ Colonne has_primary existe déjà';
    END IF;

    -- Ajouter has_middle
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'schools' 
        AND column_name = 'has_middle'
    ) THEN
        ALTER TABLE schools ADD COLUMN has_middle BOOLEAN DEFAULT false;
        RAISE NOTICE '✅ Colonne has_middle ajoutée';
    ELSE
        RAISE NOTICE '⚠️ Colonne has_middle existe déjà';
    END IF;

    -- Ajouter has_high
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'schools' 
        AND column_name = 'has_high'
    ) THEN
        ALTER TABLE schools ADD COLUMN has_high BOOLEAN DEFAULT false;
        RAISE NOTICE '✅ Colonne has_high ajoutée';
    ELSE
        RAISE NOTICE '⚠️ Colonne has_high existe déjà';
    END IF;
END $$;

-- ÉTAPE 2 : Migrer les données de niveau_enseignement[] vers les booléens
DO $$
DECLARE
    school_record RECORD;
    updated_count INTEGER := 0;
BEGIN
    RAISE NOTICE '🔄 Début de la migration des données...';
    
    FOR school_record IN SELECT id, niveau_enseignement FROM schools
    LOOP
        -- Mettre à jour les colonnes booléennes en fonction de l'array
        UPDATE schools
        SET 
            has_preschool = CASE 
                WHEN 'maternelle' = ANY(school_record.niveau_enseignement) 
                  OR 'prescolaire' = ANY(school_record.niveau_enseignement)
                  OR 'preschool' = ANY(school_record.niveau_enseignement)
                THEN true 
                ELSE false 
            END,
            has_primary = CASE 
                WHEN 'primaire' = ANY(school_record.niveau_enseignement)
                  OR 'primary' = ANY(school_record.niveau_enseignement)
                THEN true 
                ELSE false 
            END,
            has_middle = CASE 
                WHEN 'college' = ANY(school_record.niveau_enseignement)
                  OR 'collège' = ANY(school_record.niveau_enseignement)
                  OR 'middle' = ANY(school_record.niveau_enseignement)
                THEN true 
                ELSE false 
            END,
            has_high = CASE 
                WHEN 'lycee' = ANY(school_record.niveau_enseignement)
                  OR 'lycée' = ANY(school_record.niveau_enseignement)
                  OR 'high' = ANY(school_record.niveau_enseignement)
                  OR 'secondaire' = ANY(school_record.niveau_enseignement)
                THEN true 
                ELSE false 
            END
        WHERE id = school_record.id;
        
        updated_count := updated_count + 1;
    END LOOP;
    
    RAISE NOTICE '✅ % écoles migrées', updated_count;
END $$;

-- ÉTAPE 3 : S'assurer qu'au moins un niveau est sélectionné pour chaque école
UPDATE schools 
SET has_primary = true 
WHERE NOT (has_preschool OR has_primary OR has_middle OR has_high);

-- Compter combien d'écoles ont été corrigées
DO $$
DECLARE
    corrected_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO corrected_count
    FROM schools
    WHERE has_primary = true 
    AND NOT (has_preschool OR has_middle OR has_high);
    
    IF corrected_count > 0 THEN
        RAISE NOTICE '✅ % école(s) sans niveau ont été mises à jour avec "Primaire" par défaut', corrected_count;
    ELSE
        RAISE NOTICE '✅ Toutes les écoles ont au moins un niveau';
    END IF;
END $$;

-- ÉTAPE 4 : Ajouter la contrainte (maintenant que toutes les écoles ont au moins 1 niveau)
DO $$
BEGIN
    -- Supprimer la contrainte si elle existe déjà
    IF EXISTS (
        SELECT FROM pg_constraint 
        WHERE conname = 'at_least_one_level' 
        AND conrelid = 'schools'::regclass
    ) THEN
        ALTER TABLE schools DROP CONSTRAINT at_least_one_level;
        RAISE NOTICE '⚠️ Ancienne contrainte at_least_one_level supprimée';
    END IF;

    -- Ajouter la nouvelle contrainte
    ALTER TABLE schools ADD CONSTRAINT at_least_one_level 
        CHECK (has_preschool OR has_primary OR has_middle OR has_high);
    
    RAISE NOTICE '✅ Contrainte at_least_one_level ajoutée avec succès';
END $$;

-- ÉTAPE 5 : Créer des index pour améliorer les performances
DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_schools_has_preschool ON schools(has_preschool) WHERE has_preschool = true;
    CREATE INDEX IF NOT EXISTS idx_schools_has_primary ON schools(has_primary) WHERE has_primary = true;
    CREATE INDEX IF NOT EXISTS idx_schools_has_middle ON schools(has_middle) WHERE has_middle = true;
    CREATE INDEX IF NOT EXISTS idx_schools_has_high ON schools(has_high) WHERE has_high = true;
    
    RAISE NOTICE '✅ Index créés';
END $$;

-- ÉTAPE 6 : Rafraîchir le cache PostgREST (CRITIQUE pour Supabase)
NOTIFY pgrst, 'reload schema';

-- ÉTAPE 7 : Afficher un résumé détaillé
DO $$
DECLARE
    total_schools INTEGER;
    with_preschool INTEGER;
    with_primary INTEGER;
    with_middle INTEGER;
    with_high INTEGER;
    multi_level INTEGER;
    complete_level INTEGER;
BEGIN
    SELECT 
        COUNT(*),
        SUM(CASE WHEN has_preschool THEN 1 ELSE 0 END),
        SUM(CASE WHEN has_primary THEN 1 ELSE 0 END),
        SUM(CASE WHEN has_middle THEN 1 ELSE 0 END),
        SUM(CASE WHEN has_high THEN 1 ELSE 0 END),
        SUM(CASE WHEN (has_preschool::int + has_primary::int + has_middle::int + has_high::int) >= 2 THEN 1 ELSE 0 END),
        SUM(CASE WHEN has_preschool AND has_primary AND has_middle AND has_high THEN 1 ELSE 0 END)
    INTO 
        total_schools,
        with_preschool,
        with_primary,
        with_middle,
        with_high,
        multi_level,
        complete_level
    FROM schools;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 RÉSUMÉ DE LA MIGRATION';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total écoles : %', total_schools;
    RAISE NOTICE '🎓 Maternelle : %', with_preschool;
    RAISE NOTICE '📚 Primaire : %', with_primary;
    RAISE NOTICE '🏫 Collège : %', with_middle;
    RAISE NOTICE '🎓 Lycée : %', with_high;
    RAISE NOTICE '🏢 Multi-niveaux (2+) : %', multi_level;
    RAISE NOTICE '🏆 Complexes complets (4) : %', complete_level;
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ MIGRATION TERMINÉE AVEC SUCCÈS !';
    RAISE NOTICE '========================================';
END $$;

-- Afficher quelques exemples d'écoles migrées
SELECT 
    name,
    code,
    niveau_enseignement AS ancien_format,
    has_preschool AS maternelle,
    has_primary AS primaire,
    has_middle AS college,
    has_high AS lycee
FROM schools
LIMIT 5;

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================

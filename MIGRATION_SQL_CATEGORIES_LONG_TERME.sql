-- Migration SQL - Catégories Métiers VERSION LONG TERME
-- Ajoute tous les champs avancés à la table business_categories

-- 1. Ajouter les colonnes (si elles n'existent pas déjà)
DO $$ 
BEGIN
    -- order_index (Priorité HAUTE)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'business_categories' AND column_name = 'order_index'
    ) THEN
        ALTER TABLE business_categories 
        ADD COLUMN order_index INTEGER NOT NULL DEFAULT 0;
    END IF;

    -- is_visible (Priorité MOYENNE)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'business_categories' AND column_name = 'is_visible'
    ) THEN
        ALTER TABLE business_categories 
        ADD COLUMN is_visible BOOLEAN NOT NULL DEFAULT true;
    END IF;

    -- school_levels (Priorité MOYENNE)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'business_categories' AND column_name = 'school_levels'
    ) THEN
        ALTER TABLE business_categories 
        ADD COLUMN school_levels TEXT[] DEFAULT ARRAY[]::TEXT[];
    END IF;

    -- max_modules (Priorité MOYENNE)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'business_categories' AND column_name = 'max_modules'
    ) THEN
        ALTER TABLE business_categories 
        ADD COLUMN max_modules INTEGER;
    END IF;

    -- cover_image (Priorité BASSE)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'business_categories' AND column_name = 'cover_image'
    ) THEN
        ALTER TABLE business_categories 
        ADD COLUMN cover_image TEXT;
    END IF;

    -- keywords (Priorité BASSE)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'business_categories' AND column_name = 'keywords'
    ) THEN
        ALTER TABLE business_categories 
        ADD COLUMN keywords TEXT[] DEFAULT ARRAY[]::TEXT[];
    END IF;

    -- owner_id (Priorité BASSE)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'business_categories' AND column_name = 'owner_id'
    ) THEN
        ALTER TABLE business_categories 
        ADD COLUMN owner_id UUID REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Ajouter les contraintes
DO $$ 
BEGIN
    -- Contrainte sur order_index
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'valid_order_index'
    ) THEN
        ALTER TABLE business_categories 
        ADD CONSTRAINT valid_order_index CHECK (order_index >= 0);
    END IF;

    -- Contrainte sur max_modules
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'valid_max_modules'
    ) THEN
        ALTER TABLE business_categories 
        ADD CONSTRAINT valid_max_modules CHECK (max_modules IS NULL OR max_modules >= 1);
    END IF;

    -- Contrainte sur school_levels
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'valid_school_levels'
    ) THEN
        ALTER TABLE business_categories 
        ADD CONSTRAINT valid_school_levels 
        CHECK (
            school_levels IS NULL OR 
            school_levels <@ ARRAY['maternel', 'primaire', 'college', 'lycee', 'centre_formation', 'universite']::TEXT[]
        );
    END IF;
END $$;

-- 3. Créer les index pour performance
CREATE INDEX IF NOT EXISTS idx_categories_order ON business_categories(order_index);
CREATE INDEX IF NOT EXISTS idx_categories_visible ON business_categories(is_visible);
CREATE INDEX IF NOT EXISTS idx_categories_owner ON business_categories(owner_id);
CREATE INDEX IF NOT EXISTS idx_categories_school_levels ON business_categories USING GIN(school_levels);
CREATE INDEX IF NOT EXISTS idx_categories_keywords ON business_categories USING GIN(keywords);

-- 4. Initialiser les valeurs pour les catégories existantes (optionnel)
UPDATE business_categories 
SET order_index = (ROW_NUMBER() OVER (ORDER BY name)) - 1
WHERE order_index = 0;

-- 5. Ajouter des commentaires pour documentation
COMMENT ON COLUMN business_categories.order_index IS 'Ordre d''affichage de la catégorie (0 = premier)';
COMMENT ON COLUMN business_categories.is_visible IS 'Visibilité de la catégorie (peut être masquée sans être supprimée)';
COMMENT ON COLUMN business_categories.school_levels IS 'Niveaux scolaires concernés (primaire, college, lycee)';
COMMENT ON COLUMN business_categories.max_modules IS 'Nombre maximum de modules autorisés dans cette catégorie';
COMMENT ON COLUMN business_categories.cover_image IS 'URL de l''image de couverture';
COMMENT ON COLUMN business_categories.keywords IS 'Mots-clés pour améliorer la recherche';
COMMENT ON COLUMN business_categories.owner_id IS 'Responsable de la catégorie';

-- 6. Créer une vue pour les catégories avec statistiques
CREATE OR REPLACE VIEW categories_with_stats AS
SELECT 
    c.*,
    COUNT(m.id) as module_count,
    COUNT(m.id) FILTER (WHERE m.status = 'active') as active_module_count,
    u.first_name || ' ' || u.last_name as owner_name
FROM business_categories c
LEFT JOIN modules m ON m.category_id = c.id
LEFT JOIN users u ON u.id = c.owner_id
GROUP BY c.id, u.first_name, u.last_name
ORDER BY c.order_index, c.name;

-- 7. Fonction pour vérifier le nombre max de modules
CREATE OR REPLACE FUNCTION check_max_modules_before_insert()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
    max_allowed INTEGER;
BEGIN
    -- Récupérer le nombre actuel de modules et la limite
    SELECT COUNT(*), c.max_modules
    INTO current_count, max_allowed
    FROM modules m
    JOIN business_categories c ON c.id = NEW.category_id
    WHERE m.category_id = NEW.category_id
    GROUP BY c.max_modules;

    -- Si une limite est définie et dépassée, lever une erreur
    IF max_allowed IS NOT NULL AND current_count >= max_allowed THEN
        RAISE EXCEPTION 'Nombre maximum de modules atteint pour cette catégorie (max: %)', max_allowed;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Créer le trigger pour vérifier le nombre max de modules
DROP TRIGGER IF EXISTS trigger_check_max_modules ON modules;
CREATE TRIGGER trigger_check_max_modules
    BEFORE INSERT ON modules
    FOR EACH ROW
    EXECUTE FUNCTION check_max_modules_before_insert();

-- 9. Fonction pour recherche par mots-clés
CREATE OR REPLACE FUNCTION search_categories(search_term TEXT)
RETURNS TABLE (
    id UUID,
    name VARCHAR(100),
    slug VARCHAR(100),
    description TEXT,
    relevance FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.slug,
        c.description,
        (
            -- Score de pertinence basé sur plusieurs critères
            CASE WHEN c.name ILIKE '%' || search_term || '%' THEN 3 ELSE 0 END +
            CASE WHEN c.slug ILIKE '%' || search_term || '%' THEN 2 ELSE 0 END +
            CASE WHEN c.description ILIKE '%' || search_term || '%' THEN 1 ELSE 0 END +
            CASE WHEN search_term = ANY(c.keywords) THEN 4 ELSE 0 END
        )::FLOAT as relevance
    FROM business_categories c
    WHERE 
        c.is_visible = true
        AND c.status = 'active'
        AND (
            c.name ILIKE '%' || search_term || '%'
            OR c.slug ILIKE '%' || search_term || '%'
            OR c.description ILIKE '%' || search_term || '%'
            OR search_term = ANY(c.keywords)
        )
    ORDER BY relevance DESC, c.order_index, c.name;
END;
$$ LANGUAGE plpgsql;

-- 10. Afficher un résumé de la migration
DO $$
DECLARE
    total_categories INTEGER;
    visible_categories INTEGER;
    categories_with_levels INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_categories FROM business_categories;
    SELECT COUNT(*) INTO visible_categories FROM business_categories WHERE is_visible = true;
    SELECT COUNT(*) INTO categories_with_levels FROM business_categories WHERE array_length(school_levels, 1) > 0;
    
    RAISE NOTICE '✅ Migration terminée avec succès !';
    RAISE NOTICE '📊 Statistiques :';
    RAISE NOTICE '   - Total catégories : %', total_categories;
    RAISE NOTICE '   - Catégories visibles : %', visible_categories;
    RAISE NOTICE '   - Catégories avec niveaux : %', categories_with_levels;
END $$;

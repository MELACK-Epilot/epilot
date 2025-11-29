-- ============================================================================
-- SÉCURITÉ : ENFORCEMENT DES LIMITES DE STOCKAGE
-- ============================================================================
-- Empêche physiquement l'upload de fichiers si la limite de stockage est atteinte
-- ============================================================================

-- 1. Ajouter la colonne de tracking du stockage utilisé
ALTER TABLE school_groups 
ADD COLUMN IF NOT EXISTS storage_used_bytes BIGINT DEFAULT 0;

COMMENT ON COLUMN school_groups.storage_used_bytes IS 'Stockage total utilisé en bytes par ce groupe scolaire';

-- 2. Créer un index pour performance
CREATE INDEX IF NOT EXISTS idx_school_groups_storage_used 
ON school_groups(storage_used_bytes);

-- 3. Fonction pour mettre à jour le stockage utilisé
CREATE OR REPLACE FUNCTION update_storage_usage()
RETURNS TRIGGER AS $$
DECLARE
    v_school_group_id UUID;
    v_file_size BIGINT;
    v_bucket_name TEXT;
BEGIN
    -- Récupérer la taille du fichier depuis les metadata
    v_file_size := (NEW.metadata->>'size')::BIGINT;
    v_bucket_name := NEW.bucket_id;
    
    -- Déterminer le school_group_id selon le bucket
    -- Les fichiers sont organisés par groupe: bucket/school_group_id/...
    -- On extrait le school_group_id du path
    IF NEW.path_tokens IS NOT NULL AND array_length(NEW.path_tokens, 1) >= 1 THEN
        -- Le premier segment du path est généralement le school_group_id
        BEGIN
            v_school_group_id := NEW.path_tokens[1]::UUID;
        EXCEPTION WHEN OTHERS THEN
            -- Si ce n'est pas un UUID valide, on ne peut pas tracker
            RETURN NEW;
        END;
    ELSE
        -- Pas de path_tokens, on ne peut pas tracker
        RETURN NEW;
    END IF;
    
    -- Mettre à jour le compteur
    IF TG_OP = 'INSERT' THEN
        UPDATE school_groups 
        SET storage_used_bytes = COALESCE(storage_used_bytes, 0) + v_file_size
        WHERE id = v_school_group_id;
    ELSIF TG_OP = 'DELETE' THEN
        v_file_size := (OLD.metadata->>'size')::BIGINT;
        IF OLD.path_tokens IS NOT NULL AND array_length(OLD.path_tokens, 1) >= 1 THEN
            BEGIN
                v_school_group_id := OLD.path_tokens[1]::UUID;
                UPDATE school_groups 
                SET storage_used_bytes = GREATEST(COALESCE(storage_used_bytes, 0) - v_file_size, 0)
                WHERE id = v_school_group_id;
            EXCEPTION WHEN OTHERS THEN
                NULL;
            END;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Fonction pour vérifier la limite de stockage AVANT upload
CREATE OR REPLACE FUNCTION check_storage_limit()
RETURNS TRIGGER AS $$
DECLARE
    v_school_group_id UUID;
    v_file_size BIGINT;
    v_current_usage BIGINT;
    v_max_storage_gb INTEGER;
    v_max_storage_bytes BIGINT;
    v_plan_name TEXT;
BEGIN
    -- Récupérer la taille du nouveau fichier
    v_file_size := (NEW.metadata->>'size')::BIGINT;
    
    -- Extraire le school_group_id du path
    IF NEW.path_tokens IS NOT NULL AND array_length(NEW.path_tokens, 1) >= 1 THEN
        BEGIN
            v_school_group_id := NEW.path_tokens[1]::UUID;
        EXCEPTION WHEN OTHERS THEN
            -- Si ce n'est pas un UUID, on laisse passer (fichiers système, etc.)
            RETURN NEW;
        END;
    ELSE
        -- Pas de path_tokens, on laisse passer
        RETURN NEW;
    END IF;
    
    -- Récupérer l'usage actuel et la limite du plan
    SELECT 
        sg.storage_used_bytes,
        sp.max_storage,
        sp.name
    INTO 
        v_current_usage,
        v_max_storage_gb,
        v_plan_name
    FROM school_groups sg
    JOIN subscriptions s ON s.school_group_id = sg.id
    JOIN subscription_plans sp ON s.plan_id = sp.id
    WHERE sg.id = v_school_group_id
    AND s.status = 'active'
    ORDER BY s.created_at DESC
    LIMIT 1;
    
    -- Si pas de limite (NULL ou -1), on laisse passer
    IF v_max_storage_gb IS NULL OR v_max_storage_gb = -1 THEN
        RETURN NEW;
    END IF;
    
    -- Convertir GB en bytes (1 GB = 1,073,741,824 bytes)
    v_max_storage_bytes := v_max_storage_gb::BIGINT * 1073741824;
    
    -- Vérifier si l'ajout du nouveau fichier dépasse la limite
    IF (COALESCE(v_current_usage, 0) + v_file_size) > v_max_storage_bytes THEN
        RAISE EXCEPTION 'STORAGE_LIMIT_REACHED: La limite de stockage pour le plan % est atteinte (%.2f GB / % GB). Veuillez upgrader votre abonnement ou supprimer des fichiers.', 
            v_plan_name,
            (COALESCE(v_current_usage, 0) + v_file_size)::NUMERIC / 1073741824,
            v_max_storage_gb;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Créer les triggers sur storage.objects
-- Note: Ces triggers nécessitent les permissions sur le schema storage

-- Trigger pour mettre à jour le compteur
DROP TRIGGER IF EXISTS update_storage_usage_trigger ON storage.objects;
CREATE TRIGGER update_storage_usage_trigger
AFTER INSERT OR DELETE ON storage.objects
FOR EACH ROW EXECUTE FUNCTION update_storage_usage();

-- Trigger pour vérifier la limite AVANT insertion
DROP TRIGGER IF EXISTS check_storage_limit_trigger ON storage.objects;
CREATE TRIGGER check_storage_limit_trigger
BEFORE INSERT ON storage.objects
FOR EACH ROW EXECUTE FUNCTION check_storage_limit();

-- 6. Initialiser le compteur pour les groupes existants
-- Cette requête calcule la taille actuelle pour chaque groupe
UPDATE school_groups sg
SET storage_used_bytes = COALESCE(
    (
        SELECT SUM((obj.metadata->>'size')::BIGINT)
        FROM storage.objects obj
        WHERE obj.path_tokens[1]::UUID = sg.id
    ), 0
)
WHERE EXISTS (
    SELECT 1 FROM storage.objects obj 
    WHERE obj.path_tokens[1]::UUID = sg.id
);

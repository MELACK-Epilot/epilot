-- ============================================================================
-- SÉCURITÉ : ENFORCEMENT DES LIMITES DE PLAN (BACKEND)
-- ============================================================================
-- Empêche physiquement l'insertion de données si les limites du plan sont atteintes
-- ============================================================================

CREATE OR REPLACE FUNCTION check_plan_limits()
RETURNS TRIGGER AS $$
DECLARE
    v_school_group_id UUID;
    v_limit_type TEXT;
    v_current_count INTEGER;
    v_max_limit INTEGER;
    v_plan_name TEXT;
BEGIN
    -- 1. Déterminer le contexte (Ecole ou Élève) et le Group ID
    IF TG_TABLE_NAME = 'schools' THEN
        v_school_group_id := NEW.school_group_id;
        v_limit_type := 'max_schools';
    ELSIF TG_TABLE_NAME = 'students' THEN
        -- Pour les élèves, on doit récupérer le groupe via l'école
        SELECT school_group_id INTO v_school_group_id FROM schools WHERE id = NEW.school_id;
        
        -- Si l'école n'existe pas (cas étrange), on laisse l'erreur de FK se produire
        IF v_school_group_id IS NULL THEN
            RETURN NEW;
        END IF;
        
        v_limit_type := 'max_students';
    END IF;

    -- 2. Récupérer la limite du plan actif
    -- On prend l'abonnement actif le plus récent
    SELECT 
        CASE 
            WHEN v_limit_type = 'max_schools' THEN sp.max_schools
            WHEN v_limit_type = 'max_students' THEN sp.max_students
        END,
        sp.name
    INTO v_max_limit, v_plan_name
    FROM subscriptions s
    JOIN subscription_plans sp ON s.plan_id = sp.id
    WHERE s.school_group_id = v_school_group_id
    AND s.status = 'active'
    ORDER BY s.created_at DESC
    LIMIT 1;

    -- Si pas d'abonnement actif, on pourrait bloquer, mais pour l'instant on laisse (ou on bloque par défaut)
    -- Ici on assume que si pas d'abo, pas de limite (ou géré ailleurs)
    IF v_max_limit IS NULL THEN
        -- Si v_max_limit est NULL car le champ est NULL dans la BDD, ça veut dire ILLIMITÉ (-1 ou NULL)
        -- Vérifions si on a trouvé un plan
        IF v_plan_name IS NULL THEN
             -- Pas d'abonnement actif -> On peut choisir de bloquer ou non.
             -- Pour la sécurité, on ne bloque pas ici pour éviter de casser des imports existants hors abonnement,
             -- mais idéalement il faudrait.
             RETURN NEW;
        END IF;
        -- Si le plan existe mais la limite est NULL, c'est illimité
        RETURN NEW;
    END IF;
    
    -- Si la limite est -1, c'est illimité
    IF v_max_limit = -1 THEN
        RETURN NEW;
    END IF;

    -- 3. Compter l'existant
    IF TG_TABLE_NAME = 'schools' THEN
        SELECT COUNT(*) INTO v_current_count FROM schools WHERE school_group_id = v_school_group_id;
    ELSIF TG_TABLE_NAME = 'students' THEN
        SELECT COUNT(s.id) INTO v_current_count 
        FROM students s
        JOIN schools sch ON s.school_id = sch.id
        WHERE sch.school_group_id = v_school_group_id;
    END IF;

    -- 4. Vérifier (>= car on est en BEFORE INSERT, le nouveau n'est pas encore compté)
    IF v_current_count >= v_max_limit THEN
        RAISE EXCEPTION 'PLAN_LIMIT_REACHED: La limite de % pour le plan % est atteinte (%/%). Veuillez upgrader votre abonnement.', 
            CASE WHEN v_limit_type = 'max_schools' THEN 'écoles' ELSE 'élèves' END,
            v_plan_name, 
            v_current_count, 
            v_max_limit;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger Ecoles
DROP TRIGGER IF EXISTS check_schools_limit ON schools;
CREATE TRIGGER check_schools_limit
BEFORE INSERT ON schools
FOR EACH ROW EXECUTE FUNCTION check_plan_limits();

-- Trigger Élèves
DROP TRIGGER IF EXISTS check_students_limit ON students;
CREATE TRIGGER check_students_limit
BEFORE INSERT ON students
FOR EACH ROW EXECUTE FUNCTION check_plan_limits();

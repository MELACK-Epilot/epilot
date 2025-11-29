-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION: Profils d'accès PAR GROUPE SCOLAIRE
-- ═══════════════════════════════════════════════════════════════════════════════
-- 
-- CORRECTION DE L'ARCHITECTURE:
-- 
-- AVANT (incorrect):
--   access_profiles = profils GLOBAUX créés par Super Admin
-- 
-- APRÈS (correct):
--   access_profiles = profils PAR GROUPE créés par Admin Groupe
--   Chaque groupe scolaire a ses propres profils
--   Les modules disponibles dans un profil = modules du PLAN du groupe
--
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════
-- 1️⃣ AJOUTER school_group_id à access_profiles
-- ═══════════════════════════════════════════════════════════

-- Ajouter la colonne (nullable pour la migration)
ALTER TABLE public.access_profiles 
ADD COLUMN IF NOT EXISTS school_group_id UUID REFERENCES public.school_groups(id) ON DELETE CASCADE;

-- Ajouter created_by pour savoir qui a créé le profil
ALTER TABLE public.access_profiles 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Index pour filtrer par groupe
CREATE INDEX IF NOT EXISTS idx_access_profiles_school_group 
    ON public.access_profiles(school_group_id);

-- Modifier la contrainte UNIQUE: code unique PAR groupe (pas globalement)
-- D'abord supprimer l'ancienne contrainte si elle existe
ALTER TABLE public.access_profiles 
DROP CONSTRAINT IF EXISTS access_profiles_code_key;

-- Créer la nouvelle contrainte: code unique par groupe
ALTER TABLE public.access_profiles 
ADD CONSTRAINT uq_access_profiles_code_per_group UNIQUE(school_group_id, code);

COMMENT ON COLUMN public.access_profiles.school_group_id IS 
    'Groupe scolaire propriétaire du profil (NULL = profil template global)';


-- ═══════════════════════════════════════════════════════════
-- 2️⃣ CRÉER DES PROFILS TEMPLATES (globaux, pour copie)
-- ═══════════════════════════════════════════════════════════

-- Marquer les profils existants comme templates (school_group_id = NULL)
-- Ces profils servent de modèles que chaque groupe peut copier

UPDATE public.access_profiles 
SET school_group_id = NULL 
WHERE school_group_id IS NULL;

-- Ajouter une colonne pour identifier les templates
ALTER TABLE public.access_profiles 
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;

UPDATE public.access_profiles 
SET is_template = true 
WHERE school_group_id IS NULL;

COMMENT ON COLUMN public.access_profiles.is_template IS 
    'true = profil template (modèle), false = profil réel d''un groupe';


-- ═══════════════════════════════════════════════════════════
-- 3️⃣ FONCTION: Copier les templates vers un nouveau groupe
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.copy_template_profiles_to_group(
    p_school_group_id UUID,
    p_created_by UUID
)
RETURNS INTEGER AS $$
DECLARE
    v_template RECORD;
    v_count INTEGER := 0;
BEGIN
    -- Pour chaque profil template
    FOR v_template IN 
        SELECT * FROM public.access_profiles 
        WHERE is_template = true AND is_active = true
    LOOP
        -- Copier vers le groupe (si pas déjà existant)
        INSERT INTO public.access_profiles (
            code,
            name_fr,
            name_en,
            description,
            permissions,
            icon,
            is_active,
            school_group_id,
            created_by,
            is_template
        ) VALUES (
            v_template.code,
            v_template.name_fr,
            v_template.name_en,
            v_template.description,
            v_template.permissions,
            v_template.icon,
            true,
            p_school_group_id,
            p_created_by,
            false
        )
        ON CONFLICT (school_group_id, code) DO NOTHING;
        
        v_count := v_count + 1;
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.copy_template_profiles_to_group(UUID, UUID) IS 
    'Copie les profils templates vers un groupe scolaire';


-- ═══════════════════════════════════════════════════════════
-- 4️⃣ TRIGGER: Auto-créer les profils quand un groupe est créé
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.on_school_group_created()
RETURNS TRIGGER AS $$
BEGIN
    -- Copier les profils templates vers le nouveau groupe
    PERFORM public.copy_template_profiles_to_group(NEW.id, NEW.admin_id);
    
    RAISE NOTICE '✅ Profils templates copiés pour le groupe %', NEW.name;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger (si pas déjà existant)
DROP TRIGGER IF EXISTS trigger_copy_profiles_on_group_created ON public.school_groups;

CREATE TRIGGER trigger_copy_profiles_on_group_created
    AFTER INSERT ON public.school_groups
    FOR EACH ROW
    EXECUTE FUNCTION public.on_school_group_created();


-- ═══════════════════════════════════════════════════════════
-- 5️⃣ METTRE À JOUR access_profile_modules
-- Ajouter school_group_id pour filtrer par groupe
-- ═══════════════════════════════════════════════════════════

-- La table access_profile_modules référence access_profiles via code
-- Comme access_profiles a maintenant school_group_id, on doit adapter

-- Ajouter school_group_id à access_profile_modules
ALTER TABLE public.access_profile_modules 
ADD COLUMN IF NOT EXISTS school_group_id UUID REFERENCES public.school_groups(id) ON DELETE CASCADE;

-- Index
CREATE INDEX IF NOT EXISTS idx_apm_school_group 
    ON public.access_profile_modules(school_group_id);

-- Modifier la contrainte unique
ALTER TABLE public.access_profile_modules 
DROP CONSTRAINT IF EXISTS uq_profile_module;

ALTER TABLE public.access_profile_modules 
ADD CONSTRAINT uq_profile_module_per_group 
    UNIQUE(school_group_id, access_profile_code, module_id);


-- ═══════════════════════════════════════════════════════════
-- 6️⃣ METTRE À JOUR users.access_profile_code
-- Le profil est maintenant relatif au groupe
-- ═══════════════════════════════════════════════════════════

-- Pas besoin de modifier users.access_profile_code
-- Car on filtre par school_group_id dans les requêtes


-- ═══════════════════════════════════════════════════════════
-- 7️⃣ METTRE À JOUR LE TRIGGER sync_user_modules_from_profile
-- Pour prendre en compte le groupe
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.sync_user_modules_from_profile()
RETURNS TRIGGER AS $$
DECLARE
    v_new_profile VARCHAR(50);
    v_old_profile VARCHAR(50);
    v_school_group_id UUID;
    v_module RECORD;
    v_count INTEGER := 0;
BEGIN
    v_new_profile := NEW.access_profile_code;
    v_old_profile := COALESCE(OLD.access_profile_code, '');
    v_school_group_id := NEW.school_group_id;
    
    -- Si le profil n'a pas changé, ne rien faire
    IF v_new_profile IS NOT DISTINCT FROM v_old_profile THEN
        RETURN NEW;
    END IF;
    
    RAISE NOTICE '🔄 Sync modules: user=%, group=%, old=%, new=%', 
        NEW.id, v_school_group_id, v_old_profile, v_new_profile;
    
    -- ÉTAPE 1: Supprimer les modules de l'ancien profil
    IF v_old_profile IS NOT NULL AND v_old_profile != '' THEN
        DELETE FROM public.user_modules 
        WHERE user_id = NEW.id 
        AND assigned_by_profile = v_old_profile;
        
        GET DIAGNOSTICS v_count = ROW_COUNT;
        RAISE NOTICE '🗑️ Supprimé % modules', v_count;
    END IF;
    
    -- ÉTAPE 2: Ajouter les modules du nouveau profil (filtré par groupe)
    IF v_new_profile IS NOT NULL AND v_new_profile != '' AND v_school_group_id IS NOT NULL THEN
        v_count := 0;
        
        FOR v_module IN 
            SELECT 
                apm.module_id,
                apm.can_read,
                apm.can_write,
                apm.can_delete,
                apm.can_export
            FROM public.access_profile_modules apm
            WHERE apm.access_profile_code = v_new_profile
            AND apm.school_group_id = v_school_group_id
        LOOP
            INSERT INTO public.user_modules (
                user_id, module_id, is_enabled, assigned_at, assigned_by_profile,
                can_read, can_write, can_delete, can_export
            ) VALUES (
                NEW.id, v_module.module_id, true, NOW(), v_new_profile,
                v_module.can_read, v_module.can_write, v_module.can_delete, v_module.can_export
            )
            ON CONFLICT (user_id, module_id) 
            DO UPDATE SET
                is_enabled = true,
                assigned_by_profile = v_new_profile,
                can_read = v_module.can_read,
                can_write = v_module.can_write,
                can_delete = v_module.can_delete,
                can_export = v_module.can_export,
                updated_at = NOW();
            
            v_count := v_count + 1;
        END LOOP;
        
        RAISE NOTICE '✅ Assigné % modules du profil %', v_count, v_new_profile;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ═══════════════════════════════════════════════════════════
-- 8️⃣ RLS: Admin Groupe ne voit que ses profils
-- ═══════════════════════════════════════════════════════════

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "super_admin_full_access_profiles" ON public.access_profiles;
DROP POLICY IF EXISTS "read_active_profiles" ON public.access_profiles;

-- Super Admin: Accès total (templates + tous les groupes)
CREATE POLICY "super_admin_full_access_profiles"
    ON public.access_profiles FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Admin Groupe: Accès à ses profils + templates en lecture
CREATE POLICY "admin_groupe_manage_own_profiles"
    ON public.access_profiles FOR ALL
    USING (
        -- Ses propres profils
        school_group_id = (
            SELECT school_group_id FROM public.users 
            WHERE id = auth.uid() AND role = 'admin_groupe'
        )
        OR
        -- Templates en lecture seule
        (is_template = true AND (
            SELECT role FROM public.users WHERE id = auth.uid()
        ) = 'admin_groupe')
    );

-- Utilisateurs: Lecture des profils de leur groupe
CREATE POLICY "users_read_group_profiles"
    ON public.access_profiles FOR SELECT
    USING (
        school_group_id = (
            SELECT school_group_id FROM public.users WHERE id = auth.uid()
        )
    );


-- ═══════════════════════════════════════════════════════════
-- 9️⃣ MIGRER LES GROUPES EXISTANTS
-- Copier les templates vers chaque groupe
-- ═══════════════════════════════════════════════════════════

DO $$
DECLARE
    v_group RECORD;
    v_count INTEGER;
BEGIN
    FOR v_group IN 
        SELECT sg.id, sg.name, u.id AS admin_id
        FROM public.school_groups sg
        LEFT JOIN public.users u ON u.school_group_id = sg.id AND u.role = 'admin_groupe'
        WHERE NOT EXISTS (
            SELECT 1 FROM public.access_profiles ap 
            WHERE ap.school_group_id = sg.id
        )
    LOOP
        SELECT public.copy_template_profiles_to_group(v_group.id, v_group.admin_id) INTO v_count;
        RAISE NOTICE '✅ Groupe "%": % profils copiés', v_group.name, v_count;
    END LOOP;
END $$;


COMMIT;

-- ═══════════════════════════════════════════════════════════
-- ✅ VÉRIFICATION
-- ═══════════════════════════════════════════════════════════

SELECT 
    CASE WHEN school_group_id IS NULL THEN 'TEMPLATE' ELSE sg.name END AS groupe,
    ap.code,
    ap.name_fr,
    ap.is_template
FROM public.access_profiles ap
LEFT JOIN public.school_groups sg ON sg.id = ap.school_group_id
ORDER BY ap.is_template DESC, sg.name, ap.code;

SELECT '✅ Migration profils par groupe terminée!' AS status;

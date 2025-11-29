-- ═══════════════════════════════════════════════════════════════════════════════
-- SCRIPT CONSOLIDÉ: Système de Profils par Groupe Scolaire
-- ═══════════════════════════════════════════════════════════════════════════════
-- 
-- Ce script applique toutes les migrations nécessaires pour le système de profils.
-- À exécuter dans Supabase Dashboard > SQL Editor
--
-- ORDRE D'EXÉCUTION:
-- 1. 021_unified_profile_modules_system.sql - Table access_profile_modules + triggers
-- 2. 024_profiles_per_school_group.sql - Profils par groupe
-- 3. 022_seed_profile_modules.sql - Données initiales (optionnel)
-- 4. 023_migrate_existing_users_to_profiles.sql - Migration utilisateurs (optionnel)
--
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════
-- ÉTAPE 1: Vérifier les prérequis
-- ═══════════════════════════════════════════════════════════

DO $$
BEGIN
    -- Vérifier que les tables existent
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'access_profiles') THEN
        RAISE EXCEPTION 'Table access_profiles non trouvée. Exécutez d''abord 20251116_create_access_profiles_system.sql';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'modules') THEN
        RAISE EXCEPTION 'Table modules non trouvée.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'school_groups') THEN
        RAISE EXCEPTION 'Table school_groups non trouvée.';
    END IF;
    
    RAISE NOTICE '✅ Prérequis vérifiés';
END $$;


-- ═══════════════════════════════════════════════════════════
-- ÉTAPE 2: Ajouter colonnes à access_profiles
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.access_profiles 
ADD COLUMN IF NOT EXISTS school_group_id UUID REFERENCES public.school_groups(id) ON DELETE CASCADE;

ALTER TABLE public.access_profiles 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.access_profiles 
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_access_profiles_school_group 
    ON public.access_profiles(school_group_id);

-- Marquer les profils existants comme templates
UPDATE public.access_profiles 
SET is_template = true 
WHERE school_group_id IS NULL;

RAISE NOTICE '✅ Colonnes ajoutées à access_profiles';


-- ═══════════════════════════════════════════════════════════
-- ÉTAPE 3: Créer table access_profile_modules
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.access_profile_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    access_profile_code VARCHAR(50) NOT NULL,
    school_group_id UUID REFERENCES public.school_groups(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    can_read BOOLEAN DEFAULT true NOT NULL,
    can_write BOOLEAN DEFAULT false NOT NULL,
    can_delete BOOLEAN DEFAULT false NOT NULL,
    can_export BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_apm_profile_code ON public.access_profile_modules(access_profile_code);
CREATE INDEX IF NOT EXISTS idx_apm_school_group ON public.access_profile_modules(school_group_id);
CREATE INDEX IF NOT EXISTS idx_apm_module_id ON public.access_profile_modules(module_id);

-- Contrainte unique par groupe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_profile_module_per_group'
    ) THEN
        ALTER TABLE public.access_profile_modules 
        ADD CONSTRAINT uq_profile_module_per_group 
            UNIQUE(school_group_id, access_profile_code, module_id);
    END IF;
END $$;

RAISE NOTICE '✅ Table access_profile_modules créée';


-- ═══════════════════════════════════════════════════════════
-- ÉTAPE 4: Ajouter colonnes à user_modules
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.user_modules 
ADD COLUMN IF NOT EXISTS assigned_by_profile VARCHAR(50);

ALTER TABLE public.user_modules 
ADD COLUMN IF NOT EXISTS can_read BOOLEAN DEFAULT true;

ALTER TABLE public.user_modules 
ADD COLUMN IF NOT EXISTS can_write BOOLEAN DEFAULT false;

ALTER TABLE public.user_modules 
ADD COLUMN IF NOT EXISTS can_delete BOOLEAN DEFAULT false;

ALTER TABLE public.user_modules 
ADD COLUMN IF NOT EXISTS can_export BOOLEAN DEFAULT false;

ALTER TABLE public.user_modules 
ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_um_assigned_by_profile 
    ON public.user_modules(assigned_by_profile) 
    WHERE assigned_by_profile IS NOT NULL;

RAISE NOTICE '✅ Colonnes ajoutées à user_modules';


-- ═══════════════════════════════════════════════════════════
-- ÉTAPE 5: Créer fonction de sync
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
    
    IF v_new_profile IS NOT DISTINCT FROM v_old_profile THEN
        RETURN NEW;
    END IF;
    
    -- Supprimer les modules de l'ancien profil
    IF v_old_profile IS NOT NULL AND v_old_profile != '' THEN
        DELETE FROM public.user_modules 
        WHERE user_id = NEW.id 
        AND assigned_by_profile = v_old_profile;
    END IF;
    
    -- Ajouter les modules du nouveau profil
    IF v_new_profile IS NOT NULL AND v_new_profile != '' AND v_school_group_id IS NOT NULL THEN
        FOR v_module IN 
            SELECT module_id, can_read, can_write, can_delete, can_export
            FROM public.access_profile_modules
            WHERE access_profile_code = v_new_profile
            AND school_group_id = v_school_group_id
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
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_modules_on_profile_change ON public.users;
CREATE TRIGGER trigger_sync_modules_on_profile_change
    AFTER INSERT OR UPDATE OF access_profile_code ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_user_modules_from_profile();

RAISE NOTICE '✅ Trigger sync_user_modules_from_profile créé';


-- ═══════════════════════════════════════════════════════════
-- ÉTAPE 6: Fonction pour copier templates vers groupe
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.copy_template_profiles_to_group(
    p_school_group_id UUID,
    p_created_by UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_template RECORD;
    v_count INTEGER := 0;
BEGIN
    FOR v_template IN 
        SELECT * FROM public.access_profiles 
        WHERE is_template = true AND is_active = true
    LOOP
        INSERT INTO public.access_profiles (
            code, name_fr, name_en, description, permissions, icon,
            is_active, school_group_id, created_by, is_template
        ) VALUES (
            v_template.code, v_template.name_fr, v_template.name_en,
            v_template.description, v_template.permissions, v_template.icon,
            true, p_school_group_id, p_created_by, false
        )
        ON CONFLICT DO NOTHING;
        
        v_count := v_count + 1;
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

RAISE NOTICE '✅ Fonction copy_template_profiles_to_group créée';


-- ═══════════════════════════════════════════════════════════
-- ÉTAPE 7: RLS Policies
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.access_profile_modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_groupe_manage_profile_modules" ON public.access_profile_modules;
CREATE POLICY "admin_groupe_manage_profile_modules"
    ON public.access_profile_modules FOR ALL
    USING (
        school_group_id = (
            SELECT school_group_id FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin_groupe', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "users_read_profile_modules" ON public.access_profile_modules;
CREATE POLICY "users_read_profile_modules"
    ON public.access_profile_modules FOR SELECT
    USING (
        school_group_id = (
            SELECT school_group_id FROM public.users WHERE id = auth.uid()
        )
    );

RAISE NOTICE '✅ RLS Policies créées';


-- ═══════════════════════════════════════════════════════════
-- ÉTAPE 8: Copier templates vers groupes existants
-- ═══════════════════════════════════════════════════════════

DO $$
DECLARE
    v_group RECORD;
    v_count INTEGER;
BEGIN
    FOR v_group IN 
        SELECT sg.id, sg.name
        FROM public.school_groups sg
        WHERE NOT EXISTS (
            SELECT 1 FROM public.access_profiles ap 
            WHERE ap.school_group_id = sg.id
        )
    LOOP
        SELECT public.copy_template_profiles_to_group(v_group.id, NULL) INTO v_count;
        RAISE NOTICE 'Groupe "%": % profils copiés', v_group.name, v_count;
    END LOOP;
END $$;

RAISE NOTICE '✅ Templates copiés vers groupes existants';


-- ═══════════════════════════════════════════════════════════
-- VÉRIFICATION FINALE
-- ═══════════════════════════════════════════════════════════

SELECT '═══════════════════════════════════════════════════════════' AS separator;
SELECT '✅ MIGRATION TERMINÉE AVEC SUCCÈS!' AS status;
SELECT '═══════════════════════════════════════════════════════════' AS separator;

SELECT 
    'Profils templates' AS type,
    COUNT(*) AS count
FROM public.access_profiles WHERE is_template = true

UNION ALL

SELECT 
    'Profils par groupe' AS type,
    COUNT(*) AS count
FROM public.access_profiles WHERE is_template = false;

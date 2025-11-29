-- ═══════════════════════════════════════════════════════════════════════════════
-- SYSTÈME UNIFIÉ D'ASSIGNATION PROFIL → MODULES
-- ═══════════════════════════════════════════════════════════════════════════════
-- Version: 2.0
-- Date: 2025-01-29
-- 
-- WORKFLOW COMPLET:
-- ┌─────────────────────────────────────────────────────────────┐
-- │ ⿡ SUPER ADMIN E-PILOT (Plateforme)                         │
-- │    • Crée les access_profiles (profils d'accès)             │
-- │    • Lie les modules aux profils (access_profile_modules)   │
-- │    • Définit les permissions par module                     │
-- └─────────────────────────────────────────────────────────────┘
--                             ↓
-- ┌─────────────────────────────────────────────────────────────┐
-- │ ⿢ ADMIN DE GROUPE SCOLAIRE                                  │
-- │    • Assigne un profil à un utilisateur                     │
-- │    • TRIGGER: Les modules du profil sont auto-assignés      │
-- │    • L'utilisateur hérite des permissions du profil         │
-- └─────────────────────────────────────────────────────────────┘
--                             ↓
-- ┌─────────────────────────────────────────────────────────────┐
-- │ ⿣ UTILISATEUR                                               │
-- │    • Voit ses modules assignés via son profil               │
-- │    • Permissions héritées du profil (read/write/delete)     │
-- │    • Temps réel via Supabase Realtime                       │
-- └─────────────────────────────────────────────────────────────┘
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════
-- 1️⃣ TABLE: access_profile_modules
-- Lie les profils d'accès aux modules avec permissions granulaires
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.access_profile_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relation avec le profil (via code pour flexibilité)
    access_profile_code VARCHAR(50) NOT NULL,
    
    -- Relation avec le module
    module_id UUID NOT NULL,
    
    -- Permissions granulaires sur ce module
    can_read BOOLEAN DEFAULT true NOT NULL,
    can_write BOOLEAN DEFAULT false NOT NULL,
    can_delete BOOLEAN DEFAULT false NOT NULL,
    can_export BOOLEAN DEFAULT false NOT NULL,
    
    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    
    -- Contraintes
    CONSTRAINT fk_apm_profile FOREIGN KEY (access_profile_code) 
        REFERENCES public.access_profiles(code) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_apm_module FOREIGN KEY (module_id) 
        REFERENCES public.modules(id) ON DELETE CASCADE,
    CONSTRAINT fk_apm_created_by FOREIGN KEY (created_by) 
        REFERENCES public.users(id) ON DELETE SET NULL,
    CONSTRAINT uq_profile_module UNIQUE(access_profile_code, module_id)
);

-- Index pour performance (CRUCIAL pour 900+ utilisateurs)
CREATE INDEX IF NOT EXISTS idx_apm_profile_code ON public.access_profile_modules(access_profile_code);
CREATE INDEX IF NOT EXISTS idx_apm_module_id ON public.access_profile_modules(module_id);
CREATE INDEX IF NOT EXISTS idx_apm_composite ON public.access_profile_modules(access_profile_code, module_id);

-- Commentaires
COMMENT ON TABLE public.access_profile_modules IS 'Liaison profils d''accès ↔ modules avec permissions granulaires';
COMMENT ON COLUMN public.access_profile_modules.can_read IS 'Peut lire/consulter le module';
COMMENT ON COLUMN public.access_profile_modules.can_write IS 'Peut créer/modifier dans le module';
COMMENT ON COLUMN public.access_profile_modules.can_delete IS 'Peut supprimer dans le module';
COMMENT ON COLUMN public.access_profile_modules.can_export IS 'Peut exporter les données du module';


-- ═══════════════════════════════════════════════════════════
-- 2️⃣ AJOUTER COLONNES À user_modules
-- Pour tracker l'origine de l'assignation (profil vs manuel)
-- ═══════════════════════════════════════════════════════════

-- Colonne pour savoir si assigné via profil
ALTER TABLE public.user_modules 
ADD COLUMN IF NOT EXISTS assigned_by_profile VARCHAR(50);

-- Colonnes de permissions granulaires
ALTER TABLE public.user_modules 
ADD COLUMN IF NOT EXISTS can_read BOOLEAN DEFAULT true;

ALTER TABLE public.user_modules 
ADD COLUMN IF NOT EXISTS can_write BOOLEAN DEFAULT false;

ALTER TABLE public.user_modules 
ADD COLUMN IF NOT EXISTS can_delete BOOLEAN DEFAULT false;

ALTER TABLE public.user_modules 
ADD COLUMN IF NOT EXISTS can_export BOOLEAN DEFAULT false;

-- Colonne is_enabled si elle n'existe pas
ALTER TABLE public.user_modules 
ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT true;

-- Index pour filtrer par profil
CREATE INDEX IF NOT EXISTS idx_um_assigned_by_profile 
    ON public.user_modules(assigned_by_profile) 
    WHERE assigned_by_profile IS NOT NULL;

-- Commentaire
COMMENT ON COLUMN public.user_modules.assigned_by_profile IS 
    'Code du profil qui a assigné ce module (NULL = assignation manuelle)';


-- ═══════════════════════════════════════════════════════════
-- 3️⃣ FONCTION: Synchroniser les modules d'un utilisateur avec son profil
-- Appelée automatiquement quand access_profile_code change
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.sync_user_modules_from_profile()
RETURNS TRIGGER AS $$
DECLARE
    v_new_profile VARCHAR(50);
    v_old_profile VARCHAR(50);
    v_module RECORD;
    v_count INTEGER := 0;
BEGIN
    -- Récupérer les profils
    v_new_profile := NEW.access_profile_code;
    v_old_profile := COALESCE(OLD.access_profile_code, '');
    
    -- Si le profil n'a pas changé, ne rien faire
    IF v_new_profile IS NOT DISTINCT FROM v_old_profile THEN
        RETURN NEW;
    END IF;
    
    RAISE NOTICE '🔄 Sync modules: user=%, old_profile=%, new_profile=%', 
        NEW.id, v_old_profile, v_new_profile;
    
    -- ═══════════════════════════════════════════════════════════
    -- ÉTAPE 1: Supprimer les modules de l'ancien profil
    -- (Ne touche PAS aux modules assignés manuellement)
    -- ═══════════════════════════════════════════════════════════
    IF v_old_profile IS NOT NULL AND v_old_profile != '' THEN
        DELETE FROM public.user_modules 
        WHERE user_id = NEW.id 
        AND assigned_by_profile = v_old_profile;
        
        GET DIAGNOSTICS v_count = ROW_COUNT;
        RAISE NOTICE '🗑️ Supprimé % modules de l''ancien profil %', v_count, v_old_profile;
    END IF;
    
    -- ═══════════════════════════════════════════════════════════
    -- ÉTAPE 2: Ajouter les modules du nouveau profil
    -- ═══════════════════════════════════════════════════════════
    IF v_new_profile IS NOT NULL AND v_new_profile != '' THEN
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
        LOOP
            -- Upsert: Insérer ou mettre à jour
            INSERT INTO public.user_modules (
                user_id,
                module_id,
                is_enabled,
                assigned_at,
                assigned_by_profile,
                can_read,
                can_write,
                can_delete,
                can_export
            ) VALUES (
                NEW.id,
                v_module.module_id,
                true,
                NOW(),
                v_new_profile,
                v_module.can_read,
                v_module.can_write,
                v_module.can_delete,
                v_module.can_export
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

-- Commentaire
COMMENT ON FUNCTION public.sync_user_modules_from_profile() IS 
    'Synchronise automatiquement les modules d''un utilisateur quand son profil change';


-- ═══════════════════════════════════════════════════════════
-- 4️⃣ TRIGGER: Déclencher la sync quand le profil change
-- ═══════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS trigger_sync_modules_on_profile_change ON public.users;

CREATE TRIGGER trigger_sync_modules_on_profile_change
    AFTER INSERT OR UPDATE OF access_profile_code ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_user_modules_from_profile();

COMMENT ON TRIGGER trigger_sync_modules_on_profile_change ON public.users IS 
    'Auto-assigne les modules quand un profil est assigné à un utilisateur';


-- ═══════════════════════════════════════════════════════════
-- 5️⃣ FONCTION: Resync tous les utilisateurs d'un profil
-- Utile quand on modifie les modules d'un profil existant
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.resync_profile_users(p_profile_code VARCHAR(50))
RETURNS JSON AS $$
DECLARE
    v_user RECORD;
    v_count INTEGER := 0;
    v_module RECORD;
    v_module_count INTEGER;
BEGIN
    -- Vérifier que le profil existe
    IF NOT EXISTS (SELECT 1 FROM public.access_profiles WHERE code = p_profile_code) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Profil non trouvé: ' || p_profile_code
        );
    END IF;
    
    -- Pour chaque utilisateur avec ce profil
    FOR v_user IN 
        SELECT id FROM public.users WHERE access_profile_code = p_profile_code
    LOOP
        -- Supprimer les anciens modules de ce profil
        DELETE FROM public.user_modules 
        WHERE user_id = v_user.id 
        AND assigned_by_profile = p_profile_code;
        
        -- Réinsérer les modules actuels du profil
        v_module_count := 0;
        FOR v_module IN 
            SELECT module_id, can_read, can_write, can_delete, can_export
            FROM public.access_profile_modules
            WHERE access_profile_code = p_profile_code
        LOOP
            INSERT INTO public.user_modules (
                user_id, module_id, is_enabled, assigned_at, assigned_by_profile,
                can_read, can_write, can_delete, can_export
            ) VALUES (
                v_user.id, v_module.module_id, true, NOW(), p_profile_code,
                v_module.can_read, v_module.can_write, v_module.can_delete, v_module.can_export
            )
            ON CONFLICT (user_id, module_id) DO UPDATE SET
                is_enabled = true,
                assigned_by_profile = p_profile_code,
                can_read = EXCLUDED.can_read,
                can_write = EXCLUDED.can_write,
                can_delete = EXCLUDED.can_delete,
                can_export = EXCLUDED.can_export,
                updated_at = NOW();
            
            v_module_count := v_module_count + 1;
        END LOOP;
        
        v_count := v_count + 1;
    END LOOP;
    
    RETURN json_build_object(
        'success', true,
        'users_updated', v_count,
        'profile_code', p_profile_code
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.resync_profile_users(VARCHAR) IS 
    'Resynchronise les modules de tous les utilisateurs d''un profil donné';


-- ═══════════════════════════════════════════════════════════
-- 6️⃣ TRIGGER: Quand les modules d'un profil changent
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.on_profile_modules_change()
RETURNS TRIGGER AS $$
DECLARE
    v_profile_code VARCHAR(50);
BEGIN
    -- Déterminer le profil concerné
    IF TG_OP = 'DELETE' THEN
        v_profile_code := OLD.access_profile_code;
    ELSE
        v_profile_code := NEW.access_profile_code;
    END IF;
    
    -- Resync tous les utilisateurs de ce profil
    PERFORM public.resync_profile_users(v_profile_code);
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_resync_on_profile_modules_change ON public.access_profile_modules;

CREATE TRIGGER trigger_resync_on_profile_modules_change
    AFTER INSERT OR UPDATE OR DELETE ON public.access_profile_modules
    FOR EACH ROW
    EXECUTE FUNCTION public.on_profile_modules_change();

COMMENT ON TRIGGER trigger_resync_on_profile_modules_change ON public.access_profile_modules IS 
    'Resync automatique des utilisateurs quand les modules d''un profil changent';


-- ═══════════════════════════════════════════════════════════
-- 7️⃣ RLS POLICIES
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.access_profile_modules ENABLE ROW LEVEL SECURITY;

-- Super Admin: Accès total
DROP POLICY IF EXISTS "super_admin_full_access_apm" ON public.access_profile_modules;
CREATE POLICY "super_admin_full_access_apm"
    ON public.access_profile_modules FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Lecture publique pour les profils actifs
DROP POLICY IF EXISTS "read_active_profile_modules" ON public.access_profile_modules;
CREATE POLICY "read_active_profile_modules"
    ON public.access_profile_modules FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.access_profiles ap
            WHERE ap.code = access_profile_code AND ap.is_active = true
        )
    );


-- ═══════════════════════════════════════════════════════════
-- 8️⃣ VUE: Modules effectifs d'un utilisateur (avec permissions)
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.v_user_effective_modules AS
SELECT 
    um.user_id,
    um.module_id,
    m.name AS module_name,
    m.slug AS module_slug,
    m.icon AS module_icon,
    m.color AS module_color,
    m.category_id,
    bc.name AS category_name,
    bc.slug AS category_slug,
    bc.icon AS category_icon,
    bc.color AS category_color,
    um.is_enabled,
    um.can_read,
    um.can_write,
    um.can_delete,
    um.can_export,
    um.assigned_by_profile,
    um.assigned_at,
    CASE 
        WHEN um.assigned_by_profile IS NOT NULL THEN 'profile'
        ELSE 'manual'
    END AS assignment_type,
    ap.name_fr AS profile_name
FROM public.user_modules um
JOIN public.modules m ON m.id = um.module_id
LEFT JOIN public.business_categories bc ON bc.id = m.category_id
LEFT JOIN public.access_profiles ap ON ap.code = um.assigned_by_profile
WHERE um.is_enabled = true
AND m.status = 'active';

COMMENT ON VIEW public.v_user_effective_modules IS 
    'Vue des modules effectifs d''un utilisateur avec permissions et origine';


-- ═══════════════════════════════════════════════════════════
-- 9️⃣ FONCTION RPC: Récupérer les modules d'un utilisateur
-- Optimisée pour le frontend (React Query)
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_user_modules_with_permissions(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'module_id', module_id,
            'module_name', module_name,
            'module_slug', module_slug,
            'module_icon', module_icon,
            'module_color', module_color,
            'category_id', category_id,
            'category_name', category_name,
            'category_slug', category_slug,
            'category_icon', category_icon,
            'category_color', category_color,
            'permissions', json_build_object(
                'read', can_read,
                'write', can_write,
                'delete', can_delete,
                'export', can_export
            ),
            'assignment_type', assignment_type,
            'profile_name', profile_name,
            'assigned_at', assigned_at
        )
        ORDER BY category_name, module_name
    )
    INTO v_result
    FROM public.v_user_effective_modules
    WHERE user_id = p_user_id;
    
    RETURN COALESCE(v_result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_user_modules_with_permissions(UUID) IS 
    'Récupère tous les modules d''un utilisateur avec leurs permissions';


-- ═══════════════════════════════════════════════════════════
-- 🔟 GRANTS
-- ═══════════════════════════════════════════════════════════

GRANT SELECT ON public.access_profile_modules TO authenticated;
GRANT SELECT ON public.v_user_effective_modules TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_modules_with_permissions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resync_profile_users(VARCHAR) TO authenticated;

COMMIT;

-- ═══════════════════════════════════════════════════════════
-- ✅ VÉRIFICATION
-- ═══════════════════════════════════════════════════════════

SELECT '✅ Migration 021_unified_profile_modules_system.sql appliquée avec succès!' AS status;
SELECT 'Tables créées: access_profile_modules' AS info;
SELECT 'Triggers créés: trigger_sync_modules_on_profile_change, trigger_resync_on_profile_modules_change' AS info;
SELECT 'Fonctions créées: sync_user_modules_from_profile, resync_profile_users, get_user_modules_with_permissions' AS info;

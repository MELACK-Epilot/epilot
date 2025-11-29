-- ═══════════════════════════════════════════════════════════════════════════════
-- PERFECTIONNEMENT SYSTÈME (NIVEAU EXPERT)
-- Copie Intelligente avec Filtrage par Plan et Valeurs par Défaut
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════
-- 1️⃣ DÉFINIR LES CONFIGURATIONS PAR DÉFAUT (TEMPLATES)
-- On peuple access_profile_modules pour les templates (school_group_id IS NULL)
-- ═══════════════════════════════════════════════════════════

-- Nettoyer les anciens templates de modules s'il y en a
DELETE FROM public.access_profile_modules WHERE school_group_id IS NULL;

-- Insérer les configurations par défaut pour les templates globaux
-- (Utilise la logique métier définie précédemment)

-- 1.1 Chef d'établissement (Tout sauf suppression)
INSERT INTO public.access_profile_modules (access_profile_code, module_id, can_read, can_write, can_delete, can_export, school_group_id)
SELECT 'chef_etablissement', id, true, true, false, true, NULL
FROM public.modules WHERE status = 'active';

-- 1.2 Financier (Modules Finance uniquement)
INSERT INTO public.access_profile_modules (access_profile_code, module_id, can_read, can_write, can_delete, can_export, school_group_id)
SELECT 'financier_sans_suppression', m.id, true, true, false, true, NULL
FROM public.modules m
JOIN public.business_categories bc ON bc.id = m.category_id
WHERE m.status = 'active' AND bc.slug IN ('finances', 'comptabilite', 'finances-comptabilite');

-- 1.3 Secrétaire (Admin + Scolarité)
INSERT INTO public.access_profile_modules (access_profile_code, module_id, can_read, can_write, can_delete, can_export, school_group_id)
SELECT 'administratif_basique', m.id, true, true, false, true, NULL
FROM public.modules m
JOIN public.business_categories bc ON bc.id = m.category_id
WHERE m.status = 'active' AND bc.slug IN ('administration', 'scolarite', 'scolarite-admissions', 'inscriptions');

-- 1.4 Enseignant (Pédagogie)
INSERT INTO public.access_profile_modules (access_profile_code, module_id, can_read, can_write, can_delete, can_export, school_group_id)
SELECT 'enseignant_saisie_notes', m.id, true, true, false, false, NULL
FROM public.modules m
JOIN public.business_categories bc ON bc.id = m.category_id
WHERE m.status = 'active' AND bc.slug IN ('pedagogie', 'pedagogie-evaluations');

-- 1.5 Élève (Consultation)
INSERT INTO public.access_profile_modules (access_profile_code, module_id, can_read, can_write, can_delete, can_export, school_group_id)
SELECT 'eleve_consultation', m.id, true, false, false, false, NULL
FROM public.modules m
WHERE m.status = 'active' AND m.slug IN ('notes', 'bulletins', 'absences', 'emploi-du-temps', 'devoirs', 'messagerie');

-- 1.6 Parent (Consultation)
INSERT INTO public.access_profile_modules (access_profile_code, module_id, can_read, can_write, can_delete, can_export, school_group_id)
SELECT 'parent_consultation', m.id, true, false, false, false, NULL
FROM public.modules m
WHERE m.status = 'active' AND m.slug IN ('notes', 'bulletins', 'absences', 'retards', 'emploi-du-temps', 'devoirs', 'messagerie', 'paiements', 'frais-scolaires');


-- ═══════════════════════════════════════════════════════════
-- 2️⃣ AMÉLIORER LA FONCTION DE COPIE (CŒUR DU SYSTÈME)
-- Cette fonction fait le lien: Template -> Plan du Groupe -> Profil du Groupe
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.copy_template_profiles_to_group(
    p_school_group_id UUID,
    p_created_by UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_template RECORD;
    v_plan_id UUID;
    v_modules_count INTEGER := 0;
    v_profiles_count INTEGER := 0;
BEGIN
    -- 1. Récupérer le PLAN ACTIF du groupe
    SELECT plan_id INTO v_plan_id
    FROM public.subscriptions
    WHERE school_group_id = p_school_group_id AND status = 'active'
    LIMIT 1;

    -- Si pas de plan, on prend le plan par défaut (ex: Gratuit) ou on log un warning
    IF v_plan_id IS NULL THEN
        RAISE NOTICE '⚠️ Attention: Aucun plan actif trouvé pour le groupe %. Les profils seront créés sans modules.', p_school_group_id;
    END IF;

    -- 2. Boucle sur chaque Profil Template
    FOR v_template IN 
        SELECT * FROM public.access_profiles 
        WHERE is_template = true AND is_active = true
    LOOP
        -- A. Créer le profil pour le groupe
        INSERT INTO public.access_profiles (
            code, name_fr, name_en, description, permissions, icon,
            is_active, school_group_id, created_by, is_template
        ) VALUES (
            v_template.code, v_template.name_fr, v_template.name_en,
            v_template.description, v_template.permissions, v_template.icon,
            true, p_school_group_id, p_created_by, false
        )
        ON CONFLICT (school_group_id, code) DO NOTHING;
        
        v_profiles_count := v_profiles_count + 1;

        -- B. Copier les modules, MAIS filtrer par le PLAN du groupe
        IF v_plan_id IS NOT NULL THEN
            INSERT INTO public.access_profile_modules (
                access_profile_code, school_group_id, module_id,
                can_read, can_write, can_delete, can_export, created_by
            )
            SELECT 
                v_template.code,
                p_school_group_id,
                apm.module_id,
                apm.can_read,
                apm.can_write,
                apm.can_delete,
                apm.can_export,
                p_created_by
            FROM public.access_profile_modules apm
            -- Jointure pour vérifier que le module est dans le PLAN
            JOIN public.plan_modules pm ON pm.module_id = apm.module_id AND pm.plan_id = v_plan_id
            WHERE apm.access_profile_code = v_template.code 
            AND apm.school_group_id IS NULL -- C'est un module de template
            ON CONFLICT (school_group_id, access_profile_code, module_id) DO NOTHING;
            
            GET DIAGNOSTICS v_modules_count = ROW_COUNT;
        END IF;
        
    END LOOP;
    
    RAISE NOTICE '✅ Terminé: % profils créés/vérifiés pour le groupe %', v_profiles_count, p_school_group_id;
    RETURN v_profiles_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ═══════════════════════════════════════════════════════════
-- 3️⃣ APPLIQUER RÉTROACTIVEMENT (Auto-repair)
-- ═══════════════════════════════════════════════════════════

-- Relancer la copie pour tous les groupes existants pour peupler leurs modules
DO $$
DECLARE
    v_group RECORD;
BEGIN
    FOR v_group IN SELECT id, name FROM public.school_groups
    LOOP
        PERFORM public.copy_template_profiles_to_group(v_group.id, NULL);
        RAISE NOTICE '♻️  Groupe % mis à jour avec les modules par défaut', v_group.name;
    END LOOP;
END $$;

COMMIT;

SELECT '✅ SYSTÈME PARFAIT DYNAMIQUE ACTIVÉ' AS status;

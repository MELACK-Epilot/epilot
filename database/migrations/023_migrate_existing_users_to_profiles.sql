-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION: Assigner les profils aux utilisateurs existants
-- ═══════════════════════════════════════════════════════════════════════════════
-- 
-- Cette migration assigne automatiquement un profil d'accès aux utilisateurs
-- existants basé sur leur rôle actuel.
--
-- MAPPING RÔLE → PROFIL:
-- - proviseur, directeur, directeur_etudes → chef_etablissement
-- - comptable → financier_sans_suppression
-- - secretaire → administratif_basique
-- - enseignant → enseignant_saisie_notes
-- - parent → parent_consultation
-- - eleve → eleve_consultation
-- - cpe, surveillant → enseignant_saisie_notes (accès pédagogie)
-- - bibliothecaire, infirmier, etc. → administratif_basique
--
-- NOTE: Les admin_groupe et super_admin ne reçoivent PAS de profil
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════
-- 1️⃣ Créer une fonction de mapping rôle → profil
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_default_profile_for_role(p_role VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
    RETURN CASE p_role
        -- Direction → Chef d'établissement
        WHEN 'proviseur' THEN 'chef_etablissement'
        WHEN 'directeur' THEN 'chef_etablissement'
        WHEN 'directeur_etudes' THEN 'chef_etablissement'
        
        -- Finance → Comptable
        WHEN 'comptable' THEN 'financier_sans_suppression'
        
        -- Administration → Secrétaire
        WHEN 'secretaire' THEN 'administratif_basique'
        
        -- Pédagogie → Enseignant
        WHEN 'enseignant' THEN 'enseignant_saisie_notes'
        WHEN 'cpe' THEN 'enseignant_saisie_notes'
        WHEN 'surveillant' THEN 'enseignant_saisie_notes'
        
        -- Services → Administratif basique
        WHEN 'bibliothecaire' THEN 'administratif_basique'
        WHEN 'infirmier' THEN 'administratif_basique'
        WHEN 'gestionnaire_cantine' THEN 'administratif_basique'
        WHEN 'conseiller_orientation' THEN 'administratif_basique'
        
        -- Utilisateurs finaux
        WHEN 'parent' THEN 'parent_consultation'
        WHEN 'eleve' THEN 'eleve_consultation'
        
        -- Autres → Pas de profil par défaut
        ELSE NULL
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.get_default_profile_for_role(VARCHAR) IS 
    'Retourne le code du profil d''accès par défaut pour un rôle donné';


-- ═══════════════════════════════════════════════════════════
-- 2️⃣ Migrer les utilisateurs existants
-- ═══════════════════════════════════════════════════════════

-- Mettre à jour les utilisateurs qui n'ont pas encore de profil
UPDATE public.users
SET 
    access_profile_code = public.get_default_profile_for_role(role::VARCHAR),
    updated_at = NOW()
WHERE 
    access_profile_code IS NULL
    AND role NOT IN ('super_admin', 'admin_groupe')
    AND public.get_default_profile_for_role(role::VARCHAR) IS NOT NULL;

-- Afficher le résultat
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM public.users
    WHERE access_profile_code IS NOT NULL
    AND role NOT IN ('super_admin', 'admin_groupe');
    
    RAISE NOTICE '✅ % utilisateurs ont maintenant un profil d''accès', v_count;
END $$;


-- ═══════════════════════════════════════════════════════════
-- 3️⃣ Synchroniser les modules pour tous les utilisateurs migrés
-- ═══════════════════════════════════════════════════════════

-- Cette fonction va déclencher le trigger pour chaque utilisateur
-- qui a un profil mais pas encore de modules assignés

DO $$
DECLARE
    v_user RECORD;
    v_count INTEGER := 0;
BEGIN
    -- Pour chaque utilisateur avec un profil mais sans modules du profil
    FOR v_user IN 
        SELECT DISTINCT u.id, u.access_profile_code
        FROM public.users u
        WHERE u.access_profile_code IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 FROM public.user_modules um
            WHERE um.user_id = u.id
            AND um.assigned_by_profile = u.access_profile_code
        )
    LOOP
        -- Forcer la resync en faisant un UPDATE "fictif"
        -- Le trigger sync_user_modules_from_profile va s'exécuter
        UPDATE public.users
        SET updated_at = NOW()
        WHERE id = v_user.id;
        
        v_count := v_count + 1;
    END LOOP;
    
    RAISE NOTICE '✅ % utilisateurs synchronisés avec leurs modules de profil', v_count;
END $$;


-- ═══════════════════════════════════════════════════════════
-- 4️⃣ Vérification finale
-- ═══════════════════════════════════════════════════════════

SELECT 
    'Statistiques de migration' AS info,
    (SELECT COUNT(*) FROM public.users WHERE access_profile_code IS NOT NULL) AS users_with_profile,
    (SELECT COUNT(*) FROM public.users WHERE access_profile_code IS NULL AND role NOT IN ('super_admin', 'admin_groupe')) AS users_without_profile,
    (SELECT COUNT(DISTINCT user_id) FROM public.user_modules WHERE assigned_by_profile IS NOT NULL) AS users_with_profile_modules;

-- Détail par profil
SELECT 
    ap.name_fr AS profile_name,
    ap.code AS profile_code,
    COUNT(u.id) AS user_count,
    (SELECT COUNT(*) FROM public.access_profile_modules apm WHERE apm.access_profile_code = ap.code) AS module_count
FROM public.access_profiles ap
LEFT JOIN public.users u ON u.access_profile_code = ap.code
GROUP BY ap.id, ap.name_fr, ap.code
ORDER BY user_count DESC;

COMMIT;

SELECT '✅ Migration des utilisateurs existants terminée!' AS status;

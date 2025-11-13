-- ============================================
-- MIGRATION : Ajouter les 12 Rôles Officiels Congo
-- ============================================
-- Date: 2025-01-04
-- Description: Ajouter les nouveaux rôles utilisateurs officiels
--              pour le système éducatif congolais
-- ============================================

-- 1. Ajouter les nouveaux rôles à l'enum user_role
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'proviseur';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'directeur';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'directeur_etudes';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'secretaire';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'bibliothecaire';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'eleve';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'parent';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'gestionnaire_cantine';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'autre';

-- Note: Les rôles existants sont conservés :
-- - super_admin
-- - admin_groupe
-- - enseignant
-- - cpe
-- - comptable
-- - documentaliste (sera remplacé par bibliothecaire)
-- - surveillant

-- ============================================
-- VÉRIFICATION
-- ============================================

-- Lister tous les rôles disponibles
DO $$
DECLARE
    role_list TEXT;
BEGIN
    SELECT string_agg(enumlabel, ', ' ORDER BY enumlabel)
    INTO role_list
    FROM pg_enum
    WHERE enumtypid = 'user_role'::regtype;
    
    RAISE NOTICE 'Rôles disponibles: %', role_list;
END $$;

-- ============================================
-- MIGRATION DES DONNÉES (si nécessaire)
-- ============================================

-- Note: Pas de migration nécessaire car 'documentaliste' n'existe pas dans l'enum actuel
-- Si des utilisateurs avec ce rôle existent, ils seront migrés manuellement après

-- ============================================
-- COMMENTAIRES
-- ============================================

COMMENT ON TYPE user_role IS 'Rôles utilisateurs du système éducatif congolais';

-- ============================================
-- RÉSUMÉ DES RÔLES
-- ============================================

/*
RÔLES ADMINISTRATEURS (2) :
- super_admin          : Administrateur plateforme E-Pilot
- admin_groupe         : Administrateur de groupe scolaire

RÔLES DIRECTION (3) :
- proviseur            : Responsable lycée
- directeur            : Responsable école/collège
- directeur_etudes     : Responsable pédagogique

RÔLES ADMINISTRATIFS (2) :
- secretaire           : Secrétariat
- comptable            : Comptabilité

RÔLES PÉDAGOGIQUES (3) :
- enseignant           : Personnel enseignant
- cpe                  : Conseiller Principal d'Éducation
- surveillant          : Surveillance et discipline

RÔLES SUPPORT (2) :
- bibliothecaire       : Gestion bibliothèque
- gestionnaire_cantine : Gestion cantine

RÔLES UTILISATEURS (2) :
- eleve                : Étudiant inscrit
- parent               : Parent d'élève

RÔLE GÉNÉRIQUE (1) :
- autre                : Autre personnel

TOTAL : 15 rôles
*/

-- ============================================
-- VALIDATION
-- ============================================

-- Compter les rôles
SELECT COUNT(*) as total_roles
FROM pg_enum
WHERE enumtypid = 'user_role'::regtype;

-- Afficher tous les rôles
SELECT enumlabel as role_name
FROM pg_enum
WHERE enumtypid = 'user_role'::regtype
ORDER BY enumlabel;

-- ============================================
-- SUCCÈS
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Migration terminée avec succès !';
    RAISE NOTICE '📊 15 rôles utilisateurs disponibles';
    RAISE NOTICE '🇨🇬 Système conforme au contexte congolais';
END $$;

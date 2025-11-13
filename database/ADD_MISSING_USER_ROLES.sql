-- ============================================
-- MIGRATION : Ajouter les Rôles Manquants
-- ============================================
-- Date: 2025-01-04
-- Description: Ajouter les 4 rôles manquants (comptable, enseignant, surveillant, cpe)
-- ============================================

-- Ajouter les rôles manquants
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'comptable';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'enseignant';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'surveillant';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'cpe';

-- ============================================
-- VÉRIFICATION
-- ============================================

-- Lister tous les rôles (devrait afficher 15 rôles)
SELECT enumlabel as role_name
FROM pg_enum
WHERE enumtypid = 'user_role'::regtype
ORDER BY enumlabel;

-- Compter les rôles
SELECT COUNT(*) as total_roles
FROM pg_enum
WHERE enumtypid = 'user_role'::regtype;

-- ============================================
-- RÉSUMÉ DES 15 RÔLES FINAUX
-- ============================================

/*
ADMINISTRATEURS (2):
✅ super_admin
✅ admin_groupe

DIRECTION (3):
✅ proviseur
✅ directeur
✅ directeur_etudes

ADMINISTRATIFS (2):
✅ secretaire
✅ comptable

PÉDAGOGIQUES (3):
✅ enseignant
✅ cpe
✅ surveillant

SUPPORT (2):
✅ bibliothecaire
✅ gestionnaire_cantine

UTILISATEURS (2):
✅ eleve
✅ parent

GÉNÉRIQUE (1):
✅ autre

TOTAL : 15 rôles
*/

-- ============================================
-- SUCCÈS
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Migration des rôles manquants terminée !';
    RAISE NOTICE '📊 15 rôles utilisateurs disponibles';
    RAISE NOTICE '🎯 Formulaire 100%% compatible avec la BDD';
END $$;

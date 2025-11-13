/**
 * Correction de l'enum user_role pour inclure tous les rôles définis dans l'application
 * Résout l'erreur: invalid input value for enum user_role: "student"
 * 
 * ARCHITECTURE E-PILOT :
 * - super_admin : Gère toute la plateforme
 * - admin_groupe : Gère un groupe scolaire ET toutes ses écoles
 * - Autres rôles : Personnel des écoles (directeur, enseignant, etc.)
 * 
 * NOTE : admin_ecole N'EXISTE PAS - admin_groupe gère plusieurs écoles
 * @module FIX_USER_ROLE_ENUM
 */

-- =====================================================
-- ÉTAPE 1 : Ajouter les nouveaux rôles à l'enum
-- =====================================================

-- Ajouter les rôles de direction (dans les écoles)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'proviseur';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'directeur';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'directeur_etudes';

-- Ajouter les rôles administratifs
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'secretaire';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'comptable';

-- Ajouter les rôles éducatifs
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'enseignant';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'cpe';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'surveillant';

-- Ajouter les rôles spécialisés
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'bibliothecaire';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'gestionnaire_cantine';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'conseiller_orientation';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'infirmier';

-- Ajouter les utilisateurs finaux
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'eleve';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'parent';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'autre';

-- Ajouter les alias courants (pour compatibilité)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'student'; -- Alias pour 'eleve'
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'teacher'; -- Alias pour 'enseignant'

-- =====================================================
-- ÉTAPE 2 : Vérifier les valeurs ajoutées
-- =====================================================

-- Afficher toutes les valeurs de l'enum user_role
SELECT enumlabel as role_value 
FROM pg_enum 
WHERE enumtypid = (
  SELECT oid 
  FROM pg_type 
  WHERE typname = 'user_role'
)
ORDER BY enumlabel;

-- =====================================================
-- ÉTAPE 3 : Mettre à jour les contraintes si nécessaire
-- =====================================================

-- Vérifier s'il y a des contraintes CHECK sur la table users
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
  AND contype = 'c';

-- =====================================================
-- ÉTAPE 4 : Messages de confirmation
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Enum user_role mis à jour avec succès !';
  RAISE NOTICE '📋 Rôles disponibles :';
  RAISE NOTICE '   - Admins : super_admin, admin_groupe';
  RAISE NOTICE '   - Direction École : proviseur, directeur, directeur_etudes';
  RAISE NOTICE '   - Administratif : secretaire, comptable';
  RAISE NOTICE '   - Éducatif : enseignant, cpe, surveillant';
  RAISE NOTICE '   - Spécialisé : bibliothecaire, gestionnaire_cantine, conseiller_orientation, infirmier';
  RAISE NOTICE '   - Utilisateurs : eleve, parent, autre';
  RAISE NOTICE '   - Alias : student, teacher';
  RAISE NOTICE '';
  RAISE NOTICE '🏗️ ARCHITECTURE E-PILOT :';
  RAISE NOTICE '   - super_admin → Gère toute la plateforme';
  RAISE NOTICE '   - admin_groupe → Gère un groupe scolaire + toutes ses écoles';
  RAISE NOTICE '   - directeur/proviseur → Dirige une école spécifique';
  RAISE NOTICE '   - Autres → Personnel des écoles';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 L''erreur "invalid input value for enum user_role: student" est maintenant corrigée !';
END $$;

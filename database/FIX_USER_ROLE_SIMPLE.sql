/**
 * CORRECTION SIMPLE DES RÔLES UTILISATEURS
 * Version simplifiée qui évite les conflits de contraintes
 * Ajoute seulement les rôles manquants sans toucher aux contraintes existantes
 * 
 * @module FIX_USER_ROLE_SIMPLE
 */

-- =====================================================
-- AJOUTER LES RÔLES MANQUANTS UNIQUEMENT
-- =====================================================

-- Rôles de direction (dans les écoles)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'proviseur';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'directeur';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'directeur_etudes';

-- Rôles administratifs
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'secretaire';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'comptable';

-- Rôles éducatifs
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'enseignant';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'cpe';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'surveillant';

-- Rôles spécialisés
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'bibliothecaire';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'gestionnaire_cantine';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'conseiller_orientation';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'infirmier';

-- Utilisateurs finaux
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'eleve';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'parent';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'autre';

-- Alias (compatibilité)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'student'; -- Alias pour 'eleve'
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'teacher'; -- Alias pour 'enseignant'

-- =====================================================
-- VÉRIFICATION DES RÔLES AJOUTÉS
-- =====================================================

-- Afficher tous les rôles disponibles
SELECT enumlabel as role_value 
FROM pg_enum 
WHERE enumtypid = (
  SELECT oid 
  FROM pg_type 
  WHERE typname = 'user_role'
)
ORDER BY enumlabel;

-- =====================================================
-- MESSAGES DE CONFIRMATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '🎉 RÔLES AJOUTÉS AVEC SUCCÈS !';
  RAISE NOTICE '';
  RAISE NOTICE '✅ RÔLES DISPONIBLES :';
  RAISE NOTICE '   - Direction : proviseur, directeur, directeur_etudes';
  RAISE NOTICE '   - Administratif : secretaire, comptable';
  RAISE NOTICE '   - Éducatif : enseignant, cpe, surveillant';
  RAISE NOTICE '   - Spécialisé : bibliothecaire, gestionnaire_cantine, etc.';
  RAISE NOTICE '   - Utilisateurs : eleve, parent, autre';
  RAISE NOTICE '   - Alias : student, teacher';
  RAISE NOTICE '';
  RAISE NOTICE '🏗️ ARCHITECTURE E-PILOT :';
  RAISE NOTICE '   - super_admin → Plateforme complète';
  RAISE NOTICE '   - admin_groupe → Groupe + écoles';
  RAISE NOTICE '   - Autres rôles → Personnel des écoles';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 ERREUR "invalid input value for enum user_role: student" CORRIGÉE !';
  RAISE NOTICE '🚀 Vous pouvez maintenant créer des utilisateurs avec tous les rôles !';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  CONTRAINTES EXISTANTES PRÉSERVÉES (pas de modification)';
END $$;

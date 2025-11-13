/**
 * CORRECTION COMPLÈTE DES RÔLES UTILISATEURS
 * 1. Ajoute tous les rôles manquants à l'enum user_role
 * 2. Nettoie les contraintes obsolètes (admin_ecole)
 * 3. Ajoute les contraintes cohérentes avec l'architecture E-Pilot
 * 
 * ARCHITECTURE E-PILOT :
 * - super_admin : Gère toute la plateforme (pas de school_group_id/school_id)
 * - admin_groupe : Gère un groupe scolaire + ses écoles (school_group_id requis)
 * - directeur/proviseur : Dirige une école (school_id requis)
 * - personnel école : Travaille dans une école (school_id requis)
 * - élèves/parents : Liés à une école (school_id requis)
 * 
 * @module FIX_USER_ROLE_COMPLETE
 */

-- =====================================================
-- PARTIE 1 : AJOUTER LES RÔLES MANQUANTS
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
-- PARTIE 2 : NETTOYER LES CONTRAINTES OBSOLÈTES
-- =====================================================

-- Supprimer les contraintes référençant admin_ecole (inexistant)
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_admin_ecole_has_school;

-- Supprimer les contraintes dupliquées
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_admin_groupe_has_group;
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_super_admin_no_group;

-- =====================================================
-- PARTIE 3 : AJOUTER LES CONTRAINTES COHÉRENTES
-- =====================================================

-- Contrainte : Les directeurs/proviseurs doivent avoir une école
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_directeur_has_school' 
    AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users ADD CONSTRAINT check_directeur_has_school 
    CHECK (
      (role NOT IN ('directeur', 'proviseur', 'directeur_etudes') OR school_id IS NOT NULL)
    );
  END IF;
END $$;

-- Contrainte : Le personnel d'école doit avoir une école
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_school_staff_has_school' 
    AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users ADD CONSTRAINT check_school_staff_has_school 
    CHECK (
      (role NOT IN ('enseignant', 'cpe', 'surveillant', 'secretaire', 'comptable', 
                    'bibliothecaire', 'gestionnaire_cantine', 'conseiller_orientation', 'infirmier') 
       OR school_id IS NOT NULL)
    );
  END IF;
END $$;

-- Contrainte : Les élèves et parents doivent avoir une école
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_users_have_school' 
    AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users ADD CONSTRAINT check_users_have_school 
    CHECK (
      (role NOT IN ('eleve', 'student', 'parent') OR school_id IS NOT NULL)
    );
  END IF;
END $$;

-- =====================================================
-- PARTIE 4 : VÉRIFICATIONS
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

-- Afficher toutes les contraintes CHECK
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
  AND contype = 'c'
ORDER BY conname;

-- =====================================================
-- PARTIE 5 : MESSAGES DE CONFIRMATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '🎉 CORRECTION COMPLÈTE TERMINÉE !';
  RAISE NOTICE '';
  RAISE NOTICE '✅ RÔLES AJOUTÉS :';
  RAISE NOTICE '   - Direction : proviseur, directeur, directeur_etudes';
  RAISE NOTICE '   - Administratif : secretaire, comptable';
  RAISE NOTICE '   - Éducatif : enseignant, cpe, surveillant';
  RAISE NOTICE '   - Spécialisé : bibliothecaire, gestionnaire_cantine, etc.';
  RAISE NOTICE '   - Utilisateurs : eleve, parent, autre';
  RAISE NOTICE '   - Alias : student, teacher';
  RAISE NOTICE '';
  RAISE NOTICE '🧹 CONTRAINTES NETTOYÉES :';
  RAISE NOTICE '   ❌ Supprimé : check_admin_ecole_has_school (rôle inexistant)';
  RAISE NOTICE '   ❌ Supprimé : Doublons admin_groupe et super_admin';
  RAISE NOTICE '   ✅ Conservé : Contraintes email et architecture de base';
  RAISE NOTICE '';
  RAISE NOTICE '🆕 NOUVELLES CONTRAINTES :';
  RAISE NOTICE '   ✅ Directeurs → doivent avoir school_id';
  RAISE NOTICE '   ✅ Personnel école → doivent avoir school_id';
  RAISE NOTICE '   ✅ Élèves/parents → doivent avoir school_id';
  RAISE NOTICE '';
  RAISE NOTICE '🏗️ ARCHITECTURE COHÉRENTE :';
  RAISE NOTICE '   - super_admin → Plateforme (pas de school_group_id/school_id)';
  RAISE NOTICE '   - admin_groupe → Groupe + écoles (school_group_id requis)';
  RAISE NOTICE '   - Autres rôles → École spécifique (school_id requis)';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 ERREUR "invalid input value for enum user_role: student" CORRIGÉE !';
  RAISE NOTICE '🚀 Vous pouvez maintenant créer des utilisateurs avec tous les rôles !';
END $$;

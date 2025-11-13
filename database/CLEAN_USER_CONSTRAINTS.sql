/**
 * Nettoyage des contraintes obsolètes sur la table users
 * Supprime les références à admin_ecole qui n'existe pas dans l'architecture E-Pilot
 * @module CLEAN_USER_CONSTRAINTS
 */

-- =====================================================
-- ÉTAPE 1 : Supprimer les contraintes obsolètes
-- =====================================================

-- Supprimer la contrainte admin_ecole (rôle inexistant)
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_admin_ecole_has_school;

-- Supprimer les contraintes dupliquées
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_admin_groupe_has_group;
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_super_admin_no_group;

-- =====================================================
-- ÉTAPE 2 : Garder les contraintes correctes
-- =====================================================

-- Ces contraintes sont correctes et doivent rester :
-- ✅ check_admin_groupe_has_school_group
-- ✅ check_email_format  
-- ✅ check_super_admin_no_school_group

-- =====================================================
-- ÉTAPE 3 : Ajouter contraintes pour nouveaux rôles
-- =====================================================

-- Contrainte : Les directeurs/proviseurs doivent avoir une école
ALTER TABLE users ADD CONSTRAINT check_directeur_has_school 
CHECK (
  (role NOT IN ('directeur', 'proviseur', 'directeur_etudes') OR school_id IS NOT NULL)
);

-- Contrainte : Le personnel d'école doit avoir une école
ALTER TABLE users ADD CONSTRAINT check_school_staff_has_school 
CHECK (
  (role NOT IN ('enseignant', 'cpe', 'surveillant', 'secretaire', 'comptable', 
                'bibliothecaire', 'gestionnaire_cantine', 'conseiller_orientation', 'infirmier') 
   OR school_id IS NOT NULL)
);

-- Contrainte : Les élèves et parents doivent avoir une école
ALTER TABLE users ADD CONSTRAINT check_users_have_school 
CHECK (
  (role NOT IN ('eleve', 'student', 'parent') OR school_id IS NOT NULL)
);

-- =====================================================
-- ÉTAPE 4 : Vérifier les contraintes finales
-- =====================================================

-- Afficher toutes les contraintes CHECK restantes
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
  AND contype = 'c'
ORDER BY conname;

-- =====================================================
-- ÉTAPE 5 : Messages de confirmation
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Contraintes users nettoyées avec succès !';
  RAISE NOTICE '';
  RAISE NOTICE '❌ SUPPRIMÉES :';
  RAISE NOTICE '   - check_admin_ecole_has_school (rôle inexistant)';
  RAISE NOTICE '   - check_admin_groupe_has_group (doublons)';
  RAISE NOTICE '   - check_super_admin_no_group (doublons)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ CONSERVÉES :';
  RAISE NOTICE '   - check_admin_groupe_has_school_group';
  RAISE NOTICE '   - check_email_format';
  RAISE NOTICE '   - check_super_admin_no_school_group';
  RAISE NOTICE '';
  RAISE NOTICE '🆕 AJOUTÉES :';
  RAISE NOTICE '   - check_directeur_has_school';
  RAISE NOTICE '   - check_school_staff_has_school';
  RAISE NOTICE '   - check_users_have_school';
  RAISE NOTICE '';
  RAISE NOTICE '🏗️ ARCHITECTURE COHÉRENTE :';
  RAISE NOTICE '   - super_admin : Pas de school_group_id ni school_id';
  RAISE NOTICE '   - admin_groupe : Doit avoir school_group_id';
  RAISE NOTICE '   - directeur/proviseur : Doit avoir school_id';
  RAISE NOTICE '   - personnel école : Doit avoir school_id';
  RAISE NOTICE '   - élèves/parents : Doit avoir school_id';
END $$;

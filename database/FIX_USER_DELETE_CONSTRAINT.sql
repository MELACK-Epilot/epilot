/**
 * Correction de la contrainte de clé étrangère user_module_permissions_assigned_by_fkey
 * Permet la suppression d'utilisateurs même s'ils ont assigné des permissions
 * @module FIX_USER_DELETE_CONSTRAINT
 */

-- =====================================================
-- ÉTAPE 1 : SUPPRIMER L'ANCIENNE CONTRAINTE
-- =====================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_module_permissions_assigned_by_fkey'
  ) THEN
    ALTER TABLE user_module_permissions 
    DROP CONSTRAINT user_module_permissions_assigned_by_fkey;
    RAISE NOTICE '✅ Ancienne contrainte supprimée';
  ELSE
    RAISE NOTICE 'ℹ️  Contrainte n''existe pas, passage à la création';
  END IF;
END $$;

-- =====================================================
-- ÉTAPE 2 : RECRÉER LA CONTRAINTE AVEC ON DELETE SET NULL
-- =====================================================

ALTER TABLE user_module_permissions
ADD CONSTRAINT user_module_permissions_assigned_by_fkey
FOREIGN KEY (assigned_by)
REFERENCES users(id)
ON DELETE SET NULL;

-- =====================================================
-- ÉTAPE 3 : VÉRIFIER D'AUTRES CONTRAINTES SIMILAIRES
-- =====================================================

-- Lister toutes les contraintes de clés étrangères pointant vers users
SELECT 
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND ccu.table_name = 'users'
ORDER BY tc.table_name;

-- =====================================================
-- ÉTAPE 4 : CORRIGER D'AUTRES CONTRAINTES PROBLÉMATIQUES
-- =====================================================

-- Vérifier et corriger schools.created_by
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'schools_created_by_fkey'
  ) THEN
    ALTER TABLE schools DROP CONSTRAINT IF EXISTS schools_created_by_fkey;
    ALTER TABLE schools
    ADD CONSTRAINT schools_created_by_fkey
    FOREIGN KEY (created_by)
    REFERENCES users(id)
    ON DELETE SET NULL;
    RAISE NOTICE '✅ Contrainte schools_created_by_fkey corrigée';
  END IF;
END $$;

-- Vérifier et corriger school_groups.created_by
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'school_groups_created_by_fkey'
  ) THEN
    ALTER TABLE school_groups DROP CONSTRAINT IF EXISTS school_groups_created_by_fkey;
    ALTER TABLE school_groups
    ADD CONSTRAINT school_groups_created_by_fkey
    FOREIGN KEY (created_by)
    REFERENCES users(id)
    ON DELETE SET NULL;
    RAISE NOTICE '✅ Contrainte school_groups_created_by_fkey corrigée';
  END IF;
END $$;

-- Vérifier et corriger system_alerts.created_by
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'system_alerts_created_by_fkey'
  ) THEN
    ALTER TABLE system_alerts DROP CONSTRAINT IF EXISTS system_alerts_created_by_fkey;
    ALTER TABLE system_alerts
    ADD CONSTRAINT system_alerts_created_by_fkey
    FOREIGN KEY (created_by)
    REFERENCES users(id)
    ON DELETE SET NULL;
    RAISE NOTICE '✅ Contrainte system_alerts_created_by_fkey corrigée';
  END IF;
END $$;

-- =====================================================
-- MESSAGES DE CONFIRMATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 CORRECTION DES CONTRAINTES TERMINÉE !';
  RAISE NOTICE '';
  RAISE NOTICE '✅ MODIFICATIONS APPLIQUÉES :';
  RAISE NOTICE '   - user_module_permissions.assigned_by → ON DELETE SET NULL';
  RAISE NOTICE '   - schools.created_by → ON DELETE SET NULL';
  RAISE NOTICE '   - school_groups.created_by → ON DELETE SET NULL';
  RAISE NOTICE '   - system_alerts.created_by → ON DELETE SET NULL';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 COMPORTEMENT :';
  RAISE NOTICE '   - Suppression d''un utilisateur → assigned_by/created_by = NULL';
  RAISE NOTICE '   - Pas de blocage, pas de cascade';
  RAISE NOTICE '   - Historique préservé (enregistrements conservés)';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Vous pouvez maintenant supprimer des admin groupes sans erreur !';
END $$;

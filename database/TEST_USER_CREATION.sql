-- =====================================================
-- SCRIPT DE TEST : Création d'utilisateurs
-- Vérifie que la base est prête pour créer des users
-- Date : 4 novembre 2025
-- =====================================================

-- =====================================================
-- 1. VÉRIFIER LES ENUMS
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '=== VÉRIFICATION DES ENUMS ===';
  
  -- Vérifier user_role
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    RAISE NOTICE '✅ ENUM user_role existe';
    RAISE NOTICE '   Valeurs: %', (
      SELECT string_agg(enumlabel, ', ' ORDER BY enumsortorder)
      FROM pg_enum
      WHERE enumtypid = 'user_role'::regtype
    );
  ELSE
    RAISE NOTICE '❌ ENUM user_role MANQUANT';
  END IF;
  
  -- Vérifier user_status
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
    RAISE NOTICE '✅ ENUM user_status existe';
    RAISE NOTICE '   Valeurs: %', (
      SELECT string_agg(enumlabel, ', ' ORDER BY enumsortorder)
      FROM pg_enum
      WHERE enumtypid = 'user_status'::regtype
    );
  ELSE
    RAISE NOTICE '❌ ENUM user_status MANQUANT';
  END IF;
  
  -- Vérifier user_gender
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_gender') THEN
    RAISE NOTICE '✅ ENUM user_gender existe';
    RAISE NOTICE '   Valeurs: %', (
      SELECT string_agg(enumlabel, ', ' ORDER BY enumsortorder)
      FROM pg_enum
      WHERE enumtypid = 'user_gender'::regtype
    );
  ELSE
    RAISE NOTICE '❌ ENUM user_gender MANQUANT';
  END IF;
END $$;

-- =====================================================
-- 2. VÉRIFIER LES CONTRAINTES CHECK
-- =====================================================

DO $$
DECLARE
  constraint_count INT;
  constraint_name TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== VÉRIFICATION DES CONTRAINTES CHECK ===';
  
  SELECT COUNT(*) INTO constraint_count
  FROM pg_constraint
  WHERE conrelid = 'users'::regclass
  AND contype = 'c'
  AND conname LIKE 'check_%';
  
  RAISE NOTICE '✅ Nombre de contraintes CHECK: %', constraint_count;
  
  -- Lister les contraintes
  FOR constraint_name IN (
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'users'::regclass
    AND contype = 'c'
    AND conname LIKE 'check_%'
  ) LOOP
    RAISE NOTICE '   - %', constraint_name;
  END LOOP;
END $$;

-- =====================================================
-- 3. VÉRIFIER LES GROUPES SCOLAIRES
-- =====================================================

DO $$
DECLARE
  group_count INT;
  group_record RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== VÉRIFICATION DES GROUPES SCOLAIRES ===';
  
  SELECT COUNT(*) INTO group_count FROM school_groups;
  
  IF group_count > 0 THEN
    RAISE NOTICE '✅ Groupes scolaires disponibles: %', group_count;
    RAISE NOTICE '   Premiers groupes:';
    FOR group_record IN (
      SELECT name, code
      FROM school_groups
      LIMIT 3
    ) LOOP
      RAISE NOTICE '   - % (%)', group_record.name, group_record.code;
    END LOOP;
  ELSE
    RAISE NOTICE '⚠️ AUCUN GROUPE SCOLAIRE';
    RAISE NOTICE '   Créez au moins un groupe pour tester admin_groupe';
  END IF;
END $$;

-- =====================================================
-- 4. TESTER L'INSERTION D'UN SUPER ADMIN
-- =====================================================

DO $$
DECLARE
  test_id UUID;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== TEST 1: CRÉATION SUPER ADMIN ===';
  
  BEGIN
    test_id := gen_random_uuid();
    
    INSERT INTO users (
      id, first_name, last_name, email, phone,
      role, status, school_group_id, school_id
    ) VALUES (
      test_id,
      'Test', 'SuperAdmin', 'test.superadmin.sql@epilot.cg', '+242069698620',
      'super_admin', 'active', NULL, NULL
    );
    
    RAISE NOTICE '✅ Super Admin créé avec succès';
    RAISE NOTICE '   ID: %', test_id;
    
    -- Nettoyer
    DELETE FROM users WHERE id = test_id;
    RAISE NOTICE '✅ Test nettoyé';
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '❌ ERREUR: %', SQLERRM;
      RAISE NOTICE '   Code: %', SQLSTATE;
  END;
END $$;

-- =====================================================
-- 5. TESTER L'INSERTION D'UN ADMIN GROUPE
-- =====================================================

DO $$
DECLARE
  test_id UUID;
  first_group_id UUID;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== TEST 2: CRÉATION ADMIN GROUPE ===';
  
  -- Récupérer le premier groupe
  SELECT id INTO first_group_id FROM school_groups LIMIT 1;
  
  IF first_group_id IS NULL THEN
    RAISE NOTICE '⚠️ SKIP: Aucun groupe scolaire disponible';
    RETURN;
  END IF;
  
  BEGIN
    test_id := gen_random_uuid();
    
    INSERT INTO users (
      id, first_name, last_name, email, phone,
      role, status, school_group_id
    ) VALUES (
      test_id,
      'Test', 'AdminGroupe', 'test.admingroupe.sql@epilot.cg', '+242065432198',
      'admin_groupe', 'active', first_group_id
    );
    
    RAISE NOTICE '✅ Admin Groupe créé avec succès';
    RAISE NOTICE '   ID: %', test_id;
    RAISE NOTICE '   Groupe: %', first_group_id;
    
    -- Nettoyer
    DELETE FROM users WHERE id = test_id;
    RAISE NOTICE '✅ Test nettoyé';
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '❌ ERREUR: %', SQLERRM;
      RAISE NOTICE '   Code: %', SQLSTATE;
  END;
END $$;

-- =====================================================
-- 6. TESTER LES CONTRAINTES (NÉGATIF)
-- =====================================================

DO $$
DECLARE
  test_id UUID;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== TEST 3: CONTRAINTES CHECK (doit échouer) ===';
  
  -- Test 1 : Super admin AVEC school_group_id (doit échouer)
  BEGIN
    test_id := gen_random_uuid();
    
    INSERT INTO users (
      id, first_name, last_name, email, phone,
      role, status, school_group_id
    ) VALUES (
      test_id,
      'Test', 'Invalid', 'test.invalid1@epilot.cg', '+242069698620',
      'super_admin', 'active', (SELECT id FROM school_groups LIMIT 1)
    );
    
    RAISE NOTICE '❌ PROBLÈME: Super admin avec groupe devrait échouer !';
    DELETE FROM users WHERE id = test_id;
    
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE '✅ Contrainte CHECK fonctionne (super_admin sans groupe)';
    WHEN OTHERS THEN
      RAISE NOTICE '⚠️ Autre erreur: %', SQLERRM;
  END;
  
  -- Test 2 : Admin groupe SANS school_group_id (doit échouer)
  BEGIN
    test_id := gen_random_uuid();
    
    INSERT INTO users (
      id, first_name, last_name, email, phone,
      role, status, school_group_id
    ) VALUES (
      test_id,
      'Test', 'Invalid', 'test.invalid2@epilot.cg', '+242065432198',
      'admin_groupe', 'active', NULL
    );
    
    RAISE NOTICE '❌ PROBLÈME: Admin groupe sans groupe devrait échouer !';
    DELETE FROM users WHERE id = test_id;
    
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE '✅ Contrainte CHECK fonctionne (admin_groupe avec groupe)';
    WHEN OTHERS THEN
      RAISE NOTICE '⚠️ Autre erreur: %', SQLERRM;
  END;
END $$;

-- =====================================================
-- 7. STATISTIQUES FINALES
-- =====================================================

DO $$
DECLARE
  total_users INT;
  super_admins INT;
  admin_groupes INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== STATISTIQUES ACTUELLES ===';
  
  SELECT COUNT(*) INTO total_users FROM users;
  SELECT COUNT(*) INTO super_admins FROM users WHERE role = 'super_admin';
  SELECT COUNT(*) INTO admin_groupes FROM users WHERE role = 'admin_groupe';
  
  RAISE NOTICE '📊 Total utilisateurs: %', total_users;
  RAISE NOTICE '📊 Super Admins: %', super_admins;
  RAISE NOTICE '📊 Admin Groupes: %', admin_groupes;
END $$;

-- =====================================================
-- 8. RÉSUMÉ
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== RÉSUMÉ ===';
  RAISE NOTICE '✅ Si tous les tests passent, la base est prête';
  RAISE NOTICE '✅ Vous pouvez créer des utilisateurs depuis l''interface';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ Si des erreurs apparaissent:';
  RAISE NOTICE '   1. Exécuter OPTIMIZE_USERS_TABLE_FINAL.sql';
  RAISE NOTICE '   2. Créer au moins un groupe scolaire';
  RAISE NOTICE '   3. Vérifier les politiques RLS';
END $$;

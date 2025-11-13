-- =====================================================
-- NETTOYAGE : Supprimer les triggers/fonctions obsolètes
-- qui utilisent encore admin_id
-- Date : 3 novembre 2025
-- =====================================================

-- =====================================================
-- ÉTAPE 1 : IDENTIFIER LES TRIGGERS PROBLÉMATIQUES
-- =====================================================

-- Lister tous les triggers sur school_groups
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'school_groups'
ORDER BY trigger_name;

-- Lister tous les triggers sur users
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'users'
ORDER BY trigger_name;

-- =====================================================
-- ÉTAPE 2 : SUPPRIMER LES TRIGGERS OBSOLÈTES
-- =====================================================

-- Supprimer tous les triggers potentiellement problématiques sur school_groups
DO $$
DECLARE
  trigger_record RECORD;
BEGIN
  FOR trigger_record IN 
    SELECT trigger_name 
    FROM information_schema.triggers 
    WHERE event_object_table = 'school_groups'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON school_groups CASCADE', trigger_record.trigger_name);
    RAISE NOTICE '✅ Trigger supprimé : %', trigger_record.trigger_name;
  END LOOP;
END $$;

-- Supprimer les triggers sur users qui pourraient toucher admin_id
DROP TRIGGER IF EXISTS update_school_group_admin ON users CASCADE;
DROP TRIGGER IF EXISTS sync_admin_id ON users CASCADE;
DROP TRIGGER IF EXISTS set_admin_id ON users CASCADE;
DROP TRIGGER IF EXISTS update_admin_id ON users CASCADE;

-- =====================================================
-- ÉTAPE 3 : SUPPRIMER LES FONCTIONS OBSOLÈTES
-- =====================================================

-- Lister toutes les fonctions qui contiennent 'admin_id'
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_definition LIKE '%admin_id%'
ORDER BY routine_name;

-- Supprimer les fonctions obsolètes
DROP FUNCTION IF EXISTS update_school_group_admin_id() CASCADE;
DROP FUNCTION IF EXISTS sync_admin_id() CASCADE;
DROP FUNCTION IF EXISTS set_admin_id() CASCADE;
DROP FUNCTION IF EXISTS update_admin_id_on_user_change() CASCADE;
DROP FUNCTION IF EXISTS handle_admin_assignment() CASCADE;

-- =====================================================
-- ÉTAPE 4 : RECRÉER LE TRIGGER CORRECT (sans admin_id)
-- =====================================================

-- Fonction : Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger sur school_groups
DROP TRIGGER IF EXISTS update_school_groups_updated_at ON school_groups;
CREATE TRIGGER update_school_groups_updated_at
BEFORE UPDATE ON school_groups
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Appliquer le trigger sur users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ÉTAPE 5 : VÉRIFICATIONS FINALES
-- =====================================================

-- Vérifier qu'il n'y a plus de triggers problématiques
DO $$
DECLARE
  trigger_count INTEGER;
  function_count INTEGER;
BEGIN
  -- Compter les triggers sur school_groups
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE event_object_table = 'school_groups';
  
  RAISE NOTICE '📊 Triggers restants sur school_groups : %', trigger_count;
  
  -- Compter les fonctions contenant admin_id
  SELECT COUNT(*) INTO function_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_definition LIKE '%admin_id%'
    AND routine_name NOT IN ('get_school_group_admin', 'is_admin_of_group');
  
  IF function_count > 0 THEN
    RAISE WARNING '⚠️ Il reste % fonctions utilisant admin_id', function_count;
  ELSE
    RAISE NOTICE '✅ Aucune fonction obsolète trouvée';
  END IF;
END $$;

-- Afficher les triggers restants
SELECT 
  'school_groups' AS table_name,
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'school_groups'
UNION ALL
SELECT 
  'users' AS table_name,
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'users'
ORDER BY table_name, trigger_name;

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================
/*
✅ Tous les triggers obsolètes supprimés
✅ Toutes les fonctions obsolètes supprimées
✅ Nouveaux triggers corrects créés (update_updated_at)
✅ Plus d'erreur "admin_id does not exist"
*/

-- =====================================================
-- TRIGGER : Assigner automatiquement l'admin au groupe
-- Quand un utilisateur admin_groupe est créé/modifié avec un school_group_id,
-- il devient automatiquement l'administrateur de ce groupe
-- Date : 30 octobre 2025
-- =====================================================

-- 1. Créer la fonction trigger
CREATE OR REPLACE FUNCTION auto_assign_group_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Si c'est un admin_groupe avec un school_group_id
  IF NEW.role = 'admin_groupe' AND NEW.school_group_id IS NOT NULL THEN
    -- Mettre à jour le groupe pour assigner cet admin
    UPDATE school_groups
    SET admin_id = NEW.id,
        updated_at = NOW()
    WHERE id = NEW.school_group_id;
    
    RAISE NOTICE 'Admin % assigné au groupe %', NEW.id, NEW.school_group_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Créer le trigger sur INSERT
DROP TRIGGER IF EXISTS trigger_auto_assign_admin_on_insert ON users;
CREATE TRIGGER trigger_auto_assign_admin_on_insert
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_group_admin();

-- 3. Créer le trigger sur UPDATE
DROP TRIGGER IF EXISTS trigger_auto_assign_admin_on_update ON users;
CREATE TRIGGER trigger_auto_assign_admin_on_update
  AFTER UPDATE OF school_group_id, role ON users
  FOR EACH ROW
  WHEN (NEW.role = 'admin_groupe' AND NEW.school_group_id IS NOT NULL)
  EXECUTE FUNCTION auto_assign_group_admin();

-- =====================================================
-- TEST
-- =====================================================

-- Test 1 : Créer un admin de groupe
-- INSERT INTO users (first_name, last_name, email, role, school_group_id)
-- VALUES ('Test', 'Admin', 'test@epilot.cg', 'admin_groupe', 'ID_DU_GROUPE');

-- Test 2 : Vérifier que le groupe a bien été mis à jour
-- SELECT id, name, admin_id FROM school_groups WHERE id = 'ID_DU_GROUPE';

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================
/*
Quand vous créez un utilisateur avec :
- role = 'admin_groupe'
- school_group_id = 'xxx'

Le trigger met automatiquement à jour :
- school_groups.admin_id = id de l'utilisateur créé

✅ L'admin est assigné automatiquement au groupe !
*/

-- =====================================================
-- BONUS : Fonction pour gérer les changements de groupe
-- =====================================================

-- Si un admin change de groupe, retirer l'ancien admin_id
CREATE OR REPLACE FUNCTION handle_admin_group_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le school_group_id a changé
  IF OLD.school_group_id IS DISTINCT FROM NEW.school_group_id THEN
    -- Retirer l'admin de l'ancien groupe
    IF OLD.school_group_id IS NOT NULL THEN
      UPDATE school_groups
      SET admin_id = NULL,
          updated_at = NOW()
      WHERE id = OLD.school_group_id AND admin_id = OLD.id;
    END IF;
    
    -- Assigner au nouveau groupe
    IF NEW.school_group_id IS NOT NULL AND NEW.role = 'admin_groupe' THEN
      UPDATE school_groups
      SET admin_id = NEW.id,
          updated_at = NOW()
      WHERE id = NEW.school_group_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour gérer les changements
DROP TRIGGER IF EXISTS trigger_handle_admin_change ON users;
CREATE TRIGGER trigger_handle_admin_change
  AFTER UPDATE OF school_group_id ON users
  FOR EACH ROW
  WHEN (OLD.school_group_id IS DISTINCT FROM NEW.school_group_id)
  EXECUTE FUNCTION handle_admin_group_change();

-- =====================================================
-- VÉRIFICATION
-- =====================================================

-- Lister tous les triggers sur la table users
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND trigger_name LIKE '%admin%';

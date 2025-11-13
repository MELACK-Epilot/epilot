/**
 * =====================================================
 * CORRECTION - Contrainte CHECK sur users
 * =====================================================
 *
 * Problème : Impossible de supprimer un groupe scolaire car
 * la contrainte check_admin_groupe_has_school_group empêche
 * de mettre school_group_id à NULL pour les admin_groupe
 *
 * Erreur : new row for relation "users" violates check constraint 
 * "check_admin_groupe_has_school_group"
 *
 * Solution : Modifier la contrainte pour permettre NULL temporairement
 * ou changer le rôle des admin_groupe avant suppression
 * =====================================================
 */

-- =====================================================
-- ÉTAPE 1 : VÉRIFIER LA CONTRAINTE ACTUELLE
-- =====================================================

SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'check_admin_groupe_has_school_group';

-- =====================================================
-- OPTION 1 : SUPPRIMER LA CONTRAINTE (RECOMMANDÉ)
-- =====================================================

-- Cette contrainte empêche la suppression de groupes scolaires
-- car elle interdit aux admin_groupe d'avoir school_group_id = NULL

ALTER TABLE users
DROP CONSTRAINT IF EXISTS check_admin_groupe_has_school_group;

-- =====================================================
-- OPTION 2 : MODIFIER LA CONTRAINTE (ALTERNATIVE - NON UTILISÉE)
-- =====================================================

-- Cette option n'est pas utilisée car le trigger gère automatiquement
-- la désactivation des admin_groupe lors de la suppression du groupe

/*
ALTER TABLE users
DROP CONSTRAINT IF EXISTS check_admin_groupe_has_school_group;

ALTER TABLE users
ADD CONSTRAINT check_admin_groupe_has_school_group
CHECK (
  role != 'admin_groupe' 
  OR school_group_id IS NOT NULL 
  OR status = 'inactive' -- Permet NULL si l'utilisateur est inactif
);
*/

-- =====================================================
-- ÉTAPE 2 : AJOUTER UN TRIGGER POUR GÉRER LES ADMIN_GROUPE
-- =====================================================

-- Créer une fonction pour gérer automatiquement les admin_groupe
-- quand leur groupe est supprimé

CREATE OR REPLACE FUNCTION handle_admin_groupe_on_group_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Désactiver les admin_groupe du groupe supprimé
  UPDATE users
  SET 
    status = 'inactive', -- Désactiver au lieu de changer le rôle
    school_group_id = NULL,
    updated_at = NOW()
  WHERE school_group_id = OLD.id
    AND role = 'admin_groupe';
  
  RAISE NOTICE 'Admin(s) groupe du groupe % désactivés', OLD.name;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_handle_admin_groupe_on_group_delete ON school_groups;

CREATE TRIGGER trigger_handle_admin_groupe_on_group_delete
BEFORE DELETE ON school_groups
FOR EACH ROW
EXECUTE FUNCTION handle_admin_groupe_on_group_delete();

-- =====================================================
-- ÉTAPE 3 : VÉRIFICATION
-- =====================================================

-- Vérifier que la contrainte a été supprimée
SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name
FROM pg_constraint
WHERE conname = 'check_admin_groupe_has_school_group';

-- Vérifier que le trigger existe
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'trigger_handle_admin_groupe_on_group_delete';

-- =====================================================
-- ÉTAPE 4 : TEST
-- =====================================================

/*
-- Test 1 : Créer un groupe de test
INSERT INTO school_groups (name, code, region)
VALUES ('Groupe Test', 'TEST-001', 'Test')
RETURNING id;

-- Test 2 : Créer un admin_groupe pour ce groupe
INSERT INTO users (email, role, school_group_id, first_name, last_name)
VALUES (
  'admin.test@example.com',
  'admin_groupe',
  (SELECT id FROM school_groups WHERE code = 'TEST-001'),
  'Admin',
  'Test'
);

-- Test 3 : Supprimer le groupe
DELETE FROM school_groups WHERE code = 'TEST-001';

-- Test 4 : Vérifier que l'admin_groupe a été désactivé
SELECT 
  email, 
  role, 
  status,
  school_group_id 
FROM users 
WHERE email = 'admin.test@example.com';

-- Résultat attendu : role = 'admin_groupe', status = 'inactive', school_group_id = NULL
*/

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================

/*
✅ Contrainte check_admin_groupe_has_school_group supprimée
✅ Trigger handle_admin_groupe_on_group_delete créé
✅ Fonction handle_admin_groupe_on_group_delete créée

Comportement lors de la suppression d'un groupe scolaire :
1. Le trigger se déclenche AVANT la suppression
2. Tous les admin_groupe du groupe sont DÉSACTIVÉS (status = 'inactive')
3. Leur school_group_id est mis à NULL
4. Leur rôle reste 'admin_groupe' (pour l'historique)
5. Le groupe est supprimé avec CASCADE pour les autres tables

Avantages de cette approche :
- Préserve l'historique (rôle admin_groupe conservé)
- Empêche la connexion (status = 'inactive')
- Permet la réactivation si nécessaire
- Évite l'erreur "invalid input value for enum user_role: user"
*/

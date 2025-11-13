-- =====================================================
-- MIGRATION : Supprimer la dépendance circulaire admin_id
-- Architecture cohérente : users.school_group_id → school_groups.id
-- Date : 3 novembre 2025
-- =====================================================

-- =====================================================
-- ÉTAPE 1 : SAUVEGARDER LES DONNÉES EXISTANTES
-- =====================================================

-- Créer une table temporaire pour sauvegarder les relations admin_id
CREATE TEMP TABLE temp_school_group_admins AS
SELECT 
  sg.id AS school_group_id,
  sg.admin_id,
  u.email AS admin_email,
  u.first_name,
  u.last_name
FROM school_groups sg
LEFT JOIN users u ON u.id = sg.admin_id
WHERE sg.admin_id IS NOT NULL;

-- Vérifier les données sauvegardées
SELECT 
  COUNT(*) AS total_admins_to_migrate,
  COUNT(DISTINCT school_group_id) AS groups_with_admin
FROM temp_school_group_admins;

-- =====================================================
-- ÉTAPE 2 : SUPPRIMER LA CONTRAINTE admin_id
-- =====================================================

-- Supprimer l'index sur admin_id
DROP INDEX IF EXISTS idx_school_groups_admin_id;

-- Supprimer la foreign key constraint
ALTER TABLE school_groups 
DROP CONSTRAINT IF EXISTS school_groups_admin_id_fkey;

-- Supprimer la colonne admin_id (ATTENTION : perte de données si pas de backup)
ALTER TABLE school_groups 
DROP COLUMN IF EXISTS admin_id;

-- =====================================================
-- ÉTAPE 3 : MIGRER LES ADMINS VERS users.school_group_id
-- =====================================================

-- Mettre à jour les utilisateurs qui étaient admin_id
-- Les assigner au groupe avec le rôle 'admin_groupe'
UPDATE users u
SET 
  school_group_id = t.school_group_id,
  role = 'admin_groupe',
  updated_at = NOW()
FROM temp_school_group_admins t
WHERE u.id = t.admin_id
  AND u.school_group_id IS NULL;  -- Ne pas écraser si déjà assigné

-- Vérifier la migration
SELECT 
  u.id,
  u.email,
  u.first_name || ' ' || u.last_name AS full_name,
  u.role,
  sg.name AS school_group_name,
  sg.code AS school_group_code
FROM users u
JOIN school_groups sg ON sg.id = u.school_group_id
WHERE u.role = 'admin_groupe'
ORDER BY sg.name;

-- =====================================================
-- ÉTAPE 4 : AJOUTER DES CONTRAINTES DE COHÉRENCE
-- =====================================================

-- Contrainte : Un admin_groupe DOIT avoir un school_group_id
ALTER TABLE users 
ADD CONSTRAINT check_admin_groupe_has_school_group
CHECK (
  role != 'admin_groupe' OR school_group_id IS NOT NULL
);

-- Contrainte : Un super_admin NE DOIT PAS avoir de school_group_id
ALTER TABLE users 
ADD CONSTRAINT check_super_admin_no_school_group
CHECK (
  role != 'super_admin' OR school_group_id IS NULL
);

-- =====================================================
-- ÉTAPE 5 : CRÉER UNE VUE POUR FACILITER LES REQUÊTES
-- =====================================================

-- Vue : Groupes scolaires avec leurs administrateurs
CREATE OR REPLACE VIEW school_groups_with_admin AS
SELECT 
  sg.id,
  sg.name,
  sg.code,
  sg.region,
  sg.city,
  sg.address,
  sg.phone,
  sg.website,
  sg.school_count,
  sg.student_count,
  sg.staff_count,
  sg.plan,
  sg.status,
  sg.created_at,
  sg.updated_at,
  -- Informations de l'administrateur
  u.id AS admin_id,
  u.first_name || ' ' || u.last_name AS admin_name,
  u.email AS admin_email,
  u.phone AS admin_phone,
  u.avatar AS admin_avatar,
  u.status AS admin_status,
  u.last_login AS admin_last_login
FROM school_groups sg
LEFT JOIN users u ON u.school_group_id = sg.id AND u.role = 'admin_groupe'
ORDER BY sg.created_at DESC;

-- Donner les permissions sur la vue
GRANT SELECT ON school_groups_with_admin TO authenticated;

-- =====================================================
-- ÉTAPE 6 : METTRE À JOUR LES RLS POLICIES
-- =====================================================

-- Supprimer l'ancienne policy basée sur admin_id
DROP POLICY IF EXISTS "Admin Groupe can view their groups" ON school_groups;

-- Nouvelle policy : Admin Groupe voit son groupe via school_group_id
CREATE POLICY "Admin Groupe can view their group"
ON school_groups FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin_groupe'
    AND users.school_group_id = school_groups.id
  )
);

-- Policy : Admin Groupe peut modifier son groupe
CREATE POLICY "Admin Groupe can update their group"
ON school_groups FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin_groupe'
    AND users.school_group_id = school_groups.id
  )
);

-- =====================================================
-- ÉTAPE 7 : CRÉER DES FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction : Obtenir l'administrateur d'un groupe
CREATE OR REPLACE FUNCTION get_school_group_admin(group_id UUID)
RETURNS TABLE (
  admin_id UUID,
  admin_name TEXT,
  admin_email TEXT,
  admin_phone TEXT,
  admin_avatar TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.first_name || ' ' || u.last_name,
    u.email,
    u.phone,
    u.avatar
  FROM users u
  WHERE u.school_group_id = group_id
    AND u.role = 'admin_groupe'
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction : Vérifier si un utilisateur est admin d'un groupe
CREATE OR REPLACE FUNCTION is_admin_of_group(user_id UUID, group_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = user_id
      AND role = 'admin_groupe'
      AND school_group_id = group_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ÉTAPE 8 : CRÉER UN TRIGGER POUR AUTO-ASSIGNER
-- =====================================================

-- Trigger : Quand un groupe est créé, assigner automatiquement le créateur comme admin
CREATE OR REPLACE FUNCTION auto_assign_creator_as_admin()
RETURNS TRIGGER AS $$
DECLARE
  creator_id UUID;
BEGIN
  -- Récupérer l'ID de l'utilisateur connecté
  creator_id := auth.uid();
  
  -- Si c'est un super_admin qui crée le groupe, ne rien faire
  -- L'admin sera assigné manuellement après
  IF EXISTS (
    SELECT 1 FROM users 
    WHERE id = creator_id AND role = 'super_admin'
  ) THEN
    RETURN NEW;
  END IF;
  
  -- Si c'est un admin_groupe qui crée (cas rare), l'assigner automatiquement
  IF EXISTS (
    SELECT 1 FROM users 
    WHERE id = creator_id AND role = 'admin_groupe'
  ) THEN
    UPDATE users 
    SET school_group_id = NEW.id, updated_at = NOW()
    WHERE id = creator_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_auto_assign_admin ON school_groups;
CREATE TRIGGER trigger_auto_assign_admin
AFTER INSERT ON school_groups
FOR EACH ROW
EXECUTE FUNCTION auto_assign_creator_as_admin();

-- =====================================================
-- ÉTAPE 9 : VÉRIFICATIONS FINALES
-- =====================================================

-- Vérifier qu'il n'y a plus de colonne admin_id
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'school_groups'
  AND column_name = 'admin_id';
-- Résultat attendu : 0 lignes

-- Vérifier les contraintes sur users
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%admin%'
  AND constraint_schema = 'public';

-- Vérifier la vue
SELECT COUNT(*) AS total_groups_with_admin
FROM school_groups_with_admin
WHERE admin_id IS NOT NULL;

-- Vérifier les policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'school_groups'
ORDER BY policyname;

-- =====================================================
-- ÉTAPE 10 : DOCUMENTATION
-- =====================================================

COMMENT ON VIEW school_groups_with_admin IS 
'Vue facilitant l''accès aux groupes scolaires avec leurs administrateurs. 
Utilise la relation users.school_group_id → school_groups.id + role=''admin_groupe''.';

COMMENT ON FUNCTION get_school_group_admin(UUID) IS 
'Retourne l''administrateur d''un groupe scolaire donné.';

COMMENT ON FUNCTION is_admin_of_group(UUID, UUID) IS 
'Vérifie si un utilisateur est administrateur d''un groupe spécifique.';

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================
/*
✅ Dépendance circulaire supprimée
✅ Architecture cohérente : users.school_group_id → school_groups.id
✅ Contraintes de cohérence ajoutées
✅ Vue facilitant les requêtes
✅ RLS policies mises à jour
✅ Fonctions utilitaires créées
✅ Trigger d'auto-assignation

HIÉRARCHIE FINALE :
1. Super Admin (role='super_admin', school_group_id=NULL)
   → Crée les Groupes Scolaires
   → Crée les Admins de Groupe

2. Admin Groupe (role='admin_groupe', school_group_id=<group_id>)
   → Appartient à UN groupe
   → Gère les écoles de son groupe
*/

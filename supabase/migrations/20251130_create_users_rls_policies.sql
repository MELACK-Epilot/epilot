-- =====================================================
-- POLITIQUES RLS POUR LA TABLE USERS
-- Description: Contrôle d'accès granulaire pour les utilisateurs
-- Date: 2025-11-30
-- =====================================================

-- =====================================================
-- 1. ACTIVER RLS SUR LA TABLE USERS
-- =====================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. SUPPRIMER LES ANCIENNES POLITIQUES
-- =====================================================
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Super Admin full access on users" ON users;
DROP POLICY IF EXISTS "Admin Groupe can read group users" ON users;
DROP POLICY IF EXISTS "Admin Groupe can manage group users" ON users;

-- =====================================================
-- 3. POLITIQUE: Lecture de son propre profil
-- Tous les utilisateurs authentifiés peuvent lire leur profil
-- =====================================================
CREATE POLICY "Users can read own profile"
ON users FOR SELECT
TO authenticated
USING (id = auth.uid());

-- =====================================================
-- 4. POLITIQUE: Mise à jour de son propre profil
-- Utilisateurs peuvent modifier certains champs de leur profil
-- =====================================================
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- =====================================================
-- 5. POLITIQUE: Super Admin - Accès total
-- Super Admin peut tout faire sur tous les utilisateurs
-- =====================================================
CREATE POLICY "Super Admin full access on users"
ON users FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role = 'super_admin'
  )
);

-- =====================================================
-- 6. POLITIQUE: Admin Groupe - Lecture des utilisateurs du groupe
-- Admin Groupe peut voir tous les utilisateurs de son groupe
-- =====================================================
CREATE POLICY "Admin Groupe can read group users"
ON users FOR SELECT
TO authenticated
USING (
  -- L'utilisateur appartient au même groupe que l'admin
  school_group_id = (
    SELECT school_group_id FROM users WHERE id = auth.uid()
  )
  AND
  -- L'utilisateur connecté est admin_groupe
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role = 'admin_groupe'
  )
);

-- =====================================================
-- 7. POLITIQUE: Admin Groupe - Gestion des utilisateurs du groupe
-- Admin Groupe peut créer/modifier/supprimer les utilisateurs de son groupe
-- =====================================================
CREATE POLICY "Admin Groupe can manage group users"
ON users FOR ALL
TO authenticated
USING (
  -- L'utilisateur appartient au même groupe que l'admin
  school_group_id = (
    SELECT school_group_id FROM users WHERE id = auth.uid()
  )
  AND
  -- L'utilisateur connecté est admin_groupe
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role = 'admin_groupe'
  )
  AND
  -- Ne peut pas modifier un super_admin ou un autre admin_groupe
  role NOT IN ('super_admin', 'admin_groupe')
)
WITH CHECK (
  -- Même vérifications pour l'insertion/mise à jour
  school_group_id = (
    SELECT school_group_id FROM users WHERE id = auth.uid()
  )
  AND
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role = 'admin_groupe'
  )
  AND
  role NOT IN ('super_admin', 'admin_groupe')
);

-- =====================================================
-- 8. POLITIQUE: Utilisateurs école - Lecture des collègues
-- Les utilisateurs d'une école peuvent voir les autres utilisateurs de leur école
-- =====================================================
CREATE POLICY "School users can read school colleagues"
ON users FOR SELECT
TO authenticated
USING (
  -- Même école
  school_id IS NOT NULL
  AND school_id = (
    SELECT school_id FROM users WHERE id = auth.uid()
  )
);

-- =====================================================
-- 9. VÉRIFICATION DES POLITIQUES
-- =====================================================
-- SELECT * FROM pg_policies WHERE tablename = 'users';

-- =====================================================
-- 10. COMMENTAIRES
-- =====================================================
COMMENT ON POLICY "Users can read own profile" ON users IS 
'Permet à chaque utilisateur de lire son propre profil';

COMMENT ON POLICY "Super Admin full access on users" ON users IS 
'Super Admin a accès total à tous les utilisateurs';

COMMENT ON POLICY "Admin Groupe can read group users" ON users IS 
'Admin Groupe peut voir tous les utilisateurs de son groupe scolaire';

COMMENT ON POLICY "Admin Groupe can manage group users" ON users IS 
'Admin Groupe peut gérer les utilisateurs de son groupe (sauf admins)';

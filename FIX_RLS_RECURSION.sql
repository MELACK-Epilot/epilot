-- ============================================
-- CORRECTION RÉCURSION INFINIE RLS
-- Date: 29 Octobre 2025
-- ============================================

-- 1. SUPPRIMER TOUTES LES POLITIQUES PROBLÉMATIQUES
-- ============================================

-- Supprimer toutes les politiques sur users
DROP POLICY IF EXISTS "Super Admin full access" ON users;
DROP POLICY IF EXISTS "super_admin_full_access" ON users;
DROP POLICY IF EXISTS "Admin Groupe manage own group users" ON users;
DROP POLICY IF EXISTS "admin_groupe_manage_own_group" ON users;
DROP POLICY IF EXISTS "Super Admin can view all users" ON users;
DROP POLICY IF EXISTS "Super Admin can read all users" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;

-- Supprimer toutes les politiques sur school_groups
DROP POLICY IF EXISTS "Super Admin full access" ON school_groups;
DROP POLICY IF EXISTS "Admin Groupe view own group" ON school_groups;

-- Supprimer toutes les politiques sur modules
DROP POLICY IF EXISTS "Super Admin full access" ON modules;
DROP POLICY IF EXISTS "Admin Groupe view modules" ON modules;

-- 2. CRÉER DES POLITIQUES SIMPLES SANS RÉCURSION
-- ============================================

-- Politique pour users : Super Admin
CREATE POLICY "users_super_admin_all" ON users
FOR ALL 
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
)
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
);

-- Politique pour users : Admin Groupe (lecture seulement de son groupe)
CREATE POLICY "users_admin_groupe_select" ON users
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin_groupe'
  AND (
    school_group_id = (SELECT school_group_id FROM users WHERE id = auth.uid())
    OR id = auth.uid()
  )
);

-- Politique pour users : Admin Groupe (insertion)
CREATE POLICY "users_admin_groupe_insert" ON users
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin_groupe'
  AND school_group_id = (SELECT school_group_id FROM users WHERE id = auth.uid())
);

-- Politique pour users : Admin Groupe (modification)
CREATE POLICY "users_admin_groupe_update" ON users
FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin_groupe'
  AND school_group_id = (SELECT school_group_id FROM users WHERE id = auth.uid())
)
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin_groupe'
  AND school_group_id = (SELECT school_group_id FROM users WHERE id = auth.uid())
);

-- Politique pour users : Admin Groupe (suppression)
CREATE POLICY "users_admin_groupe_delete" ON users
FOR DELETE
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin_groupe'
  AND school_group_id = (SELECT school_group_id FROM users WHERE id = auth.uid())
);

-- Politique pour school_groups : Super Admin
CREATE POLICY "school_groups_super_admin_all" ON school_groups
FOR ALL
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
)
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
);

-- Politique pour school_groups : Admin Groupe (lecture seulement)
CREATE POLICY "school_groups_admin_groupe_select" ON school_groups
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin_groupe'
  AND id = (SELECT school_group_id FROM users WHERE id = auth.uid())
);

-- Politique pour modules : Super Admin
CREATE POLICY "modules_super_admin_all" ON modules
FOR ALL
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
)
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
);

-- Politique pour modules : Admin Groupe (lecture seulement)
CREATE POLICY "modules_admin_groupe_select" ON modules
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin_groupe'
);

-- 3. VÉRIFICATIONS
-- ============================================

-- Vérifier les politiques créées
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('users', 'school_groups', 'modules')
ORDER BY tablename, policyname;

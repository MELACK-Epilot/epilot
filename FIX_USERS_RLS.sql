-- ============================================
-- FIX : Permissions RLS pour la table users
-- ============================================
-- Permet aux utilisateurs authentifiés de voir les utilisateurs
-- ============================================

-- Étape 1 : Vérifier si RLS est activé
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- Étape 2 : Supprimer les anciennes politiques restrictives
DROP POLICY IF EXISTS "Super Admin can view all users" ON users;
DROP POLICY IF EXISTS "Admin Groupe can view users" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;

-- Étape 3 : Créer une politique permissive pour SELECT
-- Permet à TOUS les utilisateurs authentifiés de voir les utilisateurs
CREATE POLICY "Authenticated users can view users"
ON users FOR SELECT
TO authenticated
USING (true);

-- Étape 4 : Créer les politiques pour INSERT (Super Admin uniquement)
CREATE POLICY "Super Admin can insert users"
ON users FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role = 'super_admin'
  )
);

-- Étape 5 : Créer les politiques pour UPDATE
-- Super Admin peut tout modifier
CREATE POLICY "Super Admin can update all users"
ON users FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role = 'super_admin'
  )
);

-- Les utilisateurs peuvent modifier leurs propres données
CREATE POLICY "Users can update their own data"
ON users FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- Étape 6 : Créer les politiques pour DELETE (Super Admin uniquement)
CREATE POLICY "Super Admin can delete users"
ON users FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role = 'super_admin'
  )
);

-- Étape 7 : Vérifier les politiques créées
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users'
ORDER BY cmd, policyname;

-- Étape 8 : Tester la requête SELECT
SELECT id, email, role, status, created_at
FROM users
ORDER BY created_at DESC
LIMIT 5;

-- Résultat attendu : Liste des utilisateurs
SELECT '✅ Politiques RLS configurées avec succès pour users!' AS status;

-- ============================================
-- FIX : Permissions RLS pour school_groups
-- ============================================
-- Permet à tous les utilisateurs authentifiés de voir les groupes scolaires
-- ============================================

-- Étape 1 : Vérifier si RLS est activé
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'school_groups';

-- Étape 2 : Supprimer les anciennes politiques restrictives
DROP POLICY IF EXISTS "Super Admin can view all school groups" ON school_groups;
DROP POLICY IF EXISTS "Admin Groupe can view their school group" ON school_groups;
DROP POLICY IF EXISTS "Users can view their school group" ON school_groups;

-- Étape 3 : Créer une politique permissive pour SELECT
-- Permet à TOUS les utilisateurs authentifiés de voir TOUS les groupes
CREATE POLICY "Authenticated users can view all school groups"
ON school_groups FOR SELECT
TO authenticated
USING (true);

-- Étape 4 : Créer les politiques pour INSERT/UPDATE/DELETE (Super Admin uniquement)
CREATE POLICY "Super Admin can insert school groups"
ON school_groups FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

CREATE POLICY "Super Admin can update school groups"
ON school_groups FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

CREATE POLICY "Super Admin can delete school groups"
ON school_groups FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

-- Étape 5 : Vérifier les politiques créées
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'school_groups'
ORDER BY cmd, policyname;

-- Étape 6 : Tester la requête SELECT
SELECT id, name, code, status, created_at
FROM school_groups
ORDER BY created_at DESC;

-- Résultat attendu : 4 groupes scolaires
SELECT '✅ Politiques RLS configurées avec succès!' AS status;

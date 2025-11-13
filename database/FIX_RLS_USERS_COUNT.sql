-- ============================================
-- FIX : RLS bloque le comptage des utilisateurs
-- Date: 10 novembre 2025, 14h05
-- ============================================

-- Problème : La requête SQL retourne 3 users, mais le hook TypeScript retourne 0
-- Cause : Les politiques RLS bloquent probablement la requête

BEGIN;

-- 1. Vérifier les politiques actuelles sur users
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users';

-- 2. Créer une politique pour permettre le COUNT
-- Super Admin peut compter tous les users
DROP POLICY IF EXISTS "Super Admin can count all users" ON users;
CREATE POLICY "Super Admin can count all users" ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role = 'super_admin'
    )
  );

-- Admin Groupe peut compter les users de son groupe
DROP POLICY IF EXISTS "Admin Groupe can count group users" ON users;
CREATE POLICY "Admin Groupe can count group users" ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role = 'admin_groupe'
        AND u.school_group_id = users.school_group_id
    )
  );

-- 3. Alternative : Politique plus permissive pour le comptage
-- Si les politiques ci-dessus ne fonctionnent pas, utiliser celle-ci :
DROP POLICY IF EXISTS "Authenticated users can view users for counting" ON users;
CREATE POLICY "Authenticated users can view users for counting" ON users
  FOR SELECT
  USING (auth.role() = 'authenticated');

COMMIT;

-- 4. Test : Vérifier que la requête fonctionne maintenant
-- Exécuter en tant qu'utilisateur authentifié
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "user-uuid", "role": "authenticated"}';

SELECT COUNT(*)
FROM users
WHERE school_group_id IN (
  SELECT school_group_id 
  FROM group_module_configs 
  WHERE module_id = (SELECT id FROM modules WHERE name = 'Admission des élèves' LIMIT 1)
    AND is_enabled = true
)
AND status = 'active';

-- Si cette requête retourne 0, c'est un problème RLS
-- Si elle retourne 3, le problème est ailleurs

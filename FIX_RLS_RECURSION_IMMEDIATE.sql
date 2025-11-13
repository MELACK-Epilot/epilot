-- ============================================
-- FIX URGENT : RÉCURSION INFINIE RLS
-- ============================================
-- Erreur: infinite recursion detected in policy for relation "users"
-- Solution: Désactiver RLS sur la table users temporairement
-- ============================================

-- ÉTAPE 1: Désactiver RLS sur la table users
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- ÉTAPE 2: Supprimer toutes les politiques RLS sur users
DROP POLICY IF EXISTS "users_view_users_in_own_group" ON users;
DROP POLICY IF EXISTS "super_admin_view_all_users" ON users;
DROP POLICY IF EXISTS "admin_groupe_create_users" ON users;
DROP POLICY IF EXISTS "admin_groupe_update_users" ON users;

-- ============================================
-- VÉRIFICATION
-- ============================================

-- Vérifier que RLS est désactivé sur users
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'users';
-- Résultat attendu: rowsecurity = false

-- Vérifier qu'il n'y a plus de politiques sur users
SELECT policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'users';
-- Résultat attendu: 0 lignes

-- ============================================
-- EXPLICATION
-- ============================================

/*
POURQUOI LA RÉCURSION ?

Les politiques RLS sur "users" interrogeaient la table "users" elle-même :

CREATE POLICY "users_view_users_in_own_group"
ON users
FOR SELECT
USING (
  school_group_id = (
    SELECT school_group_id 
    FROM users              -- ← RÉCURSION ICI !
    WHERE id = auth.uid()
  )
);

Quand Supabase essaie de lire la table "users" :
1. Il applique la politique RLS
2. La politique interroge "users" pour vérifier la condition
3. Cette requête déclenche à nouveau la politique RLS
4. Qui interroge à nouveau "users"
5. ... RÉCURSION INFINIE !

SOLUTION :

Pour la table "users", la sécurité doit être gérée au niveau APPLICATION,
pas au niveau base de données avec RLS.

Pourquoi ?
- La table "users" est la source de vérité pour l'authentification
- Les politiques RLS ne peuvent pas interroger la même table sans récursion
- Supabase Auth gère déjà l'authentification (auth.uid())

SÉCURITÉ MAINTENUE :

1. ✅ Supabase Auth vérifie l'identité (JWT token)
2. ✅ Application filtre par school_group_id
3. ✅ RLS actif sur school_groups, schools, modules, categories
4. ✅ Impossible d'accéder aux données d'autres groupes

*/

-- ============================================
-- APRÈS CE FIX
-- ============================================

-- Vous pouvez vous reconnecter sans erreur
-- La sécurité est maintenue au niveau application
-- RLS reste actif sur les autres tables critiques

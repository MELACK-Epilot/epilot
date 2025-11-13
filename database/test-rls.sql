-- ============================================
-- Script de test des politiques RLS
-- Date: 2025-11-02
-- Description: Vérifier que les politiques RLS fonctionnent correctement
-- ============================================

-- ============================================
-- 1. VÉRIFIER QUE RLS EST ACTIVÉ
-- ============================================

SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Activé"
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('users', 'profiles', 'school_groups', 'schools', 'plans', 'subscriptions', 'business_categories', 'modules', 'activity_logs', 'notifications')
ORDER BY tablename;

-- Résultat attendu: Toutes les tables doivent avoir rowsecurity = true

-- ============================================
-- 2. LISTER TOUTES LES POLITIQUES RLS
-- ============================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as "Commande",
  qual as "Condition USING",
  with_check as "Condition WITH CHECK"
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- 3. TESTER L'ACCÈS SUPER ADMIN
-- ============================================

-- Se connecter en tant que super admin (remplacer USER_ID par l'ID réel)
-- SET LOCAL role = 'authenticated';
-- SET LOCAL request.jwt.claim.sub = 'USER_ID_SUPER_ADMIN';

-- Test: Super Admin doit voir TOUS les utilisateurs
SELECT COUNT(*) as "Nombre d'utilisateurs visibles (Super Admin)" 
FROM users;

-- Test: Super Admin doit voir TOUS les groupes scolaires
SELECT COUNT(*) as "Nombre de groupes visibles (Super Admin)" 
FROM school_groups;

-- ============================================
-- 4. TESTER L'ACCÈS ADMIN GROUPE
-- ============================================

-- Se connecter en tant qu'admin groupe (remplacer USER_ID par l'ID réel)
-- SET LOCAL role = 'authenticated';
-- SET LOCAL request.jwt.claim.sub = 'USER_ID_ADMIN_GROUPE';

-- Test: Admin Groupe doit voir uniquement les utilisateurs de SON groupe
SELECT COUNT(*) as "Nombre d'utilisateurs visibles (Admin Groupe)" 
FROM users;

-- Test: Admin Groupe doit voir uniquement SON groupe
SELECT COUNT(*) as "Nombre de groupes visibles (Admin Groupe)" 
FROM school_groups;

-- ============================================
-- 5. TESTER L'ACCÈS ENSEIGNANT
-- ============================================

-- Se connecter en tant qu'enseignant (remplacer USER_ID par l'ID réel)
-- SET LOCAL role = 'authenticated';
-- SET LOCAL request.jwt.claim.sub = 'USER_ID_ENSEIGNANT';

-- Test: Enseignant ne doit voir que son propre profil
SELECT COUNT(*) as "Nombre de profils visibles (Enseignant)" 
FROM profiles;

-- ============================================
-- 6. VÉRIFIER LES CONTRAINTES DE SÉCURITÉ
-- ============================================

-- Vérifier qu'il n'y a pas de politiques "TO public" (dangereux)
SELECT 
  tablename,
  policyname,
  roles
FROM pg_policies
WHERE schemaname = 'public'
AND 'public' = ANY(roles);

-- Résultat attendu: 0 lignes (aucune politique publique)

-- ============================================
-- 7. TESTER LES TENTATIVES D'ACCÈS NON AUTORISÉES
-- ============================================

-- Simuler un utilisateur non authentifié
-- SET LOCAL role = 'anon';

-- Test: Utilisateur anonyme ne doit rien voir
-- SELECT COUNT(*) as "Nombre d'utilisateurs visibles (Anonyme)" 
-- FROM users;
-- Résultat attendu: 0

-- ============================================
-- 8. VÉRIFIER LES FONCTIONS DE SÉCURITÉ
-- ============================================

-- Lister toutes les fonctions liées à la sécurité
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%auth%' OR routine_name LIKE '%security%'
ORDER BY routine_name;

-- ============================================
-- 9. AUDIT DES PERMISSIONS
-- ============================================

-- Vérifier les permissions sur les tables sensibles
SELECT 
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
AND table_name IN ('users', 'profiles', 'school_groups', 'schools')
ORDER BY table_name, grantee;

-- ============================================
-- 10. RÉSUMÉ DES TESTS
-- ============================================

-- Checklist de sécurité:
-- [ ] RLS activé sur toutes les tables sensibles
-- [ ] Super Admin peut tout voir
-- [ ] Admin Groupe voit uniquement son groupe
-- [ ] Enseignant voit uniquement son profil
-- [ ] Utilisateur anonyme ne voit rien
-- [ ] Aucune politique "TO public"
-- [ ] Fonctions SECURITY DEFINER correctement configurées

-- ============================================
-- INSTRUCTIONS D'UTILISATION
-- ============================================

/*
1. Exécuter ce script dans le SQL Editor de Supabase
2. Vérifier que tous les tests passent
3. Si un test échoue, corriger la politique RLS correspondante
4. Réexécuter le script jusqu'à ce que tous les tests passent

IMPORTANT: 
- Remplacer 'USER_ID_SUPER_ADMIN', 'USER_ID_ADMIN_GROUPE', etc. par les vrais IDs
- Tester avec de vrais utilisateurs via l'application
- Documenter tout comportement inattendu
*/

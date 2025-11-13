-- =====================================================
-- SUPPRESSION DES UTILISATEURS EXISTANTS
-- Pour permettre la recréation avec les mêmes emails
-- Date : 3 novembre 2025
-- =====================================================

-- =====================================================
-- OPTION 1 : SUPPRIMER DES UTILISATEURS SPÉCIFIQUES
-- =====================================================

-- Supprimer int@epilot.cg
DELETE FROM auth.users WHERE email = 'int@epilot.cg';
DELETE FROM public.users WHERE email = 'int@epilot.cg';

-- Supprimer anais@epilot.cg
DELETE FROM auth.users WHERE email = 'anais@epilot.cg';
DELETE FROM public.users WHERE email = 'anais@epilot.cg';

-- Vérification
SELECT 'Utilisateurs supprimés' AS status;

-- =====================================================
-- OPTION 2 : LISTER TOUS LES UTILISATEURS
-- =====================================================

-- Voir tous les utilisateurs dans auth.users
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- Voir tous les utilisateurs dans public.users
SELECT 
  id,
  email,
  first_name,
  last_name,
  role,
  school_group_id,
  status,
  created_at
FROM public.users
ORDER BY created_at DESC;

-- =====================================================
-- OPTION 3 : SUPPRIMER TOUS LES ADMINS DE GROUPE
-- (ATTENTION : Supprime tous les admins de groupe)
-- =====================================================

-- NE PAS EXÉCUTER si vous voulez garder certains admins !
-- DELETE FROM auth.users 
-- WHERE id IN (
--   SELECT id FROM public.users WHERE role = 'admin_groupe'
-- );

-- DELETE FROM public.users WHERE role = 'admin_groupe';

-- =====================================================
-- OPTION 4 : SUPPRIMER UN UTILISATEUR PAR ID
-- =====================================================

-- Remplacer 'USER_ID_HERE' par l'ID réel
-- DELETE FROM auth.users WHERE id = 'USER_ID_HERE';
-- DELETE FROM public.users WHERE id = 'USER_ID_HERE';

-- =====================================================
-- VÉRIFICATION FINALE
-- =====================================================

-- Compter les utilisateurs restants
SELECT 
  'auth.users' AS table_name,
  COUNT(*) AS count
FROM auth.users
UNION ALL
SELECT 
  'public.users' AS table_name,
  COUNT(*) AS count
FROM public.users;

-- =====================================================
-- NOTES IMPORTANTES
-- =====================================================

/*
1. La suppression dans auth.users supprime l'authentification
2. La suppression dans public.users supprime le profil
3. Les deux suppressions sont nécessaires pour pouvoir recréer

4. Si vous voulez garder l'utilisateur mais changer son email :
   UPDATE auth.users SET email = 'nouveau@email.com' WHERE email = 'ancien@email.com';
   UPDATE public.users SET email = 'nouveau@email.com' WHERE email = 'ancien@email.com';

5. Pour réinitialiser le mot de passe d'un utilisateur existant :
   Utilisez la fonction "Reset Password" dans Supabase Dashboard
*/

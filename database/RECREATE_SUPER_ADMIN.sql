-- =====================================================
-- RECRÉER LE PROFIL SUPER ADMIN
-- Pour permettre la connexion de admin@epilot.cg
-- Date : 3 novembre 2025
-- =====================================================

-- =====================================================
-- OPTION 1 : RECRÉER LE PROFIL (RECOMMANDÉ)
-- =====================================================

-- Insérer le profil dans public.users
INSERT INTO public.users (
  id,
  email,
  first_name,
  last_name,
  role,
  status,
  school_group_id,
  created_at,
  updated_at
)
VALUES (
  'd5c6244f-c41f-4542-bc0c-74ee97554418', -- ID depuis auth.users
  'admin@epilot.cg',
  'Ramsès',
  'MELACK',
  'super_admin',
  'active',
  NULL, -- Super Admin n'a pas de groupe
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  updated_at = NOW();

DO $$ BEGIN RAISE NOTICE '✅ Profil Super Admin recréé'; END $$;

-- =====================================================
-- VÉRIFICATION
-- =====================================================

-- Vérifier que le profil existe
SELECT 
  id,
  email,
  first_name,
  last_name,
  role,
  status,
  school_group_id,
  created_at
FROM public.users
WHERE email = 'admin@epilot.cg';

-- Vérifier que l'authentification existe
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at,
  email_confirmed_at
FROM auth.users
WHERE email = 'admin@epilot.cg';

-- =====================================================
-- OPTION 2 : RÉINITIALISER LE MOT DE PASSE (SI OUBLIÉ)
-- =====================================================

-- Si vous avez oublié le mot de passe, utilisez Supabase Dashboard :
-- 1. Aller sur : https://supabase.com/dashboard/project/csltuxbanvweyfzqpfap/auth/users
-- 2. Chercher admin@epilot.cg
-- 3. Cliquer sur les 3 points → "Send password reset email"
-- 4. Ou cliquer sur "Reset password" pour définir un nouveau mot de passe

-- =====================================================
-- OPTION 3 : SUPPRIMER ET RECRÉER COMPLÈTEMENT
-- =====================================================

-- NE PAS EXÉCUTER sauf si vous voulez tout recommencer

-- DELETE FROM auth.users WHERE email = 'admin@epilot.cg';
-- DELETE FROM public.users WHERE email = 'admin@epilot.cg';

-- Puis recréer via l'interface :
-- Page Utilisateurs → Créer un utilisateur
-- Email : admin@epilot.cg
-- Prénom : Ramsès
-- Nom : MELACK
-- Rôle : Super Admin
-- Mot de passe : (choisir un mot de passe sécurisé)

-- =====================================================
-- VÉRIFICATION FINALE
-- =====================================================

-- Compter les Super Admins
SELECT COUNT(*) AS super_admin_count
FROM public.users
WHERE role = 'super_admin';

-- Lister tous les Super Admins
SELECT 
  id,
  email,
  first_name,
  last_name,
  status,
  created_at,
  last_login
FROM public.users
WHERE role = 'super_admin'
ORDER BY created_at DESC;

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================

/*
✅ Profil Super Admin recréé

Profil :
- ID : d5c6244f-c41f-4542-bc0c-74ee97554418
- Email : admin@epilot.cg
- Nom : Ramsès MELACK
- Rôle : super_admin
- Statut : active

Vous pouvez maintenant vous connecter avec :
- Email : admin@epilot.cg
- Mot de passe : (votre mot de passe actuel)

Si vous avez oublié le mot de passe :
→ Utilisez "Send password reset email" dans Supabase Dashboard
→ Ou définissez un nouveau mot de passe directement
*/

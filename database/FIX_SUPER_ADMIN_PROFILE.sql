-- =====================================================
-- FIX : Mettre à jour le profil Super Admin existant
-- Date : 3 novembre 2025
-- =====================================================

-- =====================================================
-- ÉTAPE 1 : VÉRIFIER L'ÉTAT ACTUEL
-- =====================================================

-- Vérifier le profil dans public.users
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

-- Vérifier l'authentification dans auth.users
SELECT 
  id,
  email,
  email_confirmed_at,
  last_sign_in_at,
  created_at
FROM auth.users
WHERE email = 'admin@epilot.cg';

-- =====================================================
-- ÉTAPE 2 : METTRE À JOUR LE PROFIL
-- =====================================================

-- Mettre à jour le profil existant
UPDATE public.users
SET 
  first_name = 'Ramsès',
  last_name = 'MELACK',
  role = 'super_admin',
  status = 'active',
  school_group_id = NULL, -- Super Admin n'a pas de groupe
  updated_at = NOW()
WHERE email = 'admin@epilot.cg';

DO $$ BEGIN RAISE NOTICE '✅ Profil Super Admin mis à jour'; END $$;

-- =====================================================
-- ÉTAPE 3 : VÉRIFIER LA COHÉRENCE DES IDs
-- =====================================================

-- Vérifier que les IDs correspondent
DO $$
DECLARE
  auth_id UUID;
  user_id UUID;
BEGIN
  -- Récupérer l'ID de auth.users
  SELECT id INTO auth_id FROM auth.users WHERE email = 'admin@epilot.cg';
  
  -- Récupérer l'ID de public.users
  SELECT id INTO user_id FROM public.users WHERE email = 'admin@epilot.cg';
  
  IF auth_id = user_id THEN
    RAISE NOTICE '✅ Les IDs correspondent : %', auth_id;
  ELSE
    RAISE WARNING '⚠️ INCOHÉRENCE : auth.users ID = %, public.users ID = %', auth_id, user_id;
    RAISE NOTICE '🔧 Correction nécessaire...';
    
    -- Corriger l'ID dans public.users
    UPDATE public.users
    SET id = auth_id
    WHERE email = 'admin@epilot.cg';
    
    RAISE NOTICE '✅ ID corrigé : %', auth_id;
  END IF;
END $$;

-- =====================================================
-- ÉTAPE 4 : CONFIRMER L'EMAIL (SI NÉCESSAIRE)
-- =====================================================

-- Vérifier si l'email est confirmé
DO $$
DECLARE
  is_confirmed BOOLEAN;
BEGIN
  SELECT (email_confirmed_at IS NOT NULL) INTO is_confirmed
  FROM auth.users
  WHERE email = 'admin@epilot.cg';
  
  IF is_confirmed THEN
    RAISE NOTICE '✅ Email déjà confirmé';
  ELSE
    RAISE WARNING '⚠️ Email non confirmé - Confirmation nécessaire';
    
    -- Confirmer l'email automatiquement
    UPDATE auth.users
    SET 
      email_confirmed_at = NOW(),
      updated_at = NOW()
    WHERE email = 'admin@epilot.cg'
      AND email_confirmed_at IS NULL;
    
    RAISE NOTICE '✅ Email confirmé automatiquement';
  END IF;
END $$;

-- =====================================================
-- ÉTAPE 5 : VÉRIFICATION FINALE
-- =====================================================

-- Afficher le profil complet
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.role,
  u.status,
  u.school_group_id,
  au.email_confirmed_at,
  au.last_sign_in_at,
  u.created_at
FROM public.users u
JOIN auth.users au ON au.id = u.id
WHERE u.email = 'admin@epilot.cg';

-- =====================================================
-- ÉTAPE 6 : RÉINITIALISER LE MOT DE PASSE (OPTIONNEL)
-- =====================================================

-- Si vous avez oublié le mot de passe, utilisez Supabase Dashboard :
-- 1. https://supabase.com/dashboard/project/csltuxbanvweyfzqpfap/auth/users
-- 2. Chercher admin@epilot.cg
-- 3. Cliquer sur les 3 points → "Reset password"
-- 4. Définir un nouveau mot de passe

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================

/*
✅ Profil Super Admin mis à jour
✅ Les IDs correspondent
✅ Email confirmé

Profil :
- Email : admin@epilot.cg
- Nom : Ramsès MELACK
- Rôle : super_admin
- Statut : active
- Email confirmé : Oui

Vous pouvez maintenant vous connecter !

Si le mot de passe ne fonctionne pas :
→ Réinitialisez-le via Supabase Dashboard
*/

-- =====================================================
-- FIX FINAL : Réparer le compte Super Admin
-- Date : 3 novembre 2025
-- =====================================================

-- =====================================================
-- ÉTAPE 1 : DIAGNOSTIC COMPLET
-- =====================================================

-- Vérifier l'état dans public.users
DO $$
DECLARE
  user_exists BOOLEAN;
  user_id UUID;
  user_email TEXT;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.users WHERE email = 'admin@epilot.cg') INTO user_exists;
  
  IF user_exists THEN
    SELECT id, email INTO user_id, user_email FROM public.users WHERE email = 'admin@epilot.cg';
    RAISE NOTICE '✅ Profil existe dans public.users';
    RAISE NOTICE '   ID: %', user_id;
    RAISE NOTICE '   Email: %', user_email;
  ELSE
    RAISE NOTICE '❌ Profil n''existe PAS dans public.users';
  END IF;
END $$;

-- Vérifier l'état dans auth.users
DO $$
DECLARE
  auth_exists BOOLEAN;
  auth_id UUID;
  auth_email TEXT;
BEGIN
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'admin@epilot.cg') INTO auth_exists;
  
  IF auth_exists THEN
    SELECT id, email INTO auth_id, auth_email FROM auth.users WHERE email = 'admin@epilot.cg';
    RAISE NOTICE '✅ Auth existe dans auth.users';
    RAISE NOTICE '   ID: %', auth_id;
    RAISE NOTICE '   Email: %', auth_email;
  ELSE
    RAISE NOTICE '❌ Auth n''existe PAS dans auth.users';
  END IF;
END $$;

-- =====================================================
-- ÉTAPE 2 : SOLUTION SELON LE CAS
-- =====================================================

DO $$
DECLARE
  user_exists BOOLEAN;
  auth_exists BOOLEAN;
  user_id UUID;
  auth_id UUID;
BEGIN
  -- Vérifier l'existence
  SELECT EXISTS(SELECT 1 FROM public.users WHERE email = 'admin@epilot.cg') INTO user_exists;
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'admin@epilot.cg') INTO auth_exists;
  
  -- CAS 1 : Les deux existent
  IF user_exists AND auth_exists THEN
    SELECT id INTO user_id FROM public.users WHERE email = 'admin@epilot.cg';
    SELECT id INTO auth_id FROM auth.users WHERE email = 'admin@epilot.cg';
    
    IF user_id = auth_id THEN
      RAISE NOTICE '✅ CAS 1 : Les deux existent avec le même ID';
      RAISE NOTICE '   → Mise à jour du profil uniquement';
      
      -- Mettre à jour le profil
      UPDATE public.users
      SET 
        first_name = 'Ramsès',
        last_name = 'MELACK',
        role = 'super_admin',
        status = 'active',
        school_group_id = NULL,
        updated_at = NOW()
      WHERE email = 'admin@epilot.cg';
      
      -- Confirmer l'email
      UPDATE auth.users
      SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
      WHERE email = 'admin@epilot.cg';
      
      RAISE NOTICE '✅ Profil mis à jour avec succès';
    ELSE
      RAISE NOTICE '⚠️ CAS 2 : Les deux existent mais IDs différents';
      RAISE NOTICE '   user_id: %, auth_id: %', user_id, auth_id;
      RAISE NOTICE '   → Suppression du profil et recréation';
      
      -- Supprimer le profil avec le mauvais ID
      DELETE FROM public.users WHERE email = 'admin@epilot.cg';
      
      -- Recréer avec le bon ID
      INSERT INTO public.users (
        id, email, first_name, last_name, role, status, school_group_id, created_at, updated_at
      ) VALUES (
        auth_id, 'admin@epilot.cg', 'Ramsès', 'MELACK', 'super_admin', 'active', NULL, NOW(), NOW()
      );
      
      -- Confirmer l'email
      UPDATE auth.users
      SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
      WHERE email = 'admin@epilot.cg';
      
      RAISE NOTICE '✅ Profil recréé avec le bon ID';
    END IF;
  
  -- CAS 3 : Seulement auth existe
  ELSIF auth_exists AND NOT user_exists THEN
    SELECT id INTO auth_id FROM auth.users WHERE email = 'admin@epilot.cg';
    
    RAISE NOTICE '⚠️ CAS 3 : Seulement auth.users existe';
    RAISE NOTICE '   → Création du profil avec ID: %', auth_id;
    
    -- Créer le profil
    INSERT INTO public.users (
      id, email, first_name, last_name, role, status, school_group_id, created_at, updated_at
    ) VALUES (
      auth_id, 'admin@epilot.cg', 'Ramsès', 'MELACK', 'super_admin', 'active', NULL, NOW(), NOW()
    );
    
    -- Confirmer l'email
    UPDATE auth.users
    SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
    WHERE email = 'admin@epilot.cg';
    
    RAISE NOTICE '✅ Profil créé avec succès';
  
  -- CAS 4 : Seulement profil existe
  ELSIF user_exists AND NOT auth_exists THEN
    RAISE NOTICE '❌ CAS 4 : Seulement public.users existe (orphelin)';
    RAISE NOTICE '   → Suppression du profil orphelin';
    
    -- Supprimer le profil orphelin
    DELETE FROM public.users WHERE email = 'admin@epilot.cg';
    
    RAISE NOTICE '⚠️ Compte supprimé - Recréez-le via l''interface';
  
  -- CAS 5 : Aucun n'existe
  ELSE
    RAISE NOTICE '❌ CAS 5 : Aucun compte n''existe';
    RAISE NOTICE '   → Créez le compte via l''interface';
  END IF;
END $$;

-- =====================================================
-- ÉTAPE 3 : VÉRIFICATION FINALE
-- =====================================================

-- Afficher le résultat final
SELECT 
  'RÉSULTAT FINAL' AS status,
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.role,
  u.status,
  au.email_confirmed_at IS NOT NULL AS email_confirmed,
  au.last_sign_in_at
FROM public.users u
JOIN auth.users au ON au.id = u.id
WHERE u.email = 'admin@epilot.cg';

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================

/*
Selon le cas détecté :

CAS 1 : ✅ Profil mis à jour
CAS 2 : ✅ Profil recréé avec le bon ID
CAS 3 : ✅ Profil créé
CAS 4 : ⚠️ Profil orphelin supprimé → Recréer via interface
CAS 5 : ❌ Aucun compte → Créer via interface

Si CAS 1, 2 ou 3 : Vous pouvez vous connecter !
Si CAS 4 ou 5 : Créez le compte via l'interface :
  Page Utilisateurs → Créer
  Email : admin@epilot.cg
  Rôle : Super Admin
  Mot de passe : (choisir)
*/

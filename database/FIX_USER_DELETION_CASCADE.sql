-- =====================================================
-- FIX : Suppression CASCADE auth.users + public.users
-- Quand on supprime dans public.users, supprimer aussi dans auth.users
-- Date : 3 novembre 2025
-- =====================================================

-- =====================================================
-- ÉTAPE 1 : CRÉER LA FONCTION DE SUPPRESSION CASCADE
-- =====================================================

CREATE OR REPLACE FUNCTION delete_auth_user_on_profile_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Supprimer l'utilisateur dans auth.users quand supprimé dans public.users
  DELETE FROM auth.users WHERE id = OLD.id;
  
  RAISE NOTICE '✅ Utilisateur % supprimé de auth.users', OLD.email;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ÉTAPE 2 : CRÉER LE TRIGGER
-- =====================================================

DROP TRIGGER IF EXISTS trigger_delete_auth_user ON public.users;

CREATE TRIGGER trigger_delete_auth_user
AFTER DELETE ON public.users
FOR EACH ROW
EXECUTE FUNCTION delete_auth_user_on_profile_delete();

DO $$ BEGIN RAISE NOTICE '✅ Trigger de suppression CASCADE créé'; END $$;

-- =====================================================
-- ÉTAPE 3 : NETTOYER LES UTILISATEURS ORPHELINS
-- =====================================================

-- Trouver les utilisateurs dans auth.users qui n'existent plus dans public.users
DO $$
DECLARE
  orphan_count INTEGER;
  rec RECORD;
BEGIN
  -- Compter les orphelins
  SELECT COUNT(*) INTO orphan_count
  FROM auth.users au
  WHERE NOT EXISTS (
    SELECT 1 FROM public.users pu WHERE pu.id = au.id
  );
  
  IF orphan_count > 0 THEN
    RAISE NOTICE '⚠️ % utilisateurs orphelins trouvés dans auth.users', orphan_count;
    
    -- Lister les orphelins
    RAISE NOTICE '📋 Liste des utilisateurs orphelins :';
    FOR rec IN 
      SELECT au.id, au.email, au.created_at
      FROM auth.users au
      WHERE NOT EXISTS (
        SELECT 1 FROM public.users pu WHERE pu.id = au.id
      )
    LOOP
      RAISE NOTICE '  - % (%) créé le %', rec.email, rec.id, rec.created_at;
    END LOOP;
    
    -- Supprimer les orphelins (DÉCOMMENTER POUR EXÉCUTER)
    -- DELETE FROM auth.users
    -- WHERE id IN (
    --   SELECT au.id
    --   FROM auth.users au
    --   WHERE NOT EXISTS (
    --     SELECT 1 FROM public.users pu WHERE pu.id = au.id
    --   )
    -- );
    
    -- RAISE NOTICE '✅ % utilisateurs orphelins supprimés', orphan_count;
  ELSE
    RAISE NOTICE '✅ Aucun utilisateur orphelin trouvé';
  END IF;
END $$;

-- =====================================================
-- ÉTAPE 4 : VÉRIFICATIONS
-- =====================================================

-- Vérifier que le trigger existe
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_delete_auth_user'
  AND event_object_table = 'users';

-- Comparer les comptes
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
-- TEST DU TRIGGER (OPTIONNEL)
-- =====================================================

-- NE PAS EXÉCUTER EN PRODUCTION SANS BACKUP !

-- 1. Créer un utilisateur de test
-- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
-- VALUES (
--   gen_random_uuid(),
--   'test.delete@epilot.cg',
--   crypt('password123', gen_salt('bf')),
--   NOW(),
--   NOW(),
--   NOW()
-- );

-- 2. Créer le profil correspondant
-- INSERT INTO public.users (id, email, first_name, last_name, role, status)
-- SELECT 
--   id,
--   'test.delete@epilot.cg',
--   'Test',
--   'Delete',
--   'admin_groupe',
--   'active'
-- FROM auth.users WHERE email = 'test.delete@epilot.cg';

-- 3. Supprimer le profil (devrait supprimer aussi auth.users)
-- DELETE FROM public.users WHERE email = 'test.delete@epilot.cg';

-- 4. Vérifier que auth.users est aussi supprimé
-- SELECT * FROM auth.users WHERE email = 'test.delete@epilot.cg';
-- Résultat attendu : 0 lignes

-- =====================================================
-- ALTERNATIVE : SUPPRIMER MANUELLEMENT LES ORPHELINS
-- =====================================================

-- Si vous voulez supprimer manuellement les utilisateurs orphelins :

-- Lister les orphelins
SELECT 
  au.id,
  au.email,
  au.created_at,
  au.last_sign_in_at
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
)
ORDER BY au.created_at DESC;

-- Supprimer un orphelin spécifique par email
-- DELETE FROM auth.users WHERE email = 'int@epilot.cg';
-- DELETE FROM auth.users WHERE email = 'anais@epilot.cg';

-- Supprimer TOUS les orphelins (ATTENTION !)
-- DELETE FROM auth.users
-- WHERE id NOT IN (SELECT id FROM public.users);

-- =====================================================
-- RÉSUMÉ
-- =====================================================

/*
✅ Trigger créé : Suppression CASCADE automatique
✅ Fonction créée : delete_auth_user_on_profile_delete()
✅ Détection des orphelins : Script fourni
✅ Nettoyage des orphelins : Script fourni (à décommenter)

COMPORTEMENT APRÈS CE SCRIPT :
- Supprimer dans public.users → Supprime aussi dans auth.users ✅
- Plus d'utilisateurs orphelins ✅
- Possibilité de recréer avec le même email ✅

NOTES :
1. Le trigger s'exécute APRÈS la suppression dans public.users
2. SECURITY DEFINER permet au trigger d'accéder à auth.users
3. Les orphelins existants doivent être nettoyés manuellement
4. Testez d'abord sur un utilisateur de test !
*/

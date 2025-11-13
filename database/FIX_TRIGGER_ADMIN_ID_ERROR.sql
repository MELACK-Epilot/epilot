-- =====================================================
-- FIX : Supprimer les triggers obsolètes qui utilisent admin_id
-- Date : 4 novembre 2025
-- Problème : column "admin_id" of relation "school_groups" does not exist
-- =====================================================

-- =====================================================
-- ÉTAPE 1 : SUPPRIMER LES TRIGGERS OBSOLÈTES
-- =====================================================

-- Supprimer les triggers qui tentent de mettre à jour school_groups.admin_id
DROP TRIGGER IF EXISTS trigger_auto_assign_admin_on_insert ON public.users CASCADE;
DROP TRIGGER IF EXISTS trigger_auto_assign_admin_on_update ON public.users CASCADE;
DROP TRIGGER IF EXISTS trigger_handle_admin_change ON public.users CASCADE;

-- Supprimer d'autres triggers potentiellement problématiques
DROP TRIGGER IF EXISTS update_school_group_admin ON public.users CASCADE;
DROP TRIGGER IF EXISTS sync_admin_id ON public.users CASCADE;
DROP TRIGGER IF EXISTS set_admin_id ON public.users CASCADE;
DROP TRIGGER IF EXISTS update_admin_id ON public.users CASCADE;

-- =====================================================
-- ÉTAPE 2 : SUPPRIMER LES FONCTIONS OBSOLÈTES
-- =====================================================

-- Supprimer les fonctions qui utilisent admin_id
DROP FUNCTION IF EXISTS public.auto_assign_group_admin() CASCADE;
DROP FUNCTION IF EXISTS public.handle_admin_group_change() CASCADE;
DROP FUNCTION IF EXISTS public.update_school_group_admin_id() CASCADE;
DROP FUNCTION IF EXISTS public.sync_admin_id() CASCADE;
DROP FUNCTION IF EXISTS public.set_admin_id() CASCADE;
DROP FUNCTION IF EXISTS public.update_admin_id_on_user_change() CASCADE;
DROP FUNCTION IF EXISTS public.handle_admin_assignment() CASCADE;

-- =====================================================
-- ÉTAPE 3 : VÉRIFICATIONS
-- =====================================================

-- Vérifier qu'il ne reste plus de triggers sur users
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND trigger_schema = 'public'
ORDER BY trigger_name;

-- Vérifier qu'il ne reste plus de fonctions utilisant admin_id
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_definition LIKE '%admin_id%'
  AND routine_name NOT IN (
    'get_school_group_admin',  -- Cette fonction est OK (utilise users.school_group_id)
    'is_admin_of_group'        -- Cette fonction est OK
  )
ORDER BY routine_name;

-- Vérifier que la colonne admin_id n'existe plus dans school_groups
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'school_groups'
  AND column_name = 'admin_id';
-- Résultat attendu : 0 lignes

-- =====================================================
-- ÉTAPE 4 : RECRÉER LE TRIGGER CORRECT (update_updated_at)
-- =====================================================

-- Fonction pour mettre à jour updated_at (sans toucher à admin_id)
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur users
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Trigger sur school_groups
DROP TRIGGER IF EXISTS update_school_groups_updated_at ON public.school_groups;
CREATE TRIGGER update_school_groups_updated_at
  BEFORE UPDATE ON public.school_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- =====================================================
-- ÉTAPE 5 : VÉRIFICATION FINALE
-- =====================================================

DO $$
DECLARE
  trigger_count INTEGER;
  function_count INTEGER;
  column_exists BOOLEAN;
BEGIN
  -- Compter les triggers restants sur users
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE event_object_table = 'users'
    AND trigger_schema = 'public';
  
  RAISE NOTICE '📊 Triggers restants sur users : %', trigger_count;
  
  -- Compter les fonctions contenant admin_id (sauf les autorisées)
  SELECT COUNT(*) INTO function_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_definition LIKE '%admin_id%'
    AND routine_name NOT IN ('get_school_group_admin', 'is_admin_of_group');
  
  IF function_count > 0 THEN
    RAISE WARNING '⚠️ Il reste % fonctions utilisant admin_id', function_count;
  ELSE
    RAISE NOTICE '✅ Aucune fonction obsolète trouvée';
  END IF;
  
  -- Vérifier que admin_id n'existe plus dans school_groups
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'school_groups'
      AND column_name = 'admin_id'
  ) INTO column_exists;
  
  IF column_exists THEN
    RAISE WARNING '⚠️ La colonne admin_id existe encore dans school_groups';
  ELSE
    RAISE NOTICE '✅ La colonne admin_id a bien été supprimée';
  END IF;
  
  -- Résumé
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ NETTOYAGE TERMINÉ';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================
/*
Après exécution de ce script :

✅ Tous les triggers obsolètes supprimés
✅ Toutes les fonctions obsolètes supprimées
✅ Nouveaux triggers corrects créés (update_updated_at)
✅ Plus d'erreur "admin_id does not exist"

Vous pouvez maintenant créer des utilisateurs sans erreur !

Test :
1. Aller sur http://localhost:3000/dashboard/users
2. Cliquer sur "Nouvel utilisateur"
3. Remplir le formulaire
4. Cliquer sur "➕ Créer"

Résultat attendu :
✅ Toast vert "Utilisateur créé avec succès"
✅ Dialog se ferme
✅ Liste se rafraîchit automatiquement
✅ Nouvel utilisateur visible
*/

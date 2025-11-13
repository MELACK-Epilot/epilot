-- =====================================================
-- NETTOYAGE COMPLET : Supprimer orphelins + Recréer admin
-- Date : 3 novembre 2025
-- =====================================================

-- =====================================================
-- ÉTAPE 1 : SUPPRIMER L'ORPHELIN admin@epilot.cg
-- =====================================================

DELETE FROM auth.users WHERE email = 'admin@epilot.cg';

DO $$ BEGIN RAISE NOTICE '✅ Orphelin admin@epilot.cg supprimé'; END $$;

-- =====================================================
-- ÉTAPE 2 : SUPPRIMER TOUS LES AUTRES ORPHELINS
-- =====================================================

-- Supprimer tous les utilisateurs dans auth.users qui n'ont pas de profil dans public.users
DELETE FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users);

DO $$ 
DECLARE
  deleted_count INTEGER;
BEGIN
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✅ % orphelins supprimés au total', deleted_count;
END $$;

-- =====================================================
-- ÉTAPE 3 : VÉRIFICATION
-- =====================================================

-- Vérifier qu'il n'y a plus d'orphelins
DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM auth.users au
  WHERE NOT EXISTS (
    SELECT 1 FROM public.users pu WHERE pu.id = au.id
  );
  
  IF orphan_count = 0 THEN
    RAISE NOTICE '✅ Aucun orphelin restant - Base de données cohérente';
  ELSE
    RAISE WARNING '⚠️ Il reste % orphelins', orphan_count;
  END IF;
END $$;

-- =====================================================
-- ÉTAPE 4 : STATISTIQUES FINALES
-- =====================================================

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

-- Lister tous les utilisateurs restants
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.role,
  u.status,
  sg.name AS school_group,
  u.created_at
FROM public.users u
LEFT JOIN school_groups sg ON sg.id = u.school_group_id
ORDER BY u.created_at DESC;

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================

/*
✅ Orphelin admin@epilot.cg supprimé
✅ X orphelins supprimés au total
✅ Aucun orphelin restant - Base de données cohérente

Les comptes auth.users et public.users sont maintenant synchronisés.

PROCHAINE ÉTAPE :
Recréer l'utilisateur admin@epilot.cg via l'interface :
1. Aller sur la page Utilisateurs
2. Cliquer sur "Créer un utilisateur"
3. Remplir :
   - Email : admin@epilot.cg
   - Prénom : Admin
   - Nom : E-Pilot
   - Rôle : Super Admin
   - Mot de passe : (choisir un mot de passe sécurisé)
4. Valider

Le trigger CASCADE garantira que les deux tables restent synchronisées.
*/

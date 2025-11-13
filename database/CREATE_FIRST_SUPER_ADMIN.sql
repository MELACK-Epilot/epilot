-- =====================================================
-- CRÉER LE PREMIER SUPER ADMIN
-- Quand la table auth.users est vide
-- Date : 3 novembre 2025
-- =====================================================

-- =====================================================
-- MÉTHODE 1 : VIA SUPABASE AUTH API (RECOMMANDÉ)
-- =====================================================

/*
⚠️ IMPORTANT : Vous NE POUVEZ PAS créer un utilisateur directement dans auth.users via SQL.
La table auth.users est gérée par Supabase Auth et nécessite l'API.

SOLUTION : Utilisez l'interface Supabase Dashboard
*/

-- =====================================================
-- ÉTAPE 1 : CRÉER VIA SUPABASE DASHBOARD
-- =====================================================

/*
1. Ouvrir : https://supabase.com/dashboard/project/csltuxbanvweyfzqpfap/auth/users

2. Cliquer sur "Add user" (bouton vert en haut à droite)

3. Choisir : "Create new user"

4. Remplir le formulaire :
   ┌─────────────────────────────────────────┐
   │ Email : admin@epilot.cg                 │
   │ Password : Admin@2025!                  │
   │ Auto Confirm User : ✅ (cocher)         │
   └─────────────────────────────────────────┘

5. Cliquer sur "Create user"

6. ✅ L'utilisateur est créé dans auth.users avec un ID généré
*/

-- =====================================================
-- ÉTAPE 2 : CRÉER LE PROFIL DANS PUBLIC.USERS
-- =====================================================

-- Attendre que l'utilisateur soit créé dans auth.users
-- Puis exécuter cette requête pour créer le profil :

DO $$
DECLARE
  auth_user_id UUID;
BEGIN
  -- Récupérer l'ID de l'utilisateur créé
  SELECT id INTO auth_user_id
  FROM auth.users
  WHERE email = 'admin@epilot.cg';
  
  IF auth_user_id IS NULL THEN
    RAISE EXCEPTION '❌ Utilisateur non trouvé dans auth.users. Créez-le d''abord via Supabase Dashboard.';
  END IF;
  
  -- Créer le profil dans public.users
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
  ) VALUES (
    auth_user_id,
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
  
  RAISE NOTICE '✅ Profil Super Admin créé avec ID : %', auth_user_id;
END $$;

-- =====================================================
-- ÉTAPE 3 : VÉRIFICATION
-- =====================================================

-- Vérifier que tout est OK
SELECT 
  '✅ COMPTE CRÉÉ' AS status,
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.role,
  u.status,
  au.email_confirmed_at IS NOT NULL AS email_confirmed,
  au.created_at
FROM public.users u
JOIN auth.users au ON au.id = u.id
WHERE u.email = 'admin@epilot.cg';

-- =====================================================
-- MÉTHODE 2 : VIA L'INTERFACE E-PILOT (ALTERNATIVE)
-- =====================================================

/*
Si vous avez déjà un autre compte avec accès :

1. Se connecter avec cet autre compte
2. Aller sur : Page Utilisateurs
3. Cliquer sur : Créer un utilisateur
4. Remplir :
   - Email : admin@epilot.cg
   - Prénom : Ramsès
   - Nom : MELACK
   - Téléphone : +242 06 969 8620
   - Rôle : Super Admin
   - Mot de passe : Admin@2025!
5. Valider

✅ Le système créera automatiquement :
   - L'utilisateur dans auth.users
   - Le profil dans public.users
*/

-- =====================================================
-- MÉTHODE 3 : CRÉER UN COMPTE TEMPORAIRE
-- =====================================================

/*
Si vous n'avez AUCUN compte :

1. Activer l'inscription publique temporairement :
   https://supabase.com/dashboard/project/csltuxbanvweyfzqpfap/auth/providers

2. Aller sur votre page de connexion :
   http://localhost:3000/

3. S'inscrire avec admin@epilot.cg

4. Désactiver l'inscription publique

5. Mettre à jour le rôle en super_admin :
*/

UPDATE public.users
SET role = 'super_admin', status = 'active'
WHERE email = 'admin@epilot.cg';

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================

/*
Après avoir suivi l'une des 3 méthodes :

✅ Utilisateur créé dans auth.users
✅ Profil créé dans public.users
✅ Email : admin@epilot.cg
✅ Mot de passe : Admin@2025! (ou celui que vous avez choisi)
✅ Rôle : super_admin
✅ Statut : active

Vous pouvez maintenant vous connecter !

CONNEXION :
1. http://localhost:3000/
2. Email : admin@epilot.cg
3. Mot de passe : Admin@2025!
*/

-- =====================================================
-- NOTES IMPORTANTES
-- =====================================================

/*
⚠️ POURQUOI auth.users EST VIDE ?

Causes possibles :
1. Base de données fraîchement créée
2. Suppression accidentelle de tous les utilisateurs
3. Reset de la base de données
4. Problème de migration

✅ SOLUTION :
Créez le premier utilisateur via Supabase Dashboard (MÉTHODE 1)
C'est la méthode la plus sûre et recommandée.

🔐 SÉCURITÉ :
- Changez le mot de passe après la première connexion
- Activez l'authentification à deux facteurs si disponible
- Ne partagez jamais les identifiants Super Admin
*/

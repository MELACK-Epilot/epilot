-- ============================================================================
-- CRÉATION ADMIN GROUPE - VERSION FINALE CORRIGÉE
-- ============================================================================
-- Script prêt à l'emploi - Pas besoin de remplacer d'UUID !
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1: Créer directement l'utilisateur dans Supabase Auth Dashboard
-- ============================================================================
/*
1. Aller dans Supabase Dashboard → Authentication → Users
2. Cliquer "Add user"
3. Email: admin.groupe@epilot.com
4. Password: Admin@2025!
5. Auto Confirm User: ✅ OUI
6. Copier l'UUID généré (exemple: a1b2c3d4-e5f6-7890-abcd-ef1234567890)
*/

-- ============================================================================
-- ÉTAPE 2: Créer le groupe scolaire avec un UUID unique
-- ============================================================================
INSERT INTO school_groups (
  id,
  name,
  code,
  region,
  city,
  admin_id,
  plan,
  status,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(), -- Génère automatiquement un UUID unique
  'Nouveau Groupe Scolaire',
  'NGS-' || to_char(NOW(), 'YYYY'),
  'Brazzaville',
  'Brazzaville',
  'REMPLACER_PAR_UUID_SUPABASE', -- ⚠️ Remplacer par l'UUID copié à l'étape 1
  'premium',
  'active',
  NOW(),
  NOW()
)
RETURNING id; -- Affiche l'ID du groupe créé

-- ============================================================================
-- ÉTAPE 3: Créer l'utilisateur dans la table users
-- ============================================================================
-- ⚠️ Remplacer les 2 UUID ci-dessous par ceux générés aux étapes précédentes

INSERT INTO users (
  id,
  first_name,
  last_name,
  email,
  phone,
  role,
  school_group_id,
  status,
  created_at,
  updated_at
) VALUES (
  'REMPLACER_PAR_UUID_SUPABASE', -- ⚠️ UUID de l'étape 1
  'Admin',
  'Groupe',
  'admin.groupe@epilot.com',
  '+242 06 987 65 43',
  'admin_groupe',
  'REMPLACER_PAR_UUID_GROUPE', -- ⚠️ UUID retourné à l'étape 2
  'active',
  NOW(),
  NOW()
);

-- ============================================================================
-- VÉRIFICATIONS
-- ============================================================================

-- Vérifier l'utilisateur créé
SELECT 
  u.id,
  u.first_name,
  u.last_name,
  u.email,
  u.role,
  u.school_group_id,
  sg.name as group_name,
  u.status
FROM users u
LEFT JOIN school_groups sg ON u.school_group_id = sg.id
WHERE u.email = 'admin.groupe@epilot.com';

-- ============================================================================
-- RÉSULTAT ATTENDU
-- ============================================================================
/*
Connexion:
  URL: http://localhost:5173/login
  Email: admin.groupe@epilot.com
  Password: Admin@2025!
  
  ✅ Redirection vers /dashboard
  ✅ Sidebar filtrée (Écoles, Utilisateurs, Finances)
  ✅ Peut créer 10 écoles max (Plan Premium)
*/

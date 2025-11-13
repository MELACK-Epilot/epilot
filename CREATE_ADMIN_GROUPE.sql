-- ============================================================================
-- CRÉATION ADMIN GROUPE - E-PILOT CONGO
-- ============================================================================
-- Ce script crée un Admin Groupe avec son groupe scolaire associé
-- L'Admin Groupe aura un espace privé complètement séparé du Super Admin
-- ============================================================================

-- 1. CRÉER LE GROUPE SCOLAIRE
-- ============================================================================
-- Note: Créer d'abord un utilisateur temporaire pour admin_id
-- Nous le mettrons à jour après avoir créé le vrai admin

-- Créer un utilisateur temporaire (sera remplacé)
INSERT INTO users (
  id,
  email,
  first_name,
  last_name,
  role,
  status
) VALUES (
  'temp-admin-id',
  'temp@epilot.com',
  'Temp',
  'Admin',
  'admin_groupe',
  'inactive'
) ON CONFLICT (id) DO NOTHING;

-- Créer le groupe scolaire
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
  'group-1',
  'Groupe Scolaire International',
  'GSI-2025',
  'Brazzaville',
  'Brazzaville',
  'temp-admin-id', -- Sera mis à jour après
  'premium', -- Plan Premium
  'active',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  region = EXCLUDED.region,
  city = EXCLUDED.city,
  plan = EXCLUDED.plan,
  status = EXCLUDED.status,
  updated_at = NOW();

-- 2. CRÉER L'UTILISATEUR DANS SUPABASE AUTH
-- ============================================================================
-- NOTE: Cette partie doit être exécutée via le Dashboard Supabase ou l'API
-- Car nous ne pouvons pas créer directement dans auth.users via SQL

-- Via Dashboard Supabase:
-- 1. Aller dans Authentication > Users
-- 2. Cliquer sur "Add user"
-- 3. Email: int@epilot.com
-- 4. Password: int1@epilot.COM
-- 5. Auto Confirm User: OUI
-- 6. Copier l'UUID généré

-- Ou via API Supabase (à exécuter depuis votre backend):
/*
const { data, error } = await supabase.auth.admin.createUser({
  email: 'int@epilot.com',
  password: 'int1@epilot.COM',
  email_confirm: true,
  user_metadata: {
    first_name: 'Admin',
    last_name: 'Groupe',
    role: 'admin_groupe'
  }
});
*/

-- 3. CRÉER L'ENREGISTREMENT DANS LA TABLE USERS
-- ============================================================================
-- IMPORTANT: Remplacer 'USER_UUID_FROM_AUTH' par l'UUID réel de l'utilisateur créé dans auth.users

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
  'USER_UUID_FROM_AUTH', -- ⚠️ REMPLACER PAR L'UUID RÉEL
  'Admin',
  'Groupe',
  'int@epilot.com',
  '+242 06 987 65 43',
  'admin_groupe',
  'group-1', -- Lié au Groupe Scolaire International
  'active',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  school_group_id = EXCLUDED.school_group_id,
  status = EXCLUDED.status,
  updated_at = NOW();

-- 3.1 METTRE À JOUR LE GROUPE AVEC LE VRAI ADMIN
-- ============================================================================
UPDATE school_groups
SET admin_id = 'USER_UUID_FROM_AUTH' -- ⚠️ REMPLACER PAR L'UUID RÉEL
WHERE id = 'group-1';

-- 3.2 SUPPRIMER L'UTILISATEUR TEMPORAIRE
-- ============================================================================
DELETE FROM users WHERE id = 'temp-admin-id';

-- 4. VÉRIFICATION
-- ============================================================================
-- Vérifier que le groupe scolaire existe
SELECT 
  id,
  name,
  code,
  region,
  city,
  admin_id,
  plan,
  status
FROM school_groups
WHERE id = 'group-1';

-- Vérifier que l'utilisateur existe et est lié au groupe
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
WHERE u.email = 'int@epilot.com';

-- Vérifier les quotas du groupe
SELECT 
  sg.name,
  sg.plan as plan_actuel,
  sg.school_count,
  sg.student_count,
  sg.staff_count,
  (SELECT COUNT(*) FROM schools WHERE school_group_id = sg.id) as current_schools
FROM school_groups sg
WHERE sg.id = 'group-1';

-- ============================================================================
-- INSTRUCTIONS D'UTILISATION
-- ============================================================================
/*
ÉTAPE 1: Créer l'utilisateur dans Supabase Auth
-------------------------------------------------
Via Dashboard Supabase:
1. Aller dans Authentication > Users
2. Cliquer sur "Add user"
3. Email: int@epilot.com
4. Password: int1@epilot.COM
5. Auto Confirm User: ✅ OUI
6. Copier l'UUID généré (ex: 550e8400-e29b-41d4-a716-446655440000)

ÉTAPE 2: Exécuter ce script SQL
-------------------------------------------------
1. Remplacer 'USER_UUID_FROM_AUTH' par l'UUID copié à l'étape 1
2. Exécuter le script dans le SQL Editor de Supabase

ÉTAPE 3: Tester la connexion
-------------------------------------------------
1. Aller sur http://localhost:5173/login
2. Email: int@epilot.com
3. Password: int1@epilot.COM
4. ✅ Connexion réussie !

RÉSULTAT ATTENDU:
-------------------------------------------------
✅ Connexion réussie
✅ Redirection vers /dashboard
✅ Sidebar filtrée (Admin Groupe voit uniquement "Écoles")
✅ Peut créer des écoles dans les limites du plan Premium:
   - Maximum 3 écoles
   - Maximum 200 élèves par école
   - Maximum 20 personnel par école
✅ Message d'erreur si quota dépassé
*/

-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================
/*
🔐 SÉCURITÉ:
- L'Admin Groupe a un espace complètement séparé du Super Admin
- Il ne peut voir que ses propres écoles
- Les politiques RLS garantissent l'isolation des données

📊 QUOTAS:
- Plan Premium: 3 écoles, 200 élèves/école, 20 personnel/école
- Si quota dépassé → Message: "Vous avez atteint la limite de votre plan actuel"
- Possibilité de passer à un plan supérieur (Pro ou Institutionnel)

🏗️ HIÉRARCHIE:
Super Admin E-Pilot → Gère les plans et groupes scolaires
Admin Groupe → Gère ses écoles et utilisateurs
Admin École → Gère son école uniquement
*/

-- ============================================================================
-- CRÉATION ADMIN GROUPE - VERSION SIMPLIFIÉE
-- ============================================================================
-- Script corrigé et prêt à l'emploi
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1: Créer l'utilisateur temporaire
-- ============================================================================
INSERT INTO users (
  id,
  email,
  first_name,
  last_name,
  role,
  status
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'temp@epilot.com',
  'Temp',
  'Admin',
  'admin_groupe',
  'inactive'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ÉTAPE 2: Créer le groupe scolaire
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
  '00000000-0000-0000-0000-000000000002',
  'Groupe Scolaire International',
  'GSI-2025',
  'Brazzaville',
  'Brazzaville',
  '00000000-0000-0000-0000-000000000001',
  'premium',
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

-- ============================================================================
-- ÉTAPE 3: Créer le vrai utilisateur
-- ============================================================================
-- ⚠️ IMPORTANT: Avant d'exécuter cette partie :
-- 1. Aller dans Supabase Dashboard → Authentication → Users
-- 2. Cliquer "Add user"
-- 3. Email: int@epilot.com
-- 4. Password: int1@epilot.COM
-- 5. Auto Confirm User: ✅ OUI
-- 6. Copier l'UUID généré
-- 7. Remplacer 'VOTRE_UUID_ICI' ci-dessous par l'UUID copié

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
  'VOTRE_UUID_ICI', -- ⚠️ REMPLACER PAR L'UUID DE SUPABASE AUTH
  'Admin',
  'Groupe',
  'int@epilot.com',
  '+242 06 987 65 43',
  'admin_groupe',
  '00000000-0000-0000-0000-000000000002',
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

-- ============================================================================
-- ÉTAPE 4: Mettre à jour le groupe avec le vrai admin
-- ============================================================================
UPDATE school_groups
SET admin_id = 'VOTRE_UUID_ICI' -- ⚠️ REMPLACER PAR L'UUID DE SUPABASE AUTH
WHERE id = '00000000-0000-0000-0000-000000000002';

-- ============================================================================
-- ÉTAPE 5: Supprimer l'utilisateur temporaire
-- ============================================================================
DELETE FROM users WHERE id = '00000000-0000-0000-0000-000000000001';

-- ============================================================================
-- VÉRIFICATIONS
-- ============================================================================

-- Vérifier le groupe scolaire
SELECT 
  id,
  name,
  code,
  region,
  city,
  admin_id,
  plan,
  status,
  school_count,
  student_count,
  staff_count
FROM school_groups
WHERE id = '00000000-0000-0000-0000-000000000002';

-- Vérifier l'utilisateur
SELECT 
  u.id,
  u.first_name,
  u.last_name,
  u.email,
  u.phone,
  u.role,
  u.school_group_id,
  sg.name as group_name,
  u.status
FROM users u
LEFT JOIN school_groups sg ON u.school_group_id = sg.id
WHERE u.email = 'int@epilot.com';

-- Vérifier les quotas
SELECT 
  sg.name,
  sg.plan as plan_actuel,
  sg.school_count,
  sg.student_count,
  sg.staff_count,
  (SELECT COUNT(*) FROM schools WHERE school_group_id = sg.id) as current_schools
FROM school_groups sg
WHERE sg.id = '00000000-0000-0000-0000-000000000002';

-- ============================================================================
-- RÉSULTAT ATTENDU
-- ============================================================================
/*
Groupe Scolaire:
  id: 00000000-0000-0000-0000-000000000002
  name: Groupe Scolaire International
  code: GSI-2025
  region: Brazzaville
  city: Brazzaville
  admin_id: <UUID de l'admin>
  plan: premium
  status: active

Utilisateur:
  email: int@epilot.com
  role: admin_groupe
  school_group_id: 00000000-0000-0000-0000-000000000002
  status: active

Connexion:
  URL: http://localhost:5173/login
  Email: int@epilot.com
  Password: int1@epilot.COM
  
  ✅ Redirection vers /dashboard
  ✅ Sidebar filtrée (Écoles, Utilisateurs, Finances)
  ✅ Peut créer 3 écoles max (Plan Premium)
*/

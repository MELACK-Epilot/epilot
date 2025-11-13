-- ============================================
-- TEST : Reproduire exactement la requête du hook TypeScript
-- Date: 10 novembre 2025, 14h06
-- ============================================

-- Cette requête reproduit EXACTEMENT ce que fait le hook useModuleAdoption.ts

-- ÉTAPE 1 : Récupérer les groupes qui ont le module "Admission des élèves"
WITH groups_with_module AS (
  SELECT 
    gmc.school_group_id,
    sg.name as groupe_name
  FROM group_module_configs gmc
  JOIN modules m ON m.id = gmc.module_id
  JOIN school_groups sg ON sg.id = gmc.school_group_id
  WHERE m.name = 'Admission des élèves'
    AND gmc.is_enabled = true
)
SELECT 
  '=== ÉTAPE 1 : Groupes avec le module ===' as etape,
  school_group_id,
  groupe_name
FROM groups_with_module;

-- ÉTAPE 2 : Compter les utilisateurs actifs de ces groupes
WITH groups_with_module AS (
  SELECT gmc.school_group_id
  FROM group_module_configs gmc
  JOIN modules m ON m.id = gmc.module_id
  WHERE m.name = 'Admission des élèves'
    AND gmc.is_enabled = true
)
SELECT 
  '=== ÉTAPE 2 : Utilisateurs actifs ===' as etape,
  COUNT(*) as total_users,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as users_actifs
FROM users
WHERE school_group_id IN (SELECT school_group_id FROM groups_with_module)
  AND status = 'active';

-- ÉTAPE 3 : Détail des utilisateurs
WITH groups_with_module AS (
  SELECT gmc.school_group_id
  FROM group_module_configs gmc
  JOIN modules m ON m.id = gmc.module_id
  WHERE m.name = 'Admission des élèves'
    AND gmc.is_enabled = true
)
SELECT 
  '=== ÉTAPE 3 : Détail des utilisateurs ===' as etape,
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.status,
  u.role,
  sg.name as groupe_name,
  u.school_group_id
FROM users u
LEFT JOIN school_groups sg ON sg.id = u.school_group_id
WHERE u.school_group_id IN (SELECT school_group_id FROM groups_with_module)
  AND u.status = 'active'
ORDER BY sg.name, u.email;

-- ÉTAPE 4 : Vérifier si le problème vient de l'opérateur IN
-- Tester avec les UUIDs directs
SELECT 
  '=== ÉTAPE 4 : Test avec UUIDs directs ===' as etape,
  school_group_id,
  COUNT(*) as nb_users
FROM users
WHERE status = 'active'
GROUP BY school_group_id
ORDER BY nb_users DESC;

-- ÉTAPE 5 : Vérifier les permissions RLS
-- Cette requête doit être exécutée en tant que super admin
SELECT 
  '=== ÉTAPE 5 : Politiques RLS sur users ===' as etape,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

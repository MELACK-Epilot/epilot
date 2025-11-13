-- ============================================
-- VÉRIFICATION : Nombre RÉEL d'utilisateurs
-- Date: 10 novembre 2025, 14h12
-- ============================================

-- 1. COMPTER TOUS LES UTILISATEURS
SELECT 
  '=== TOTAL UTILISATEURS ===' as etape,
  COUNT(*) as total_users,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as users_actifs,
  COUNT(CASE WHEN status != 'active' THEN 1 END) as users_inactifs
FROM users;

-- 2. UTILISATEURS PAR GROUPE
SELECT 
  '=== UTILISATEURS PAR GROUPE ===' as etape,
  sg.name as groupe_name,
  COUNT(u.id) as nb_users,
  COUNT(CASE WHEN u.status = 'active' THEN 1 END) as users_actifs
FROM school_groups sg
LEFT JOIN users u ON u.school_group_id = sg.id
WHERE sg.status = 'active'
GROUP BY sg.id, sg.name
ORDER BY nb_users DESC;

-- 3. LISTE COMPLÈTE DES UTILISATEURS ACTIFS
SELECT 
  '=== LISTE COMPLÈTE USERS ACTIFS ===' as etape,
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
WHERE u.status = 'active'
ORDER BY sg.name, u.email;

-- 4. UTILISATEURS DES GROUPES AVEC MODULE "Admission des élèves"
SELECT 
  '=== USERS DES GROUPES AVEC MODULE ===' as etape,
  u.email,
  u.status,
  sg.name as groupe_name,
  u.school_group_id
FROM users u
JOIN school_groups sg ON sg.id = u.school_group_id
WHERE u.school_group_id IN (
  SELECT gmc.school_group_id
  FROM group_module_configs gmc
  JOIN modules m ON m.id = gmc.module_id
  WHERE m.name = 'Admission des élèves'
    AND gmc.is_enabled = true
)
ORDER BY sg.name, u.email;

-- 5. VÉRIFIER LES GROUPES QUI ONT LE MODULE
SELECT 
  '=== GROUPES AVEC MODULE ===' as etape,
  sg.id as group_id,
  sg.name as groupe_name,
  m.name as module_name,
  gmc.is_enabled
FROM group_module_configs gmc
JOIN school_groups sg ON sg.id = gmc.school_group_id
JOIN modules m ON m.id = gmc.module_id
WHERE m.name = 'Admission des élèves'
  AND gmc.is_enabled = true;

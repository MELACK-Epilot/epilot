-- Vérification SIMPLE pour Admin Groupe
-- Voir si les données sont bien présentes

-- 1. Utilisateur Admin Groupe
SELECT 
  'UTILISATEUR ADMIN GROUPE' as check_type,
  u.email,
  u.school_group_id,
  sg.name as group_name
FROM users u
LEFT JOIN school_groups sg ON u.school_group_id = sg.id
WHERE u.role = 'admin_groupe'
LIMIT 3;

-- 2. Modules dans group_module_configs pour cet utilisateur
SELECT 
  'MODULES ASSIGNÉS AU GROUPE' as check_type,
  COUNT(*) as total_modules,
  COUNT(CASE WHEN gmc.is_enabled = true THEN 1 END) as modules_actifs
FROM group_module_configs gmc
WHERE gmc.school_group_id IN (
  SELECT DISTINCT school_group_id 
  FROM users 
  WHERE role = 'admin_groupe'
  LIMIT 1
);

-- 3. Détail de quelques modules
SELECT 
  'EXEMPLES MODULES' as check_type,
  m.name as module_name,
  gmc.is_enabled as actif,
  bc.name as categorie
FROM group_module_configs gmc
JOIN modules m ON gmc.module_id = m.id
LEFT JOIN business_categories bc ON m.category_id = bc.id
WHERE gmc.school_group_id IN (
  SELECT DISTINCT school_group_id 
  FROM users 
  WHERE role = 'admin_groupe'
  LIMIT 1
)
LIMIT 5;

-- 4. Test de la requête que l'interface utilise
SELECT 
  'TEST REQUÊTE INTERFACE' as check_type,
  gmc.is_enabled,
  m.id,
  m.name,
  m.description,
  m.icon,
  m.color,
  bc.name as category_name
FROM group_module_configs gmc
JOIN modules m ON gmc.module_id = m.id
LEFT JOIN business_categories bc ON m.category_id = bc.id
WHERE gmc.school_group_id = (
  SELECT school_group_id 
  FROM users 
  WHERE role = 'admin_groupe' 
  LIMIT 1
)
AND m.status = 'active'
LIMIT 3;

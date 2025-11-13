-- Test des données pour "Mes Modules" Admin Groupe
-- Vérifier que les modules sont bien assignés au groupe

-- 1. Vérifier l'utilisateur Admin Groupe
SELECT 
  id,
  email,
  first_name,
  last_name,
  role,
  school_group_id,
  (SELECT name FROM school_groups WHERE id = users.school_group_id) as group_name
FROM users 
WHERE role = 'admin_groupe' 
LIMIT 5;

-- 2. Vérifier l'abonnement du groupe
SELECT 
  sg.id,
  sg.name as group_name,
  sg.plan_id,
  p.name as plan_name,
  p.slug as plan_slug,
  s.status as subscription_status
FROM school_groups sg
LEFT JOIN plans p ON sg.plan_id = p.id
LEFT JOIN subscriptions s ON s.school_group_id = sg.id
WHERE sg.id IN (
  SELECT DISTINCT school_group_id 
  FROM users 
  WHERE role = 'admin_groupe'
)
LIMIT 5;

-- 3. Vérifier les modules assignés au plan
SELECT 
  p.name as plan_name,
  COUNT(pm.module_id) as modules_count
FROM plans p
LEFT JOIN plan_modules pm ON p.id = pm.plan_id
WHERE p.id IN (
  SELECT DISTINCT plan_id 
  FROM school_groups 
  WHERE id IN (
    SELECT DISTINCT school_group_id 
    FROM users 
    WHERE role = 'admin_groupe'
  )
)
GROUP BY p.id, p.name;

-- 4. Vérifier les modules dans group_module_configs
SELECT 
  sg.name as group_name,
  COUNT(gmc.module_id) as total_modules,
  COUNT(CASE WHEN gmc.is_enabled = true THEN 1 END) as enabled_modules,
  COUNT(CASE WHEN gmc.is_enabled = false THEN 1 END) as disabled_modules
FROM school_groups sg
LEFT JOIN group_module_configs gmc ON sg.id = gmc.school_group_id
WHERE sg.id IN (
  SELECT DISTINCT school_group_id 
  FROM users 
  WHERE role = 'admin_groupe'
)
GROUP BY sg.id, sg.name;

-- 5. Détail des modules assignés à un groupe spécifique
SELECT 
  gmc.school_group_id,
  sg.name as group_name,
  m.name as module_name,
  m.slug as module_slug,
  bc.name as category_name,
  gmc.is_enabled,
  m.plan_required,
  m.is_core
FROM group_module_configs gmc
JOIN business_modules m ON gmc.module_id = m.id
JOIN business_categories bc ON m.category_id = bc.id
JOIN school_groups sg ON gmc.school_group_id = sg.id
WHERE gmc.school_group_id IN (
  SELECT DISTINCT school_group_id 
  FROM users 
  WHERE role = 'admin_groupe'
  LIMIT 1
)
ORDER BY bc.name, m.name;

-- 6. Vérifier si les modules du plan sont bien dans group_module_configs
WITH admin_group AS (
  SELECT school_group_id, plan_id
  FROM school_groups 
  WHERE id IN (
    SELECT DISTINCT school_group_id 
    FROM users 
    WHERE role = 'admin_groupe'
    LIMIT 1
  )
),
plan_modules AS (
  SELECT pm.module_id, m.name as module_name
  FROM plan_modules pm
  JOIN business_modules m ON pm.module_id = m.id
  WHERE pm.plan_id = (SELECT plan_id FROM admin_group)
),
group_modules AS (
  SELECT gmc.module_id, m.name as module_name, gmc.is_enabled
  FROM group_module_configs gmc
  JOIN business_modules m ON gmc.module_id = m.id
  WHERE gmc.school_group_id = (SELECT school_group_id FROM admin_group)
)
SELECT 
  pm.module_name,
  CASE 
    WHEN gm.module_id IS NOT NULL THEN 'Assigné'
    ELSE 'MANQUANT'
  END as status_assignment,
  COALESCE(gm.is_enabled, false) as is_enabled
FROM plan_modules pm
LEFT JOIN group_modules gm ON pm.module_id = gm.module_id
ORDER BY pm.module_name;

-- 7. Statistiques par catégorie pour un groupe
SELECT 
  bc.name as category_name,
  bc.icon,
  bc.color,
  COUNT(gmc.module_id) as total_modules,
  COUNT(CASE WHEN gmc.is_enabled = true THEN 1 END) as enabled_modules
FROM business_categories bc
JOIN business_modules m ON bc.id = m.category_id
JOIN group_module_configs gmc ON m.id = gmc.module_id
WHERE gmc.school_group_id IN (
  SELECT DISTINCT school_group_id 
  FROM users 
  WHERE role = 'admin_groupe'
  LIMIT 1
)
AND bc.status = 'active'
AND m.status = 'active'
GROUP BY bc.id, bc.name, bc.icon, bc.color
ORDER BY bc.name;

-- 8. Diagnostic complet
SELECT 
  'Utilisateurs Admin Groupe' as check_type,
  COUNT(*) as count
FROM users 
WHERE role = 'admin_groupe'

UNION ALL

SELECT 
  'Groupes avec plan assigné' as check_type,
  COUNT(*) as count
FROM school_groups 
WHERE plan_id IS NOT NULL

UNION ALL

SELECT 
  'Modules dans plan Pro' as check_type,
  COUNT(*) as count
FROM plan_modules pm
JOIN plans p ON pm.plan_id = p.id
WHERE p.slug = 'pro'

UNION ALL

SELECT 
  'Configurations groupe-modules' as check_type,
  COUNT(*) as count
FROM group_module_configs

UNION ALL

SELECT 
  'Modules actifs' as check_type,
  COUNT(*) as count
FROM business_modules
WHERE status = 'active'

UNION ALL

SELECT 
  'Catégories actives' as check_type,
  COUNT(*) as count
FROM business_categories
WHERE status = 'active';

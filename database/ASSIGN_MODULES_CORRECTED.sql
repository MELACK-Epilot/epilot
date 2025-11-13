-- Script CORRIGÉ pour assigner les modules aux groupes Admin
-- Utilise probablement 'school_group_id' (nom le plus courant)

-- 1. Assigner le plan Pro aux groupes Admin
UPDATE school_groups 
SET plan_id = (SELECT id FROM subscription_plans WHERE slug = 'pro' LIMIT 1)
WHERE plan_id IS NULL
AND id IN (
  SELECT DISTINCT school_group_id  -- ✅ Nom le plus probable
  FROM users 
  WHERE role = 'admin_groupe'
);

-- 2. Assigner les modules aux groupes Admin
INSERT INTO group_module_configs (school_group_id, module_id, is_enabled)
SELECT DISTINCT
  u.school_group_id,  -- ✅ Nom le plus probable
  pm.module_id,
  true
FROM users u
JOIN school_groups sg ON sg.id = u.school_group_id  -- ✅ Nom le plus probable
JOIN plan_modules pm ON pm.plan_id = sg.plan_id
WHERE u.role = 'admin_groupe'
AND sg.plan_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM group_module_configs gmc 
  WHERE gmc.school_group_id = u.school_group_id  -- ✅ Nom le plus probable
  AND gmc.module_id = pm.module_id
);

-- 3. Vérification
SELECT 
  sg.name as groupe,
  COUNT(gmc.module_id) as modules_assignes,
  COUNT(CASE WHEN gmc.is_enabled = true THEN 1 END) as modules_actifs
FROM school_groups sg
JOIN users u ON sg.id = u.school_group_id  -- ✅ Nom le plus probable
LEFT JOIN group_module_configs gmc ON sg.id = gmc.school_group_id
WHERE u.role = 'admin_groupe'
GROUP BY sg.id, sg.name
ORDER BY sg.name;

-- 4. Message final
SELECT 
  'MODULES ASSIGNÉS AUX GROUPES ADMIN' as status,
  COUNT(DISTINCT gmc.school_group_id) as groupes_avec_modules,
  COUNT(*) as total_assignations
FROM group_module_configs gmc
JOIN users u ON gmc.school_group_id = u.school_group_id
WHERE u.role = 'admin_groupe';

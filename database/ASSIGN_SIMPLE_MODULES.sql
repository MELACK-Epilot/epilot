-- Script SIMPLE pour assigner les modules aux groupes Admin
-- À exécuter APRÈS avoir identifié la bonne colonne avec CHECK_EXACT_COLUMNS.sql

-- REMPLACEZ 'COLONNE_GROUPE' par le vrai nom de colonne (school_group_id, group_id, etc.)

-- 1. Assigner le plan Pro aux groupes Admin (ADAPTEZ LA COLONNE)
UPDATE school_groups 
SET plan_id = (SELECT id FROM subscription_plans WHERE slug = 'pro' LIMIT 1)
WHERE plan_id IS NULL
AND id IN (
  SELECT DISTINCT COLONNE_GROUPE  -- ⚠️ REMPLACEZ par le vrai nom
  FROM users 
  WHERE role = 'admin_groupe'
);

-- 2. Assigner les modules aux groupes Admin (ADAPTEZ LA COLONNE)
INSERT INTO group_module_configs (school_group_id, module_id, is_enabled)
SELECT DISTINCT
  u.COLONNE_GROUPE,  -- ⚠️ REMPLACEZ par le vrai nom
  pm.module_id,
  true
FROM users u
JOIN school_groups sg ON sg.id = u.COLONNE_GROUPE  -- ⚠️ REMPLACEZ par le vrai nom
JOIN plan_modules pm ON pm.plan_id = sg.plan_id
WHERE u.role = 'admin_groupe'
AND sg.plan_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM group_module_configs gmc 
  WHERE gmc.school_group_id = u.COLONNE_GROUPE  -- ⚠️ REMPLACEZ par le vrai nom
  AND gmc.module_id = pm.module_id
);

-- 3. Vérification (ADAPTEZ LA COLONNE)
SELECT 
  sg.name as groupe,
  COUNT(gmc.module_id) as modules_assignes
FROM school_groups sg
JOIN users u ON sg.id = u.COLONNE_GROUPE  -- ⚠️ REMPLACEZ par le vrai nom
LEFT JOIN group_module_configs gmc ON sg.id = gmc.school_group_id
WHERE u.role = 'admin_groupe'
GROUP BY sg.id, sg.name;

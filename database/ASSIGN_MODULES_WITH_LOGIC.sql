-- Assigner les modules aux groupes selon la LOGIQUE ABONNEMENT
-- Chaque groupe reçoit seulement les modules de son plan

-- 1. Assigner le plan Pro aux groupes Admin Groupe
UPDATE school_groups 
SET plan_id = (SELECT id FROM subscription_plans WHERE slug = 'pro' LIMIT 1)
WHERE plan_id IS NULL
AND id IN (
  SELECT DISTINCT school_group_id
  FROM users 
  WHERE role = 'admin_groupe'
);

-- 2. Assigner les modules selon le plan du groupe (LOGIQUE CORRECTE)
INSERT INTO group_module_configs (school_group_id, module_id, is_enabled)
SELECT DISTINCT
  sg.id as school_group_id,
  pm.module_id,
  true as is_enabled
FROM school_groups sg
JOIN subscription_plans sp ON sg.plan_id = sp.id
JOIN plan_modules pm ON sp.id = pm.plan_id
JOIN modules m ON pm.module_id = m.id
WHERE sg.plan_id IS NOT NULL
AND m.status = 'active'
AND NOT EXISTS (
  SELECT 1 FROM group_module_configs gmc 
  WHERE gmc.school_group_id = sg.id
  AND gmc.module_id = pm.module_id
);

-- 3. Vérification par groupe et plan
SELECT 
  sg.name as groupe_scolaire,
  sp.name as plan_abonnement,
  sp.slug as plan_slug,
  COUNT(gmc.module_id) as modules_assignes,
  COUNT(CASE WHEN gmc.is_enabled = true THEN 1 END) as modules_actifs,
  COUNT(CASE WHEN m.is_core = true THEN 1 END) as modules_essentiels
FROM school_groups sg
LEFT JOIN subscription_plans sp ON sg.plan_id = sp.id
LEFT JOIN group_module_configs gmc ON sg.id = gmc.school_group_id
LEFT JOIN modules m ON gmc.module_id = m.id
WHERE sg.id IN (
  SELECT DISTINCT school_group_id 
  FROM users 
  WHERE role = 'admin_groupe'
)
GROUP BY sg.id, sg.name, sp.name, sp.slug
ORDER BY sg.name;

-- 4. Détail des modules par groupe Admin
SELECT 
  sg.name as groupe,
  sp.name as plan,
  bc.name as categorie,
  m.name as module,
  m.is_core as essentiel,
  gmc.is_enabled as actif
FROM school_groups sg
JOIN users u ON sg.id = u.school_group_id
JOIN subscription_plans sp ON sg.plan_id = sp.id
JOIN group_module_configs gmc ON sg.id = gmc.school_group_id
JOIN modules m ON gmc.module_id = m.id
LEFT JOIN business_categories bc ON m.category_id = bc.id
WHERE u.role = 'admin_groupe'
ORDER BY sg.name, bc.name, m.name;

-- 5. Statistiques par catégorie pour Admin Groupe
SELECT 
  sg.name as groupe,
  bc.name as categorie,
  bc.icon,
  bc.color,
  COUNT(gmc.module_id) as total_modules,
  COUNT(CASE WHEN gmc.is_enabled = true THEN 1 END) as modules_actifs
FROM school_groups sg
JOIN users u ON sg.id = u.school_group_id
JOIN group_module_configs gmc ON sg.id = gmc.school_group_id
JOIN modules m ON gmc.module_id = m.id
LEFT JOIN business_categories bc ON m.category_id = bc.id
WHERE u.role = 'admin_groupe'
AND m.status = 'active'
GROUP BY sg.id, sg.name, bc.id, bc.name, bc.icon, bc.color
ORDER BY sg.name, bc.name;

-- 6. Message de confirmation
SELECT 
  'MODULES ASSIGNÉS SELON LOGIQUE ABONNEMENT ✅' as status,
  COUNT(DISTINCT gmc.school_group_id) as groupes_configures,
  COUNT(*) as total_assignations
FROM group_module_configs gmc
JOIN users u ON gmc.school_group_id = u.school_group_id
WHERE u.role = 'admin_groupe';

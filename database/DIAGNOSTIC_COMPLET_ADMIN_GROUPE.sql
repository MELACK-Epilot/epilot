-- DIAGNOSTIC COMPLET - Pourquoi Admin Groupe ne voit pas ses modules
-- Analyse étape par étape de la chaîne de données

-- 1. VÉRIFIER L'UTILISATEUR ADMIN GROUPE
SELECT 
  '=== UTILISATEUR ADMIN GROUPE ===' as section,
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.role,
  u.school_group_id,
  sg.name as group_name,
  sg.plan_id
FROM users u
LEFT JOIN school_groups sg ON u.school_group_id = sg.id
WHERE u.role = 'admin_groupe'
LIMIT 5;

-- 2. VÉRIFIER L'ABONNEMENT DU GROUPE
SELECT 
  '=== ABONNEMENT GROUPE ===' as section,
  sg.id as group_id,
  sg.name as group_name,
  sg.plan_id,
  sp.name as plan_name,
  sp.slug as plan_slug,
  sp.status as plan_status,
  sp.price as plan_price
FROM school_groups sg
LEFT JOIN subscription_plans sp ON sg.plan_id = sp.id
WHERE sg.id IN (
  SELECT DISTINCT school_group_id 
  FROM users 
  WHERE role = 'admin_groupe'
);

-- 3. VÉRIFIER LES MODULES DU PLAN
SELECT 
  '=== MODULES DU PLAN ===' as section,
  sp.name as plan_name,
  COUNT(pm.module_id) as modules_dans_plan,
  string_agg(m.name, ', ' ORDER BY m.name) as liste_modules
FROM subscription_plans sp
LEFT JOIN plan_modules pm ON sp.id = pm.plan_id
LEFT JOIN modules m ON pm.module_id = m.id
WHERE sp.id IN (
  SELECT DISTINCT plan_id 
  FROM school_groups 
  WHERE id IN (
    SELECT DISTINCT school_group_id 
    FROM users 
    WHERE role = 'admin_groupe'
  )
)
GROUP BY sp.id, sp.name;

-- 4. VÉRIFIER LES CATÉGORIES DU PLAN
SELECT 
  '=== CATÉGORIES DU PLAN ===' as section,
  sp.name as plan_name,
  COUNT(pc.category_id) as categories_dans_plan,
  string_agg(bc.name, ', ' ORDER BY bc.name) as liste_categories
FROM subscription_plans sp
LEFT JOIN plan_categories pc ON sp.id = pc.plan_id
LEFT JOIN business_categories bc ON pc.category_id = bc.id
WHERE sp.id IN (
  SELECT DISTINCT plan_id 
  FROM school_groups 
  WHERE id IN (
    SELECT DISTINCT school_group_id 
    FROM users 
    WHERE role = 'admin_groupe'
  )
)
GROUP BY sp.id, sp.name;

-- 5. VÉRIFIER group_module_configs (CRITIQUE)
SELECT 
  '=== GROUP MODULE CONFIGS ===' as section,
  sg.name as group_name,
  COUNT(gmc.module_id) as modules_assignes_groupe,
  COUNT(CASE WHEN gmc.is_enabled = true THEN 1 END) as modules_actifs,
  COUNT(CASE WHEN gmc.is_enabled = false THEN 1 END) as modules_inactifs
FROM school_groups sg
LEFT JOIN group_module_configs gmc ON sg.id = gmc.school_group_id
WHERE sg.id IN (
  SELECT DISTINCT school_group_id 
  FROM users 
  WHERE role = 'admin_groupe'
)
GROUP BY sg.id, sg.name;

-- 6. DÉTAIL DES MODULES ASSIGNÉS AU GROUPE
SELECT 
  '=== DÉTAIL MODULES GROUPE ===' as section,
  sg.name as group_name,
  m.name as module_name,
  m.slug as module_slug,
  bc.name as category_name,
  gmc.is_enabled as module_actif,
  m.status as module_status,
  m.is_core as module_essentiel
FROM school_groups sg
JOIN group_module_configs gmc ON sg.id = gmc.school_group_id
JOIN modules m ON gmc.module_id = m.id
LEFT JOIN business_categories bc ON m.category_id = bc.id
WHERE sg.id IN (
  SELECT DISTINCT school_group_id 
  FROM users 
  WHERE role = 'admin_groupe'
  LIMIT 1
)
ORDER BY bc.name, m.name;

-- 7. VÉRIFIER LA CHAÎNE COMPLÈTE (CRITIQUE)
WITH admin_group_data AS (
  SELECT 
    u.school_group_id,
    sg.name as group_name,
    sg.plan_id,
    sp.name as plan_name
  FROM users u
  JOIN school_groups sg ON u.school_group_id = sg.id
  LEFT JOIN subscription_plans sp ON sg.plan_id = sp.id
  WHERE u.role = 'admin_groupe'
  LIMIT 1
)
SELECT 
  '=== CHAÎNE COMPLÈTE ===' as section,
  agd.group_name,
  agd.plan_name,
  CASE 
    WHEN agd.plan_id IS NULL THEN 'PROBLÈME: Pas de plan assigné'
    WHEN plan_modules_count = 0 THEN 'PROBLÈME: Plan sans modules'
    WHEN group_configs_count = 0 THEN 'PROBLÈME: Modules pas assignés au groupe'
    ELSE 'OK: Chaîne complète'
  END as diagnostic,
  COALESCE(plan_modules_count, 0) as modules_dans_plan,
  COALESCE(group_configs_count, 0) as modules_assignes_groupe
FROM admin_group_data agd
LEFT JOIN (
  SELECT plan_id, COUNT(*) as plan_modules_count
  FROM plan_modules 
  GROUP BY plan_id
) pm ON agd.plan_id = pm.plan_id
LEFT JOIN (
  SELECT school_group_id, COUNT(*) as group_configs_count
  FROM group_module_configs 
  GROUP BY school_group_id
) gmc ON agd.school_group_id = gmc.school_group_id;

-- 8. VÉRIFIER LES TABLES CRITIQUES EXISTENT
SELECT 
  '=== VÉRIFICATION TABLES ===' as section,
  table_name,
  CASE 
    WHEN table_name IS NOT NULL THEN 'Existe'
    ELSE 'Manquante'
  END as status
FROM (
  VALUES 
    ('users'),
    ('school_groups'),
    ('subscription_plans'),
    ('modules'),
    ('business_categories'),
    ('plan_modules'),
    ('plan_categories'),
    ('group_module_configs')
) AS required_tables(table_name)
LEFT JOIN information_schema.tables t ON t.table_name = required_tables.table_name AND t.table_schema = 'public';

-- 9. DIAGNOSTIC FINAL
SELECT 
  '=== DIAGNOSTIC FINAL ===' as section,
  'Utilisateurs Admin Groupe: ' || COUNT(DISTINCT u.id) as stat1
FROM users u WHERE u.role = 'admin_groupe'

UNION ALL

SELECT 
  '=== DIAGNOSTIC FINAL ===' as section,
  'Groupes avec plan: ' || COUNT(DISTINCT sg.id) as stat1
FROM school_groups sg 
JOIN users u ON sg.id = u.school_group_id
WHERE u.role = 'admin_groupe' AND sg.plan_id IS NOT NULL

UNION ALL

SELECT 
  '=== DIAGNOSTIC FINAL ===' as section,
  'Modules dans plans: ' || COUNT(*) as stat1
FROM plan_modules

UNION ALL

SELECT 
  '=== DIAGNOSTIC FINAL ===' as section,
  'Modules assignés aux groupes: ' || COUNT(*) as stat1
FROM group_module_configs gmc
JOIN users u ON gmc.school_group_id = u.school_group_id
WHERE u.role = 'admin_groupe';

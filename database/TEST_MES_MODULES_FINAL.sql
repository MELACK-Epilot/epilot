-- Test des données pour "Mes Modules" Admin Groupe - VERSION FINALE
-- Corrigé selon les vraies colonnes et tables

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

-- 2. Vérifier l'abonnement du groupe (CORRIGÉ : subscription_plans)
SELECT 
  sg.id,
  sg.name as group_name,
  sg.plan_id,
  COALESCE(p.name, sp.name) as plan_name,
  COALESCE(p.slug, sp.slug) as plan_slug,
  s.status as subscription_status
FROM school_groups sg
LEFT JOIN plans p ON sg.plan_id = p.id
LEFT JOIN subscription_plans sp ON sg.plan_id = sp.id  -- Alternative
LEFT JOIN subscriptions s ON s.school_group_id = sg.id
WHERE sg.id IN (
  SELECT DISTINCT school_group_id 
  FROM users 
  WHERE role = 'admin_groupe'
)
LIMIT 5;

-- 3. Vérifier les modules assignés au plan
SELECT 
  COALESCE(p.name, sp.name, 'Plan inconnu') as plan_name,
  COUNT(pm.module_id) as modules_count
FROM school_groups sg
LEFT JOIN plans p ON sg.plan_id = p.id
LEFT JOIN subscription_plans sp ON sg.plan_id = sp.id
LEFT JOIN plan_modules pm ON COALESCE(p.id, sp.id) = pm.plan_id
WHERE sg.id IN (
  SELECT DISTINCT school_group_id 
  FROM users 
  WHERE role = 'admin_groupe'
)
GROUP BY COALESCE(p.id, sp.id), COALESCE(p.name, sp.name);

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

-- 5. Détail des modules assignés (SANS plan_required qui n'existe pas)
SELECT 
  gmc.school_group_id,
  sg.name as group_name,
  m.name as module_name,
  m.slug as module_slug,
  COALESCE(bc.name, 'Aucune catégorie') as category_name,
  gmc.is_enabled,
  COALESCE(m.is_core, false) as is_core,
  m.version,
  m.status
FROM group_module_configs gmc
JOIN modules m ON gmc.module_id = m.id
LEFT JOIN business_categories bc ON m.category_id = bc.id
JOIN school_groups sg ON gmc.school_group_id = sg.id
WHERE gmc.school_group_id IN (
  SELECT DISTINCT school_group_id 
  FROM users 
  WHERE role = 'admin_groupe'
  LIMIT 1
)
ORDER BY COALESCE(bc.name, 'ZZZ'), m.name;

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
plan_modules_list AS (
  SELECT pm.module_id, m.name as module_name
  FROM plan_modules pm
  JOIN modules m ON pm.module_id = m.id
  WHERE pm.plan_id = (SELECT plan_id FROM admin_group)
),
group_modules_list AS (
  SELECT gmc.module_id, m.name as module_name, gmc.is_enabled
  FROM group_module_configs gmc
  JOIN modules m ON gmc.module_id = m.id
  WHERE gmc.school_group_id = (SELECT school_group_id FROM admin_group)
)
SELECT 
  pm.module_name,
  CASE 
    WHEN gm.module_id IS NOT NULL THEN 'Assigné'
    ELSE 'MANQUANT'
  END as status_assignment,
  COALESCE(gm.is_enabled, false) as is_enabled
FROM plan_modules_list pm
LEFT JOIN group_modules_list gm ON pm.module_id = gm.module_id
ORDER BY pm.module_name;

-- 7. Statistiques par catégorie pour un groupe
SELECT 
  COALESCE(bc.name, 'Catégorie inconnue') as category_name,
  COALESCE(bc.icon, '📦') as icon,
  COALESCE(bc.color, '#2A9D8F') as color,
  COUNT(gmc.module_id) as total_modules,
  COUNT(CASE WHEN gmc.is_enabled = true THEN 1 END) as enabled_modules
FROM modules m
JOIN group_module_configs gmc ON m.id = gmc.module_id
LEFT JOIN business_categories bc ON m.category_id = bc.id
WHERE gmc.school_group_id IN (
  SELECT DISTINCT school_group_id 
  FROM users 
  WHERE role = 'admin_groupe'
  LIMIT 1
)
AND COALESCE(m.status, 'active') = 'active'
GROUP BY bc.id, bc.name, bc.icon, bc.color
ORDER BY COALESCE(bc.name, 'ZZZ');

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
  'Plans disponibles' as check_type,
  COUNT(*) as count
FROM plans

UNION ALL

SELECT 
  'Subscription plans disponibles' as check_type,
  COUNT(*) as count
FROM subscription_plans

UNION ALL

SELECT 
  'Modules dans plans' as check_type,
  COUNT(*) as count
FROM plan_modules

UNION ALL

SELECT 
  'Configurations groupe-modules' as check_type,
  COUNT(*) as count
FROM group_module_configs

UNION ALL

SELECT 
  'Modules actifs' as check_type,
  COUNT(*) as count
FROM modules
WHERE COALESCE(status, 'active') = 'active'

UNION ALL

SELECT 
  'Catégories actives' as check_type,
  COUNT(*) as count
FROM business_categories
WHERE COALESCE(status, 'active') = 'active';

-- 9. Exemple de données manquantes à créer si besoin
SELECT 
  'DIAGNOSTIC TERMINÉ' as status,
  'Vérifiez les résultats ci-dessus pour identifier les problèmes' as message;

-- SOLUTION COHÉRENTE BASÉE SUR LES DONNÉES RÉELLES
-- Respecte la hiérarchie E-Pilot et utilise les 54 modules + 12 catégories existants

-- 1. IDENTIFIER LE GROUPE LAMARELLE ET SON PLAN
WITH lamarelle_info AS (
  SELECT 
    sg.id as group_id,
    sg.name as group_name,
    sg.plan_id,
    sp.name as plan_name,
    sp.slug as plan_slug
  FROM school_groups sg
  LEFT JOIN subscription_plans sp ON sg.plan_id = sp.id
  WHERE sg.id = '914d2ced-663a-4732-a521-edcc2423a012'
     OR sg.name ILIKE '%LAMARELLE%'
     OR sg.code = 'E-PILOT-003'
  LIMIT 1
)
SELECT 
  '🔍 GROUPE LAMARELLE IDENTIFIÉ' as status,
  li.*
FROM lamarelle_info li;

-- 2. ASSIGNER UN PLAN AU GROUPE LAMARELLE S'IL N'EN A PAS
UPDATE school_groups 
SET plan_id = (
  SELECT id FROM subscription_plans 
  WHERE slug IN ('pro', 'premium', 'professionnel') 
  OR name ILIKE '%pro%'
  ORDER BY price DESC 
  LIMIT 1
)
WHERE (id = '914d2ced-663a-4732-a521-edcc2423a012'
   OR name ILIKE '%LAMARELLE%'
   OR code = 'E-PILOT-003')
AND plan_id IS NULL;

-- 3. IDENTIFIER LE PLAN DU GROUPE LAMARELLE
WITH lamarelle_plan AS (
  SELECT 
    sg.id as group_id,
    sg.plan_id,
    sp.name as plan_name
  FROM school_groups sg
  JOIN subscription_plans sp ON sg.plan_id = sp.id
  WHERE sg.id = '914d2ced-663a-4732-a521-edcc2423a012'
     OR sg.name ILIKE '%LAMARELLE%'
     OR sg.code = 'E-PILOT-003'
  LIMIT 1
)
SELECT 
  '📋 PLAN DU GROUPE LAMARELLE' as status,
  lp.*
FROM lamarelle_plan lp;

-- 4. ASSIGNER TOUS LES MODULES DU PLAN AU GROUPE LAMARELLE
-- (Respecte la hiérarchie : Plan → Modules → Groupe hérite)
INSERT INTO group_module_configs (school_group_id, module_id, is_enabled, created_at, updated_at)
SELECT DISTINCT
  sg.id as school_group_id,
  pm.module_id,
  true as is_enabled,
  NOW(),
  NOW()
FROM school_groups sg
JOIN subscription_plans sp ON sg.plan_id = sp.id
JOIN plan_modules pm ON sp.id = pm.plan_id
JOIN modules m ON pm.module_id = m.id
WHERE (sg.id = '914d2ced-663a-4732-a521-edcc2423a012'
   OR sg.name ILIKE '%LAMARELLE%'
   OR sg.code = 'E-PILOT-003')
AND m.status = 'active'
AND NOT EXISTS (
  SELECT 1 FROM group_module_configs gmc 
  WHERE gmc.school_group_id = sg.id 
  AND gmc.module_id = pm.module_id
);

-- 5. VÉRIFIER LA COHÉRENCE FINALE POUR LAMARELLE
WITH coherence_check AS (
  SELECT 
    sg.name as groupe,
    sp.name as plan,
    COUNT(DISTINCT pm.module_id) as modules_dans_plan,
    COUNT(DISTINCT gmc.module_id) as modules_assignes_groupe,
    COUNT(DISTINCT bc.id) as categories_disponibles,
    CASE 
      WHEN COUNT(DISTINCT gmc.module_id) > 0 THEN '✅ MODULES ASSIGNÉS'
      ELSE '❌ AUCUN MODULE'
    END as status
  FROM school_groups sg
  LEFT JOIN subscription_plans sp ON sg.plan_id = sp.id
  LEFT JOIN plan_modules pm ON sp.id = pm.plan_id
  LEFT JOIN group_module_configs gmc ON sg.id = gmc.school_group_id
  LEFT JOIN modules m ON gmc.module_id = m.id
  LEFT JOIN business_categories bc ON m.category_id = bc.id
  WHERE sg.id = '914d2ced-663a-4732-a521-edcc2423a012'
     OR sg.name ILIKE '%LAMARELLE%'
     OR sg.code = 'E-PILOT-003'
  GROUP BY sg.id, sg.name, sp.name
)
SELECT 
  '🎯 COHÉRENCE FINALE LAMARELLE' as check_type,
  *
FROM coherence_check;

-- 6. EXEMPLES DE MODULES ASSIGNÉS À LAMARELLE
SELECT 
  '📦 MODULES LAMARELLE' as check_type,
  m.name as module_name,
  bc.name as categorie,
  gmc.is_enabled as actif,
  m.is_core as essentiel
FROM group_module_configs gmc
JOIN modules m ON gmc.module_id = m.id
LEFT JOIN business_categories bc ON m.category_id = bc.id
JOIN school_groups sg ON gmc.school_group_id = sg.id
WHERE sg.id = '914d2ced-663a-4732-a521-edcc2423a012'
   OR sg.name ILIKE '%LAMARELLE%'
   OR sg.code = 'E-PILOT-003'
ORDER BY bc.name, m.name
LIMIT 10;

-- 7. STATISTIQUES PAR CATÉGORIE POUR LAMARELLE
SELECT 
  '📊 STATS PAR CATÉGORIE' as check_type,
  bc.name as categorie,
  bc.icon,
  bc.color,
  COUNT(gmc.module_id) as total_modules,
  COUNT(CASE WHEN gmc.is_enabled = true THEN 1 END) as modules_actifs
FROM business_categories bc
JOIN modules m ON bc.id = m.category_id
JOIN group_module_configs gmc ON m.id = gmc.module_id
JOIN school_groups sg ON gmc.school_group_id = sg.id
WHERE (sg.id = '914d2ced-663a-4732-a521-edcc2423a012'
   OR sg.name ILIKE '%LAMARELLE%'
   OR sg.code = 'E-PILOT-003')
AND bc.status = 'active'
AND m.status = 'active'
GROUP BY bc.id, bc.name, bc.icon, bc.color
ORDER BY COUNT(gmc.module_id) DESC;

-- 8. VÉRIFIER QUE L'UTILISATEUR ADMIN GROUPE EXISTE
SELECT 
  '👤 UTILISATEUR ADMIN LAMARELLE' as check_type,
  u.email,
  u.first_name,
  u.last_name,
  u.school_group_id,
  sg.name as group_name
FROM users u
JOIN school_groups sg ON u.school_group_id = sg.id
WHERE u.role = 'admin_groupe'
AND (sg.id = '914d2ced-663a-4732-a521-edcc2423a012'
   OR sg.name ILIKE '%LAMARELLE%'
   OR sg.code = 'E-PILOT-003');

-- 9. CRÉER UN UTILISATEUR ADMIN GROUPE POUR LAMARELLE SI MANQUANT
INSERT INTO users (
  id,
  email,
  first_name,
  last_name,
  role,
  school_group_id,
  status,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  'admin@lamarelle.cg',
  'Admin',
  'LAMARELLE',
  'admin_groupe',
  sg.id,
  'active',
  NOW(),
  NOW()
FROM school_groups sg
WHERE (sg.id = '914d2ced-663a-4732-a521-edcc2423a012'
   OR sg.name ILIKE '%LAMARELLE%'
   OR sg.code = 'E-PILOT-003')
AND NOT EXISTS (
  SELECT 1 FROM users u 
  WHERE u.school_group_id = sg.id 
  AND u.role = 'admin_groupe'
);

-- 10. RÉSUMÉ FINAL DE LA SOLUTION
SELECT 
  '✅ SOLUTION COHÉRENTE APPLIQUÉE' as status,
  'Groupe LAMARELLE configuré selon la hiérarchie E-Pilot' as message,
  CONCAT(
    'Plan: ', (SELECT sp.name FROM school_groups sg JOIN subscription_plans sp ON sg.plan_id = sp.id WHERE sg.name ILIKE '%LAMARELLE%' LIMIT 1),
    ' | Modules: ', (SELECT COUNT(*) FROM group_module_configs gmc JOIN school_groups sg ON gmc.school_group_id = sg.id WHERE sg.name ILIKE '%LAMARELLE%'),
    ' | Catégories: ', (SELECT COUNT(DISTINCT bc.id) FROM group_module_configs gmc JOIN modules m ON gmc.module_id = m.id JOIN business_categories bc ON m.category_id = bc.id JOIN school_groups sg ON gmc.school_group_id = sg.id WHERE sg.name ILIKE '%LAMARELLE%')
  ) as statistiques;

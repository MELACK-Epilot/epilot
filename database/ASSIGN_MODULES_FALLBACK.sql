-- Script avec alternatives si school_group_id ne fonctionne pas

-- Version A : Essayer avec 'group_id'
-- UPDATE school_groups 
-- SET plan_id = (SELECT id FROM subscription_plans WHERE slug = 'pro' LIMIT 1)
-- WHERE plan_id IS NULL
-- AND id IN (
--   SELECT DISTINCT group_id
--   FROM users 
--   WHERE role = 'admin_groupe'
-- );

-- Version B : Essayer avec 'organisation_id'  
-- UPDATE school_groups 
-- SET plan_id = (SELECT id FROM subscription_plans WHERE slug = 'pro' LIMIT 1)
-- WHERE plan_id IS NULL
-- AND id IN (
--   SELECT DISTINCT organisation_id
--   FROM users 
--   WHERE role = 'admin_groupe'
-- );

-- Version C : Si aucune colonne de relation, créer directement
-- Assigner le plan Pro au premier groupe
UPDATE school_groups 
SET plan_id = (SELECT id FROM subscription_plans WHERE slug = 'pro' LIMIT 1)
WHERE plan_id IS NULL
LIMIT 1;

-- Assigner tous les modules à tous les groupes (solution de force)
INSERT INTO group_module_configs (school_group_id, module_id, is_enabled)
SELECT DISTINCT
  sg.id,
  m.id,
  true
FROM school_groups sg
CROSS JOIN modules m
WHERE sg.plan_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM group_module_configs gmc 
  WHERE gmc.school_group_id = sg.id
  AND gmc.module_id = m.id
);

-- Vérification finale
SELECT 
  'SOLUTION DE FORCE APPLIQUÉE' as status,
  COUNT(DISTINCT school_group_id) as groupes_avec_modules,
  COUNT(*) as total_modules_assignes
FROM group_module_configs;

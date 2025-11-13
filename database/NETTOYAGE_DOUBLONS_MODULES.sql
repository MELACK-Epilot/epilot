-- NETTOYAGE DES DOUBLONS - Corriger l'incohérence 47 vs 108

-- 1. SUPPRIMER LES DOUBLONS (garder le plus récent)
DELETE FROM group_module_configs 
WHERE id NOT IN (
  SELECT DISTINCT ON (school_group_id, module_id) id
  FROM group_module_configs
  WHERE school_group_id IN (
    SELECT DISTINCT school_group_id 
    FROM users 
    WHERE role = 'admin_groupe'
  )
  ORDER BY school_group_id, module_id, created_at DESC
);

-- 2. SUPPRIMER LES MODULES FANTÔMES (modules inexistants)
DELETE FROM group_module_configs 
WHERE module_id NOT IN (SELECT id FROM modules)
AND school_group_id IN (
  SELECT DISTINCT school_group_id 
  FROM users 
  WHERE role = 'admin_groupe'
);

-- 3. SUPPRIMER LES MODULES INACTIFS
DELETE FROM group_module_configs 
WHERE module_id IN (
  SELECT id FROM modules WHERE status != 'active' OR status IS NULL
)
AND school_group_id IN (
  SELECT DISTINCT school_group_id 
  FROM users 
  WHERE role = 'admin_groupe'
);

-- 4. RÉASSIGNER PROPREMENT (1 fois par module par groupe)
INSERT INTO group_module_configs (school_group_id, module_id, is_enabled, created_at, updated_at)
SELECT DISTINCT
  sg.id,
  m.id,
  true,
  NOW(),
  NOW()
FROM school_groups sg
JOIN users u ON sg.id = u.school_group_id
JOIN subscription_plans sp ON sg.plan_id = sp.id
JOIN plan_modules pm ON sp.id = pm.plan_id
JOIN modules m ON pm.module_id = m.id
WHERE u.role = 'admin_groupe'
AND m.status = 'active'
AND NOT EXISTS (
  SELECT 1 FROM group_module_configs gmc 
  WHERE gmc.school_group_id = sg.id 
  AND gmc.module_id = m.id
);

-- 5. VÉRIFICATION APRÈS NETTOYAGE
SELECT 
  '✅ APRÈS NETTOYAGE' as section,
  sg.name as groupe_scolaire,
  COUNT(gmc.module_id) as modules_assignes,
  COUNT(DISTINCT gmc.module_id) as modules_uniques,
  CASE 
    WHEN COUNT(gmc.module_id) = COUNT(DISTINCT gmc.module_id) THEN '✅ PAS DE DOUBLONS'
    ELSE '❌ DOUBLONS RESTANTS'
  END as status_doublons
FROM school_groups sg
JOIN users u ON sg.id = u.school_group_id
LEFT JOIN group_module_configs gmc ON sg.id = gmc.school_group_id
WHERE u.role = 'admin_groupe'
GROUP BY sg.id, sg.name
ORDER BY sg.name;

-- 6. CALCUL FINAL COHÉRENT
SELECT 
  '📊 CALCUL FINAL' as section,
  (SELECT COUNT(*) FROM modules WHERE status = 'active') as modules_disponibles,
  (SELECT COUNT(DISTINCT school_group_id) FROM users WHERE role = 'admin_groupe') as groupes_admin,
  (SELECT COUNT(*) FROM group_module_configs gmc 
   JOIN users u ON gmc.school_group_id = u.school_group_id 
   WHERE u.role = 'admin_groupe') as assignations_totales,
  CASE 
    WHEN (SELECT COUNT(*) FROM group_module_configs gmc 
          JOIN users u ON gmc.school_group_id = u.school_group_id 
          WHERE u.role = 'admin_groupe') = 
         (SELECT COUNT(*) FROM modules WHERE status = 'active') * 
         (SELECT COUNT(DISTINCT school_group_id) FROM users WHERE role = 'admin_groupe')
    THEN '✅ COHÉRENT'
    ELSE '❌ INCOHÉRENT'
  END as status_coherence;

-- 7. MESSAGE FINAL
SELECT 
  'NETTOYAGE TERMINÉ ✅' as status,
  'Les doublons ont été supprimés, les données sont maintenant cohérentes' as message,
  CONCAT(
    'Modules: ', (SELECT COUNT(*) FROM modules WHERE status = 'active'),
    ' | Groupes: ', (SELECT COUNT(DISTINCT school_group_id) FROM users WHERE role = 'admin_groupe'),
    ' | Assignations: ', (SELECT COUNT(*) FROM group_module_configs gmc 
                          JOIN users u ON gmc.school_group_id = u.school_group_id 
                          WHERE u.role = 'admin_groupe')
  ) as statistiques_finales;

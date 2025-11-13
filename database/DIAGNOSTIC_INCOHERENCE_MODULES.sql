-- DIAGNOSTIC PRÉCIS - Incohérence 47 modules vs 108 assignations

-- 1. COMPTER LES MODULES RÉELS
SELECT 
  '=== MODULES DANS LA TABLE ===' as section,
  COUNT(*) as total_modules,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as modules_actifs,
  COUNT(CASE WHEN status != 'active' OR status IS NULL THEN 1 END) as modules_inactifs
FROM modules;

-- 2. COMPTER LES ASSIGNATIONS PAR GROUPE
SELECT 
  '=== ASSIGNATIONS PAR GROUPE ===' as section,
  sg.name as groupe_scolaire,
  COUNT(gmc.module_id) as modules_assignes,
  COUNT(DISTINCT gmc.module_id) as modules_uniques_assignes
FROM school_groups sg
JOIN users u ON sg.id = u.school_group_id
LEFT JOIN group_module_configs gmc ON sg.id = gmc.school_group_id
WHERE u.role = 'admin_groupe'
GROUP BY sg.id, sg.name
ORDER BY sg.name;

-- 3. VÉRIFIER LES DOUBLONS DANS group_module_configs
SELECT 
  '=== DOUBLONS DÉTECTÉS ===' as section,
  school_group_id,
  module_id,
  COUNT(*) as nb_doublons
FROM group_module_configs
WHERE school_group_id IN (
  SELECT DISTINCT school_group_id 
  FROM users 
  WHERE role = 'admin_groupe'
)
GROUP BY school_group_id, module_id
HAVING COUNT(*) > 1
ORDER BY nb_doublons DESC;

-- 4. TOTAL ASSIGNATIONS vs MODULES DISPONIBLES
SELECT 
  '=== CALCUL THÉORIQUE ===' as section,
  (SELECT COUNT(*) FROM modules WHERE status = 'active') as modules_disponibles,
  (SELECT COUNT(DISTINCT school_group_id) FROM users WHERE role = 'admin_groupe') as groupes_admin,
  (SELECT COUNT(*) FROM modules WHERE status = 'active') * 
  (SELECT COUNT(DISTINCT school_group_id) FROM users WHERE role = 'admin_groupe') as assignations_theoriques,
  (SELECT COUNT(*) FROM group_module_configs gmc 
   JOIN users u ON gmc.school_group_id = u.school_group_id 
   WHERE u.role = 'admin_groupe') as assignations_reelles;

-- 5. MODULES ASSIGNÉS PLUSIEURS FOIS AU MÊME GROUPE
SELECT 
  '=== MODULES DUPLIQUÉS MÊME GROUPE ===' as section,
  sg.name as groupe,
  m.name as module,
  COUNT(*) as nb_fois_assigne
FROM group_module_configs gmc
JOIN school_groups sg ON gmc.school_group_id = sg.id
JOIN modules m ON gmc.module_id = m.id
JOIN users u ON sg.id = u.school_group_id
WHERE u.role = 'admin_groupe'
GROUP BY sg.id, sg.name, m.id, m.name
HAVING COUNT(*) > 1
ORDER BY nb_fois_assigne DESC, sg.name, m.name;

-- 6. MODULES INEXISTANTS ASSIGNÉS
SELECT 
  '=== MODULES FANTÔMES ===' as section,
  gmc.module_id,
  COUNT(*) as nb_assignations
FROM group_module_configs gmc
JOIN users u ON gmc.school_group_id = u.school_group_id
LEFT JOIN modules m ON gmc.module_id = m.id
WHERE u.role = 'admin_groupe'
AND m.id IS NULL
GROUP BY gmc.module_id;

-- 7. DÉTAIL COMPLET PAR GROUPE
SELECT 
  '=== DÉTAIL PAR GROUPE ===' as section,
  sg.name as groupe,
  sp.name as plan,
  COUNT(DISTINCT gmc.module_id) as modules_uniques,
  COUNT(gmc.module_id) as total_assignations,
  COUNT(gmc.module_id) - COUNT(DISTINCT gmc.module_id) as doublons,
  ROUND(
    COUNT(DISTINCT gmc.module_id) * 100.0 / NULLIF((SELECT COUNT(*) FROM modules WHERE status = 'active'), 0), 
    1
  ) as pourcentage_modules_disponibles
FROM school_groups sg
JOIN users u ON sg.id = u.school_group_id
LEFT JOIN subscription_plans sp ON sg.plan_id = sp.id
LEFT JOIN group_module_configs gmc ON sg.id = gmc.school_group_id
WHERE u.role = 'admin_groupe'
GROUP BY sg.id, sg.name, sp.name
ORDER BY sg.name;

-- 8. SOLUTION RECOMMANDÉE
SELECT 
  '=== SOLUTION RECOMMANDÉE ===' as section,
  CASE 
    WHEN (SELECT COUNT(*) FROM (
      SELECT school_group_id, module_id, COUNT(*) 
      FROM group_module_configs 
      GROUP BY school_group_id, module_id 
      HAVING COUNT(*) > 1
    ) doublons) > 0 THEN 'NETTOYER LES DOUBLONS'
    WHEN (SELECT COUNT(*) FROM group_module_configs gmc 
          LEFT JOIN modules m ON gmc.module_id = m.id 
          WHERE m.id IS NULL) > 0 THEN 'SUPPRIMER MODULES FANTÔMES'
    ELSE 'DONNÉES COHÉRENTES'
  END as action_requise;

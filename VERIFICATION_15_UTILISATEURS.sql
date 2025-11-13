-- ============================================
-- VÉRIFICATION : D'où vient le chiffre "15 utilisateurs" ?
-- Date: 10 novembre 2025, 14h15
-- ============================================

-- 1. Compter les utilisateurs UNIQUES actifs (tous modules confondus)
SELECT 
  '=== UTILISATEURS UNIQUES ACTIFS ===' as etape,
  COUNT(DISTINCT u.id) as users_uniques
FROM users u
WHERE u.status = 'active';

-- 2. Compter les utilisateurs par module (peut avoir des doublons)
SELECT 
  '=== UTILISATEURS PAR MODULE ===' as etape,
  m.name as module_name,
  COUNT(DISTINCT u.id) as nb_users
FROM modules m
JOIN group_module_configs gmc ON gmc.module_id = m.id
JOIN users u ON u.school_group_id = gmc.school_group_id
WHERE m.status = 'active'
  AND gmc.is_enabled = true
  AND u.status = 'active'
GROUP BY m.id, m.name
ORDER BY nb_users DESC;

-- 3. SOMME de tous les utilisateurs (avec doublons si un user a plusieurs modules)
SELECT 
  '=== SOMME TOTALE (avec doublons) ===' as etape,
  SUM(nb_users) as total_avec_doublons
FROM (
  SELECT 
    m.name as module_name,
    COUNT(DISTINCT u.id) as nb_users
  FROM modules m
  JOIN group_module_configs gmc ON gmc.module_id = m.id
  JOIN users u ON u.school_group_id = gmc.school_group_id
  WHERE m.status = 'active'
    AND gmc.is_enabled = true
    AND u.status = 'active'
  GROUP BY m.id, m.name
) as counts;

-- 4. Vérifier si le total est bien 15
WITH module_users AS (
  SELECT 
    m.name as module_name,
    COUNT(DISTINCT u.id) as nb_users
  FROM modules m
  JOIN group_module_configs gmc ON gmc.module_id = m.id
  JOIN users u ON u.school_group_id = gmc.school_group_id
  WHERE m.status = 'active'
    AND gmc.is_enabled = true
    AND u.status = 'active'
  GROUP BY m.id, m.name
)
SELECT 
  '=== DÉTAIL DU CALCUL ===' as etape,
  module_name,
  nb_users,
  SUM(nb_users) OVER () as total_cumule
FROM module_users
ORDER BY nb_users DESC;

-- 5. Vérifier les 3 modules visibles sur la capture
SELECT 
  '=== LES 3 MODULES VISIBLES ===' as etape,
  m.name as module_name,
  COUNT(DISTINCT u.id) as nb_users
FROM modules m
JOIN group_module_configs gmc ON gmc.module_id = m.id
JOIN users u ON u.school_group_id = gmc.school_group_id
WHERE m.name IN ('Admission des élèves', 'Arriérés & relances', 'Badges élèves personnalisés')
  AND gmc.is_enabled = true
  AND u.status = 'active'
GROUP BY m.id, m.name
ORDER BY m.name;

-- 6. Vérifier si certains users ont plusieurs modules
SELECT 
  '=== USERS AVEC PLUSIEURS MODULES ===' as etape,
  u.email,
  COUNT(DISTINCT m.id) as nb_modules,
  STRING_AGG(m.name, ', ') as modules
FROM users u
JOIN group_module_configs gmc ON gmc.school_group_id = u.school_group_id
JOIN modules m ON m.id = gmc.module_id
WHERE u.status = 'active'
  AND gmc.is_enabled = true
  AND m.status = 'active'
GROUP BY u.id, u.email
HAVING COUNT(DISTINCT m.id) > 1
ORDER BY nb_modules DESC;

-- ============================================
-- DEBUG : Pourquoi utilisateurs = 0 ?
-- Date: 10 novembre 2025
-- ============================================

-- 1. Vérifier les modules actifs
SELECT 
  id,
  name,
  slug,
  status
FROM modules
WHERE status = 'active'
LIMIT 5;

-- 2. Vérifier group_module_configs
SELECT 
  gmc.id,
  sg.name as groupe_name,
  m.name as module_name,
  gmc.is_enabled,
  gmc.enabled_at,
  gmc.school_group_id,
  gmc.module_id
FROM group_module_configs gmc
JOIN school_groups sg ON sg.id = gmc.school_group_id
JOIN modules m ON m.id = gmc.module_id
WHERE gmc.is_enabled = true
LIMIT 10;

-- 3. Vérifier les utilisateurs par groupe
SELECT 
  sg.name as groupe_name,
  sg.id as groupe_id,
  COUNT(u.id) as total_users,
  COUNT(CASE WHEN u.status = 'active' THEN 1 END) as users_actifs,
  COUNT(CASE WHEN u.status = 'active' AND u.last_sign_in_at >= NOW() - INTERVAL '30 days' THEN 1 END) as users_actifs_30j
FROM school_groups sg
LEFT JOIN users u ON u.school_group_id = sg.id
WHERE sg.status = 'active'
GROUP BY sg.id, sg.name
ORDER BY total_users DESC;

-- 4. Vérifier les utilisateurs avec last_sign_in_at
SELECT 
  id,
  email,
  status,
  school_group_id,
  last_sign_in_at,
  created_at
FROM users
WHERE status = 'active'
ORDER BY last_sign_in_at DESC NULLS LAST
LIMIT 10;

-- 5. TEST COMPLET : Simuler le calcul du hook
-- Prenons le premier module actif
WITH first_module AS (
  SELECT id, name FROM modules WHERE status = 'active' LIMIT 1
),
groups_with_module AS (
  SELECT school_group_id
  FROM group_module_configs
  WHERE module_id = (SELECT id FROM first_module)
    AND is_enabled = true
)
SELECT 
  (SELECT name FROM first_module) as module_name,
  COUNT(*) as total_users,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as users_actifs,
  COUNT(CASE WHEN status = 'active' AND last_sign_in_at >= NOW() - INTERVAL '30 days' THEN 1 END) as users_actifs_30j,
  COUNT(CASE WHEN status = 'active' AND last_sign_in_at IS NULL THEN 1 END) as users_sans_connexion
FROM users
WHERE school_group_id IN (SELECT school_group_id FROM groups_with_module);

-- 6. Vérifier si last_sign_in_at est NULL pour beaucoup d'utilisateurs
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN last_sign_in_at IS NULL THEN 1 END) as users_sans_last_sign_in,
  COUNT(CASE WHEN last_sign_in_at IS NOT NULL THEN 1 END) as users_avec_last_sign_in,
  COUNT(CASE WHEN last_sign_in_at >= NOW() - INTERVAL '30 days' THEN 1 END) as users_connectes_30j
FROM users
WHERE status = 'active';

-- 7. Détail des utilisateurs actifs
SELECT 
  u.email,
  u.status,
  sg.name as groupe,
  u.last_sign_in_at,
  CASE 
    WHEN u.last_sign_in_at IS NULL THEN 'Jamais connecté'
    WHEN u.last_sign_in_at >= NOW() - INTERVAL '30 days' THEN 'Actif (< 30j)'
    ELSE 'Inactif (> 30j)'
  END as statut_connexion
FROM users u
LEFT JOIN school_groups sg ON sg.id = u.school_group_id
WHERE u.status = 'active'
ORDER BY u.last_sign_in_at DESC NULLS LAST
LIMIT 20;

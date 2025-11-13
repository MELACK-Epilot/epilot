-- ============================================================================
-- DIAGNOSTIC AUTOMATIQUE DES DONNÉES DU TABLEAU
-- Exécutez ce script complet d'un seul coup !
-- ============================================================================

DO $$
DECLARE
  v_group_id UUID;
  v_group_name TEXT;
BEGIN
  -- Trouver automatiquement le premier groupe scolaire
  SELECT id, name INTO v_group_id, v_group_name
  FROM school_groups
  ORDER BY created_at DESC
  LIMIT 1;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'GROUPE SCOLAIRE DÉTECTÉ';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ID: %', v_group_id;
  RAISE NOTICE 'Nom: %', v_group_name;
  RAISE NOTICE '';

  -- Afficher les statistiques des utilisateurs
  RAISE NOTICE '========================================';
  RAISE NOTICE 'STATISTIQUES UTILISATEURS';
  RAISE NOTICE '========================================';
  
  PERFORM 1 FROM (
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'active') as actifs,
      COUNT(*) FILTER (WHERE status = 'inactive') as inactifs,
      COUNT(*) FILTER (WHERE last_login IS NOT NULL) as deja_connectes,
      COUNT(*) FILTER (WHERE last_login IS NULL) as jamais_connectes
    FROM users
    WHERE school_group_id = v_group_id
  ) stats;
  
  RAISE NOTICE 'Voir les résultats dans les requêtes ci-dessous...';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- 1. RÉSUMÉ DES UTILISATEURS
-- ============================================================================
WITH group_info AS (
  SELECT id FROM school_groups ORDER BY created_at DESC LIMIT 1
)
SELECT 
  '📊 RÉSUMÉ UTILISATEURS' as section,
  COUNT(*) as total_utilisateurs,
  COUNT(*) FILTER (WHERE u.status = 'active') as actifs,
  COUNT(*) FILTER (WHERE u.status = 'inactive') as inactifs,
  COUNT(*) FILTER (WHERE u.last_login IS NOT NULL) as deja_connectes,
  COUNT(*) FILTER (WHERE u.last_login IS NULL) as jamais_connectes
FROM users u, group_info
WHERE u.school_group_id = group_info.id;

-- ============================================================================
-- 2. DÉTAIL DES UTILISATEURS AVEC MODULES
-- ============================================================================
WITH group_info AS (
  SELECT id FROM school_groups ORDER BY created_at DESC LIMIT 1
)
SELECT 
  '👤 ' || u.first_name || ' ' || u.last_name as utilisateur,
  u.email,
  u.role as role,
  u.status as statut,
  COALESCE(s.name, '❌ Aucune école') as ecole,
  COUNT(ump.module_id) as modules_assignes,
  CASE 
    WHEN u.last_login IS NULL THEN '❌ Jamais connecté'
    ELSE '✅ ' || TO_CHAR(u.last_login, 'DD/MM/YYYY HH24:MI')
  END as derniere_connexion
FROM users u
CROSS JOIN group_info
LEFT JOIN schools s ON u.school_id = s.id
LEFT JOIN user_module_permissions ump ON u.id = ump.user_id
WHERE u.school_group_id = group_info.id
GROUP BY u.id, u.first_name, u.last_name, u.email, u.role, u.status, s.name, u.last_login
ORDER BY modules_assignes DESC, u.first_name;

-- ============================================================================
-- 3. MODULES ASSIGNÉS PAR UTILISATEUR
-- ============================================================================
WITH group_info AS (
  SELECT id FROM school_groups ORDER BY created_at DESC LIMIT 1
)
SELECT 
  '📦 MODULES' as section,
  u.first_name || ' ' || u.last_name as utilisateur,
  COUNT(ump.module_id) as nombre_modules,
  STRING_AGG(ump.module_name, ', ' ORDER BY ump.module_name) as liste_modules
FROM users u
CROSS JOIN group_info
LEFT JOIN user_module_permissions ump ON u.id = ump.user_id
WHERE u.school_group_id = group_info.id
GROUP BY u.id, u.first_name, u.last_name
HAVING COUNT(ump.module_id) > 0
ORDER BY nombre_modules DESC;

-- ============================================================================
-- 4. STATISTIQUES PAR STATUT
-- ============================================================================
WITH group_info AS (
  SELECT id FROM school_groups ORDER BY created_at DESC LIMIT 1
)
SELECT 
  '📊 PAR STATUT' as section,
  u.status as statut,
  COUNT(*) as nombre_utilisateurs,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) || '%' as pourcentage
FROM users u, group_info
WHERE u.school_group_id = group_info.id
GROUP BY u.status
ORDER BY nombre_utilisateurs DESC;

-- ============================================================================
-- 5. STATISTIQUES PAR RÔLE
-- ============================================================================
WITH group_info AS (
  SELECT id FROM school_groups ORDER BY created_at DESC LIMIT 1
)
SELECT 
  '👥 PAR RÔLE' as section,
  u.role as role,
  COUNT(*) as nombre_utilisateurs,
  COUNT(*) FILTER (WHERE u.status = 'active') as actifs,
  AVG(COALESCE(module_counts.count, 0))::INTEGER as moyenne_modules
FROM users u
CROSS JOIN group_info
LEFT JOIN (
  SELECT user_id, COUNT(*) as count
  FROM user_module_permissions
  GROUP BY user_id
) module_counts ON u.id = module_counts.user_id
WHERE u.school_group_id = group_info.id
GROUP BY u.role
ORDER BY nombre_utilisateurs DESC;

-- ============================================================================
-- 6. PROBLÈMES DÉTECTÉS
-- ============================================================================
WITH group_info AS (
  SELECT id FROM school_groups ORDER BY created_at DESC LIMIT 1
)
SELECT 
  '⚠️ PROBLÈMES' as section,
  CASE 
    WHEN COUNT(*) FILTER (WHERE u.status = 'inactive') > 0 
    THEN '❌ ' || COUNT(*) FILTER (WHERE u.status = 'inactive') || ' utilisateur(s) inactif(s)'
    ELSE '✅ Tous les utilisateurs sont actifs'
  END as statut_users,
  CASE 
    WHEN COUNT(*) FILTER (WHERE ump.module_id IS NULL) > 0 
    THEN '❌ ' || COUNT(*) FILTER (WHERE ump.module_id IS NULL) || ' utilisateur(s) sans modules'
    ELSE '✅ Tous les utilisateurs ont des modules'
  END as modules_users,
  CASE 
    WHEN COUNT(*) FILTER (WHERE u.last_login IS NULL) > 0 
    THEN '⚠️ ' || COUNT(*) FILTER (WHERE u.last_login IS NULL) || ' utilisateur(s) jamais connecté(s)'
    ELSE '✅ Tous les utilisateurs se sont connectés'
  END as connexions_users
FROM users u
CROSS JOIN group_info
LEFT JOIN user_module_permissions ump ON u.id = ump.user_id
WHERE u.school_group_id = group_info.id;

-- ============================================================================
-- 7. MODULES DISPONIBLES DANS LE SYSTÈME
-- ============================================================================
SELECT 
  '📚 MODULES DISPONIBLES' as section,
  COUNT(*) as total_modules,
  COUNT(*) FILTER (WHERE m.status = 'active') as modules_actifs,
  COUNT(DISTINCT m.category_id) as nombre_categories
FROM modules m;

-- ============================================================================
-- 8. TOP 10 MODULES LES PLUS ASSIGNÉS
-- ============================================================================
WITH group_info AS (
  SELECT id FROM school_groups ORDER BY created_at DESC LIMIT 1
),
total_users AS (
  SELECT COUNT(DISTINCT u.id) as count
  FROM users u, group_info
  WHERE u.school_group_id = group_info.id
)
SELECT 
  '🏆 TOP MODULES' as section,
  ump.module_name as module,
  COUNT(DISTINCT ump.user_id) as nombre_utilisateurs,
  ROUND(COUNT(DISTINCT ump.user_id) * 100.0 / total_users.count, 2) || '%' as taux_utilisation
FROM user_module_permissions ump
CROSS JOIN group_info
CROSS JOIN total_users
JOIN users u ON ump.user_id = u.id
WHERE u.school_group_id = group_info.id
GROUP BY ump.module_name, total_users.count
ORDER BY nombre_utilisateurs DESC
LIMIT 10;

-- ============================================================================
-- 9. ACTIONS RECOMMANDÉES
-- ============================================================================
WITH group_info AS (
  SELECT id FROM school_groups ORDER BY created_at DESC LIMIT 1
),
stats AS (
  SELECT 
    COUNT(*) FILTER (WHERE u.status = 'inactive') as inactifs,
    COUNT(*) FILTER (WHERE ump.module_id IS NULL) as sans_modules,
    COUNT(*) FILTER (WHERE u.last_login IS NULL) as jamais_connectes
  FROM users u
  CROSS JOIN group_info
  LEFT JOIN user_module_permissions ump ON u.id = ump.user_id
  WHERE u.school_group_id = group_info.id
)
SELECT 
  '💡 ACTIONS RECOMMANDÉES' as section,
  CASE 
    WHEN stats.inactifs > 0 THEN 
      '1️⃣ Activer ' || stats.inactifs || ' utilisateur(s) : UPDATE users SET status = ''active'' WHERE school_group_id = ''' || group_info.id || ''' AND status = ''inactive'';'
    ELSE '✅ Pas d''action nécessaire pour les statuts'
  END as action_statuts,
  CASE 
    WHEN stats.sans_modules > 0 THEN 
      '2️⃣ Assigner des modules à ' || stats.sans_modules || ' utilisateur(s) via l''interface'
    ELSE '✅ Tous les utilisateurs ont des modules'
  END as action_modules,
  CASE 
    WHEN stats.jamais_connectes > 0 THEN 
      '3️⃣ Inviter ' || stats.jamais_connectes || ' utilisateur(s) à se connecter'
    ELSE '✅ Tous les utilisateurs se sont connectés'
  END as action_connexions
FROM stats, group_info;

-- ============================================================================
-- FIN DU DIAGNOSTIC
-- ============================================================================

-- DEBUG URGENT - Pourquoi rien ne s'affiche pour Admin Groupe

-- 1. VÉRIFIER SI L'UTILISATEUR EXISTE
SELECT 
  '🔍 UTILISATEUR ADMIN GROUPE' as debug_step,
  COUNT(*) as nb_users,
  string_agg(email, ', ') as emails
FROM users 
WHERE role = 'admin_groupe';

-- 2. VÉRIFIER LES DÉTAILS UTILISATEUR
SELECT 
  '👤 DÉTAILS UTILISATEUR' as debug_step,
  u.id,
  u.email,
  u.role,
  u.school_group_id,
  sg.name as group_name,
  sg.plan_id
FROM users u
LEFT JOIN school_groups sg ON u.school_group_id = sg.id
WHERE u.role = 'admin_groupe'
LIMIT 3;

-- 3. VÉRIFIER SI group_module_configs A DES DONNÉES
SELECT 
  '📦 GROUP MODULE CONFIGS' as debug_step,
  COUNT(*) as total_configs,
  COUNT(DISTINCT school_group_id) as groupes_distincts,
  COUNT(DISTINCT module_id) as modules_distincts
FROM group_module_configs;

-- 4. VÉRIFIER SPÉCIFIQUEMENT POUR ADMIN GROUPE
SELECT 
  '🎯 CONFIGS ADMIN GROUPE' as debug_step,
  gmc.school_group_id,
  sg.name as group_name,
  COUNT(*) as nb_modules
FROM group_module_configs gmc
JOIN school_groups sg ON gmc.school_group_id = sg.id
WHERE gmc.school_group_id IN (
  SELECT DISTINCT school_group_id 
  FROM users 
  WHERE role = 'admin_groupe'
)
GROUP BY gmc.school_group_id, sg.name;

-- 5. VÉRIFIER LA TABLE MODULES
SELECT 
  '📚 TABLE MODULES' as debug_step,
  COUNT(*) as total_modules,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as modules_actifs,
  COUNT(CASE WHEN status != 'active' OR status IS NULL THEN 1 END) as modules_inactifs
FROM modules;

-- 6. VÉRIFIER LA TABLE BUSINESS_CATEGORIES
SELECT 
  '📂 TABLE CATEGORIES' as debug_step,
  COUNT(*) as total_categories,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as categories_actives
FROM business_categories;

-- 7. TEST DE LA REQUÊTE EXACTE DE L'INTERFACE
SELECT 
  '🔬 TEST REQUÊTE INTERFACE' as debug_step,
  'Simulation de la requête React' as description;

-- Simuler la requête que fait l'interface
WITH admin_user AS (
  SELECT school_group_id 
  FROM users 
  WHERE role = 'admin_groupe' 
  LIMIT 1
)
SELECT 
  '📋 RÉSULTAT REQUÊTE' as debug_step,
  gmc.is_enabled,
  m.id as module_id,
  m.name as module_name,
  m.status as module_status,
  bc.name as category_name
FROM group_module_configs gmc
JOIN modules m ON gmc.module_id = m.id
LEFT JOIN business_categories bc ON m.category_id = bc.id
WHERE gmc.school_group_id = (SELECT school_group_id FROM admin_user)
LIMIT 5;

-- 8. VÉRIFIER S'IL Y A DES ERREURS DE JOINTURE
SELECT 
  '⚠️ MODULES ORPHELINS' as debug_step,
  COUNT(*) as modules_sans_config
FROM modules m
WHERE m.status = 'active'
AND NOT EXISTS (
  SELECT 1 FROM group_module_configs gmc 
  WHERE gmc.module_id = m.id
);

-- 9. VÉRIFIER S'IL Y A DES CONFIGS ORPHELINES
SELECT 
  '🚫 CONFIGS ORPHELINES' as debug_step,
  COUNT(*) as configs_sans_module
FROM group_module_configs gmc
WHERE NOT EXISTS (
  SELECT 1 FROM modules m 
  WHERE m.id = gmc.module_id
);

-- 10. DIAGNOSTIC FINAL
SELECT 
  '🎯 DIAGNOSTIC FINAL' as debug_step,
  CASE 
    WHEN (SELECT COUNT(*) FROM users WHERE role = 'admin_groupe') = 0 
    THEN 'PROBLÈME: Aucun utilisateur admin_groupe'
    WHEN (SELECT COUNT(*) FROM group_module_configs WHERE school_group_id IN (SELECT school_group_id FROM users WHERE role = 'admin_groupe')) = 0 
    THEN 'PROBLÈME: Aucun module assigné aux groupes admin'
    WHEN (SELECT COUNT(*) FROM modules WHERE status = 'active') = 0 
    THEN 'PROBLÈME: Aucun module actif'
    ELSE 'DONNÉES OK - Problème dans l''interface'
  END as diagnostic;

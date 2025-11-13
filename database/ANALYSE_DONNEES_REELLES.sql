-- ANALYSE COMPLÈTE DES DONNÉES RÉELLES
-- Comprendre la structure existante avant d'implémenter une solution

-- 1. ANALYSER LA STRUCTURE DES GROUPES SCOLAIRES EXISTANTS
SELECT 
  '🏫 GROUPES SCOLAIRES EXISTANTS' as section,
  COUNT(*) as total_groupes,
  COUNT(CASE WHEN plan_id IS NOT NULL THEN 1 END) as groupes_avec_plan,
  COUNT(CASE WHEN plan_id IS NULL THEN 1 END) as groupes_sans_plan
FROM school_groups;

-- 2. DÉTAIL DES GROUPES EXISTANTS
SELECT 
  '📋 DÉTAIL GROUPES' as section,
  sg.id,
  sg.name,
  sg.code,
  sg.region,
  sg.plan_id,
  sp.name as plan_name,
  sp.slug as plan_slug
FROM school_groups sg
LEFT JOIN subscription_plans sp ON sg.plan_id = sp.id
ORDER BY sg.created_at DESC
LIMIT 10;

-- 3. ANALYSER LES PLANS D'ABONNEMENT EXISTANTS
SELECT 
  '💰 PLANS EXISTANTS' as section,
  sp.id,
  sp.name,
  sp.slug,
  sp.price,
  sp.status,
  COUNT(sg.id) as groupes_utilisant_ce_plan
FROM subscription_plans sp
LEFT JOIN school_groups sg ON sp.id = sg.plan_id
GROUP BY sp.id, sp.name, sp.slug, sp.price, sp.status
ORDER BY sp.price;

-- 4. ANALYSER LES CATÉGORIES MÉTIERS EXISTANTES
SELECT 
  '📂 CATÉGORIES EXISTANTES' as section,
  bc.id,
  bc.name,
  bc.slug,
  bc.status,
  COUNT(m.id) as nb_modules_dans_categorie
FROM business_categories bc
LEFT JOIN modules m ON bc.id = m.category_id
GROUP BY bc.id, bc.name, bc.slug, bc.status
ORDER BY bc.name;

-- 5. ANALYSER LES MODULES EXISTANTS
SELECT 
  '📦 MODULES EXISTANTS' as section,
  COUNT(*) as total_modules,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as modules_actifs,
  COUNT(CASE WHEN is_core = true THEN 1 END) as modules_core,
  COUNT(CASE WHEN category_id IS NOT NULL THEN 1 END) as modules_avec_categorie
FROM modules;

-- 6. MODULES PAR CATÉGORIE
SELECT 
  '📊 RÉPARTITION MODULES' as section,
  bc.name as categorie,
  COUNT(m.id) as nb_modules,
  COUNT(CASE WHEN m.is_core = true THEN 1 END) as modules_core,
  COUNT(CASE WHEN m.status = 'active' THEN 1 END) as modules_actifs
FROM business_categories bc
LEFT JOIN modules m ON bc.id = m.category_id
GROUP BY bc.id, bc.name
ORDER BY COUNT(m.id) DESC;

-- 7. ANALYSER LES UTILISATEURS ADMIN GROUPE
SELECT 
  '👤 ADMIN GROUPES EXISTANTS' as section,
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.school_group_id,
  sg.name as group_name,
  sg.plan_id
FROM users u
LEFT JOIN school_groups sg ON u.school_group_id = sg.id
WHERE u.role = 'admin_groupe'
ORDER BY u.created_at DESC;

-- 8. ANALYSER LES ASSIGNATIONS PLAN-MODULES
SELECT 
  '🔗 PLAN-MODULES EXISTANTS' as section,
  sp.name as plan_name,
  COUNT(pm.module_id) as modules_assignes_au_plan
FROM subscription_plans sp
LEFT JOIN plan_modules pm ON sp.id = pm.plan_id
GROUP BY sp.id, sp.name
ORDER BY COUNT(pm.module_id) DESC;

-- 9. ANALYSER LES ASSIGNATIONS GROUPE-MODULES
SELECT 
  '⚙️ GROUPE-MODULES EXISTANTS' as section,
  sg.name as groupe,
  COUNT(gmc.module_id) as modules_assignes_au_groupe,
  COUNT(CASE WHEN gmc.is_enabled = true THEN 1 END) as modules_actifs
FROM school_groups sg
LEFT JOIN group_module_configs gmc ON sg.id = gmc.school_group_id
GROUP BY sg.id, sg.name
ORDER BY COUNT(gmc.module_id) DESC;

-- 10. VÉRIFIER LA COHÉRENCE PLAN → GROUPE → MODULES
WITH plan_analysis AS (
  SELECT 
    sg.name as groupe,
    sp.name as plan,
    COUNT(DISTINCT pm.module_id) as modules_dans_plan,
    COUNT(DISTINCT gmc.module_id) as modules_assignes_groupe,
    CASE 
      WHEN COUNT(DISTINCT pm.module_id) = COUNT(DISTINCT gmc.module_id) THEN '✅ COHÉRENT'
      WHEN COUNT(DISTINCT gmc.module_id) = 0 THEN '❌ AUCUN MODULE ASSIGNÉ'
      WHEN COUNT(DISTINCT pm.module_id) > COUNT(DISTINCT gmc.module_id) THEN '⚠️ MODULES MANQUANTS'
      ELSE '🔄 INCOHÉRENT'
    END as status_coherence
  FROM school_groups sg
  LEFT JOIN subscription_plans sp ON sg.plan_id = sp.id
  LEFT JOIN plan_modules pm ON sp.id = pm.plan_id
  LEFT JOIN group_module_configs gmc ON sg.id = gmc.school_group_id
  WHERE sg.plan_id IS NOT NULL
  GROUP BY sg.id, sg.name, sp.name
)
SELECT 
  '🎯 COHÉRENCE PLAN-GROUPE' as section,
  *
FROM plan_analysis
ORDER BY status_coherence, groupe;

-- 11. IDENTIFIER LE GROUPE LAMARELLE SPÉCIFIQUEMENT
SELECT 
  '🔍 GROUPE LAMARELLE' as section,
  sg.*,
  sp.name as plan_name,
  COUNT(gmc.module_id) as modules_assignes
FROM school_groups sg
LEFT JOIN subscription_plans sp ON sg.plan_id = sp.id
LEFT JOIN group_module_configs gmc ON sg.id = gmc.school_group_id
WHERE sg.id = '914d2ced-663a-4732-a521-edcc2423a012'
   OR sg.name ILIKE '%LAMARELLE%'
   OR sg.code = 'E-PILOT-003'
GROUP BY sg.id, sg.name, sg.code, sg.description, sg.region, sg.plan_id, sg.status, sg.created_at, sg.updated_at, sp.name;

-- 12. DIAGNOSTIC FINAL
SELECT 
  '📊 DIAGNOSTIC FINAL' as section,
  'Groupes: ' || (SELECT COUNT(*) FROM school_groups) ||
  ' | Plans: ' || (SELECT COUNT(*) FROM subscription_plans) ||
  ' | Catégories: ' || (SELECT COUNT(*) FROM business_categories WHERE status = 'active') ||
  ' | Modules: ' || (SELECT COUNT(*) FROM modules WHERE status = 'active') ||
  ' | Plan-Modules: ' || (SELECT COUNT(*) FROM plan_modules) ||
  ' | Groupe-Modules: ' || (SELECT COUNT(*) FROM group_module_configs) as statistiques;

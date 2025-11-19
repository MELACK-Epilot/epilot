-- =====================================================
-- DIAGNOSTIC COMPLET - Plan Pro de Vianney
-- =====================================================
-- Date: 17 novembre 2025
-- Objectif: Diagnostiquer pourquoi seulement 3 catégories et 47 modules

-- =====================================================
-- 1. VÉRIFIER LE GROUPE LAMARELLE
-- =====================================================
SELECT 
  sg.id,
  sg.name,
  sg.plan as plan_statique,
  sg.subscription_plan_id,
  sp.name as plan_name,
  sp.slug as plan_slug,
  sp.plan_type
FROM school_groups sg
LEFT JOIN subscription_plans sp ON sp.id = sg.subscription_plan_id
WHERE sg.name ILIKE '%LAMARELLE%';

-- =====================================================
-- 2. VÉRIFIER LES CATÉGORIES ASSIGNÉES AU PLAN
-- =====================================================
SELECT 
  sp.name as plan_name,
  sp.slug as plan_slug,
  COUNT(pc.id) as nb_categories_assignees,
  STRING_AGG(bc.name, ', ' ORDER BY bc.name) as categories
FROM subscription_plans sp
LEFT JOIN plan_categories pc ON pc.plan_id = sp.id
LEFT JOIN business_categories bc ON bc.id = pc.category_id
WHERE sp.slug = 'pro'  -- Plan Pro
GROUP BY sp.id, sp.name, sp.slug;

-- =====================================================
-- 3. DÉTAIL DES CATÉGORIES ASSIGNÉES AU PLAN PRO
-- =====================================================
SELECT 
  bc.id,
  bc.name,
  bc.slug,
  bc.icon,
  bc.color,
  bc.status,
  bc.is_core,
  bc.required_plan
FROM subscription_plans sp
JOIN plan_categories pc ON pc.plan_id = sp.id
JOIN business_categories bc ON bc.id = pc.category_id
WHERE sp.slug = 'pro'
ORDER BY bc.name;

-- =====================================================
-- 4. VÉRIFIER LES MODULES ASSIGNÉS AU PLAN PRO
-- =====================================================
SELECT 
  sp.name as plan_name,
  COUNT(pm.id) as nb_modules_assignes,
  COUNT(DISTINCT m.category_id) as nb_categories_modules
FROM subscription_plans sp
LEFT JOIN plan_modules pm ON pm.plan_id = sp.id
LEFT JOIN modules m ON m.id = pm.module_id
WHERE sp.slug = 'pro'
GROUP BY sp.id, sp.name;

-- =====================================================
-- 5. CATÉGORIES DES MODULES ASSIGNÉS (vs Catégories Assignées)
-- =====================================================
SELECT 
  'Catégories des modules assignés' as type,
  bc.id,
  bc.name,
  bc.slug,
  COUNT(m.id) as nb_modules
FROM subscription_plans sp
JOIN plan_modules pm ON pm.plan_id = sp.id
JOIN modules m ON m.id = pm.module_id
JOIN business_categories bc ON bc.id = m.category_id
WHERE sp.slug = 'pro'
GROUP BY bc.id, bc.name, bc.slug
ORDER BY bc.name;

-- =====================================================
-- 6. INCOHÉRENCE: Modules avec catégories NON assignées au plan
-- =====================================================
SELECT 
  m.id as module_id,
  m.name as module_name,
  bc.id as category_id,
  bc.name as category_name,
  CASE 
    WHEN pc.id IS NULL THEN '❌ CATÉGORIE NON ASSIGNÉE AU PLAN!'
    ELSE '✅ OK'
  END as status
FROM subscription_plans sp
JOIN plan_modules pm ON pm.plan_id = sp.id
JOIN modules m ON m.id = pm.module_id
JOIN business_categories bc ON bc.id = m.category_id
LEFT JOIN plan_categories pc ON pc.plan_id = sp.id AND pc.category_id = bc.id
WHERE sp.slug = 'pro'
ORDER BY 
  CASE WHEN pc.id IS NULL THEN 0 ELSE 1 END,
  bc.name,
  m.name;

-- =====================================================
-- 7. TOUTES LES CATÉGORIES EXISTANTES
-- =====================================================
SELECT 
  bc.id,
  bc.name,
  bc.slug,
  bc.icon,
  bc.color,
  bc.status,
  bc.is_core,
  bc.required_plan,
  COUNT(m.id) as nb_modules_total
FROM business_categories bc
LEFT JOIN modules m ON m.category_id = bc.id AND m.status = 'active'
WHERE bc.status = 'active'
GROUP BY bc.id, bc.name, bc.slug, bc.icon, bc.color, bc.status, bc.is_core, bc.required_plan
ORDER BY bc.name;

-- =====================================================
-- 8. RECOMMANDATION: Catégories à ajouter au plan Pro
-- =====================================================
SELECT 
  bc.id,
  bc.name,
  bc.slug,
  bc.icon,
  COUNT(m.id) as nb_modules,
  CASE 
    WHEN pc.id IS NOT NULL THEN '✅ Déjà assignée'
    ELSE '❌ À ASSIGNER'
  END as status
FROM business_categories bc
LEFT JOIN modules m ON m.category_id = bc.id AND m.status = 'active'
LEFT JOIN plan_categories pc ON pc.category_id = bc.id 
  AND pc.plan_id = (SELECT id FROM subscription_plans WHERE slug = 'pro')
WHERE bc.status = 'active'
GROUP BY bc.id, bc.name, bc.slug, bc.icon, pc.id
ORDER BY 
  CASE WHEN pc.id IS NULL THEN 0 ELSE 1 END,
  bc.name;

-- =====================================================
-- 9. RÉSUMÉ FINAL
-- =====================================================
SELECT 
  '📊 RÉSUMÉ DIAGNOSTIC' as titre,
  (SELECT COUNT(*) FROM business_categories WHERE status = 'active') as total_categories_systeme,
  (SELECT COUNT(*) FROM plan_categories pc 
   JOIN subscription_plans sp ON sp.id = pc.plan_id 
   WHERE sp.slug = 'pro') as categories_assignees_plan_pro,
  (SELECT COUNT(*) FROM modules WHERE status = 'active') as total_modules_systeme,
  (SELECT COUNT(*) FROM plan_modules pm 
   JOIN subscription_plans sp ON sp.id = pm.plan_id 
   WHERE sp.slug = 'pro') as modules_assignes_plan_pro,
  (SELECT COUNT(DISTINCT m.category_id) FROM plan_modules pm 
   JOIN subscription_plans sp ON sp.id = pm.plan_id 
   JOIN modules m ON m.id = pm.module_id
   WHERE sp.slug = 'pro') as categories_modules_plan_pro;

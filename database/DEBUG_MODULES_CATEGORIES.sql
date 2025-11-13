-- ============================================================================
-- SCRIPT DE DEBUG - MODULES & CATÉGORIES
-- Vérifier pourquoi les modules et catégories ne s'affichent pas
-- ============================================================================

-- 1. Vérifier le groupe scolaire "L'INTELIGENCE SELESTE"
SELECT 
  id,
  name,
  code,
  plan,
  created_at
FROM school_groups
WHERE name ILIKE '%INTELIGENCE%' OR code = 'E-PILOT-002';

-- 2. Vérifier l'abonnement actif du groupe
SELECT 
  sg.name as groupe_name,
  sgs.id as subscription_id,
  sgs.plan_id,
  sgs.status,
  sgs.start_date,
  sgs.end_date,
  sp.name as plan_name,
  sp.slug as plan_slug
FROM school_groups sg
LEFT JOIN school_group_subscriptions sgs ON sg.id = sgs.school_group_id
LEFT JOIN subscription_plans sp ON sgs.plan_id = sp.id
WHERE sg.name ILIKE '%INTELIGENCE%' OR sg.code = 'E-PILOT-002'
ORDER BY sgs.created_at DESC;

-- 3. Vérifier les modules assignés au plan
SELECT 
  sp.name as plan_name,
  sp.slug as plan_slug,
  COUNT(pm.module_id) as modules_count
FROM subscription_plans sp
LEFT JOIN plan_modules pm ON sp.id = pm.plan_id
WHERE sp.slug = 'gratuit' -- Remplacer par le slug du plan du groupe
GROUP BY sp.id, sp.name, sp.slug;

-- 4. Vérifier les catégories assignées au plan
SELECT 
  sp.name as plan_name,
  sp.slug as plan_slug,
  COUNT(pc.category_id) as categories_count
FROM subscription_plans sp
LEFT JOIN plan_categories pc ON sp.id = pc.plan_id
WHERE sp.slug = 'gratuit' -- Remplacer par le slug du plan du groupe
GROUP BY sp.id, sp.name, sp.slug;

-- 5. Lister TOUS les modules assignés au plan Gratuit
SELECT 
  m.id,
  m.name,
  m.slug,
  m.status,
  bc.name as category_name
FROM plan_modules pm
INNER JOIN modules m ON pm.module_id = m.id
LEFT JOIN business_categories bc ON m.category_id = bc.id
WHERE pm.plan_id IN (
  SELECT id FROM subscription_plans WHERE slug = 'gratuit'
)
ORDER BY bc.name, m.name;

-- 6. Lister TOUTES les catégories assignées au plan Gratuit
SELECT 
  bc.id,
  bc.name,
  bc.slug,
  bc.status
FROM plan_categories pc
INNER JOIN business_categories bc ON pc.category_id = bc.id
WHERE pc.plan_id IN (
  SELECT id FROM subscription_plans WHERE slug = 'gratuit'
)
ORDER BY bc.name;

-- 7. Vérifier si le plan Gratuit existe
SELECT 
  id,
  name,
  slug,
  status
FROM subscription_plans
WHERE slug = 'gratuit';

-- 8. Vérifier TOUS les plans disponibles
SELECT 
  id,
  name,
  slug,
  status,
  (SELECT COUNT(*) FROM plan_modules WHERE plan_id = subscription_plans.id) as modules_count,
  (SELECT COUNT(*) FROM plan_categories WHERE plan_id = subscription_plans.id) as categories_count
FROM subscription_plans
ORDER BY name;

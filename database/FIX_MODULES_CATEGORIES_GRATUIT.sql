-- ============================================================================
-- SCRIPT DE CORRECTION - MODULES & CATÉGORIES PLAN GRATUIT
-- Assigner automatiquement des modules et catégories au plan Gratuit
-- ============================================================================

-- ÉTAPE 1 : Vérifier le plan Gratuit
SELECT 
  id,
  name,
  slug,
  (SELECT COUNT(*) FROM plan_modules WHERE plan_id = subscription_plans.id) as modules_assignes,
  (SELECT COUNT(*) FROM plan_categories WHERE plan_id = subscription_plans.id) as categories_assignees
FROM subscription_plans
WHERE slug = 'gratuit';

-- Si modules_assignes = 0 ou categories_assignees = 0, continuer avec les étapes suivantes

-- ============================================================================
-- ÉTAPE 2 : Assigner des CATÉGORIES au plan Gratuit
-- ============================================================================

-- Assigner TOUTES les catégories actives au plan Gratuit
INSERT INTO plan_categories (plan_id, category_id, created_at)
SELECT 
  sp.id as plan_id,
  bc.id as category_id,
  NOW() as created_at
FROM subscription_plans sp
CROSS JOIN business_categories bc
WHERE sp.slug = 'gratuit'
  AND bc.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM plan_categories 
    WHERE plan_id = sp.id AND category_id = bc.id
  );

-- Vérifier le résultat
SELECT 
  sp.name as plan_name,
  COUNT(pc.category_id) as categories_assignees
FROM subscription_plans sp
LEFT JOIN plan_categories pc ON sp.id = pc.plan_id
WHERE sp.slug = 'gratuit'
GROUP BY sp.name;

-- ============================================================================
-- ÉTAPE 3 : Assigner des MODULES au plan Gratuit
-- ============================================================================

-- Option A : Assigner TOUS les modules actifs (recommandé pour plan Gratuit)
INSERT INTO plan_modules (plan_id, module_id, created_at)
SELECT 
  sp.id as plan_id,
  m.id as module_id,
  NOW() as created_at
FROM subscription_plans sp
CROSS JOIN modules m
WHERE sp.slug = 'gratuit'
  AND m.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM plan_modules 
    WHERE plan_id = sp.id AND module_id = m.id
  );

-- OU Option B : Assigner uniquement les modules "gratuit" (plus restrictif)
/*
INSERT INTO plan_modules (plan_id, module_id, created_at)
SELECT 
  sp.id as plan_id,
  m.id as module_id,
  NOW() as created_at
FROM subscription_plans sp
CROSS JOIN modules m
WHERE sp.slug = 'gratuit'
  AND m.required_plan = 'gratuit'
  AND m.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM plan_modules 
    WHERE plan_id = sp.id AND module_id = m.id
  );
*/

-- Vérifier le résultat
SELECT 
  sp.name as plan_name,
  COUNT(pm.module_id) as modules_assignes
FROM subscription_plans sp
LEFT JOIN plan_modules pm ON sp.id = pm.plan_id
WHERE sp.slug = 'gratuit'
GROUP BY sp.name;

-- ============================================================================
-- ÉTAPE 4 : Vérifier l'abonnement du groupe
-- ============================================================================

-- Vérifier si le groupe a un abonnement actif
SELECT 
  sg.name as groupe_name,
  sg.code,
  sgs.status as subscription_status,
  sp.name as plan_name,
  sp.slug as plan_slug,
  sgs.start_date,
  sgs.end_date
FROM school_groups sg
LEFT JOIN school_group_subscriptions sgs ON sg.id = sgs.school_group_id AND sgs.status = 'active'
LEFT JOIN subscription_plans sp ON sgs.plan_id = sp.id
WHERE sg.code = 'E-PILOT-002';

-- Si pas d'abonnement actif, créer un
INSERT INTO school_group_subscriptions (
  school_group_id,
  plan_id,
  status,
  start_date,
  end_date,
  created_at,
  updated_at
)
SELECT 
  sg.id,
  sp.id,
  'active',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '1 year',
  NOW(),
  NOW()
FROM school_groups sg
CROSS JOIN subscription_plans sp
WHERE sg.code = 'E-PILOT-002'
  AND sp.slug = 'gratuit'
  AND NOT EXISTS (
    SELECT 1 FROM school_group_subscriptions
    WHERE school_group_id = sg.id AND status = 'active'
  );

-- ============================================================================
-- ÉTAPE 5 : VÉRIFICATION FINALE
-- ============================================================================

-- Cette requête doit retourner des nombres > 0
SELECT 
  sg.name as groupe,
  sg.code,
  sp.name as plan,
  sp.slug as plan_slug,
  COUNT(DISTINCT pm.module_id) as modules_disponibles,
  COUNT(DISTINCT pc.category_id) as categories_disponibles
FROM school_groups sg
INNER JOIN school_group_subscriptions sgs ON sg.id = sgs.school_group_id
INNER JOIN subscription_plans sp ON sgs.plan_id = sp.id
LEFT JOIN plan_modules pm ON sp.id = pm.plan_id
LEFT JOIN plan_categories pc ON sp.id = pc.plan_id
WHERE sg.code = 'E-PILOT-002'
  AND sgs.status = 'active'
GROUP BY sg.name, sg.code, sp.name, sp.slug;

-- ============================================================================
-- ÉTAPE 6 : Lister les modules disponibles pour le groupe
-- ============================================================================

SELECT 
  m.name as module_name,
  bc.name as category_name,
  m.status
FROM school_groups sg
INNER JOIN school_group_subscriptions sgs ON sg.id = sgs.school_group_id
INNER JOIN subscription_plans sp ON sgs.plan_id = sp.id
INNER JOIN plan_modules pm ON sp.id = pm.plan_id
INNER JOIN modules m ON pm.module_id = m.id
LEFT JOIN business_categories bc ON m.category_id = bc.id
WHERE sg.code = 'E-PILOT-002'
  AND sgs.status = 'active'
  AND m.status = 'active'
ORDER BY bc.name, m.name;

-- ============================================================================
-- RÉSULTAT ATTENDU
-- ============================================================================

/*
APRÈS EXÉCUTION DE CE SCRIPT :

1. Le plan Gratuit doit avoir des catégories assignées
2. Le plan Gratuit doit avoir des modules assignés
3. Le groupe "L'INTELIGENCE SELESTE" doit avoir un abonnement actif
4. La vérification finale doit retourner :
   - modules_disponibles > 0
   - categories_disponibles > 0

5. Rafraîchir la page "Mes Modules" dans l'application
6. Les KPI doivent afficher les bons nombres
7. Les modules doivent s'afficher dans la liste
*/

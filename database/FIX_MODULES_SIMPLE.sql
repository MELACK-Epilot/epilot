-- ============================================================================
-- SCRIPT DE CORRECTION SIMPLE - MODULES & CATÉGORIES
-- Version simplifiée et testée
-- ============================================================================

-- ÉTAPE 1 : Vérifier le plan Gratuit existe
SELECT 
  id,
  name,
  slug,
  (SELECT COUNT(*) FROM plan_modules WHERE plan_id = subscription_plans.id) as modules_assignes,
  (SELECT COUNT(*) FROM plan_categories WHERE plan_id = subscription_plans.id) as categories_assignees
FROM subscription_plans
WHERE slug = 'gratuit';

-- ============================================================================
-- ÉTAPE 2 : Assigner TOUTES les catégories au plan Gratuit
-- ============================================================================

INSERT INTO plan_categories (plan_id, category_id, created_at)
SELECT 
  sp.id as plan_id,
  bc.id as category_id,
  NOW() as created_at
FROM subscription_plans sp
CROSS JOIN business_categories bc
WHERE sp.slug = 'gratuit'
  AND NOT EXISTS (
    SELECT 1 FROM plan_categories 
    WHERE plan_id = sp.id AND category_id = bc.id
  );

-- Vérifier combien de catégories ont été ajoutées
SELECT COUNT(*) as categories_ajoutees FROM plan_categories 
WHERE plan_id IN (SELECT id FROM subscription_plans WHERE slug = 'gratuit');

-- ============================================================================
-- ÉTAPE 3 : Assigner TOUS les modules au plan Gratuit
-- ============================================================================

INSERT INTO plan_modules (plan_id, module_id, created_at)
SELECT 
  sp.id as plan_id,
  m.id as module_id,
  NOW() as created_at
FROM subscription_plans sp
CROSS JOIN modules m
WHERE sp.slug = 'gratuit'
  AND NOT EXISTS (
    SELECT 1 FROM plan_modules 
    WHERE plan_id = sp.id AND module_id = m.id
  );

-- Vérifier combien de modules ont été ajoutés
SELECT COUNT(*) as modules_ajoutes FROM plan_modules 
WHERE plan_id IN (SELECT id FROM subscription_plans WHERE slug = 'gratuit');

-- ============================================================================
-- ÉTAPE 4 : Créer un abonnement actif si nécessaire
-- ============================================================================

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

-- Cette requête doit retourner modules_disponibles > 0 et categories_disponibles > 0
SELECT 
  sg.name as groupe,
  sg.code,
  sp.name as plan,
  COUNT(DISTINCT pm.module_id) as modules_disponibles,
  COUNT(DISTINCT pc.category_id) as categories_disponibles
FROM school_groups sg
INNER JOIN school_group_subscriptions sgs ON sg.id = sgs.school_group_id
INNER JOIN subscription_plans sp ON sgs.plan_id = sp.id
LEFT JOIN plan_modules pm ON sp.id = pm.plan_id
LEFT JOIN plan_categories pc ON sp.id = pc.plan_id
WHERE sg.code = 'E-PILOT-002'
  AND sgs.status = 'active'
GROUP BY sg.name, sg.code, sp.name;

-- ============================================================================
-- RÉSULTAT ATTENDU
-- ============================================================================

/*
APRÈS EXÉCUTION :

groupe                  | plan    | modules_disponibles | categories_disponibles
------------------------|---------|---------------------|------------------------
L'INTELIGENCE SELESTE  | Gratuit | 15                  | 5

Si les nombres sont > 0 → ✅ SUCCÈS !
Rafraîchir la page "Mes Modules" dans l'application
*/

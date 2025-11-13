-- =====================================================
-- DEBUG : Pourquoi le tableau des abonnements est vide ?
-- =====================================================
-- Date: 10 Novembre 2025, 01:00
-- =====================================================

-- =====================================================
-- ÉTAPE 1 : Vérifier si des groupes existent
-- =====================================================
SELECT 
  COUNT(*) AS nombre_groupes,
  'Groupes scolaires dans la BDD' AS description
FROM school_groups;

SELECT 
  id,
  name,
  code,
  plan,
  status,
  created_at
FROM school_groups
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- ÉTAPE 2 : Vérifier si des abonnements existent
-- =====================================================
SELECT 
  COUNT(*) AS nombre_abonnements,
  'Abonnements dans la BDD' AS description
FROM subscriptions;

SELECT 
  id,
  school_group_id,
  plan_id,
  status,
  amount,
  start_date,
  end_date,
  created_at
FROM subscriptions
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- ÉTAPE 3 : Vérifier si le trigger existe
-- =====================================================
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_create_subscription_on_group';

-- =====================================================
-- ÉTAPE 4 : Vérifier si des plans existent
-- =====================================================
SELECT 
  id,
  name,
  slug,
  price,
  billing_period,
  status
FROM subscription_plans
WHERE status = 'active'
ORDER BY price;

-- =====================================================
-- DIAGNOSTIC
-- =====================================================
-- Si nombre_groupes > 0 ET nombre_abonnements = 0
-- → Le trigger n'a pas fonctionné ou n'existait pas lors de la création des groupes
-- → Solution : Créer les abonnements manuellement pour les groupes existants

-- Si nombre_groupes = 0
-- → Aucun groupe créé
-- → Solution : Créer des groupes de test

-- Si nombre_abonnements > 0 mais tableau vide
-- → Problème dans le hook useSubscriptions (jointure incorrecte)
-- → Solution : Vérifier le code React

-- =====================================================
-- SOLUTION 1 : Créer abonnements pour groupes existants
-- =====================================================
-- Cette requête crée un abonnement pour chaque groupe qui n'en a pas

INSERT INTO subscriptions (
  school_group_id,
  plan_id,
  status,
  start_date,
  end_date,
  amount,
  currency,
  billing_period,
  payment_status,
  payment_method,
  auto_renew
)
SELECT 
  sg.id AS school_group_id,
  sp.id AS plan_id,
  'active' AS status,
  NOW() AS start_date,
  CASE 
    WHEN sp.billing_period = 'monthly' THEN NOW() + INTERVAL '1 month'
    ELSE NOW() + INTERVAL '1 year'
  END AS end_date,
  sp.price AS amount,
  'FCFA' AS currency,
  sp.billing_period,
  'pending' AS payment_status,
  'bank_transfer' AS payment_method,
  true AS auto_renew
FROM school_groups sg
JOIN subscription_plans sp ON sp.slug = sg.plan
WHERE sg.id NOT IN (SELECT school_group_id FROM subscriptions)
  AND sg.status = 'active'
  AND sp.status = 'active';

-- Vérifier le résultat
SELECT 
  COUNT(*) AS abonnements_crees,
  'Abonnements créés pour les groupes existants' AS description
FROM subscriptions;

-- =====================================================
-- SOLUTION 2 : Vérifier la vue utilisée par React
-- =====================================================
-- Si vous utilisez une vue, vérifiez qu'elle existe
SELECT 
  s.id,
  sg.name AS school_group_name,
  sg.code AS school_group_code,
  sp.name AS plan_name,
  s.status,
  s.amount,
  s.start_date,
  s.end_date
FROM subscriptions s
INNER JOIN school_groups sg ON sg.id = s.school_group_id
INNER JOIN subscription_plans sp ON sp.id = s.plan_id
ORDER BY s.created_at DESC;

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================
-- ✅ Groupes : > 0
-- ✅ Abonnements : > 0
-- ✅ Trigger : 1 ligne
-- ✅ Plans : 4 lignes (gratuit, premium, pro, institutionnel)
-- ✅ Jointure : Données visibles
-- =====================================================

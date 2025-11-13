-- =====================================================
-- DEBUG : Vérifier les abonnements
-- =====================================================

-- 1. Vérifier la structure de la table subscriptions
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'subscriptions'
ORDER BY ordinal_position;

-- 2. Compter les abonnements
SELECT COUNT(*) AS total_subscriptions FROM subscriptions;

-- 3. Voir les abonnements avec leurs relations
SELECT 
  s.id,
  s.school_group_id,
  s.plan_id,
  s.status,
  s.amount,
  s.start_date,
  s.end_date,
  sg.name AS group_name,
  sp.name AS plan_name
FROM subscriptions s
LEFT JOIN school_groups sg ON sg.id = s.school_group_id
LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
ORDER BY s.created_at DESC
LIMIT 10;

-- 4. Vérifier les groupes scolaires
SELECT id, name, code, status
FROM school_groups
LIMIT 10;

-- 5. Vérifier les plans
SELECT id, name, slug, price
FROM subscription_plans
LIMIT 10;

-- 6. Vérifier s'il y a des abonnements actifs
SELECT 
  status,
  COUNT(*) AS count
FROM subscriptions
GROUP BY status;

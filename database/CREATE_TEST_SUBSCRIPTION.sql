-- =====================================================
-- CRÉER UN ABONNEMENT DE TEST
-- =====================================================
-- Date: 10 Novembre 2025, 00:10
-- Objectif: Tester le Hub Abonnements avec des données réelles
-- =====================================================

BEGIN;

-- 1. Vérifier qu'on a au moins un groupe scolaire
DO $$
DECLARE
  v_group_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_group_count FROM school_groups;
  
  IF v_group_count = 0 THEN
    RAISE EXCEPTION 'Aucun groupe scolaire trouvé. Créez d''abord un groupe.';
  END IF;
  
  RAISE NOTICE '✅ % groupe(s) scolaire(s) trouvé(s)', v_group_count;
END $$;

-- 2. Vérifier qu'on a des plans
DO $$
DECLARE
  v_plan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_plan_count FROM subscription_plans;
  
  IF v_plan_count = 0 THEN
    RAISE EXCEPTION 'Aucun plan trouvé. Créez d''abord des plans.';
  END IF;
  
  RAISE NOTICE '✅ % plan(s) trouvé(s)', v_plan_count;
END $$;

-- 3. Créer 3 abonnements de test
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
  NOW() + INTERVAL '1 year' AS end_date,
  sp.price AS amount,
  'FCFA' AS currency,
  'monthly' AS billing_period,
  'paid' AS payment_status,
  'bank_transfer' AS payment_method,
  true AS auto_renew
FROM 
  (SELECT id FROM school_groups ORDER BY created_at LIMIT 3) sg
CROSS JOIN
  (SELECT id, price FROM subscription_plans WHERE slug = 'premium' LIMIT 1) sp
ON CONFLICT DO NOTHING;

-- 4. Si pas assez de groupes, créer avec différents plans
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
  CASE 
    WHEN sp.slug = 'gratuit' THEN 'active'
    WHEN sp.slug = 'premium' THEN 'active'
    WHEN sp.slug = 'pro' THEN 'pending'
    ELSE 'active'
  END AS status,
  NOW() - INTERVAL '3 months' AS start_date,
  NOW() + INTERVAL '9 months' AS end_date,
  sp.price AS amount,
  'FCFA' AS currency,
  CASE 
    WHEN sp.slug IN ('gratuit', 'premium') THEN 'monthly'
    ELSE 'yearly'
  END AS billing_period,
  CASE 
    WHEN sp.slug = 'gratuit' THEN 'paid'
    WHEN sp.slug = 'premium' THEN 'paid'
    WHEN sp.slug = 'pro' THEN 'pending'
    ELSE 'paid'
  END AS payment_status,
  'bank_transfer' AS payment_method,
  true AS auto_renew
FROM 
  (SELECT id FROM school_groups ORDER BY created_at LIMIT 1) sg
CROSS JOIN
  (SELECT id, slug, price FROM subscription_plans WHERE slug IN ('gratuit', 'pro')) sp
ON CONFLICT DO NOTHING;

-- 5. Vérifier les abonnements créés
SELECT 
  s.id,
  sg.name AS groupe,
  sp.name AS plan,
  s.status,
  s.amount,
  s.start_date,
  s.end_date
FROM subscriptions s
JOIN school_groups sg ON sg.id = s.school_group_id
JOIN subscription_plans sp ON sp.id = s.plan_id
ORDER BY s.created_at DESC;

-- 6. Compter les abonnements
SELECT 
  COUNT(*) AS total_abonnements,
  COUNT(*) FILTER (WHERE status = 'active') AS actifs,
  COUNT(*) FILTER (WHERE status = 'pending') AS en_attente,
  SUM(amount) FILTER (WHERE status = 'active') AS revenu_total
FROM subscriptions;

COMMIT;

-- =====================================================
-- ✅ RÉSULTAT ATTENDU
-- =====================================================
-- Au moins 3-5 abonnements créés
-- Différents statuts (active, pending)
-- Différents plans (gratuit, premium, pro)
-- =====================================================

-- =====================================================
-- 🔧 SI ERREUR "Aucun groupe scolaire"
-- =====================================================
-- Créer d'abord un groupe de test :
-- 
-- INSERT INTO school_groups (name, code, status, admin_id)
-- VALUES (
--   'Groupe Test E-Pilot',
--   'GRP-TEST-001',
--   'active',
--   (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)
-- );
-- =====================================================

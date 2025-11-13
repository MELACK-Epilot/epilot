-- =====================================================
-- CRÉATION RAPIDE D'ABONNEMENT DE TEST
-- =====================================================
-- Exécuter ce script pour créer un abonnement immédiatement
-- =====================================================

-- Créer un abonnement Premium pour le premier groupe trouvé
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
VALUES (
  (SELECT id FROM school_groups LIMIT 1),
  (SELECT id FROM subscription_plans WHERE slug = 'premium'),
  'active',
  NOW(),
  NOW() + INTERVAL '1 year',
  25000,
  'FCFA',
  'monthly',
  'paid',
  'bank_transfer',
  true
);

-- Vérifier
SELECT 
  s.id,
  sg.name AS groupe_scolaire,
  sp.name AS plan,
  s.status,
  s.amount || ' ' || s.currency AS montant,
  s.start_date::date AS debut,
  s.end_date::date AS fin
FROM subscriptions s
JOIN school_groups sg ON sg.id = s.school_group_id
JOIN subscription_plans sp ON sp.id = s.plan_id
ORDER BY s.created_at DESC
LIMIT 1;

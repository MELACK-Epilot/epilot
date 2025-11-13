-- =====================================================
-- FIX RAPIDE : Créer abonnements pour groupes existants
-- =====================================================
-- Date: 10 Novembre 2025, 01:05
-- Objectif: Créer les abonnements manquants
-- =====================================================

BEGIN;

-- =====================================================
-- ÉTAPE 1 : Diagnostic rapide
-- =====================================================
DO $$
DECLARE
  v_nb_groupes INTEGER;
  v_nb_abonnements INTEGER;
  v_nb_plans INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_nb_groupes FROM school_groups;
  SELECT COUNT(*) INTO v_nb_abonnements FROM subscriptions;
  SELECT COUNT(*) INTO v_nb_plans FROM subscription_plans WHERE status = 'active';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 DIAGNOSTIC';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🏢 Groupes scolaires : %', v_nb_groupes;
  RAISE NOTICE '📋 Abonnements : %', v_nb_abonnements;
  RAISE NOTICE '📦 Plans actifs : %', v_nb_plans;
  RAISE NOTICE '========================================';
  
  IF v_nb_groupes = 0 THEN
    RAISE NOTICE '⚠️ PROBLÈME : Aucun groupe scolaire trouvé !';
    RAISE NOTICE '💡 SOLUTION : Créer des groupes de test';
  END IF;
  
  IF v_nb_plans = 0 THEN
    RAISE NOTICE '⚠️ PROBLÈME : Aucun plan trouvé !';
    RAISE NOTICE '💡 SOLUTION : Créer les plans (gratuit, premium, pro, institutionnel)';
  END IF;
  
  IF v_nb_groupes > 0 AND v_nb_abonnements = 0 THEN
    RAISE NOTICE '⚠️ PROBLÈME : Groupes existent mais aucun abonnement !';
    RAISE NOTICE '💡 SOLUTION : Créer les abonnements automatiquement (voir ci-dessous)';
  END IF;
END $$;

-- =====================================================
-- ÉTAPE 2 : Créer abonnements pour TOUS les groupes existants
-- =====================================================
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
  auto_renew,
  created_at,
  updated_at
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
  true AS auto_renew,
  NOW() AS created_at,
  NOW() AS updated_at
FROM school_groups sg
JOIN subscription_plans sp ON sp.slug = sg.plan
WHERE sg.id NOT IN (SELECT school_group_id FROM subscriptions WHERE school_group_id IS NOT NULL)
  AND sg.status = 'active'
  AND sp.status = 'active';

-- =====================================================
-- ÉTAPE 3 : Vérifier le résultat
-- =====================================================
DO $$
DECLARE
  v_nb_crees INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_nb_crees FROM subscriptions;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ RÉSULTAT';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📋 Total abonnements : %', v_nb_crees;
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- ÉTAPE 4 : Afficher les abonnements créés
-- =====================================================
SELECT 
  s.id,
  sg.name AS groupe,
  sg.code,
  sp.name AS plan,
  s.amount,
  s.billing_period AS periode,
  s.start_date AS debut,
  s.end_date AS fin,
  s.status,
  s.payment_status AS paiement
FROM subscriptions s
INNER JOIN school_groups sg ON sg.id = s.school_group_id
INNER JOIN subscription_plans sp ON sp.id = s.plan_id
ORDER BY s.created_at DESC;

COMMIT;

-- =====================================================
-- ✅ RÉSULTAT ATTENDU
-- =====================================================
-- Si tout fonctionne :
-- ✅ Message : "X abonnements créés"
-- ✅ Tableau avec les abonnements
-- ✅ Le tableau React devrait maintenant afficher les données

-- Si erreur "plan not found" :
-- ❌ Les plans n'existent pas dans subscription_plans
-- 💡 Solution : Exécuter le script de création des plans

-- Si erreur "foreign key violation" :
-- ❌ Problème de structure BDD
-- 💡 Solution : Vérifier les contraintes foreign key
-- =====================================================

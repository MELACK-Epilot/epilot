/**
 * Correction automatique des dates et statuts d'abonnements
 * Corrige LAMARELLE (status) et L'INTELIGENCE CELESTE (date)
 * @module FIX_SUBSCRIPTION_DATES_AUTO
 */

-- =====================================================
-- ÉTAPE 1 : DIAGNOSTIC AVANT CORRECTION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '🔍 ÉTAT AVANT CORRECTION';
  RAISE NOTICE '=======================';
END $$;

SELECT 
  sg.name as groupe,
  s.status,
  s.start_date,
  s.end_date,
  sp.billing_period,
  (s.end_date::DATE - CURRENT_DATE::DATE) as jours_restants,
  CASE 
    WHEN s.status != 'active' THEN '❌ Status à corriger'
    WHEN (s.end_date::DATE - s.start_date::DATE) > 300 AND sp.billing_period = 'monthly' THEN '❌ Date à corriger (devrait être 1 mois)'
    ELSE '✅ OK'
  END as diagnostic
FROM subscriptions s
INNER JOIN school_groups sg ON sg.id = s.school_group_id
INNER JOIN subscription_plans sp ON sp.id = s.plan_id
ORDER BY sg.name;

-- =====================================================
-- ÉTAPE 2 : CORRIGER LE STATUT DE LAMARELLE
-- =====================================================

UPDATE subscriptions
SET 
  status = 'active',
  updated_at = NOW()
WHERE school_group_id = (
  SELECT id FROM school_groups WHERE name = 'LAMARELLE'
)
AND status = 'pending';

DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Statut LAMARELLE corrigé : % ligne(s)', updated_count;
END $$;

-- =====================================================
-- ÉTAPE 3 : CORRIGER LES DATES INCORRECTES
-- =====================================================

-- Corriger les abonnements "monthly" qui ont une durée > 300 jours
UPDATE subscriptions s
SET 
  end_date = s.start_date + INTERVAL '1 month',
  updated_at = NOW()
FROM subscription_plans sp
WHERE s.plan_id = sp.id
  AND sp.billing_period = 'monthly'
  AND (s.end_date::DATE - s.start_date::DATE) > 300;

DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '✅ Dates corrigées : % ligne(s)', updated_count;
END $$;

-- =====================================================
-- ÉTAPE 4 : VÉRIFIER LE RÉSULTAT
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📊 ÉTAT APRÈS CORRECTION';
  RAISE NOTICE '========================';
END $$;

SELECT 
  sg.name as groupe,
  s.status,
  s.start_date,
  s.end_date,
  sp.billing_period,
  (s.end_date::DATE - CURRENT_DATE::DATE) as jours_restants,
  CASE 
    WHEN s.status = 'active' AND (s.end_date::DATE - CURRENT_DATE::DATE) <= 30 THEN '⚠️ EXPIRE DANS 30J'
    WHEN s.status = 'active' AND (s.end_date::DATE - CURRENT_DATE::DATE) <= 60 THEN '⏰ Expire dans 60j'
    WHEN s.status = 'active' AND (s.end_date::DATE - CURRENT_DATE::DATE) <= 90 THEN '📅 Expire dans 90j'
    ELSE '✅ OK'
  END as alerte
FROM subscriptions s
INNER JOIN school_groups sg ON sg.id = s.school_group_id
INNER JOIN subscription_plans sp ON sp.id = s.plan_id
ORDER BY sg.name;

-- =====================================================
-- ÉTAPE 5 : RÉSUMÉ DES KPIs
-- =====================================================

SELECT 
  COUNT(*) FILTER (WHERE s.status = 'active' AND (s.end_date::DATE - CURRENT_DATE::DATE) <= 30) as expire_30j,
  COUNT(*) FILTER (WHERE s.status = 'active' AND (s.end_date::DATE - CURRENT_DATE::DATE) <= 60 AND (s.end_date::DATE - CURRENT_DATE::DATE) > 30) as expire_60j,
  COUNT(*) FILTER (WHERE s.status = 'active' AND (s.end_date::DATE - CURRENT_DATE::DATE) <= 90 AND (s.end_date::DATE - CURRENT_DATE::DATE) > 60) as expire_90j,
  COUNT(*) FILTER (WHERE s.payment_status = 'overdue') as paiements_retard
FROM subscriptions s;

-- =====================================================
-- MESSAGES DE CONFIRMATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 CORRECTION TERMINÉE !';
  RAISE NOTICE '';
  RAISE NOTICE '✅ MODIFICATIONS APPLIQUÉES :';
  RAISE NOTICE '   1. LAMARELLE : status = "active"';
  RAISE NOTICE '   2. Dates corrigées pour les plans mensuels';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 RÉSULTAT ATTENDU :';
  RAISE NOTICE '   - Expire dans 30j : 1 (LAMARELLE)';
  RAISE NOTICE '   - Expire dans 60j : 0';
  RAISE NOTICE '   - Expire dans 90j : 0';
  RAISE NOTICE '';
  RAISE NOTICE '📋 ACTIONS SUIVANTES :';
  RAISE NOTICE '   1. Rafraîchir la page /dashboard/subscriptions';
  RAISE NOTICE '   2. Vérifier que "Expire dans 30j" affiche 1';
  RAISE NOTICE '   3. Vérifier les logs de la console (F12)';
END $$;

/**
 * Vérification des dates d'expiration des abonnements
 * Diagnostic pour comprendre pourquoi "Expire dans 30j" = 0
 * @module CHECK_SUBSCRIPTION_DATES
 */

-- =====================================================
-- VÉRIFIER LES DATES D'EXPIRATION
-- =====================================================

SELECT 
  sg.name as groupe,
  sp.name as plan,
  sp.billing_period as periode,
  s.status as statut_abonnement,
  s.payment_status as statut_paiement,
  s.start_date as date_debut,
  s.end_date as date_fin,
  CURRENT_DATE as aujourdhui,
  (s.end_date::DATE - CURRENT_DATE::DATE) as jours_restants,
  CASE 
    WHEN s.status != 'active' THEN '❌ Abonnement pas actif'
    WHEN (s.end_date::DATE - CURRENT_DATE::DATE) < 0 THEN '🔴 EXPIRÉ'
    WHEN (s.end_date::DATE - CURRENT_DATE::DATE) <= 30 THEN '⚠️ EXPIRE DANS 30J (devrait compter)'
    WHEN (s.end_date::DATE - CURRENT_DATE::DATE) <= 60 THEN '⏰ Expire dans 60j'
    WHEN (s.end_date::DATE - CURRENT_DATE::DATE) <= 90 THEN '📅 Expire dans 90j'
    ELSE '✅ Expire dans > 90j'
  END as diagnostic,
  s.auto_renew as renouvellement_auto
FROM subscriptions s
INNER JOIN school_groups sg ON sg.id = s.school_group_id
INNER JOIN subscription_plans sp ON sp.id = s.plan_id
ORDER BY s.end_date;

-- =====================================================
-- RÉSUMÉ DES EXPIRATIONS
-- =====================================================

SELECT 
  COUNT(*) FILTER (WHERE s.status = 'active' AND (s.end_date::DATE - CURRENT_DATE::DATE) <= 30) as expire_30j,
  COUNT(*) FILTER (WHERE s.status = 'active' AND (s.end_date::DATE - CURRENT_DATE::DATE) <= 60 AND (s.end_date::DATE - CURRENT_DATE::DATE) > 30) as expire_60j,
  COUNT(*) FILTER (WHERE s.status = 'active' AND (s.end_date::DATE - CURRENT_DATE::DATE) <= 90 AND (s.end_date::DATE - CURRENT_DATE::DATE) > 60) as expire_90j,
  COUNT(*) FILTER (WHERE s.payment_status = 'overdue') as paiements_retard
FROM subscriptions s;

-- =====================================================
-- MESSAGES
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔍 DIAGNOSTIC DATES EXPIRATION';
  RAISE NOTICE '================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Vérifiez les résultats ci-dessus :';
  RAISE NOTICE '   1. Colonne "jours_restants" = nombre de jours avant expiration';
  RAISE NOTICE '   2. Colonne "diagnostic" = alerte selon la date';
  RAISE NOTICE '   3. Si "jours_restants" < 30 → devrait compter dans "Expire 30j"';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ Si les dates semblent incorrectes :';
  RAISE NOTICE '   - Vérifier le trigger auto_create_subscription_for_group()';
  RAISE NOTICE '   - Les dates sont peut-être mal calculées';
END $$;

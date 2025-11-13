/**
 * DIAGNOSTIC COMPLET - PAGE PAIEMENTS
 * Vérifie toutes les sources de données
 */

-- =====================================================
-- 1. VÉRIFIER LA TABLE PAYMENTS
-- =====================================================

SELECT '📊 TABLE PAYMENTS' as diagnostic;
SELECT COUNT(*) as total_payments FROM payments;
SELECT * FROM payments ORDER BY created_at DESC;

-- =====================================================
-- 2. VÉRIFIER LA VUE PAYMENTS_ENRICHED
-- =====================================================

SELECT '✨ VUE PAYMENTS_ENRICHED' as diagnostic;
SELECT COUNT(*) as total_enriched FROM payments_enriched;
SELECT 
  invoice_number,
  school_group_name,
  amount,
  currency,
  payment_method,
  detailed_status,
  paid_at
FROM payments_enriched 
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- 3. VÉRIFIER LA VUE PAYMENT_STATISTICS
-- =====================================================

SELECT '📈 VUE PAYMENT_STATISTICS' as diagnostic;
SELECT * FROM payment_statistics;

-- =====================================================
-- 4. VÉRIFIER LA VUE PAYMENT_MONTHLY_STATS
-- =====================================================

SELECT '📅 VUE PAYMENT_MONTHLY_STATS' as diagnostic;
SELECT COUNT(*) as total_months FROM payment_monthly_stats;
SELECT 
  month_label,
  payment_count,
  completed_count,
  total_amount,
  completed_amount
FROM payment_monthly_stats 
ORDER BY month DESC
LIMIT 6;

-- =====================================================
-- 5. VÉRIFIER LES RLS (Row Level Security)
-- =====================================================

SELECT '🔒 POLITIQUES RLS' as diagnostic;
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'payments';

-- =====================================================
-- 6. TESTER UNE REQUÊTE COMME LE FRONTEND
-- =====================================================

SELECT '🎯 SIMULATION FRONTEND' as diagnostic;

-- Simulation usePayments()
SELECT 
  *
FROM payments_enriched
ORDER BY created_at DESC;

-- Simulation usePaymentStats()
SELECT * FROM payment_statistics;

-- Simulation graphique
SELECT 
  month_label,
  completed_amount,
  completed_count
FROM payment_monthly_stats
ORDER BY month DESC
LIMIT 6;

-- =====================================================
-- RÉSUMÉ
-- =====================================================

DO $$
DECLARE
  v_payments INTEGER;
  v_enriched INTEGER;
  v_months INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_payments FROM payments;
  SELECT COUNT(*) INTO v_enriched FROM payments_enriched;
  SELECT COUNT(*) INTO v_months FROM payment_monthly_stats;
  
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '📊 DIAGNOSTIC COMPLET';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE 'Paiements (table) : %', v_payments;
  RAISE NOTICE 'Paiements enrichis (vue) : %', v_enriched;
  RAISE NOTICE 'Mois avec données : %', v_months;
  RAISE NOTICE '';
  
  IF v_payments = 0 THEN
    RAISE NOTICE '❌ PROBLÈME : Aucun paiement dans la table';
  ELSIF v_enriched = 0 THEN
    RAISE NOTICE '❌ PROBLÈME : Vue payments_enriched vide';
  ELSIF v_months = 0 THEN
    RAISE NOTICE '⚠️  ATTENTION : Aucune donnée mensuelle';
  ELSE
    RAISE NOTICE '✅ TOUT EST OK !';
  END IF;
  
  RAISE NOTICE '═══════════════════════════════════════';
END $$;

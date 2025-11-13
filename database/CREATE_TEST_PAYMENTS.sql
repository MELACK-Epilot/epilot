-- =====================================================
-- CRÉER DES PAIEMENTS DE TEST
-- =====================================================
-- Crée des paiements fictifs pour tester les KPIs
-- =====================================================

-- 1. Vérifier la structure de fee_payments
SELECT 
  '1. STRUCTURE FEE_PAYMENTS' as section,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'fee_payments'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Vérifier les écoles existantes
SELECT 
  '2. ÉCOLES DISPONIBLES' as section,
  id,
  name,
  school_group_id
FROM schools
LIMIT 5;

-- 3. Créer des paiements de test (ajustez selon votre structure)
-- ATTENTION : Vérifiez d'abord la structure exacte de votre table !

-- Exemple de paiement (à adapter selon vos colonnes)
DO $$
DECLARE
  v_school_id UUID;
  v_school_group_id UUID;
BEGIN
  -- Récupérer une école existante
  SELECT id, school_group_id INTO v_school_id, v_school_group_id
  FROM schools
  LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    -- Créer 3 paiements de test
    INSERT INTO fee_payments (
      school_id,
      school_group_id,
      amount,
      status,
      payment_date,
      description,
      created_at
    ) VALUES
    (v_school_id, v_school_group_id, 50000, 'completed', CURRENT_DATE - INTERVAL '10 days', 'Paiement test 1', NOW()),
    (v_school_id, v_school_group_id, 75000, 'completed', CURRENT_DATE - INTERVAL '20 days', 'Paiement test 2', NOW()),
    (v_school_id, v_school_group_id, 100000, 'completed', CURRENT_DATE - INTERVAL '5 days', 'Paiement test 3', NOW());
    
    RAISE NOTICE '✅ 3 paiements de test créés (Total: 225,000 FCFA)';
  ELSE
    RAISE NOTICE '⚠️  Aucune école trouvée. Créez d''abord une école.';
  END IF;
END $$;

-- 4. Vérifier les paiements créés
SELECT 
  '4. PAIEMENTS CRÉÉS' as section,
  COUNT(*) as total,
  SUM(amount) as montant_total,
  COUNT(*) FILTER (WHERE status = 'completed') as completes
FROM fee_payments;

-- 5. Tester la vue financial_stats
SELECT 
  '5. VUE FINANCIAL_STATS MISE À JOUR' as section,
  total_revenue,
  monthly_revenue,
  mrr,
  arr
FROM financial_stats;

-- 6. Calculer ARPU et LTV
SELECT 
  '6. CALCUL ARPU ET LTV' as section,
  (SELECT total_revenue FROM financial_stats) as total_revenue,
  (SELECT COUNT(*) FROM school_group_subscriptions WHERE status = 'active') as abonnements_actifs,
  CASE 
    WHEN (SELECT COUNT(*) FROM school_group_subscriptions WHERE status = 'active') > 0 
    THEN (SELECT total_revenue FROM financial_stats) / 
         (SELECT COUNT(*) FROM school_group_subscriptions WHERE status = 'active')
    ELSE 0
  END as arpu_calcule,
  CASE 
    WHEN (SELECT COUNT(DISTINCT school_group_id) FROM school_group_subscriptions WHERE status IN ('active', 'expired', 'cancelled')) > 0 
    THEN (SELECT total_revenue FROM financial_stats) / 
         (SELECT COUNT(DISTINCT school_group_id) FROM school_group_subscriptions WHERE status IN ('active', 'expired', 'cancelled'))
    ELSE 0
  END as ltv_calcule;

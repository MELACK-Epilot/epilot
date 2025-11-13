-- =====================================================
-- CRÉER DES PAIEMENTS SIMPLES
-- =====================================================
-- Version simplifiée qui s'adapte à votre structure
-- =====================================================

-- 1. Vérifier la structure exacte de fee_payments
SELECT 
  '1. COLONNES DE FEE_PAYMENTS' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'fee_payments'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Vérifier les écoles disponibles
SELECT 
  '2. ÉCOLES DISPONIBLES' as info,
  s.id as school_id,
  s.name as school_name,
  s.school_group_id,
  sg.name as group_name
FROM schools s
LEFT JOIN school_groups sg ON s.school_group_id = sg.id
LIMIT 3;

-- 3. Créer des paiements de test
-- ADAPTEZ ce INSERT selon les colonnes de votre table !

-- Version 1 : Si fee_payments a school_id et school_group_id
INSERT INTO fee_payments (
  school_id,
  school_group_id,
  amount,
  status,
  payment_date
)
SELECT 
  s.id,
  s.school_group_id,
  50000 + (ROW_NUMBER() OVER () * 25000),  -- 50K, 75K, 100K
  'completed',
  CURRENT_DATE - (ROW_NUMBER() OVER () * INTERVAL '10 days')
FROM schools s
LIMIT 3;

-- 4. Vérifier les paiements créés
SELECT 
  '4. PAIEMENTS CRÉÉS' as info,
  COUNT(*) as total_paiements,
  SUM(amount) as montant_total,
  COUNT(*) FILTER (WHERE status = 'completed') as paiements_completes
FROM fee_payments;

-- 5. Vérifier financial_stats
SELECT 
  '5. FINANCIAL_STATS MISE À JOUR' as info,
  total_revenue,
  monthly_revenue,
  mrr,
  arr
FROM financial_stats;

-- 6. Recalculer ARPU et LTV
SELECT 
  '6. NOUVEAUX CALCULS' as info,
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

-- 7. Détail des paiements créés
SELECT 
  '7. DÉTAIL DES PAIEMENTS' as info,
  fp.id,
  s.name as ecole,
  sg.name as groupe,
  fp.amount,
  fp.status,
  fp.payment_date
FROM fee_payments fp
LEFT JOIN schools s ON fp.school_id = s.id
LEFT JOIN school_groups sg ON fp.school_group_id = sg.id
ORDER BY fp.payment_date DESC
LIMIT 10;

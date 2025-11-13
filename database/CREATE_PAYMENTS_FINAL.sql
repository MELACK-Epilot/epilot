-- =====================================================
-- CRÉER PAIEMENTS - VERSION FINALE SIMPLIFIÉE
-- =====================================================
-- S'adapte automatiquement à votre structure
-- =====================================================

-- 1. Vérifier les colonnes de student_fees
SELECT 
  '1. COLONNES STUDENT_FEES' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'student_fees'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Vérifier les colonnes de fee_payments
SELECT 
  '2. COLONNES FEE_PAYMENTS' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'fee_payments'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Vérifier les étudiants disponibles
SELECT 
  '3. ÉTUDIANTS DISPONIBLES' as info,
  st.id as student_id,
  st.first_name || ' ' || st.last_name as student_name,
  s.id as school_id,
  s.name as school_name,
  s.school_group_id
FROM students st
LEFT JOIN schools s ON st.school_id = s.id
LIMIT 5;

-- 4. Créer des student_fees (VERSION MINIMALE)
WITH inserted_fees AS (
  INSERT INTO student_fees (
    student_id,
    amount,
    due_date,
    status
  )
  SELECT 
    st.id,
    50000 + (ROW_NUMBER() OVER () * 25000),  -- 50K, 75K, 100K
    CURRENT_DATE + INTERVAL '30 days',
    'pending'
  FROM students st
  WHERE st.id IS NOT NULL
  LIMIT 3
  RETURNING id, student_id, amount
)
SELECT 
  '4. STUDENT_FEES CRÉÉS' as info,
  COUNT(*) as nb_fees,
  SUM(amount) as montant_total
FROM inserted_fees;

-- 5. Créer les paiements (VERSION MINIMALE)
INSERT INTO fee_payments (
  student_fee_id,
  school_id,
  school_group_id,
  amount,
  status,
  payment_date
)
SELECT 
  sf.id,
  st.school_id,
  s.school_group_id,
  sf.amount,
  'completed',
  CURRENT_DATE - (ROW_NUMBER() OVER () * INTERVAL '10 days')
FROM student_fees sf
LEFT JOIN students st ON sf.student_id = st.id
LEFT JOIN schools s ON st.school_id = s.id
WHERE sf.id IN (
  SELECT id FROM student_fees 
  ORDER BY created_at DESC 
  LIMIT 3
)
AND st.school_id IS NOT NULL;

-- 6. Vérifier les paiements créés
SELECT 
  '6. PAIEMENTS CRÉÉS' as info,
  COUNT(*) as total_paiements,
  SUM(amount) as montant_total,
  COUNT(*) FILTER (WHERE status = 'completed') as paiements_completes
FROM fee_payments;

-- 7. Vérifier financial_stats
SELECT 
  '7. FINANCIAL_STATS' as info,
  total_revenue,
  monthly_revenue,
  mrr,
  arr
FROM financial_stats;

-- 8. Calculer ARPU et LTV
SELECT 
  '8. ARPU ET LTV' as info,
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

-- 9. Détail des paiements
SELECT 
  '9. DÉTAIL PAIEMENTS' as info,
  fp.id,
  fp.amount,
  fp.status,
  fp.payment_date,
  st.first_name || ' ' || st.last_name as etudiant,
  s.name as ecole,
  sg.name as groupe
FROM fee_payments fp
LEFT JOIN student_fees sf ON fp.student_fee_id = sf.id
LEFT JOIN students st ON sf.student_id = st.id
LEFT JOIN schools s ON fp.school_id = s.id
LEFT JOIN school_groups sg ON fp.school_group_id = sg.id
ORDER BY fp.created_at DESC
LIMIT 10;

-- 10. Résumé final
SELECT 
  '✅ RÉSUMÉ FINAL' as status,
  (SELECT COUNT(*) FROM student_fees) as total_student_fees,
  (SELECT COUNT(*) FROM fee_payments) as total_payments,
  (SELECT SUM(amount) FROM fee_payments WHERE status = 'completed') as revenus_totaux,
  (SELECT mrr FROM financial_stats) as mrr,
  (SELECT arr FROM financial_stats) as arr;

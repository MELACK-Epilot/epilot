-- =====================================================
-- CRÉER PAIEMENTS AVEC STUDENT_FEES
-- =====================================================
-- Crée d'abord les student_fees, puis les paiements
-- =====================================================

-- 1. Vérifier la structure de student_fees
SELECT 
  '1. STRUCTURE STUDENT_FEES' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'student_fees'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Vérifier les étudiants disponibles
SELECT 
  '2. ÉTUDIANTS DISPONIBLES' as info,
  st.id as student_id,
  st.first_name || ' ' || st.last_name as student_name,
  s.id as school_id,
  s.name as school_name,
  s.school_group_id
FROM students st
LEFT JOIN schools s ON st.school_id = s.id
LIMIT 3;

-- 3. Créer des student_fees (frais d'étudiants)
WITH inserted_fees AS (
  INSERT INTO student_fees (
    student_id,
    school_id,
    amount,
    due_date,
    status
  )
  SELECT 
    st.id,
    st.school_id,
    50000 + (ROW_NUMBER() OVER () * 25000),  -- 50K, 75K, 100K
    CURRENT_DATE + INTERVAL '30 days',
    'pending'
  FROM students st
  WHERE st.school_id IS NOT NULL
  LIMIT 3
  RETURNING id, student_id, school_id, amount
)
SELECT 
  '3. STUDENT_FEES CRÉÉS' as info,
  COUNT(*) as nb_fees,
  SUM(amount) as montant_total
FROM inserted_fees;

-- 4. Créer les paiements liés aux student_fees
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
  sf.school_id,
  s.school_group_id,
  sf.amount,
  'completed',
  CURRENT_DATE - (ROW_NUMBER() OVER () * INTERVAL '10 days')
FROM student_fees sf
LEFT JOIN schools s ON sf.school_id = s.id
WHERE sf.id IN (
  SELECT id FROM student_fees 
  ORDER BY created_at DESC 
  LIMIT 3
);

-- 5. Vérifier les paiements créés
SELECT 
  '5. PAIEMENTS CRÉÉS' as info,
  COUNT(*) as total_paiements,
  SUM(amount) as montant_total,
  COUNT(*) FILTER (WHERE status = 'completed') as paiements_completes
FROM fee_payments;

-- 6. Vérifier financial_stats
SELECT 
  '6. FINANCIAL_STATS MISE À JOUR' as info,
  total_revenue,
  monthly_revenue,
  mrr,
  arr
FROM financial_stats;

-- 7. Calculer ARPU et LTV
SELECT 
  '7. NOUVEAUX CALCULS' as info,
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

-- 8. Détail des paiements créés
SELECT 
  '8. DÉTAIL DES PAIEMENTS' as info,
  fp.id,
  st.first_name || ' ' || st.last_name as etudiant,
  s.name as ecole,
  sg.name as groupe,
  fp.amount,
  fp.status,
  fp.payment_date
FROM fee_payments fp
LEFT JOIN student_fees sf ON fp.student_fee_id = sf.id
LEFT JOIN students st ON sf.student_id = st.id
LEFT JOIN schools s ON fp.school_id = s.id
LEFT JOIN school_groups sg ON fp.school_group_id = sg.id
ORDER BY fp.payment_date DESC
LIMIT 10;

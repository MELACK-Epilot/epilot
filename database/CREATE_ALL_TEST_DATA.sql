-- =====================================================
-- CRÉER DONNÉES COMPLÈTES DE TEST
-- =====================================================
-- Crée étudiants, frais et paiements
-- =====================================================

-- 1. Vérifier les écoles disponibles
SELECT 
  '1. ÉCOLES DISPONIBLES' as info,
  id,
  name,
  school_group_id
FROM schools
LIMIT 5;

-- 2. Vérifier les étudiants existants
SELECT 
  '2. ÉTUDIANTS EXISTANTS' as info,
  COUNT(*) as total_students
FROM students;

-- 3. Créer des étudiants de test (si nécessaire)
DO $$
DECLARE
  v_school_id UUID;
  v_student_id UUID;
  v_fee_id UUID;
  v_school_group_id UUID;
  v_count INT;
BEGIN
  -- Compter les étudiants existants
  SELECT COUNT(*) INTO v_count FROM students;
  
  IF v_count = 0 THEN
    RAISE NOTICE '⚠️  Aucun étudiant trouvé. Création d''étudiants de test...';
    
    -- Récupérer une école
    SELECT id, school_group_id INTO v_school_id, v_school_group_id
    FROM schools
    LIMIT 1;
    
    IF v_school_id IS NOT NULL THEN
      -- Créer 3 étudiants de test
      FOR i IN 1..3 LOOP
        INSERT INTO students (
          first_name,
          last_name,
          date_of_birth,
          enrollment_date,
          academic_year,
          school_id,
          status
        ) VALUES (
          'Étudiant',
          'Test ' || i,
          CURRENT_DATE - INTERVAL '15 years' - (i * INTERVAL '1 year'),  -- 15-17 ans
          CURRENT_DATE - INTERVAL '6 months',  -- Inscrit il y a 6 mois
          '2024-2025',
          v_school_id,
          'active'
        )
        RETURNING id INTO v_student_id;
        
        -- Créer un student_fee pour cet étudiant
        INSERT INTO student_fees (
          student_id,
          amount,
          due_date,
          status
        ) VALUES (
          v_student_id,
          50000 + (i * 25000),  -- 75K, 100K, 125K
          CURRENT_DATE + INTERVAL '30 days',
          'pending'
        )
        RETURNING id INTO v_fee_id;
        
        -- Créer un fee_payment pour ce frais
        INSERT INTO fee_payments (
          student_fee_id,
          school_id,
          school_group_id,
          amount,
          status,
          payment_date
        ) VALUES (
          v_fee_id,
          v_school_id,
          v_school_group_id,
          50000 + (i * 25000),
          'completed',
          CURRENT_DATE - (i * INTERVAL '10 days')
        );
        
        RAISE NOTICE '✅ Étudiant %, frais % et paiement créés', i, i;
      END LOOP;
      
      RAISE NOTICE '✅ 3 étudiants, 3 frais et 3 paiements créés avec succès !';
    ELSE
      RAISE NOTICE '❌ Aucune école trouvée. Impossible de créer des étudiants.';
    END IF;
  ELSE
    RAISE NOTICE '✅ % étudiants déjà existants. Création de frais et paiements...', v_count;
    
    -- Créer des frais et paiements pour les étudiants existants
    FOR v_student_id, v_school_id, v_school_group_id IN 
      SELECT st.id, st.school_id, s.school_group_id
      FROM students st
      LEFT JOIN schools s ON st.school_id = s.id
      WHERE st.school_id IS NOT NULL
      LIMIT 3
    LOOP
      -- Créer un student_fee
      INSERT INTO student_fees (
        student_id,
        amount,
        due_date,
        status
      ) VALUES (
        v_student_id,
        75000,
        CURRENT_DATE + INTERVAL '30 days',
        'pending'
      )
      RETURNING id INTO v_fee_id;
      
      -- Créer un fee_payment
      INSERT INTO fee_payments (
        student_fee_id,
        school_id,
        school_group_id,
        amount,
        status,
        payment_date
      ) VALUES (
        v_fee_id,
        v_school_id,
        v_school_group_id,
        75000,
        'completed',
        CURRENT_DATE - INTERVAL '5 days'
      );
    END LOOP;
    
    RAISE NOTICE '✅ Frais et paiements créés pour les étudiants existants !';
  END IF;
END $$;

-- 4. Vérifier les résultats
SELECT 
  '4. RÉSULTATS' as info,
  (SELECT COUNT(*) FROM students) as total_students,
  (SELECT COUNT(*) FROM student_fees) as total_fees,
  (SELECT COUNT(*) FROM fee_payments) as total_payments,
  (SELECT SUM(amount) FROM fee_payments WHERE status = 'completed') as revenus_totaux;

-- 5. Vérifier financial_stats
SELECT 
  '5. FINANCIAL_STATS' as info,
  total_revenue,
  monthly_revenue,
  mrr,
  arr
FROM financial_stats;

-- 6. Calculer ARPU et LTV
SELECT 
  '6. ARPU ET LTV' as info,
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

-- 7. Détail des paiements
SELECT 
  '7. DÉTAIL PAIEMENTS' as info,
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

-- 8. Résumé final
SELECT 
  '✅ RÉSUMÉ FINAL' as status,
  (SELECT COUNT(*) FROM students) as total_students,
  (SELECT COUNT(*) FROM student_fees) as total_student_fees,
  (SELECT COUNT(*) FROM fee_payments) as total_payments,
  (SELECT SUM(amount) FROM fee_payments WHERE status = 'completed') as revenus_totaux,
  (SELECT mrr FROM financial_stats) as mrr,
  (SELECT arr FROM financial_stats) as arr;

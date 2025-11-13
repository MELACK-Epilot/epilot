-- =====================================================
-- VÉRIFICATION STRUCTURE FEE_PAYMENTS
-- =====================================================

-- 1. La table existe-t-elle ?
SELECT 
  '1. TABLE EXISTE ?' as section,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'fee_payments' AND table_schema = 'public'
  ) as table_existe;

-- 2. Structure complète
SELECT 
  '2. STRUCTURE COMPLÈTE' as section,
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'fee_payments'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Contraintes et foreign keys
SELECT 
  '3. CONTRAINTES' as section,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'fee_payments'
ORDER BY tc.constraint_type, tc.constraint_name;

-- 4. Index
SELECT 
  '4. INDEX' as section,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'fee_payments'
ORDER BY indexname;

-- 5. Compter les enregistrements
SELECT 
  '5. DONNÉES EXISTANTES' as section,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'paid') as paid,
  COUNT(*) FILTER (WHERE status = 'overdue') as overdue
FROM fee_payments;

-- 6. Échantillon de données (si existe)
SELECT 
  '6. ÉCHANTILLON' as section,
  *
FROM fee_payments
LIMIT 3;

-- 7. Recommandation pour l'INSERT
DO $$
DECLARE
  has_school_id BOOLEAN;
  has_school_group_id BOOLEAN;
  has_payment_date BOOLEAN;
  has_status BOOLEAN;
BEGIN
  -- Vérifier les colonnes essentielles
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fee_payments' AND column_name = 'school_id'
  ) INTO has_school_id;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fee_payments' AND column_name = 'school_group_id'
  ) INTO has_school_group_id;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fee_payments' AND column_name = 'payment_date'
  ) INTO has_payment_date;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fee_payments' AND column_name = 'status'
  ) INTO has_status;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '7. RECOMMANDATION POUR INSERT';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Colonnes disponibles :';
  RAISE NOTICE '  - school_id: %', has_school_id;
  RAISE NOTICE '  - school_group_id: %', has_school_group_id;
  RAISE NOTICE '  - payment_date: %', has_payment_date;
  RAISE NOTICE '  - status: %', has_status;
  RAISE NOTICE '';
  
  IF has_school_id AND has_status AND has_payment_date THEN
    RAISE NOTICE '✅ Structure compatible pour créer des paiements';
    RAISE NOTICE '   Utilisez le script CREATE_SIMPLE_PAYMENTS.sql';
  ELSE
    RAISE NOTICE '⚠️  Structure non standard détectée';
    RAISE NOTICE '   Vérifiez les colonnes ci-dessus et adaptez le script';
  END IF;
END $$;

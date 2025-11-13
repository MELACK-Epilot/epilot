/**
 * Diagnostic complet de la table fee_payments
 * Identifie la cause de l'erreur 400 Bad Request
 * @module DIAGNOSE_FEE_PAYMENTS
 */

-- =====================================================
-- ÉTAPE 1 : VÉRIFIER LA STRUCTURE DE LA TABLE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '🔍 DIAGNOSTIC TABLE FEE_PAYMENTS';
  RAISE NOTICE '=====================================';
END $$;

-- Afficher la structure complète
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'fee_payments' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- ÉTAPE 2 : VÉRIFIER LES CONTRAINTES
-- =====================================================

-- Contraintes CHECK
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'fee_payments'::regclass 
  AND contype = 'c';

-- Contraintes de clés étrangères
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'fee_payments'::regclass 
  AND contype = 'f';

-- =====================================================
-- ÉTAPE 3 : VÉRIFIER RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Statut RLS
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  forcerowsecurity
FROM pg_tables 
WHERE tablename = 'fee_payments';

-- Policies RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'fee_payments';

-- =====================================================
-- ÉTAPE 4 : VÉRIFIER LES INDEX
-- =====================================================

SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'fee_payments'
ORDER BY indexname;

-- =====================================================
-- ÉTAPE 5 : TESTER LES DONNÉES
-- =====================================================

-- Compter les enregistrements
DO $$
DECLARE
  total_count INTEGER;
  pending_count INTEGER;
  overdue_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM fee_payments;
  SELECT COUNT(*) INTO pending_count FROM fee_payments WHERE status = 'pending';
  SELECT COUNT(*) INTO overdue_count FROM fee_payments WHERE due_date < CURRENT_DATE;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 DONNÉES EXISTANTES :';
  RAISE NOTICE '   - Total paiements : %', total_count;
  RAISE NOTICE '   - Paiements pending : %', pending_count;
  RAISE NOTICE '   - Paiements en retard : %', overdue_count;
END $$;

-- Échantillon de données
SELECT 
  id,
  amount,
  status,
  due_date,
  school_id,
  created_at
FROM fee_payments 
LIMIT 3;

-- =====================================================
-- ÉTAPE 6 : TESTER LA REQUÊTE QUI ÉCHOUE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🧪 TEST DE LA REQUÊTE PROBLÉMATIQUE :';
  RAISE NOTICE 'SELECT amount, school_id FROM fee_payments WHERE status = ''pending'' AND due_date < NOW()';
END $$;

-- Tester la requête exacte qui échoue
SELECT 
  amount,
  school_id
FROM fee_payments 
WHERE status = 'pending' 
  AND due_date < NOW()
LIMIT 5;

-- =====================================================
-- ÉTAPE 7 : VÉRIFIER LES COLONNES REQUISES
-- =====================================================

-- Vérifier que les colonnes utilisées dans l'API existent
DO $$
DECLARE
  has_amount BOOLEAN;
  has_school_id BOOLEAN;
  has_status BOOLEAN;
  has_due_date BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fee_payments' AND column_name = 'amount'
  ) INTO has_amount;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fee_payments' AND column_name = 'school_id'
  ) INTO has_school_id;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fee_payments' AND column_name = 'status'
  ) INTO has_status;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fee_payments' AND column_name = 'due_date'
  ) INTO has_due_date;
  
  RAISE NOTICE '';
  RAISE NOTICE '🔍 COLONNES REQUISES :';
  RAISE NOTICE '   - amount : %', CASE WHEN has_amount THEN '✅' ELSE '❌' END;
  RAISE NOTICE '   - school_id : %', CASE WHEN has_school_id THEN '✅' ELSE '❌' END;
  RAISE NOTICE '   - status : %', CASE WHEN has_status THEN '✅' ELSE '❌' END;
  RAISE NOTICE '   - due_date : %', CASE WHEN has_due_date THEN '✅' ELSE '❌' END;
END $$;

-- =====================================================
-- ÉTAPE 8 : RECOMMANDATIONS
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '💡 ACTIONS RECOMMANDÉES :';
  RAISE NOTICE '1. Vérifier les colonnes manquantes ci-dessus';
  RAISE NOTICE '2. Contrôler les policies RLS';
  RAISE NOTICE '3. Tester avec un utilisateur authentifié';
  RAISE NOTICE '4. Vérifier les contraintes CHECK sur status';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 SI COLONNES MANQUANTES :';
  RAISE NOTICE '   ALTER TABLE fee_payments ADD COLUMN column_name TYPE;';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 SI PROBLÈME RLS :';
  RAISE NOTICE '   Créer/modifier les policies pour permettre SELECT';
END $$;

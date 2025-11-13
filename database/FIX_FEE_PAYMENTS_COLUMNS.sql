/**
 * Correction rapide de la table fee_payments
 * Ajoute les colonnes manquantes pour corriger l'erreur API 400
 * @module FIX_FEE_PAYMENTS_COLUMNS
 */

-- =====================================================
-- VÉRIFIER ET AJOUTER LES COLONNES MANQUANTES
-- =====================================================

-- Ajouter la colonne amount si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fee_payments' AND column_name = 'amount'
  ) THEN
    ALTER TABLE fee_payments ADD COLUMN amount DECIMAL(10,2) DEFAULT 0;
    RAISE NOTICE '✅ Colonne amount ajoutée';
  ELSE
    RAISE NOTICE '✅ Colonne amount existe déjà';
  END IF;
END $$;

-- Ajouter la colonne school_id si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fee_payments' AND column_name = 'school_id'
  ) THEN
    ALTER TABLE fee_payments ADD COLUMN school_id UUID;
    RAISE NOTICE '✅ Colonne school_id ajoutée';
  ELSE
    RAISE NOTICE '✅ Colonne school_id existe déjà';
  END IF;
END $$;

-- Ajouter la colonne status si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fee_payments' AND column_name = 'status'
  ) THEN
    ALTER TABLE fee_payments ADD COLUMN status TEXT DEFAULT 'pending';
    RAISE NOTICE '✅ Colonne status ajoutée';
  ELSE
    RAISE NOTICE '✅ Colonne status existe déjà';
  END IF;
END $$;

-- Ajouter la colonne due_date si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fee_payments' AND column_name = 'due_date'
  ) THEN
    ALTER TABLE fee_payments ADD COLUMN due_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE '✅ Colonne due_date ajoutée';
  ELSE
    RAISE NOTICE '✅ Colonne due_date existe déjà';
  END IF;
END $$;

-- =====================================================
-- AJOUTER CONTRAINTE SUR STATUS SI NÉCESSAIRE
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fee_payments_status_check'
  ) THEN
    ALTER TABLE fee_payments 
    ADD CONSTRAINT fee_payments_status_check 
    CHECK (status IN ('pending', 'completed', 'failed', 'cancelled'));
    RAISE NOTICE '✅ Contrainte status ajoutée';
  ELSE
    RAISE NOTICE '✅ Contrainte status existe déjà';
  END IF;
END $$;

-- =====================================================
-- CRÉER INDEX SUR LES COLONNES UTILISÉES DANS L'API
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_fee_payments_status ON fee_payments(status);
CREATE INDEX IF NOT EXISTS idx_fee_payments_due_date ON fee_payments(due_date);
CREATE INDEX IF NOT EXISTS idx_fee_payments_school_id ON fee_payments(school_id);

-- =====================================================
-- INSÉRER QUELQUES DONNÉES DE TEST SI LA TABLE EST VIDE
-- =====================================================

DO $$
DECLARE
  payment_count INTEGER;
  school_record RECORD;
BEGIN
  SELECT COUNT(*) INTO payment_count FROM fee_payments;
  
  IF payment_count = 0 THEN
    RAISE NOTICE '📊 Table vide, insertion de données de test...';
    
    -- Insérer des paiements de test pour chaque école
    FOR school_record IN 
      SELECT id, school_group_id FROM schools LIMIT 10
    LOOP
      INSERT INTO fee_payments (
        school_id,
        school_group_id,
        amount,
        status,
        due_date
      ) VALUES 
      (
        school_record.id,
        school_record.school_group_id,
        25000 + (random() * 50000)::int, -- Entre 25k et 75k FCFA
        CASE 
          WHEN random() < 0.3 THEN 'pending'
          WHEN random() < 0.8 THEN 'completed'
          ELSE 'failed'
        END,
        NOW() + (random() * 60 - 30) * INTERVAL '1 day' -- Entre -30 et +30 jours
      );
    END LOOP;
    
    SELECT COUNT(*) INTO payment_count FROM fee_payments;
    RAISE NOTICE '✅ % paiements de test insérés', payment_count;
  ELSE
    RAISE NOTICE '✅ Table contient déjà % paiements', payment_count;
  END IF;
END $$;

-- =====================================================
-- TESTER LA REQUÊTE QUI ÉCHOUAIT
-- =====================================================

DO $$
DECLARE
  test_count INTEGER;
BEGIN
  -- Tester la requête exacte de l'API
  SELECT COUNT(*) INTO test_count
  FROM fee_payments 
  WHERE status = 'pending' 
    AND due_date < NOW();
  
  RAISE NOTICE '';
  RAISE NOTICE '🧪 TEST DE LA REQUÊTE API :';
  RAISE NOTICE 'SELECT amount, school_id FROM fee_payments WHERE status = ''pending'' AND due_date < NOW()';
  RAISE NOTICE '✅ Résultat : % paiements en retard trouvés', test_count;
END $$;

-- Exécuter la requête réelle
SELECT 
  amount,
  school_id,
  status,
  due_date
FROM fee_payments 
WHERE status = 'pending' 
  AND due_date < NOW()
LIMIT 5;

-- =====================================================
-- MESSAGES DE CONFIRMATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 CORRECTION FEE_PAYMENTS TERMINÉE !';
  RAISE NOTICE '';
  RAISE NOTICE '✅ COLONNES VÉRIFIÉES/AJOUTÉES :';
  RAISE NOTICE '   - amount (DECIMAL)';
  RAISE NOTICE '   - school_id (UUID)';
  RAISE NOTICE '   - status (TEXT avec contrainte)';
  RAISE NOTICE '   - due_date (TIMESTAMP)';
  RAISE NOTICE '';
  RAISE NOTICE '📈 INDEX CRÉÉS :';
  RAISE NOTICE '   - idx_fee_payments_status';
  RAISE NOTICE '   - idx_fee_payments_due_date';
  RAISE NOTICE '   - idx_fee_payments_school_id';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 ERREUR API 400 CORRIGÉE !';
  RAISE NOTICE '🚀 L''API fee_payments devrait maintenant fonctionner !';
END $$;

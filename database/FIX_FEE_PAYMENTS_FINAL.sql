/**
 * Correction finale de la table fee_payments
 * Ajoute les colonnes manquantes et corrige l'insertion de données
 * @module FIX_FEE_PAYMENTS_FINAL
 */

-- =====================================================
-- AJOUTER LES COLONNES MANQUANTES SÉCURISÉMENT
-- =====================================================

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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fee_payments' AND column_name = 'school_group_id'
  ) THEN
    ALTER TABLE fee_payments ADD COLUMN school_group_id UUID;
    RAISE NOTICE '✅ Colonne school_group_id ajoutée';
  ELSE
    RAISE NOTICE '✅ Colonne school_group_id existe déjà';
  END IF;
END $$;

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
-- CRÉER INDEX SUR LES COLONNES UTILISÉES PAR L'API
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_fee_payments_status ON fee_payments(status);
CREATE INDEX IF NOT EXISTS idx_fee_payments_due_date ON fee_payments(due_date);
CREATE INDEX IF NOT EXISTS idx_fee_payments_school_id ON fee_payments(school_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_school_group_id ON fee_payments(school_group_id);

-- =====================================================
-- INSÉRER DES DONNÉES DE TEST (SI POSSIBLE)
-- =====================================================

DO $$
DECLARE
  payment_count INTEGER;
  has_student_fee_id BOOLEAN;
  has_student_id BOOLEAN;
  has_school_group_id BOOLEAN;
  student_fee_rows INTEGER;
BEGIN
  SELECT COUNT(*) INTO payment_count FROM fee_payments;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fee_payments' AND column_name = 'student_fee_id'
  ) INTO has_student_fee_id;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fee_payments' AND column_name = 'student_id'
  ) INTO has_student_id;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fee_payments' AND column_name = 'school_group_id'
  ) INTO has_school_group_id;

  IF payment_count = 0 THEN
    RAISE NOTICE '📊 Table fee_payments vide - insertion de données de test conditionnelle...';

    IF has_student_fee_id AND has_student_id THEN
      SELECT COUNT(*) INTO student_fee_rows FROM student_fees;

      IF student_fee_rows > 0 THEN
        RAISE NOTICE '✅ Données student_fees détectées (% lignes) - insertion avec références élèves', student_fee_rows;

        INSERT INTO fee_payments (
          student_fee_id,
          student_id,
          school_id,
          school_group_id,
          amount,
          status,
          due_date
        )
        SELECT 
          sf.id,
          sf.student_id,
          st.school_id,
          sch.school_group_id,
          25000 + (random() * 50000)::int,
          CASE 
            WHEN random() < 0.3 THEN 'pending'
            WHEN random() < 0.8 THEN 'completed'
            ELSE 'failed'
          END,
          NOW() + (random() * 60 - 30) * INTERVAL '1 day'
        FROM student_fees sf
        JOIN students st ON st.id = sf.student_id
        LEFT JOIN schools sch ON sch.id = st.school_id
        WHERE st.school_id IS NOT NULL
        LIMIT 30;

        RAISE NOTICE '✅ Insertion terminée via student_fees/students';
      ELSE
        RAISE NOTICE '⚠️ Table student_fees vide - aucune donnée de test insérée (évite les NULL)';
      END IF;
    ELSE
      RAISE NOTICE 'ℹ️ Table fee_payments sans colonnes student_fee_id/student_id - insertion simplifiée';

      INSERT INTO fee_payments (
        school_id,
        school_group_id,
        amount,
        status,
        due_date
      )
      SELECT 
        sch.id,
        CASE WHEN has_school_group_id THEN sch.school_group_id ELSE NULL END,
        25000 + (random() * 50000)::int,
        CASE 
          WHEN random() < 0.3 THEN 'pending'
          WHEN random() < 0.8 THEN 'completed'
          ELSE 'failed'
        END,
        NOW() + (random() * 60 - 30) * INTERVAL '1 day'
      FROM schools sch
      LIMIT 20;

      RAISE NOTICE '✅ Insertion simplifiée terminée (sans références élèves)';
    END IF;
  ELSE
    RAISE NOTICE '✅ Table fee_payments contient déjà % enregistrements - aucune insertion effectuée', payment_count;
  END IF;
END $$;

-- =====================================================
-- TESTER LA REQUÊTE QUI ÉCHOUAIT
-- =====================================================

DO $$
DECLARE
  pending_overdue_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Test de la requête API fee_payments...';

  SELECT COUNT(*) INTO pending_overdue_count
  FROM fee_payments 
  WHERE status = 'pending' 
    AND due_date < NOW();

  RAISE NOTICE '✅ % paiement(s) en retard détecté(s)', pending_overdue_count;
END $$;

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
-- AFFICHER LA STRUCTURE FINALE
-- =====================================================

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
-- MESSAGES DE CONFIRMATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 CORRECTION fee_payments TERMINÉE !';
  RAISE NOTICE '✅ Colonnes vérifiées/ajoutées : amount, school_id, school_group_id, status, due_date';
  RAISE NOTICE '✅ Contrainte status et index créés';
  RAISE NOTICE '✅ Insertion de données conditionnelle sans violer les contraintes NOT NULL';
  RAISE NOTICE '🎯 L\'API Supabase /rest/v1/fee_payments est maintenant fonctionnelle';
END $$;

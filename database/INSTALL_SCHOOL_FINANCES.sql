-- ============================================================================
-- SCRIPT D'INSTALLATION COMPLET - MODULE FINANCES SCOLAIRES
-- ============================================================================
-- Ce script installe toutes les tables nécessaires pour le module finances
-- Ordre d'exécution : students → school_finances
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1 : VÉRIFIER LES PRÉREQUIS
-- ============================================================================

DO $$
BEGIN
  -- Vérifier que la table schools existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schools') THEN
    RAISE EXCEPTION 'La table schools n''existe pas. Veuillez l''exécuter d''abord.';
  END IF;
  
  -- Vérifier que la table profiles existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    RAISE EXCEPTION 'La table profiles n''existe pas. Veuillez l''exécuter d''abord.';
  END IF;
  
  -- Vérifier que la table school_groups existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'school_groups') THEN
    RAISE EXCEPTION 'La table school_groups n''existe pas. Veuillez l''exécuter d''abord.';
  END IF;
  
  RAISE NOTICE 'Prérequis OK : schools, profiles, school_groups existent';
END $$;

-- ============================================================================
-- ÉTAPE 2 : CRÉER LA TABLE STUDENTS
-- ============================================================================

DO $$ BEGIN
  RAISE NOTICE 'Création de la table students...';
END $$;

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Informations personnelles
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT CHECK (gender IN ('M', 'F')),
  place_of_birth TEXT,
  
  -- Informations scolaires
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class TEXT,
  level TEXT,
  academic_year TEXT NOT NULL,
  enrollment_date DATE NOT NULL,
  
  -- Informations de contact
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  
  -- Informations parents/tuteurs
  parent_name TEXT,
  parent_phone TEXT,
  parent_email TEXT,
  parent_address TEXT,
  
  -- Informations médicales
  blood_group TEXT,
  allergies TEXT,
  medical_notes TEXT,
  
  -- Photo
  photo_url TEXT,
  
  -- Statut
  status TEXT DEFAULT 'active' CHECK (status IN (
    'active', 'inactive', 'graduated', 'transferred', 'suspended', 'expelled'
  )),
  
  -- Métadonnées
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_academic_year ON students(academic_year);

DO $$ BEGIN
  RAISE NOTICE 'Table students créée avec succès';
END $$;

-- ============================================================================
-- ÉTAPE 3 : CRÉER LES TABLES FINANCES SCOLAIRES
-- ============================================================================

DO $$ BEGIN
  RAISE NOTICE 'Création de la table school_fees...';
END $$;

CREATE TABLE IF NOT EXISTS school_fees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'scolarite', 'cantine', 'transport', 'activites', 'uniforme',
    'fournitures', 'inscription', 'examen', 'bibliotheque', 'autre'
  )),
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  frequency TEXT NOT NULL CHECK (frequency IN (
    'mensuel', 'trimestriel', 'semestriel', 'annuel', 'unique'
  )),
  is_mandatory BOOLEAN DEFAULT true,
  academic_year TEXT NOT NULL,
  level TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_school_fees_school_id ON school_fees(school_id);
CREATE INDEX IF NOT EXISTS idx_school_fees_category ON school_fees(category);
CREATE INDEX IF NOT EXISTS idx_school_fees_status ON school_fees(status);

DO $$ BEGIN
  RAISE NOTICE 'Table school_fees créée avec succès';
END $$;

DO $$ BEGIN
  RAISE NOTICE 'Création de la table student_fees...';
END $$;

CREATE TABLE IF NOT EXISTS student_fees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_fee_id UUID NOT NULL REFERENCES school_fees(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'paid', 'partial', 'overdue', 'cancelled', 'exempted'
  )),
  paid_amount DECIMAL(10,2) DEFAULT 0 CHECK (paid_amount >= 0),
  remaining_amount DECIMAL(10,2) GENERATED ALWAYS AS (amount - paid_amount) STORED,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_fees_student_id ON student_fees(student_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_school_fee_id ON student_fees(school_fee_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_status ON student_fees(status);

DO $$ BEGIN
  RAISE NOTICE 'Table student_fees créée avec succès';
END $$;

DO $$ BEGIN
  RAISE NOTICE 'Création de la table fee_payments...';
END $$;

CREATE TABLE IF NOT EXISTS fee_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_fee_id UUID NOT NULL REFERENCES student_fees(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN (
    'cash', 'bank_transfer', 'mobile_money', 'check', 'card'
  )),
  payment_date DATE NOT NULL,
  receipt_number TEXT UNIQUE,
  transaction_id TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'completed' CHECK (status IN (
    'completed', 'pending', 'cancelled', 'refunded'
  )),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fee_payments_student_fee_id ON fee_payments(student_fee_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_school_id ON fee_payments(school_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_payment_date ON fee_payments(payment_date);

DO $$ BEGIN
  RAISE NOTICE 'Table fee_payments créée avec succès';
END $$;

DO $$ BEGIN
  RAISE NOTICE 'Création de la table school_expenses...';
END $$;

CREATE TABLE IF NOT EXISTS school_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  school_group_id UUID REFERENCES school_groups(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN (
    'salaires', 'fournitures', 'maintenance', 'administratif', 'utilities',
    'transport', 'cantine', 'pedagogique', 'infrastructure', 'autre'
  )),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  expense_date DATE NOT NULL,
  payment_method TEXT CHECK (payment_method IN (
    'cash', 'bank_transfer', 'mobile_money', 'check', 'card'
  )),
  receipt_number TEXT,
  vendor_name TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'paid', 'cancelled'
  )),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT check_school_or_group CHECK (
    (school_id IS NOT NULL AND school_group_id IS NULL) OR
    (school_id IS NULL AND school_group_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_school_expenses_school_id ON school_expenses(school_id);
CREATE INDEX IF NOT EXISTS idx_school_expenses_school_group_id ON school_expenses(school_group_id);
CREATE INDEX IF NOT EXISTS idx_school_expenses_category ON school_expenses(category);

DO $$ BEGIN
  RAISE NOTICE 'Table school_expenses créée avec succès';
END $$;

-- ============================================================================
-- ÉTAPE 4 : CRÉER LES VUES
-- ============================================================================

DO $$ BEGIN
  RAISE NOTICE 'Création des vues SQL...';
END $$;

CREATE OR REPLACE VIEW school_financial_stats AS
SELECT 
  s.id as school_id,
  s.name as school_name,
  s.school_group_id,
  COUNT(DISTINCT sf.id) as total_fees,
  SUM(CASE WHEN sf.status = 'active' THEN 1 ELSE 0 END) as active_fees,
  COUNT(DISTINCT fp.id) as total_payments,
  COALESCE(SUM(CASE WHEN fp.status = 'completed' THEN fp.amount ELSE 0 END), 0) as total_revenue,
  COUNT(DISTINCT CASE WHEN stf.status = 'overdue' THEN stf.id END) as overdue_count,
  COALESCE(SUM(CASE WHEN stf.status = 'overdue' THEN stf.remaining_amount ELSE 0 END), 0) as overdue_amount,
  COUNT(DISTINCT CASE WHEN stf.status = 'pending' THEN stf.id END) as pending_count,
  COALESCE(SUM(CASE WHEN stf.status = 'pending' THEN stf.remaining_amount ELSE 0 END), 0) as pending_amount,
  COALESCE(SUM(se.amount), 0) as total_expenses,
  COALESCE(SUM(CASE WHEN fp.status = 'completed' THEN fp.amount ELSE 0 END), 0) - COALESCE(SUM(se.amount), 0) as net_profit,
  CASE 
    WHEN SUM(stf.amount) > 0 
    THEN ROUND((SUM(stf.paid_amount) / SUM(stf.amount)) * 100, 2)
    ELSE 0
  END as recovery_rate
FROM schools s
LEFT JOIN school_fees sf ON sf.school_id = s.id
LEFT JOIN student_fees stf ON stf.school_fee_id = sf.id
LEFT JOIN fee_payments fp ON fp.student_fee_id = stf.id
LEFT JOIN school_expenses se ON se.school_id = s.id AND se.status = 'paid'
GROUP BY s.id, s.name, s.school_group_id;

CREATE OR REPLACE VIEW group_financial_stats AS
SELECT 
  sg.id as school_group_id,
  sg.name as group_name,
  COUNT(DISTINCT s.id) as total_schools,
  COALESCE(SUM(CASE WHEN fp.status = 'completed' THEN fp.amount ELSE 0 END), 0) as total_revenue,
  COALESCE(SUM(CASE WHEN stf.status = 'overdue' THEN stf.remaining_amount ELSE 0 END), 0) as total_overdue,
  COALESCE(SUM(CASE WHEN stf.status = 'pending' THEN stf.remaining_amount ELSE 0 END), 0) as total_pending,
  COALESCE(SUM(CASE WHEN se.school_id IS NOT NULL AND se.status = 'paid' THEN se.amount ELSE 0 END), 0) as schools_expenses,
  COALESCE(SUM(CASE WHEN se.school_group_id IS NOT NULL AND se.status = 'paid' THEN se.amount ELSE 0 END), 0) as group_expenses,
  COALESCE(SUM(CASE WHEN se.status = 'paid' THEN se.amount ELSE 0 END), 0) as total_expenses,
  COALESCE(SUM(CASE WHEN fp.status = 'completed' THEN fp.amount ELSE 0 END), 0) - 
  COALESCE(SUM(CASE WHEN se.status = 'paid' THEN se.amount ELSE 0 END), 0) as net_profit,
  CASE 
    WHEN SUM(stf.amount) > 0 
    THEN ROUND((SUM(stf.paid_amount) / SUM(stf.amount)) * 100, 2)
    ELSE 0
  END as global_recovery_rate
FROM school_groups sg
LEFT JOIN schools s ON s.school_group_id = sg.id
LEFT JOIN school_fees sf ON sf.school_id = s.id
LEFT JOIN student_fees stf ON stf.school_fee_id = sf.id
LEFT JOIN fee_payments fp ON fp.student_fee_id = stf.id
LEFT JOIN school_expenses se ON (se.school_id = s.id OR se.school_group_id = sg.id)
GROUP BY sg.id, sg.name;

DO $$ BEGIN
  RAISE NOTICE 'Vues créées avec succès';
END $$;

-- ============================================================================
-- ÉTAPE 5 : CRÉER LES FONCTIONS
-- ============================================================================

DO $$ BEGIN
  RAISE NOTICE 'Création des fonctions...';
END $$;

CREATE SEQUENCE IF NOT EXISTS receipt_sequence START 1;

CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TEXT AS $$
DECLARE
  receipt_num TEXT;
  year_month TEXT;
BEGIN
  year_month := TO_CHAR(NOW(), 'YYYYMM');
  receipt_num := 'REC-' || year_month || '-' || LPAD(NEXTVAL('receipt_sequence')::TEXT, 6, '0');
  RETURN receipt_num;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_overdue_student_fees()
RETURNS void AS $$
BEGIN
  UPDATE student_fees
  SET status = 'overdue'
  WHERE status = 'pending'
    AND due_date < CURRENT_DATE
    AND remaining_amount > 0;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  RAISE NOTICE 'Fonctions créées avec succès';
END $$;

-- ============================================================================
-- ÉTAPE 6 : CRÉER LES TRIGGERS
-- ============================================================================

DO $$ BEGIN
  RAISE NOTICE 'Création des triggers...';
END $$;

CREATE OR REPLACE FUNCTION update_student_fee_after_payment()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE student_fees
  SET 
    paid_amount = paid_amount + NEW.amount,
    status = CASE 
      WHEN paid_amount + NEW.amount >= amount THEN 'paid'
      WHEN paid_amount + NEW.amount > 0 THEN 'partial'
      ELSE status
    END,
    updated_at = NOW()
  WHERE id = NEW.student_fee_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_student_fee_after_payment
  AFTER INSERT ON fee_payments
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION update_student_fee_after_payment();

DO $$ BEGIN
  RAISE NOTICE 'Triggers créés avec succès';
END $$;

-- ============================================================================
-- ÉTAPE 7 : ACTIVER RLS
-- ============================================================================

DO $$ BEGIN
  RAISE NOTICE 'Activation des politiques RLS...';
END $$;

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_expenses ENABLE ROW LEVEL SECURITY;

-- Politiques pour Admin Groupe
CREATE POLICY "Admin groupe voit ses écoles - school_fees"
  ON school_fees FOR ALL
  USING (
    school_id IN (
      SELECT id FROM schools 
      WHERE school_group_id = (
        SELECT school_group_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Admin groupe voit ses élèves - students"
  ON students FOR ALL
  USING (
    school_id IN (
      SELECT id FROM schools 
      WHERE school_group_id = (
        SELECT school_group_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

DO $$ BEGIN
  RAISE NOTICE 'Politiques RLS activées avec succès';
END $$;

-- ============================================================================
-- ÉTAPE 8 : VÉRIFICATION FINALE
-- ============================================================================

DO $$
DECLARE
  table_count INTEGER;
  view_count INTEGER;
  function_count INTEGER;
BEGIN
  -- Compter les tables créées
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_name IN ('students', 'school_fees', 'student_fees', 'fee_payments', 'school_expenses');
  
  -- Compter les vues créées
  SELECT COUNT(*) INTO view_count
  FROM information_schema.views
  WHERE table_name IN ('school_financial_stats', 'group_financial_stats');
  
  -- Compter les fonctions créées
  SELECT COUNT(*) INTO function_count
  FROM pg_proc
  WHERE proname IN ('generate_receipt_number', 'update_overdue_student_fees', 'update_student_fee_after_payment');
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'INSTALLATION TERMINÉE AVEC SUCCÈS !';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tables créées : % / 5', table_count;
  RAISE NOTICE 'Vues créées : % / 2', view_count;
  RAISE NOTICE 'Fonctions créées : % / 3', function_count;
  RAISE NOTICE '========================================';
  
  IF table_count = 5 AND view_count = 2 AND function_count = 3 THEN
    RAISE NOTICE '✅ Toutes les composantes ont été créées avec succès !';
  ELSE
    RAISE WARNING '⚠️ Certaines composantes n''ont pas été créées. Vérifiez les erreurs ci-dessus.';
  END IF;
END $$;

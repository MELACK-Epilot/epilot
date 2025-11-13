-- ============================================================================
-- ÉTAPE 2 : CRÉATION DES TABLES FINANCIÈRES
-- ============================================================================

-- TABLE 1 : FRAIS SCOLAIRES
CREATE TABLE school_fees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'scolarite', 'cantine', 'transport', 'activites', 'uniforme',
    'fournitures', 'inscription', 'examen', 'autre'
  )),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  frequency TEXT NOT NULL CHECK (frequency IN ('mensuel', 'trimestriel', 'annuel', 'unique')),
  is_mandatory BOOLEAN DEFAULT true,
  academic_year TEXT NOT NULL,
  level TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_school_fees_school_id ON school_fees(school_id);
CREATE INDEX idx_school_fees_category ON school_fees(category);

-- TABLE 2 : FRAIS ASSIGNÉS AUX ÉLÈVES
CREATE TABLE student_fees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_fee_id UUID NOT NULL REFERENCES school_fees(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partially_paid', 'paid', 'overdue', 'cancelled')),
  amount_paid DECIMAL(10,2) DEFAULT 0 CHECK (amount_paid >= 0),
  amount_remaining DECIMAL(10,2) GENERATED ALWAYS AS (amount - amount_paid) STORED,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, school_fee_id)
);

CREATE INDEX idx_student_fees_student_id ON student_fees(student_id);
CREATE INDEX idx_student_fees_school_fee_id ON student_fees(school_fee_id);
CREATE INDEX idx_student_fees_status ON student_fees(status);

-- TABLE 3 : PAIEMENTS
CREATE TABLE fee_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_fee_id UUID NOT NULL REFERENCES student_fees(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'mobile_money', 'check', 'card')),
  payment_date DATE NOT NULL,
  receipt_number TEXT UNIQUE,
  transaction_id TEXT,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'cancelled', 'refunded')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_fee_payments_student_fee_id ON fee_payments(student_fee_id);
CREATE INDEX idx_fee_payments_student_id ON fee_payments(student_id);
CREATE INDEX idx_fee_payments_school_id ON fee_payments(school_id);
CREATE INDEX idx_fee_payments_payment_date ON fee_payments(payment_date DESC);
CREATE INDEX idx_fee_payments_status ON fee_payments(status);

-- TABLE 4 : DÉPENSES
CREATE TABLE school_expenses (
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
  payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'mobile_money', 'check', 'card')),
  receipt_number TEXT,
  vendor_name TEXT,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT check_school_or_group CHECK (
    (school_id IS NOT NULL AND school_group_id IS NULL) OR
    (school_id IS NULL AND school_group_id IS NOT NULL)
  )
);

CREATE INDEX idx_school_expenses_school_id ON school_expenses(school_id);
CREATE INDEX idx_school_expenses_school_group_id ON school_expenses(school_group_id);
CREATE INDEX idx_school_expenses_category ON school_expenses(category);
CREATE INDEX idx_school_expenses_expense_date ON school_expenses(expense_date DESC);
CREATE INDEX idx_school_expenses_status ON school_expenses(status);

-- TABLE 5 : SNAPSHOTS QUOTIDIENS
CREATE TABLE daily_financial_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  snapshot_date DATE NOT NULL,
  school_group_id UUID REFERENCES school_groups(id),
  school_id UUID REFERENCES schools(id),
  daily_revenue DECIMAL(12, 2) DEFAULT 0,
  daily_expenses DECIMAL(12, 2) DEFAULT 0,
  total_revenue DECIMAL(12, 2) DEFAULT 0,
  total_expenses DECIMAL(12, 2) DEFAULT 0,
  net_profit DECIMAL(12, 2) DEFAULT 0,
  overdue_amount DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(snapshot_date, school_group_id, school_id)
);

CREATE INDEX idx_snapshots_date ON daily_financial_snapshots(snapshot_date DESC);
CREATE INDEX idx_snapshots_group ON daily_financial_snapshots(school_group_id);
CREATE INDEX idx_snapshots_school ON daily_financial_snapshots(school_id);

-- ✅ Tables créées
SELECT 'Tables créées avec succès' AS status;

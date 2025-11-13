-- ============================================
-- TABLE EXPENSES - GESTION DES DÉPENSES
-- Pour l'onglet Dépenses du Dashboard Financier
-- ============================================

-- Créer la table expenses
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_group_id UUID REFERENCES school_groups(id) ON DELETE CASCADE,
  amount DECIMAL NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL CHECK (category IN (
    'salaires',
    'fournitures',
    'infrastructure',
    'utilities',
    'transport',
    'marketing',
    'formation',
    'autres'
  )),
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_expenses_school_group ON expenses(school_group_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_reference ON expenses(reference);

-- Fonction pour générer une référence unique
CREATE OR REPLACE FUNCTION generate_expense_reference()
RETURNS TEXT AS $$
DECLARE
  ref TEXT;
  counter INTEGER := 1;
BEGIN
  LOOP
    ref := 'DEP-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(counter::TEXT, 3, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM expenses WHERE reference = ref);
    counter := counter + 1;
  END LOOP;
  RETURN ref;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour générer automatiquement la référence
CREATE OR REPLACE FUNCTION set_expense_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reference IS NULL OR NEW.reference = '' THEN
    NEW.reference := generate_expense_reference();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_expense_reference
BEFORE INSERT ON expenses
FOR EACH ROW
EXECUTE FUNCTION set_expense_reference();

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_expense_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_expense_timestamp
BEFORE UPDATE ON expenses
FOR EACH ROW
EXECUTE FUNCTION update_expense_timestamp();

-- Row Level Security (RLS)
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Politique pour Super Admin (accès total)
CREATE POLICY "Super Admin full access on expenses"
ON expenses
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

-- Politique pour Admin Groupe (ses dépenses uniquement)
CREATE POLICY "Admin Groupe can view their expenses"
ON expenses
FOR SELECT
TO authenticated
USING (
  school_group_id IN (
    SELECT id FROM school_groups
    WHERE admin_id = auth.uid()
  )
);

CREATE POLICY "Admin Groupe can insert their expenses"
ON expenses
FOR INSERT
TO authenticated
WITH CHECK (
  school_group_id IN (
    SELECT id FROM school_groups
    WHERE admin_id = auth.uid()
  )
);

CREATE POLICY "Admin Groupe can update their expenses"
ON expenses
FOR UPDATE
TO authenticated
USING (
  school_group_id IN (
    SELECT id FROM school_groups
    WHERE admin_id = auth.uid()
  )
);

CREATE POLICY "Admin Groupe can delete their expenses"
ON expenses
FOR DELETE
TO authenticated
USING (
  school_group_id IN (
    SELECT id FROM school_groups
    WHERE admin_id = auth.uid()
  )
);

-- Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON expenses TO authenticated;

-- Insérer des données de test (optionnel)
INSERT INTO expenses (school_group_id, amount, category, description, date, status, payment_method)
VALUES
  (
    (SELECT id FROM school_groups LIMIT 1),
    500000,
    'salaires',
    'Salaires enseignants - Octobre 2025',
    '2025-10-15',
    'paid',
    'Virement bancaire'
  ),
  (
    (SELECT id FROM school_groups LIMIT 1),
    75000,
    'fournitures',
    'Achat de cahiers et stylos',
    '2025-10-20',
    'paid',
    'Espèces'
  ),
  (
    (SELECT id FROM school_groups LIMIT 1),
    150000,
    'infrastructure',
    'Réparation toiture bâtiment A',
    '2025-10-25',
    'pending',
    'Chèque'
  )
ON CONFLICT (reference) DO NOTHING;

-- Vérification
SELECT 
  'Expenses table created successfully' as message,
  COUNT(*) as expense_count
FROM expenses;

-- ============================================
-- FIN DU SCRIPT
-- ============================================

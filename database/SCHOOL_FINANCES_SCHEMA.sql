-- ============================================================================
-- SCHÉMA FINANCES SCOLAIRES - ADMIN GROUPE
-- ============================================================================
-- Tables pour la gestion des finances des écoles (frais, paiements, dépenses)
-- Adapté pour Admin Groupe qui gère plusieurs écoles
-- ============================================================================

-- ============================================================================
-- TABLE 1 : FRAIS SCOLAIRES (school_fees)
-- ============================================================================
-- Définition des frais scolaires (scolarité, cantine, transport, etc.)

CREATE TABLE IF NOT EXISTS school_fees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                           -- Ex: "Scolarité Primaire", "Cantine"
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'scolarite',      -- Frais de scolarité
    'cantine',        -- Frais de cantine
    'transport',      -- Frais de transport
    'activites',      -- Activités extra-scolaires
    'uniforme',       -- Uniforme scolaire
    'fournitures',    -- Fournitures scolaires
    'inscription',    -- Frais d'inscription
    'examen',         -- Frais d'examen
    'bibliotheque',   -- Frais de bibliothèque
    'autre'           -- Autres frais
  )),
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  frequency TEXT NOT NULL CHECK (frequency IN (
    'mensuel',        -- Paiement mensuel
    'trimestriel',    -- Paiement trimestriel
    'semestriel',     -- Paiement semestriel
    'annuel',         -- Paiement annuel
    'unique'          -- Paiement unique
  )),
  is_mandatory BOOLEAN DEFAULT true,            -- Obligatoire ou optionnel
  academic_year TEXT NOT NULL,                  -- Ex: "2024-2025"
  level TEXT,                                   -- Niveau scolaire (maternelle, primaire, college, lycee)
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_school_fees_school_id ON school_fees(school_id);
CREATE INDEX IF NOT EXISTS idx_school_fees_category ON school_fees(category);
CREATE INDEX IF NOT EXISTS idx_school_fees_status ON school_fees(status);
CREATE INDEX IF NOT EXISTS idx_school_fees_academic_year ON school_fees(academic_year);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_school_fees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_school_fees_updated_at
  BEFORE UPDATE ON school_fees
  FOR EACH ROW
  EXECUTE FUNCTION update_school_fees_updated_at();

-- ============================================================================
-- TABLE 2 : FRAIS ASSIGNÉS AUX ÉLÈVES (student_fees)
-- ============================================================================
-- Association entre les élèves et les frais scolaires

CREATE TABLE IF NOT EXISTS student_fees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_fee_id UUID NOT NULL REFERENCES school_fees(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),  -- Peut être différent du montant de base (réduction, etc.)
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',        -- En attente de paiement
    'paid',           -- Payé
    'partial',        -- Partiellement payé
    'overdue',        -- En retard
    'cancelled',      -- Annulé
    'exempted'        -- Exempté
  )),
  paid_amount DECIMAL(10,2) DEFAULT 0 CHECK (paid_amount >= 0),
  remaining_amount DECIMAL(10,2) GENERATED ALWAYS AS (amount - paid_amount) STORED,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_student_fees_student_id ON student_fees(student_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_school_fee_id ON student_fees(school_fee_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_status ON student_fees(status);
CREATE INDEX IF NOT EXISTS idx_student_fees_due_date ON student_fees(due_date);

-- Trigger pour updated_at
CREATE TRIGGER trigger_update_student_fees_updated_at
  BEFORE UPDATE ON student_fees
  FOR EACH ROW
  EXECUTE FUNCTION update_school_fees_updated_at();

-- ============================================================================
-- TABLE 3 : PAIEMENTS DES FRAIS (fee_payments)
-- ============================================================================
-- Historique des paiements effectués par les parents/élèves

CREATE TABLE IF NOT EXISTS fee_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_fee_id UUID NOT NULL REFERENCES student_fees(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN (
    'cash',           -- Espèces
    'bank_transfer',  -- Virement bancaire
    'mobile_money',   -- Mobile Money (Airtel, MTN)
    'check',          -- Chèque
    'card'            -- Carte bancaire
  )),
  payment_date DATE NOT NULL,
  receipt_number TEXT UNIQUE,                   -- Numéro de reçu unique
  transaction_id TEXT,                          -- ID de transaction (pour mobile money, etc.)
  notes TEXT,
  created_by UUID REFERENCES profiles(id),     -- Qui a enregistré le paiement
  status TEXT DEFAULT 'completed' CHECK (status IN (
    'completed',      -- Paiement complété
    'pending',        -- En attente de validation
    'cancelled',      -- Annulé
    'refunded'        -- Remboursé
  )),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_fee_payments_student_fee_id ON fee_payments(student_fee_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_student_id ON fee_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_school_id ON fee_payments(school_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_payment_date ON fee_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_fee_payments_status ON fee_payments(status);
CREATE INDEX IF NOT EXISTS idx_fee_payments_receipt_number ON fee_payments(receipt_number);

-- Trigger pour updated_at
CREATE TRIGGER trigger_update_fee_payments_updated_at
  BEFORE UPDATE ON fee_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_school_fees_updated_at();

-- ============================================================================
-- TABLE 4 : DÉPENSES DES ÉCOLES (school_expenses)
-- ============================================================================
-- Gestion des dépenses des écoles et du groupe scolaire

CREATE TABLE IF NOT EXISTS school_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  school_group_id UUID REFERENCES school_groups(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN (
    'salaires',       -- Salaires du personnel
    'fournitures',    -- Fournitures et matériel
    'maintenance',    -- Maintenance et réparations
    'administratif',  -- Frais administratifs
    'utilities',      -- Électricité, eau, internet
    'transport',      -- Transport scolaire
    'cantine',        -- Fournitures cantine
    'pedagogique',    -- Matériel pédagogique
    'infrastructure', -- Infrastructure et bâtiments
    'autre'           -- Autres dépenses
  )),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  expense_date DATE NOT NULL,
  payment_method TEXT CHECK (payment_method IN (
    'cash', 'bank_transfer', 'mobile_money', 'check', 'card'
  )),
  receipt_number TEXT,
  vendor_name TEXT,                             -- Nom du fournisseur
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),     -- Qui a approuvé la dépense
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',        -- En attente d'approbation
    'approved',       -- Approuvée
    'paid',           -- Payée
    'cancelled'       -- Annulée
  )),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Contrainte : soit school_id soit school_group_id doit être renseigné
  CONSTRAINT check_school_or_group CHECK (
    (school_id IS NOT NULL AND school_group_id IS NULL) OR
    (school_id IS NULL AND school_group_id IS NOT NULL)
  )
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_school_expenses_school_id ON school_expenses(school_id);
CREATE INDEX IF NOT EXISTS idx_school_expenses_school_group_id ON school_expenses(school_group_id);
CREATE INDEX IF NOT EXISTS idx_school_expenses_category ON school_expenses(category);
CREATE INDEX IF NOT EXISTS idx_school_expenses_expense_date ON school_expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_school_expenses_status ON school_expenses(status);

-- Trigger pour updated_at
CREATE TRIGGER trigger_update_school_expenses_updated_at
  BEFORE UPDATE ON school_expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_school_fees_updated_at();

-- ============================================================================
-- VUE 1 : STATISTIQUES FINANCIÈRES PAR ÉCOLE
-- ============================================================================

CREATE OR REPLACE VIEW school_financial_stats AS
SELECT 
  s.id as school_id,
  s.name as school_name,
  s.school_group_id,
  
  -- Frais scolaires
  COUNT(DISTINCT sf.id) as total_fees,
  SUM(CASE WHEN sf.status = 'active' THEN 1 ELSE 0 END) as active_fees,
  
  -- Paiements
  COUNT(DISTINCT fp.id) as total_payments,
  COALESCE(SUM(CASE WHEN fp.status = 'completed' THEN fp.amount ELSE 0 END), 0) as total_revenue,
  
  -- Impayés
  COUNT(DISTINCT CASE WHEN stf.status = 'overdue' THEN stf.id END) as overdue_count,
  COALESCE(SUM(CASE WHEN stf.status = 'overdue' THEN stf.remaining_amount ELSE 0 END), 0) as overdue_amount,
  
  -- Paiements en attente
  COUNT(DISTINCT CASE WHEN stf.status = 'pending' THEN stf.id END) as pending_count,
  COALESCE(SUM(CASE WHEN stf.status = 'pending' THEN stf.remaining_amount ELSE 0 END), 0) as pending_amount,
  
  -- Dépenses
  COALESCE(SUM(se.amount), 0) as total_expenses,
  
  -- Bénéfice net
  COALESCE(SUM(CASE WHEN fp.status = 'completed' THEN fp.amount ELSE 0 END), 0) - COALESCE(SUM(se.amount), 0) as net_profit,
  
  -- Taux de recouvrement
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

-- ============================================================================
-- VUE 2 : STATISTIQUES FINANCIÈRES DU GROUPE
-- ============================================================================

CREATE OR REPLACE VIEW group_financial_stats AS
SELECT 
  sg.id as school_group_id,
  sg.name as group_name,
  
  -- Écoles
  COUNT(DISTINCT s.id) as total_schools,
  
  -- Revenus totaux (toutes écoles)
  COALESCE(SUM(CASE WHEN fp.status = 'completed' THEN fp.amount ELSE 0 END), 0) as total_revenue,
  
  -- Impayés totaux
  COALESCE(SUM(CASE WHEN stf.status = 'overdue' THEN stf.remaining_amount ELSE 0 END), 0) as total_overdue,
  
  -- Paiements en attente
  COALESCE(SUM(CASE WHEN stf.status = 'pending' THEN stf.remaining_amount ELSE 0 END), 0) as total_pending,
  
  -- Dépenses écoles
  COALESCE(SUM(CASE WHEN se.school_id IS NOT NULL AND se.status = 'paid' THEN se.amount ELSE 0 END), 0) as schools_expenses,
  
  -- Dépenses groupe
  COALESCE(SUM(CASE WHEN se.school_group_id IS NOT NULL AND se.status = 'paid' THEN se.amount ELSE 0 END), 0) as group_expenses,
  
  -- Dépenses totales
  COALESCE(SUM(CASE WHEN se.status = 'paid' THEN se.amount ELSE 0 END), 0) as total_expenses,
  
  -- Bénéfice net
  COALESCE(SUM(CASE WHEN fp.status = 'completed' THEN fp.amount ELSE 0 END), 0) - 
  COALESCE(SUM(CASE WHEN se.status = 'paid' THEN se.amount ELSE 0 END), 0) as net_profit,
  
  -- Taux de recouvrement global
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

-- ============================================================================
-- FONCTION : GÉNÉRER NUMÉRO DE REÇU
-- ============================================================================

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

-- Créer la séquence pour les reçus
CREATE SEQUENCE IF NOT EXISTS receipt_sequence START 1;

-- ============================================================================
-- FONCTION : METTRE À JOUR LE STATUT DES FRAIS EN RETARD
-- ============================================================================

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

-- ============================================================================
-- TRIGGER : METTRE À JOUR student_fees APRÈS PAIEMENT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_student_fee_after_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour le montant payé
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

-- ============================================================================
-- POLITIQUES RLS (Row Level Security)
-- ============================================================================

-- Activer RLS sur toutes les tables
ALTER TABLE school_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_expenses ENABLE ROW LEVEL SECURITY;

-- Politique pour Admin Groupe : voir toutes les données de son groupe
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

CREATE POLICY "Admin groupe voit ses écoles - student_fees"
  ON student_fees FOR ALL
  USING (
    school_fee_id IN (
      SELECT id FROM school_fees 
      WHERE school_id IN (
        SELECT id FROM schools 
        WHERE school_group_id = (
          SELECT school_group_id FROM profiles WHERE id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Admin groupe voit ses écoles - fee_payments"
  ON fee_payments FOR ALL
  USING (
    school_id IN (
      SELECT id FROM schools 
      WHERE school_group_id = (
        SELECT school_group_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Admin groupe voit ses dépenses - school_expenses"
  ON school_expenses FOR ALL
  USING (
    school_group_id = (
      SELECT school_group_id FROM profiles WHERE id = auth.uid()
    )
    OR school_id IN (
      SELECT id FROM schools 
      WHERE school_group_id = (
        SELECT school_group_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================

/*
1. **Tables créées** :
   - school_fees : Définition des frais scolaires
   - student_fees : Frais assignés aux élèves
   - fee_payments : Historique des paiements
   - school_expenses : Dépenses des écoles et du groupe

2. **Vues créées** :
   - school_financial_stats : Statistiques par école
   - group_financial_stats : Statistiques du groupe

3. **Fonctions créées** :
   - generate_receipt_number() : Génère un numéro de reçu unique
   - update_overdue_student_fees() : Met à jour les frais en retard

4. **Triggers créés** :
   - update_student_fee_after_payment : Met à jour student_fees après paiement

5. **RLS activé** : Admin Groupe voit uniquement ses écoles

6. **Prochaines étapes** :
   - Créer les hooks React Query
   - Créer les composants UI
   - Implémenter la page Finances
*/

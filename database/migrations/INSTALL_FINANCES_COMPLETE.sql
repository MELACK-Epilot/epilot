-- ============================================================================
-- INSTALLATION COMPLÈTE DU SYSTÈME FINANCIER
-- Script tout-en-un : Exécute les 5 étapes automatiquement
-- Date : 2025-11-05
-- ============================================================================

DO $$ 
BEGIN
  RAISE NOTICE '🚀 Début de l''installation du système financier...';
END $$;

-- ============================================================================
-- ÉTAPE 1 : NETTOYAGE COMPLET
-- ============================================================================

DO $$ 
BEGIN
  RAISE NOTICE '🧹 Étape 1/5 : Nettoyage...';
END $$;

-- Supprimer les VUES MATÉRIALISÉES (en premier)
DROP MATERIALIZED VIEW IF EXISTS group_financial_stats CASCADE;
DROP MATERIALIZED VIEW IF EXISTS school_financial_stats CASCADE;
DROP MATERIALIZED VIEW IF EXISTS level_financial_stats CASCADE;
DROP MATERIALIZED VIEW IF EXISTS class_financial_stats CASCADE;

-- Supprimer les VUES SIMPLES (au cas où)
DROP VIEW IF EXISTS group_financial_stats CASCADE;
DROP VIEW IF EXISTS school_financial_stats CASCADE;
DROP VIEW IF EXISTS level_financial_stats CASCADE;
DROP VIEW IF EXISTS class_financial_stats CASCADE;

-- Supprimer les TABLES
DROP TABLE IF EXISTS daily_financial_snapshots CASCADE;
DROP TABLE IF EXISTS fee_payments CASCADE;
DROP TABLE IF EXISTS student_fees CASCADE;
DROP TABLE IF EXISTS school_fees CASCADE;
DROP TABLE IF EXISTS school_expenses CASCADE;
DROP TABLE IF EXISTS payment_plans CASCADE;

-- Supprimer les FONCTIONS
DROP FUNCTION IF EXISTS refresh_financial_views() CASCADE;
DROP FUNCTION IF EXISTS create_daily_snapshot() CASCADE;

-- Supprimer les TÂCHES CRON
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh-financial-views') THEN
      PERFORM cron.unschedule('refresh-financial-views');
    END IF;
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'create-daily-snapshot') THEN
      PERFORM cron.unschedule('create-daily-snapshot');
    END IF;
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
  RAISE NOTICE '✅ Étape 1/5 : Nettoyage terminé';
END $$;

-- ============================================================================
-- ÉTAPE 2 : CRÉATION DES TABLES
-- ============================================================================

DO $$ 
BEGIN
  RAISE NOTICE '📊 Étape 2/5 : Création des tables...';
END $$;

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

DO $$ 
BEGIN
  RAISE NOTICE '✅ Étape 2/5 : Tables créées';
END $$;

-- ============================================================================
-- ÉTAPE 3 : CRÉATION DES VUES MATÉRIALISÉES
-- ============================================================================

DO $$ 
BEGIN
  RAISE NOTICE '📈 Étape 3/5 : Création des vues...';
END $$;

-- VUE 1 : STATS GROUPE
CREATE MATERIALIZED VIEW group_financial_stats AS
SELECT 
  sg.id AS school_group_id,
  sg.name AS school_group_name,
  COUNT(DISTINCT s.id) AS total_schools,
  COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed'), 0) AS total_revenue,
  COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed' AND fp.payment_date >= DATE_TRUNC('month', CURRENT_DATE)), 0) AS monthly_revenue,
  COALESCE(SUM(se.amount) FILTER (WHERE se.status = 'paid'), 0) AS total_expenses,
  COALESCE(SUM(se.amount) FILTER (WHERE se.status = 'paid' AND se.school_id IS NOT NULL), 0) AS schools_expenses,
  COALESCE(SUM(se.amount) FILTER (WHERE se.status = 'paid' AND se.school_group_id = sg.id AND se.school_id IS NULL), 0) AS group_expenses,
  COALESCE(SUM(se.amount) FILTER (WHERE se.status = 'paid' AND se.expense_date >= DATE_TRUNC('month', CURRENT_DATE)), 0) AS monthly_expenses,
  COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed'), 0) - COALESCE(SUM(se.amount) FILTER (WHERE se.status = 'paid'), 0) AS net_profit,
  COALESCE(SUM(sf.amount_remaining) FILTER (WHERE sf.status = 'overdue'), 0) AS total_overdue,
  COALESCE(SUM(sf.amount_remaining) FILTER (WHERE sf.status = 'pending'), 0) AS total_pending,
  COUNT(DISTINCT sf.id) FILTER (WHERE sf.status = 'overdue') AS overdue_count,
  COUNT(DISTINCT sf.id) FILTER (WHERE sf.status = 'pending') AS pending_count,
  CASE 
    WHEN COALESCE(SUM(sf.amount), 0) > 0 
    THEN (COALESCE(SUM(sf.amount_paid), 0) / COALESCE(SUM(sf.amount), 0)) * 100
    ELSE 0
  END AS global_recovery_rate,
  CURRENT_TIMESTAMP AS last_updated
FROM school_groups sg
LEFT JOIN schools s ON s.school_group_id = sg.id
LEFT JOIN students st ON st.school_id = s.id
LEFT JOIN student_fees sf ON sf.student_id = st.id
LEFT JOIN fee_payments fp ON fp.student_fee_id = sf.id
LEFT JOIN school_expenses se ON (se.school_id = s.id OR se.school_group_id = sg.id)
GROUP BY sg.id, sg.name;

CREATE UNIQUE INDEX idx_group_financial_stats_id ON group_financial_stats(school_group_id);

-- VUE 2 : STATS ÉCOLE
CREATE MATERIALIZED VIEW school_financial_stats AS
SELECT 
  s.id AS school_id,
  s.name AS school_name,
  s.school_group_id,
  sg.name AS school_group_name,
  COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed'), 0) AS total_revenue,
  COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed' AND fp.payment_date >= DATE_TRUNC('month', CURRENT_DATE)), 0) AS monthly_revenue,
  COALESCE(SUM(se.amount) FILTER (WHERE se.status = 'paid'), 0) AS total_expenses,
  COALESCE(SUM(se.amount) FILTER (WHERE se.status = 'paid' AND se.expense_date >= DATE_TRUNC('month', CURRENT_DATE)), 0) AS monthly_expenses,
  COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed'), 0) - COALESCE(SUM(se.amount) FILTER (WHERE se.status = 'paid'), 0) AS net_profit,
  COALESCE(SUM(sf.amount_remaining) FILTER (WHERE sf.status = 'overdue'), 0) AS overdue_amount,
  COALESCE(SUM(sf.amount_remaining) FILTER (WHERE sf.status = 'pending'), 0) AS pending_amount,
  COUNT(DISTINCT sf.id) FILTER (WHERE sf.status = 'overdue') AS overdue_count,
  CASE 
    WHEN COALESCE(SUM(sf.amount), 0) > 0 
    THEN (COALESCE(SUM(sf.amount_paid), 0) / COALESCE(SUM(sf.amount), 0)) * 100
    ELSE 0
  END AS recovery_rate,
  COUNT(DISTINCT st.id) AS total_students,
  CURRENT_TIMESTAMP AS last_updated
FROM schools s
LEFT JOIN school_groups sg ON sg.id = s.school_group_id
LEFT JOIN students st ON st.school_id = s.id
LEFT JOIN student_fees sf ON sf.student_id = st.id
LEFT JOIN fee_payments fp ON fp.student_fee_id = sf.id
LEFT JOIN school_expenses se ON se.school_id = s.id
GROUP BY s.id, s.name, s.school_group_id, sg.name;

CREATE UNIQUE INDEX idx_school_financial_stats_id ON school_financial_stats(school_id);
CREATE INDEX idx_school_financial_stats_group ON school_financial_stats(school_group_id);

-- VUE 3 : STATS NIVEAU
CREATE MATERIALIZED VIEW level_financial_stats AS
SELECT 
  s.id AS school_id,
  s.name AS school_name,
  st.level,
  COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed'), 0) AS total_revenue,
  COALESCE(SUM(sf.amount_remaining) FILTER (WHERE sf.status = 'overdue'), 0) AS overdue_amount,
  COUNT(DISTINCT sf.id) FILTER (WHERE sf.status = 'overdue') AS overdue_count,
  CASE 
    WHEN COALESCE(SUM(sf.amount), 0) > 0 
    THEN (COALESCE(SUM(sf.amount_paid), 0) / COALESCE(SUM(sf.amount), 0)) * 100
    ELSE 0
  END AS recovery_rate,
  COUNT(DISTINCT st.id) AS total_students,
  CASE 
    WHEN COUNT(DISTINCT st.id) > 0 
    THEN COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed'), 0) / COUNT(DISTINCT st.id)
    ELSE 0
  END AS revenue_per_student,
  CURRENT_TIMESTAMP AS last_updated
FROM schools s
LEFT JOIN students st ON st.school_id = s.id
LEFT JOIN student_fees sf ON sf.student_id = st.id
LEFT JOIN fee_payments fp ON fp.student_fee_id = sf.id
WHERE st.level IS NOT NULL
GROUP BY s.id, s.name, st.level;

CREATE UNIQUE INDEX idx_level_financial_stats_unique ON level_financial_stats(school_id, level);
CREATE INDEX idx_level_financial_stats_school ON level_financial_stats(school_id);
CREATE INDEX idx_level_financial_stats_level ON level_financial_stats(level);

DO $$ 
BEGIN
  RAISE NOTICE '✅ Étape 3/5 : Vues créées';
END $$;

-- ============================================================================
-- ÉTAPE 4 : CRÉATION DES FONCTIONS ET AUTOMATISATIONS
-- ============================================================================

DO $$ 
BEGIN
  RAISE NOTICE '⚙️ Étape 4/5 : Création des fonctions...';
END $$;

-- FONCTION 1 : Rafraîchir les vues
CREATE OR REPLACE FUNCTION refresh_financial_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY group_financial_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY school_financial_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY level_financial_stats;
END;
$$ LANGUAGE plpgsql;

-- FONCTION 2 : Créer snapshot quotidien
CREATE OR REPLACE FUNCTION create_daily_snapshot()
RETURNS void AS $$
BEGIN
  INSERT INTO daily_financial_snapshots (
    snapshot_date, school_group_id, total_revenue, total_expenses, net_profit, overdue_amount
  )
  SELECT 
    CURRENT_DATE, school_group_id, total_revenue, total_expenses, net_profit, total_overdue
  FROM group_financial_stats
  ON CONFLICT (snapshot_date, school_group_id, school_id) DO UPDATE SET
    total_revenue = EXCLUDED.total_revenue,
    total_expenses = EXCLUDED.total_expenses,
    net_profit = EXCLUDED.net_profit,
    overdue_amount = EXCLUDED.overdue_amount;
    
  INSERT INTO daily_financial_snapshots (
    snapshot_date, school_group_id, school_id, total_revenue, total_expenses, net_profit, overdue_amount
  )
  SELECT 
    CURRENT_DATE, school_group_id, school_id, total_revenue, total_expenses, net_profit, overdue_amount
  FROM school_financial_stats
  ON CONFLICT (snapshot_date, school_group_id, school_id) DO UPDATE SET
    total_revenue = EXCLUDED.total_revenue,
    total_expenses = EXCLUDED.total_expenses,
    net_profit = EXCLUDED.net_profit,
    overdue_amount = EXCLUDED.overdue_amount;
END;
$$ LANGUAGE plpgsql;

-- TÂCHES AUTOMATIQUES
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule('refresh-financial-views', '0 * * * *', 'SELECT refresh_financial_views()');
SELECT cron.schedule('create-daily-snapshot', '0 0 * * *', 'SELECT create_daily_snapshot()');

DO $$ 
BEGIN
  RAISE NOTICE '✅ Étape 4/5 : Fonctions créées';
END $$;

-- ============================================================================
-- ÉTAPE 5 : INITIALISATION
-- ============================================================================

DO $$ 
BEGIN
  RAISE NOTICE '🚀 Étape 5/5 : Initialisation...';
END $$;

SELECT refresh_financial_views();
SELECT create_daily_snapshot();

DO $$ 
BEGIN
  RAISE NOTICE '✅ Étape 5/5 : Initialisation terminée';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 INSTALLATION TERMINÉE AVEC SUCCÈS !';
  RAISE NOTICE '📊 3 vues matérialisées créées';
  RAISE NOTICE '📅 Snapshots quotidiens activés';
  RAISE NOTICE '⏰ Rafraîchissement automatique toutes les heures';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Le système financier est prêt à être utilisé !';
END $$;

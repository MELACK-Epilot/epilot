-- ============================================================================
-- VUES FINANCIÈRES MATÉRIALISÉES - Système Classe Mondiale
-- Permet des analyses financières ultra-rapides multi-niveaux
-- Date : 2025-11-05
-- ============================================================================

-- ============================================================================
-- VUE 1 : STATISTIQUES FINANCIÈRES PAR GROUPE SCOLAIRE
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS group_financial_stats AS
SELECT 
  sg.id AS school_group_id,
  sg.name AS school_group_name,
  
  -- Nombre d'écoles
  COUNT(DISTINCT s.id) AS total_schools,
  
  -- REVENUS (Paiements complétés uniquement)
  COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed'), 0) AS total_revenue,
  COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed' AND fp.payment_date >= DATE_TRUNC('month', CURRENT_DATE)), 0) AS monthly_revenue,
  
  -- DÉPENSES (Dépenses payées uniquement)
  COALESCE(SUM(se.amount) FILTER (WHERE se.status = 'paid'), 0) AS total_expenses,
  COALESCE(SUM(se.amount) FILTER (WHERE se.status = 'paid' AND se.school_id IS NOT NULL), 0) AS schools_expenses,
  COALESCE(SUM(se.amount) FILTER (WHERE se.status = 'paid' AND se.school_group_id = sg.id AND se.school_id IS NULL), 0) AS group_expenses,
  COALESCE(SUM(se.amount) FILTER (WHERE se.status = 'paid' AND se.expense_date >= DATE_TRUNC('month', CURRENT_DATE)), 0) AS monthly_expenses,
  
  -- SOLDE & PROFIT
  COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed'), 0) - COALESCE(SUM(se.amount) FILTER (WHERE se.status = 'paid'), 0) AS net_profit,
  
  -- RETARDS & EN ATTENTE
  COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'overdue'), 0) AS total_overdue,
  COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'pending'), 0) AS total_pending,
  COUNT(DISTINCT fp.id) FILTER (WHERE fp.status = 'overdue') AS overdue_count,
  COUNT(DISTINCT fp.id) FILTER (WHERE fp.status = 'pending') AS pending_count,
  
  -- TAUX DE RECOUVREMENT
  CASE 
    WHEN COALESCE(SUM(fp.amount), 0) > 0 
    THEN (COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed'), 0) / COALESCE(SUM(fp.amount), 0)) * 100
    ELSE 0
  END AS global_recovery_rate,
  
  -- Métadonnées
  CURRENT_TIMESTAMP AS last_updated

FROM school_groups sg
LEFT JOIN schools s ON s.school_group_id = sg.id
LEFT JOIN fee_payments fp ON fp.school_id = s.id
LEFT JOIN school_expenses se ON (se.school_id = s.id OR se.school_group_id = sg.id)

GROUP BY sg.id, sg.name;

-- Index pour performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_group_financial_stats_id ON group_financial_stats(school_group_id);

-- ============================================================================
-- VUE 2 : STATISTIQUES FINANCIÈRES PAR ÉCOLE
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS school_financial_stats AS
SELECT 
  s.id AS school_id,
  s.name AS school_name,
  s.school_group_id,
  sg.name AS school_group_name,
  
  -- REVENUS
  COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed'), 0) AS total_revenue,
  COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed' AND fp.payment_date >= DATE_TRUNC('month', CURRENT_DATE)), 0) AS monthly_revenue,
  
  -- DÉPENSES
  COALESCE(SUM(se.amount) FILTER (WHERE se.status = 'paid'), 0) AS total_expenses,
  COALESCE(SUM(se.amount) FILTER (WHERE se.status = 'paid' AND se.expense_date >= DATE_TRUNC('month', CURRENT_DATE)), 0) AS monthly_expenses,
  
  -- PROFIT
  COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed'), 0) - COALESCE(SUM(se.amount) FILTER (WHERE se.status = 'paid'), 0) AS net_profit,
  
  -- RETARDS
  COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'overdue'), 0) AS overdue_amount,
  COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'pending'), 0) AS pending_amount,
  COUNT(DISTINCT fp.id) FILTER (WHERE fp.status = 'overdue') AS overdue_count,
  
  -- TAUX DE RECOUVREMENT
  CASE 
    WHEN COALESCE(SUM(fp.amount), 0) > 0 
    THEN (COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed'), 0) / COALESCE(SUM(fp.amount), 0)) * 100
    ELSE 0
  END AS recovery_rate,
  
  -- NOMBRE D'ÉLÈVES
  COUNT(DISTINCT st.id) AS total_students,
  
  -- Métadonnées
  CURRENT_TIMESTAMP AS last_updated

FROM schools s
LEFT JOIN school_groups sg ON sg.id = s.school_group_id
LEFT JOIN students st ON st.school_id = s.id
LEFT JOIN fee_payments fp ON fp.school_id = s.id
LEFT JOIN school_expenses se ON se.school_id = s.id

GROUP BY s.id, s.name, s.school_group_id, sg.name;

-- Index
CREATE UNIQUE INDEX IF NOT EXISTS idx_school_financial_stats_id ON school_financial_stats(school_id);
CREATE INDEX IF NOT EXISTS idx_school_financial_stats_group ON school_financial_stats(school_group_id);

-- ============================================================================
-- VUE 3 : STATISTIQUES FINANCIÈRES PAR NIVEAU
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS level_financial_stats AS
SELECT 
  s.id AS school_id,
  s.name AS school_name,
  st.level,
  
  -- REVENUS
  COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed'), 0) AS total_revenue,
  COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed' AND fp.payment_date >= DATE_TRUNC('month', CURRENT_DATE)), 0) AS monthly_revenue,
  
  -- RETARDS
  COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'overdue'), 0) AS overdue_amount,
  COUNT(DISTINCT fp.id) FILTER (WHERE fp.status = 'overdue') AS overdue_count,
  
  -- TAUX DE RECOUVREMENT
  CASE 
    WHEN COALESCE(SUM(fp.amount), 0) > 0 
    THEN (COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed'), 0) / COALESCE(SUM(fp.amount), 0)) * 100
    ELSE 0
  END AS recovery_rate,
  
  -- NOMBRE D'ÉLÈVES
  COUNT(DISTINCT st.id) AS total_students,
  
  -- REVENUS PAR ÉLÈVE
  CASE 
    WHEN COUNT(DISTINCT st.id) > 0 
    THEN COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed'), 0) / COUNT(DISTINCT st.id)
    ELSE 0
  END AS revenue_per_student,
  
  -- Métadonnées
  CURRENT_TIMESTAMP AS last_updated

FROM schools s
LEFT JOIN students st ON st.school_id = s.id
LEFT JOIN student_fees sf ON sf.student_id = st.id
LEFT JOIN fee_payments fp ON fp.student_fee_id = sf.id

WHERE st.level IS NOT NULL

GROUP BY s.id, s.name, st.level;

-- Index
CREATE INDEX IF NOT EXISTS idx_level_financial_stats_school ON level_financial_stats(school_id);
CREATE INDEX IF NOT EXISTS idx_level_financial_stats_level ON level_financial_stats(level);

-- ============================================================================
-- VUE 4 : STATISTIQUES FINANCIÈRES PAR CLASSE
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS class_financial_stats AS
SELECT 
  c.id AS class_id,
  c.name AS class_name,
  c.school_id,
  s.name AS school_name,
  c.level,
  
  -- REVENUS
  COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed'), 0) AS total_revenue,
  
  -- RETARDS
  COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'overdue'), 0) AS overdue_amount,
  COUNT(DISTINCT fp.id) FILTER (WHERE fp.status = 'overdue') AS overdue_count,
  
  -- TAUX DE RECOUVREMENT
  CASE 
    WHEN COALESCE(SUM(fp.amount), 0) > 0 
    THEN (COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed'), 0) / COALESCE(SUM(fp.amount), 0)) * 100
    ELSE 0
  END AS recovery_rate,
  
  -- NOMBRE D'ÉLÈVES
  COUNT(DISTINCT st.id) AS total_students,
  
  -- Métadonnées
  CURRENT_TIMESTAMP AS last_updated

FROM classes c
LEFT JOIN schools s ON s.id = c.school_id
LEFT JOIN students st ON st.class_id = c.id
LEFT JOIN student_fees sf ON sf.student_id = st.id
LEFT JOIN fee_payments fp ON fp.student_fee_id = sf.id

GROUP BY c.id, c.name, c.school_id, s.name, c.level;

-- Index
CREATE UNIQUE INDEX IF NOT EXISTS idx_class_financial_stats_id ON class_financial_stats(class_id);
CREATE INDEX IF NOT EXISTS idx_class_financial_stats_school ON class_financial_stats(school_id);

-- ============================================================================
-- VUE 5 : SNAPSHOTS QUOTIDIENS (Historique)
-- ============================================================================

CREATE TABLE IF NOT EXISTS daily_financial_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  snapshot_date DATE NOT NULL,
  school_group_id UUID REFERENCES school_groups(id),
  school_id UUID REFERENCES schools(id),
  
  -- Données du jour
  daily_revenue DECIMAL(12, 2) DEFAULT 0,
  daily_expenses DECIMAL(12, 2) DEFAULT 0,
  daily_payments_count INTEGER DEFAULT 0,
  
  -- Cumul
  total_revenue DECIMAL(12, 2) DEFAULT 0,
  total_expenses DECIMAL(12, 2) DEFAULT 0,
  net_profit DECIMAL(12, 2) DEFAULT 0,
  
  -- Retards
  overdue_amount DECIMAL(12, 2) DEFAULT 0,
  overdue_count INTEGER DEFAULT 0,
  
  -- Métadonnées
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(snapshot_date, school_group_id, school_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON daily_financial_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_group ON daily_financial_snapshots(school_group_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_school ON daily_financial_snapshots(school_id);

-- ============================================================================
-- FONCTION : RAFRAÎCHIR TOUTES LES VUES
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_financial_views()
RETURNS void AS $$
BEGIN
  RAISE NOTICE 'Rafraîchissement des vues financières...';
  
  -- Rafraîchir les vues matérialisées
  REFRESH MATERIALIZED VIEW CONCURRENTLY group_financial_stats;
  RAISE NOTICE '✓ group_financial_stats rafraîchie';
  
  REFRESH MATERIALIZED VIEW CONCURRENTLY school_financial_stats;
  RAISE NOTICE '✓ school_financial_stats rafraîchie';
  
  REFRESH MATERIALIZED VIEW CONCURRENTLY level_financial_stats;
  RAISE NOTICE '✓ level_financial_stats rafraîchie';
  
  REFRESH MATERIALIZED VIEW CONCURRENTLY class_financial_stats;
  RAISE NOTICE '✓ class_financial_stats rafraîchie';
  
  RAISE NOTICE 'Rafraîchissement terminé avec succès !';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FONCTION : CRÉER SNAPSHOT QUOTIDIEN
-- ============================================================================

CREATE OR REPLACE FUNCTION create_daily_snapshot()
RETURNS void AS $$
BEGIN
  -- Snapshot par groupe
  INSERT INTO daily_financial_snapshots (
    snapshot_date,
    school_group_id,
    daily_revenue,
    daily_expenses,
    daily_payments_count,
    total_revenue,
    total_expenses,
    net_profit,
    overdue_amount,
    overdue_count
  )
  SELECT 
    CURRENT_DATE,
    school_group_id,
    monthly_revenue,
    monthly_expenses,
    0,
    total_revenue,
    total_expenses,
    net_profit,
    total_overdue,
    overdue_count
  FROM group_financial_stats
  ON CONFLICT (snapshot_date, school_group_id, school_id) 
  DO UPDATE SET
    daily_revenue = EXCLUDED.daily_revenue,
    daily_expenses = EXCLUDED.daily_expenses,
    total_revenue = EXCLUDED.total_revenue,
    total_expenses = EXCLUDED.total_expenses,
    net_profit = EXCLUDED.net_profit,
    overdue_amount = EXCLUDED.overdue_amount,
    overdue_count = EXCLUDED.overdue_count;
  
  -- Snapshot par école
  INSERT INTO daily_financial_snapshots (
    snapshot_date,
    school_group_id,
    school_id,
    daily_revenue,
    daily_expenses,
    total_revenue,
    total_expenses,
    net_profit,
    overdue_amount,
    overdue_count
  )
  SELECT 
    CURRENT_DATE,
    school_group_id,
    school_id,
    monthly_revenue,
    monthly_expenses,
    total_revenue,
    total_expenses,
    net_profit,
    overdue_amount,
    overdue_count
  FROM school_financial_stats
  ON CONFLICT (snapshot_date, school_group_id, school_id) 
  DO UPDATE SET
    daily_revenue = EXCLUDED.daily_revenue,
    daily_expenses = EXCLUDED.daily_expenses,
    total_revenue = EXCLUDED.total_revenue,
    total_expenses = EXCLUDED.total_expenses,
    net_profit = EXCLUDED.net_profit,
    overdue_amount = EXCLUDED.overdue_amount,
    overdue_count = EXCLUDED.overdue_count;
    
  RAISE NOTICE 'Snapshot quotidien créé pour le %', CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PROGRAMMATION DES TÂCHES AUTOMATIQUES (pg_cron)
-- ============================================================================

-- Activer l'extension pg_cron si pas déjà fait
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Rafraîchir les vues toutes les heures
SELECT cron.schedule(
  'refresh-financial-views',
  '0 * * * *', -- Toutes les heures à la minute 0
  'SELECT refresh_financial_views()'
);

-- Créer snapshot quotidien à minuit
SELECT cron.schedule(
  'create-daily-snapshot',
  '0 0 * * *', -- Tous les jours à minuit
  'SELECT create_daily_snapshot()'
);

-- ============================================================================
-- COMMENTAIRES & DOCUMENTATION
-- ============================================================================

COMMENT ON MATERIALIZED VIEW group_financial_stats IS 'Statistiques financières consolidées par groupe scolaire - Rafraîchie toutes les heures';
COMMENT ON MATERIALIZED VIEW school_financial_stats IS 'Statistiques financières détaillées par école - Rafraîchie toutes les heures';
COMMENT ON MATERIALIZED VIEW level_financial_stats IS 'Statistiques financières par niveau (6ème, 5ème, etc.) - Rafraîchie toutes les heures';
COMMENT ON MATERIALIZED VIEW class_financial_stats IS 'Statistiques financières par classe - Rafraîchie toutes les heures';
COMMENT ON TABLE daily_financial_snapshots IS 'Historique quotidien des données financières pour analyses de tendances';
COMMENT ON FUNCTION refresh_financial_views IS 'Rafraîchit toutes les vues matérialisées financières';
COMMENT ON FUNCTION create_daily_snapshot IS 'Crée un snapshot quotidien des données financières';

-- ============================================================================
-- INITIALISATION : RAFRAÎCHIR LES VUES IMMÉDIATEMENT
-- ============================================================================

SELECT refresh_financial_views();
SELECT create_daily_snapshot();

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================

-- ✅ Vues financières créées et initialisées avec succès !
-- 📊 Vues disponibles :
--    - group_financial_stats (stats groupe)
--    - school_financial_stats (stats école)
--    - level_financial_stats (stats niveau)
--    - class_financial_stats (stats classe)
--    - daily_financial_snapshots (historique)
-- ⏰ Rafraîchissement automatique : Toutes les heures
-- 📅 Snapshot quotidien : Tous les jours à minuit

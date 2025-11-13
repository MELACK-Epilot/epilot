-- ============================================================================
-- ÉTAPE 4 : CRÉATION DES FONCTIONS ET AUTOMATISATIONS
-- ============================================================================

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
  -- Snapshot par groupe
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
    
  -- Snapshot par école
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

-- TÂCHES AUTOMATIQUES (pg_cron)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Rafraîchir les vues toutes les heures
SELECT cron.schedule('refresh-financial-views', '0 * * * *', 'SELECT refresh_financial_views()');

-- Créer snapshot quotidien à minuit
SELECT cron.schedule('create-daily-snapshot', '0 0 * * *', 'SELECT create_daily_snapshot()');

-- ✅ Fonctions créées
SELECT 'Fonctions et automatisations créées avec succès' AS status;

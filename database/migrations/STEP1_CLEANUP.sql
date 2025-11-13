-- ============================================================================
-- ÉTAPE 1 : NETTOYAGE COMPLET
-- Supprime toutes les anciennes structures financières
-- ============================================================================

-- Supprimer les VUES SIMPLES (pas matérialisées)
DROP VIEW IF EXISTS group_financial_stats CASCADE;
DROP VIEW IF EXISTS school_financial_stats CASCADE;
DROP VIEW IF EXISTS level_financial_stats CASCADE;
DROP VIEW IF EXISTS class_financial_stats CASCADE;

-- Supprimer les VUES MATÉRIALISÉES
DROP MATERIALIZED VIEW IF EXISTS group_financial_stats CASCADE;
DROP MATERIALIZED VIEW IF EXISTS school_financial_stats CASCADE;
DROP MATERIALIZED VIEW IF EXISTS level_financial_stats CASCADE;
DROP MATERIALIZED VIEW IF EXISTS class_financial_stats CASCADE;

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

-- Supprimer les TÂCHES CRON (si elles existent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Supprimer uniquement si le job existe
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh-financial-views') THEN
      PERFORM cron.unschedule('refresh-financial-views');
    END IF;
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'create-daily-snapshot') THEN
      PERFORM cron.unschedule('create-daily-snapshot');
    END IF;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignorer les erreurs (jobs n'existent pas)
    NULL;
END $$;

-- ✅ Nettoyage terminé
SELECT 'Nettoyage terminé avec succès' AS status;

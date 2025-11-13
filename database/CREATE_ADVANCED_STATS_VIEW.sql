-- ============================================================================
-- VUE POUR STATISTIQUES AVANCÉES - TEMPS RÉEL
-- Calcule les métriques avancées directement en SQL
-- Date : 7 novembre 2025
-- ============================================================================

CREATE OR REPLACE VIEW advanced_financial_stats AS
SELECT 
  sg.id AS school_group_id,
  sg.name AS school_group_name,
  
  -- Nombre d'écoles
  COUNT(DISTINCT s.id) AS total_schools,
  
  -- REVENUS PAR ÉCOLE (moyenne)
  CASE 
    WHEN COUNT(DISTINCT s.id) > 0 
    THEN COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed'), 0) / COUNT(DISTINCT s.id)
    ELSE 0
  END AS revenue_per_school,
  
  -- CROISSANCE MENSUELLE (comparaison mois actuel vs mois précédent)
  CASE 
    WHEN COALESCE(SUM(fp.amount) FILTER (
      WHERE fp.status = 'completed' 
      AND fp.payment_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
      AND fp.payment_date < DATE_TRUNC('month', CURRENT_DATE)
    ), 0) > 0
    THEN (
      (COALESCE(SUM(fp.amount) FILTER (
        WHERE fp.status = 'completed' 
        AND fp.payment_date >= DATE_TRUNC('month', CURRENT_DATE)
      ), 0) - COALESCE(SUM(fp.amount) FILTER (
        WHERE fp.status = 'completed' 
        AND fp.payment_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
        AND fp.payment_date < DATE_TRUNC('month', CURRENT_DATE)
      ), 0)) / COALESCE(SUM(fp.amount) FILTER (
        WHERE fp.status = 'completed' 
        AND fp.payment_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
        AND fp.payment_date < DATE_TRUNC('month', CURRENT_DATE)
      ), 1)
    ) * 100
    ELSE 0
  END AS monthly_growth_rate,
  
  -- Revenus mois actuel
  COALESCE(SUM(fp.amount) FILTER (
    WHERE fp.status = 'completed' 
    AND fp.payment_date >= DATE_TRUNC('month', CURRENT_DATE)
  ), 0) AS current_month_revenue,
  
  -- Revenus mois précédent
  COALESCE(SUM(fp.amount) FILTER (
    WHERE fp.status = 'completed' 
    AND fp.payment_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
    AND fp.payment_date < DATE_TRUNC('month', CURRENT_DATE)
  ), 0) AS previous_month_revenue,
  
  -- TAUX DE RECOUVREMENT GLOBAL
  CASE 
    WHEN COALESCE(SUM(fp.amount), 0) > 0 
    THEN (COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed'), 0) / COALESCE(SUM(fp.amount), 0)) * 100
    ELSE 0
  END AS global_recovery_rate,
  
  -- Paiements complétés
  COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed'), 0) AS completed_payments,
  
  -- Total paiements attendus
  COALESCE(SUM(fp.amount), 0) AS total_expected_payments,
  
  -- RETARDS / REVENUS (ratio)
  CASE 
    WHEN COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed'), 0) > 0 
    THEN (COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'overdue'), 0) / 
          COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed'), 0)) * 100
    ELSE 0
  END AS overdue_to_revenue_ratio,
  
  -- Montant en retard
  COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'overdue'), 0) AS total_overdue,
  
  -- Revenus totaux
  COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed'), 0) AS total_revenue,
  
  -- Nombre de paiements en retard
  COUNT(DISTINCT fp.id) FILTER (WHERE fp.status = 'overdue') AS overdue_count,
  
  -- Nombre de paiements complétés
  COUNT(DISTINCT fp.id) FILTER (WHERE fp.status = 'completed') AS completed_count,
  
  -- Métadonnées
  CURRENT_TIMESTAMP AS last_updated

FROM school_groups sg
LEFT JOIN schools s ON s.school_group_id = sg.id
LEFT JOIN fee_payments fp ON fp.school_id = s.id
GROUP BY sg.id, sg.name;

-- ============================================================================
-- INDEX POUR PERFORMANCE
-- ============================================================================
-- Note : CREATE INDEX CONCURRENTLY ne peut pas être dans un bloc DO $$

CREATE INDEX IF NOT EXISTS idx_fee_payments_date_status 
  ON fee_payments(payment_date, status) 
  WHERE status IN ('completed', 'overdue');

-- Index sur DATE_TRUNC supprimé car nécessite une fonction IMMUTABLE
-- L'index sur payment_date seul est suffisant pour les performances

-- ============================================================================
-- AJOUTER AU JOB CRON
-- ============================================================================

-- Si pg_cron est disponible, rafraîchir cette vue aussi
-- SELECT cron.schedule(
--   'refresh-advanced-stats',
--   '*/5 * * * *',
--   $$REFRESH MATERIALIZED VIEW CONCURRENTLY advanced_financial_stats$$
-- );

-- ============================================================================
-- TESTS
-- ============================================================================

-- Vérifier les données
SELECT * FROM advanced_financial_stats LIMIT 1;

-- Vérifier les calculs
SELECT 
  school_group_name,
  revenue_per_school,
  monthly_growth_rate,
  global_recovery_rate,
  overdue_to_revenue_ratio,
  current_month_revenue,
  previous_month_revenue
FROM advanced_financial_stats;

-- ============================================================================
-- FIN
-- ============================================================================

-- ============================================================================
-- CONFIGURATION TEMPS RÉEL POUR LES FINANCES - VERSION MINIMALE
-- Date : 7 novembre 2025
-- ============================================================================

-- ÉTAPE 1 : Activer pg_cron (si disponible)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ÉTAPE 2 : Rafraîchir UNIQUEMENT les vues qui existent
-- Toutes les 5 minutes
SELECT cron.schedule(
  'refresh-group-financial-stats',
  '*/5 * * * *',
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY group_financial_stats$$
);

SELECT cron.schedule(
  'refresh-school-financial-stats',
  '*/5 * * * *',
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY school_financial_stats$$
);

-- ÉTAPE 3 : Créer des index (sans CONCURRENTLY)
CREATE INDEX IF NOT EXISTS idx_fee_payments_school_status_date 
  ON fee_payments(school_id, status, payment_date);

CREATE INDEX IF NOT EXISTS idx_fee_payments_amount_status 
  ON fee_payments(amount, status) WHERE status IN ('completed', 'overdue', 'pending');

CREATE INDEX IF NOT EXISTS idx_school_expenses_school_status_date 
  ON school_expenses(school_id, status, expense_date);

CREATE INDEX IF NOT EXISTS idx_school_expenses_group_status 
  ON school_expenses(school_group_id, status) WHERE status = 'paid';

-- ÉTAPE 4 : Créer une vue pour le Top 3 des écoles par revenus
CREATE OR REPLACE VIEW top_schools_by_revenue AS
SELECT 
  s.id AS school_id,
  s.name AS school_name,
  s.code AS school_code,
  s.school_group_id,
  COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed'), 0) AS total_revenue,
  COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed' 
    AND fp.payment_date >= DATE_TRUNC('month', CURRENT_DATE)), 0) AS monthly_revenue,
  COALESCE(SUM(se.amount) FILTER (WHERE se.status = 'paid'), 0) AS total_expenses,
  COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed'), 0) 
    - COALESCE(SUM(se.amount) FILTER (WHERE se.status = 'paid'), 0) AS net_profit,
  CASE 
    WHEN COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed'), 0) > 0
    THEN ((COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed'), 0) 
      - COALESCE(SUM(se.amount) FILTER (WHERE se.status = 'paid'), 0)) 
      / COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed'), 0)) * 100
    ELSE 0
  END AS profit_margin,
  COUNT(DISTINCT fp.id) AS total_payments,
  COUNT(DISTINCT fp.id) FILTER (WHERE fp.status = 'completed') AS completed_payments,
  CASE 
    WHEN COUNT(DISTINCT fp.id) > 0
    THEN (COUNT(DISTINCT fp.id) FILTER (WHERE fp.status = 'completed')::DECIMAL 
      / COUNT(DISTINCT fp.id)) * 100
    ELSE 0
  END AS recovery_rate
FROM schools s
LEFT JOIN fee_payments fp ON fp.school_id = s.id
LEFT JOIN school_expenses se ON se.school_id = s.id
GROUP BY s.id, s.name, s.code, s.school_group_id
ORDER BY total_revenue DESC;

-- ÉTAPE 5 : Créer une vue pour la comparaison N vs N-1
CREATE OR REPLACE VIEW financial_year_comparison AS
WITH current_year AS (
  SELECT 
    sg.id AS school_group_id,
    sg.name AS school_group_name,
    COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed'), 0) AS total_revenue,
    COALESCE(SUM(se.amount) FILTER (WHERE se.status = 'paid'), 0) AS total_expenses,
    COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed'), 0) 
      - COALESCE(SUM(se.amount) FILTER (WHERE se.status = 'paid'), 0) AS net_profit,
    COUNT(DISTINCT s.id) AS total_schools,
    COUNT(DISTINCT fp.id) FILTER (WHERE fp.status = 'completed') AS completed_payments
  FROM school_groups sg
  LEFT JOIN schools s ON s.school_group_id = sg.id
  LEFT JOIN fee_payments fp ON fp.school_id = s.id 
    AND EXTRACT(YEAR FROM fp.payment_date) = EXTRACT(YEAR FROM CURRENT_DATE)
  LEFT JOIN school_expenses se ON (se.school_id = s.id OR se.school_group_id = sg.id)
    AND EXTRACT(YEAR FROM se.expense_date) = EXTRACT(YEAR FROM CURRENT_DATE)
  GROUP BY sg.id, sg.name
),
previous_year AS (
  SELECT 
    sg.id AS school_group_id,
    COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed'), 0) AS total_revenue,
    COALESCE(SUM(se.amount) FILTER (WHERE se.status = 'paid'), 0) AS total_expenses,
    COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed'), 0) 
      - COALESCE(SUM(se.amount) FILTER (WHERE se.status = 'paid'), 0) AS net_profit,
    COUNT(DISTINCT fp.id) FILTER (WHERE fp.status = 'completed') AS completed_payments
  FROM school_groups sg
  LEFT JOIN schools s ON s.school_group_id = sg.id
  LEFT JOIN fee_payments fp ON fp.school_id = s.id 
    AND EXTRACT(YEAR FROM fp.payment_date) = EXTRACT(YEAR FROM CURRENT_DATE) - 1
  LEFT JOIN school_expenses se ON (se.school_id = s.id OR se.school_group_id = sg.id)
    AND EXTRACT(YEAR FROM se.expense_date) = EXTRACT(YEAR FROM CURRENT_DATE) - 1
  GROUP BY sg.id
)
SELECT 
  cy.school_group_id,
  cy.school_group_name,
  cy.total_revenue AS current_revenue,
  py.total_revenue AS previous_revenue,
  CASE 
    WHEN py.total_revenue > 0 
    THEN ((cy.total_revenue - py.total_revenue) / py.total_revenue) * 100
    ELSE 0
  END AS revenue_growth,
  cy.total_expenses AS current_expenses,
  py.total_expenses AS previous_expenses,
  CASE 
    WHEN py.total_expenses > 0 
    THEN ((cy.total_expenses - py.total_expenses) / py.total_expenses) * 100
    ELSE 0
  END AS expenses_growth,
  cy.net_profit AS current_profit,
  py.net_profit AS previous_profit,
  CASE 
    WHEN py.net_profit != 0 
    THEN ((cy.net_profit - py.net_profit) / ABS(py.net_profit)) * 100
    ELSE 0
  END AS profit_growth,
  cy.total_schools,
  cy.completed_payments AS current_payments,
  py.completed_payments AS previous_payments
FROM current_year cy
LEFT JOIN previous_year py ON cy.school_group_id = py.school_group_id;

-- ÉTAPE 6 : Créer une vue pour les objectifs et benchmarks
CREATE OR REPLACE VIEW financial_objectives_benchmarks AS
SELECT 
  sg.id AS school_group_id,
  sg.name AS school_group_name,
  COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed'), 0) AS current_revenue,
  COALESCE(AVG(monthly_avg.revenue), 0) * 1.1 AS monthly_target,
  COALESCE(prev_year.total_revenue, 0) * 1.15 AS annual_target,
  CASE 
    WHEN COALESCE(AVG(monthly_avg.revenue), 0) * 1.1 > 0
    THEN (COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed' 
      AND fp.payment_date >= DATE_TRUNC('month', CURRENT_DATE)), 0) 
      / (COALESCE(AVG(monthly_avg.revenue), 0) * 1.1)) * 100
    ELSE 0
  END AS monthly_achievement_rate,
  AVG(other_groups.avg_revenue) AS sector_benchmark,
  CASE 
    WHEN AVG(other_groups.avg_revenue) > 0
    THEN (COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed'), 0) 
      / AVG(other_groups.avg_revenue)) * 100
    ELSE 100
  END AS benchmark_position
FROM school_groups sg
LEFT JOIN schools s ON s.school_group_id = sg.id
LEFT JOIN fee_payments fp ON fp.school_id = s.id
LEFT JOIN LATERAL (
  SELECT AVG(monthly_revenue) AS revenue
  FROM (
    SELECT 
      DATE_TRUNC('month', fp2.payment_date) AS month,
      SUM(fp2.amount) AS monthly_revenue
    FROM fee_payments fp2
    WHERE fp2.school_id = s.id 
      AND fp2.status = 'completed'
      AND fp2.payment_date >= CURRENT_DATE - INTERVAL '3 months'
    GROUP BY DATE_TRUNC('month', fp2.payment_date)
  ) AS months
) AS monthly_avg ON true
LEFT JOIN LATERAL (
  SELECT SUM(fp3.amount) AS total_revenue
  FROM fee_payments fp3
  WHERE fp3.school_id = s.id 
    AND fp3.status = 'completed'
    AND EXTRACT(YEAR FROM fp3.payment_date) = EXTRACT(YEAR FROM CURRENT_DATE) - 1
) AS prev_year ON true
LEFT JOIN LATERAL (
  SELECT AVG(group_revenue) AS avg_revenue
  FROM (
    SELECT 
      s2.school_group_id,
      SUM(fp4.amount) AS group_revenue
    FROM schools s2
    JOIN fee_payments fp4 ON fp4.school_id = s2.id
    WHERE fp4.status = 'completed'
      AND s2.school_group_id != sg.id
    GROUP BY s2.school_group_id
  ) AS other_groups_data
) AS other_groups ON true
GROUP BY sg.id, sg.name, prev_year.total_revenue;

-- ÉTAPE 7 : Rafraîchir les vues matérialisées
REFRESH MATERIALIZED VIEW CONCURRENTLY group_financial_stats;
REFRESH MATERIALIZED VIEW CONCURRENTLY school_financial_stats;

-- ÉTAPE 8 : Vérifier les jobs CRON créés
SELECT 
  jobid,
  schedule,
  command,
  active
FROM cron.job
WHERE jobname LIKE 'refresh-%';

-- FIN
SELECT '✅ CONFIGURATION TERMINÉE AVEC SUCCÈS !' AS statut;

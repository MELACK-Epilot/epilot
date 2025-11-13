-- ============================================================================
-- ÉTAPE 3 : CRÉATION DES VUES MATÉRIALISÉES
-- ============================================================================

-- VUE 1 : STATISTIQUES PAR GROUPE
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

-- Index APRÈS création
CREATE UNIQUE INDEX idx_group_financial_stats_id ON group_financial_stats(school_group_id);

-- VUE 2 : STATISTIQUES PAR ÉCOLE
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

-- Index APRÈS création
CREATE UNIQUE INDEX idx_school_financial_stats_id ON school_financial_stats(school_id);
CREATE INDEX idx_school_financial_stats_group ON school_financial_stats(school_group_id);

-- VUE 3 : STATISTIQUES PAR NIVEAU
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

-- Index APRÈS création (UNIQUE pour permettre REFRESH CONCURRENTLY)
CREATE UNIQUE INDEX idx_level_financial_stats_unique ON level_financial_stats(school_id, level);
CREATE INDEX idx_level_financial_stats_school ON level_financial_stats(school_id);
CREATE INDEX idx_level_financial_stats_level ON level_financial_stats(level);

-- ✅ Vues créées
SELECT 'Vues matérialisées créées avec succès' AS status;

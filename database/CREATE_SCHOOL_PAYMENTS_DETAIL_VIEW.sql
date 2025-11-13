-- ============================================================================
-- VUE DÉTAILLÉE DES PAIEMENTS PAR ÉCOLE
-- Pour l'onglet "Paiements" de la page détails école
-- Date : 7 novembre 2025
-- ============================================================================

-- Vue pour les paiements détaillés avec informations élève
CREATE OR REPLACE VIEW school_payments_detail AS
SELECT 
  fp.id AS payment_id,
  fp.school_id,
  s.name AS school_name,
  fp.student_id,
  st.first_name AS student_first_name,
  st.last_name AS student_last_name,
  st.level AS student_level,
  st.level AS student_class,  -- Utiliser le niveau comme classe si table classes n'existe pas
  fp.amount,
  fp.status,
  fp.payment_date,
  fp.due_date,
  'Frais scolaires' AS fee_type,  -- Valeur par défaut car colonne n'existe pas
  'Paiement frais scolaires' AS description,  -- Valeur par défaut car colonne n'existe pas
  'Non spécifié' AS payment_method,  -- Valeur par défaut car colonne n'existe pas
  fp.id::TEXT AS reference_number,  -- Utiliser l'ID comme référence
  
  -- Calcul jours de retard
  CASE 
    WHEN fp.status = 'overdue' AND fp.due_date IS NOT NULL
    THEN (CURRENT_DATE - fp.due_date::DATE)
    ELSE 0
  END AS days_overdue,
  
  -- Statut détaillé
  CASE 
    WHEN fp.status = 'completed' THEN 'Payé'
    WHEN fp.status = 'overdue' THEN 'En retard'
    WHEN fp.status = 'pending' THEN 'En attente'
    WHEN fp.status = 'cancelled' THEN 'Annulé'
    ELSE 'Autre'
  END AS status_label,
  
  -- Priorité de relance
  CASE 
    WHEN fp.status = 'overdue' AND (CURRENT_DATE - fp.due_date::DATE) > 30 THEN 'Haute'
    WHEN fp.status = 'overdue' AND (CURRENT_DATE - fp.due_date::DATE) > 15 THEN 'Moyenne'
    WHEN fp.status = 'overdue' THEN 'Faible'
    ELSE 'Aucune'
  END AS priority,
  
  -- Informations parent/tuteur
  st.parent_name,
  st.parent_phone,
  st.parent_email,
  
  -- Métadonnées
  fp.created_at,
  fp.updated_at

FROM fee_payments fp
INNER JOIN schools s ON s.id = fp.school_id
INNER JOIN students st ON st.id = fp.student_id
WHERE fp.status IN ('overdue', 'pending', 'completed')
ORDER BY 
  CASE 
    WHEN fp.status = 'overdue' THEN 1
    WHEN fp.status = 'pending' THEN 2
    ELSE 3
  END,
  fp.due_date ASC NULLS LAST;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_fee_payments_school_status_due 
  ON fee_payments(school_id, status, due_date) 
  WHERE status IN ('overdue', 'pending');

-- Vue pour statistiques de relance
CREATE OR REPLACE VIEW school_payment_reminders AS
SELECT 
  school_id,
  COUNT(*) FILTER (WHERE status = 'overdue' AND days_overdue > 30) AS high_priority_count,
  COUNT(*) FILTER (WHERE status = 'overdue' AND days_overdue BETWEEN 15 AND 30) AS medium_priority_count,
  COUNT(*) FILTER (WHERE status = 'overdue' AND days_overdue < 15) AS low_priority_count,
  SUM(amount) FILTER (WHERE status = 'overdue') AS total_overdue_amount,
  COUNT(DISTINCT student_id) FILTER (WHERE status = 'overdue') AS students_with_overdue
FROM school_payments_detail
GROUP BY school_id;

-- Vue pour benchmarking entre écoles
CREATE OR REPLACE VIEW school_benchmarking AS
WITH school_stats AS (
  SELECT 
    s.id AS school_id,
    s.name AS school_name,
    s.school_group_id,
    COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed'), 0) AS total_revenue,
    COALESCE(SUM(se.amount) FILTER (WHERE se.status = 'paid'), 0) AS total_expenses,
    COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed'), 0) - 
      COALESCE(SUM(se.amount) FILTER (WHERE se.status = 'paid'), 0) AS net_profit,
    CASE 
      WHEN COALESCE(SUM(fp.amount), 0) > 0 
      THEN (COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed'), 0) / 
            COALESCE(SUM(fp.amount), 0)) * 100
      ELSE 0
    END AS recovery_rate,
    COUNT(DISTINCT st.id) AS total_students
  FROM schools s
  LEFT JOIN fee_payments fp ON fp.school_id = s.id
  LEFT JOIN school_expenses se ON se.school_id = s.id
  LEFT JOIN students st ON st.school_id = s.id
  GROUP BY s.id, s.name, s.school_group_id
),
group_averages AS (
  SELECT 
    school_group_id,
    AVG(total_revenue) AS avg_revenue,
    AVG(total_expenses) AS avg_expenses,
    AVG(net_profit) AS avg_profit,
    AVG(recovery_rate) AS avg_recovery_rate,
    AVG(total_students) AS avg_students
  FROM school_stats
  GROUP BY school_group_id
)
SELECT 
  ss.school_id,
  ss.school_name,
  ss.school_group_id,
  ss.total_revenue,
  ss.total_expenses,
  ss.net_profit,
  ss.recovery_rate,
  ss.total_students,
  
  -- Moyennes du groupe
  ga.avg_revenue AS group_avg_revenue,
  ga.avg_expenses AS group_avg_expenses,
  ga.avg_profit AS group_avg_profit,
  ga.avg_recovery_rate AS group_avg_recovery_rate,
  ga.avg_students AS group_avg_students,
  
  -- Écarts par rapport à la moyenne
  CASE 
    WHEN ga.avg_revenue > 0 
    THEN ((ss.total_revenue - ga.avg_revenue) / ga.avg_revenue) * 100
    ELSE 0
  END AS revenue_vs_avg_pct,
  
  CASE 
    WHEN ga.avg_recovery_rate > 0 
    THEN ss.recovery_rate - ga.avg_recovery_rate
    ELSE 0
  END AS recovery_vs_avg_points,
  
  -- Classement dans le groupe
  RANK() OVER (PARTITION BY ss.school_group_id ORDER BY ss.total_revenue DESC) AS revenue_rank,
  RANK() OVER (PARTITION BY ss.school_group_id ORDER BY ss.recovery_rate DESC) AS recovery_rank,
  COUNT(*) OVER (PARTITION BY ss.school_group_id) AS total_schools_in_group

FROM school_stats ss
LEFT JOIN group_averages ga ON ga.school_group_id = ss.school_group_id;

-- Vue pour objectifs mensuels
CREATE OR REPLACE VIEW school_monthly_objectives AS
SELECT 
  s.id AS school_id,
  s.name AS school_name,
  s.school_group_id,
  
  -- Revenus mois actuel
  COALESCE(SUM(fp.amount) FILTER (
    WHERE fp.status = 'completed' 
    AND fp.payment_date >= DATE_TRUNC('month', CURRENT_DATE)
  ), 0) AS current_month_revenue,
  
  -- Objectif basé sur moyenne 3 derniers mois + 10%
  COALESCE(AVG(monthly_avg.revenue), 0) * 1.1 AS monthly_objective,
  
  -- Progression
  CASE 
    WHEN COALESCE(AVG(monthly_avg.revenue), 0) * 1.1 > 0
    THEN (COALESCE(SUM(fp.amount) FILTER (
      WHERE fp.status = 'completed' 
      AND fp.payment_date >= DATE_TRUNC('month', CURRENT_DATE)
    ), 0) / (COALESCE(AVG(monthly_avg.revenue), 0) * 1.1)) * 100
    ELSE 0
  END AS objective_progress_pct,
  
  -- Jours restants dans le mois
  EXTRACT(DAY FROM (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - CURRENT_DATE)) AS days_remaining,
  
  -- Revenus nécessaires par jour
  CASE 
    WHEN EXTRACT(DAY FROM (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - CURRENT_DATE)) > 0
    THEN (COALESCE(AVG(monthly_avg.revenue), 0) * 1.1 - 
          COALESCE(SUM(fp.amount) FILTER (
            WHERE fp.status = 'completed' 
            AND fp.payment_date >= DATE_TRUNC('month', CURRENT_DATE)
          ), 0)) / 
          EXTRACT(DAY FROM (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - CURRENT_DATE))
    ELSE 0
  END AS required_daily_revenue

FROM schools s
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
      AND fp2.payment_date < DATE_TRUNC('month', CURRENT_DATE)
    GROUP BY DATE_TRUNC('month', fp2.payment_date)
  ) AS months
) AS monthly_avg ON true
GROUP BY s.id, s.name, s.school_group_id;

-- FIN
SELECT '✅ VUES PAIEMENTS DÉTAILLÉS CRÉÉES AVEC SUCCÈS !' AS statut;

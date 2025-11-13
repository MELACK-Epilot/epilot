-- ============================================================================
-- VUE MATÉRIALISÉE POUR STATISTIQUES PAR NIVEAU
-- Pour l'onglet "Niveaux" de la page détails école
-- Date : 7 novembre 2025
-- ============================================================================

-- Supprimer la vue si elle existe déjà
DROP MATERIALIZED VIEW IF EXISTS level_financial_stats CASCADE;

-- Créer la vue matérialisée
CREATE MATERIALIZED VIEW level_financial_stats AS
WITH school_levels AS (
  -- Récupérer tous les niveaux distincts par école
  SELECT DISTINCT
    s.id AS school_id,
    s.name AS school_name,
    s.school_group_id,
    COALESCE(st.level, 'Non défini') AS level
  FROM schools s
  LEFT JOIN students st ON st.school_id = s.id
  WHERE st.level IS NOT NULL AND st.level != ''
)
SELECT 
  sl.school_id,
  sl.school_name,
  sl.school_group_id,
  sl.level,
  
  -- Nombre d'élèves par niveau
  COUNT(DISTINCT st.id) AS total_students,
  
  -- Nombre de classes par niveau (estimé : 1 classe par 30 élèves)
  CASE 
    WHEN COUNT(DISTINCT st.id) > 0 THEN CEIL(COUNT(DISTINCT st.id)::DECIMAL / 30)
    ELSE 0
  END AS total_classes,
  
  -- Revenus totaux par niveau
  COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed'), 0) AS total_revenue,
  
  -- Dépenses totales par niveau (estimées proportionnellement)
  CASE 
    WHEN COUNT(DISTINCT st.id) > 0 THEN
      COALESCE(
        (SELECT SUM(amount) FROM school_expenses WHERE school_id = sl.school_id AND status = 'paid'), 
        0
      ) * COUNT(DISTINCT st.id) / NULLIF(
        (SELECT COUNT(*) FROM students WHERE school_id = sl.school_id), 
        0
      )
    ELSE 0
  END AS total_expenses,
  
  -- Profit net par niveau
  COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed'), 0) - 
    CASE 
      WHEN COUNT(DISTINCT st.id) > 0 THEN
        COALESCE(
          (SELECT SUM(amount) FROM school_expenses WHERE school_id = sl.school_id AND status = 'paid'), 
          0
        ) * COUNT(DISTINCT st.id) / NULLIF(
          (SELECT COUNT(*) FROM students WHERE school_id = sl.school_id), 
          0
        )
      ELSE 0
    END AS net_profit,
  
  -- Montant en retard par niveau
  COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'overdue'), 0) AS overdue_amount,
  
  -- Nombre de paiements en retard
  COUNT(fp.id) FILTER (WHERE fp.status = 'overdue') AS overdue_count,
  
  -- Taux de recouvrement par niveau
  CASE 
    WHEN COALESCE(SUM(fp.amount), 0) > 0 
    THEN (COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed'), 0) / 
          COALESCE(SUM(fp.amount), 0)) * 100
    ELSE 0
  END AS recovery_rate,
  
  -- Revenus par élève
  CASE 
    WHEN COUNT(DISTINCT st.id) > 0 
    THEN COALESCE(SUM(fp.amount) FILTER (WHERE fp.status = 'completed'), 0) / COUNT(DISTINCT st.id)
    ELSE 0
  END AS revenue_per_student,
  
  -- Métadonnées
  CURRENT_TIMESTAMP AS last_updated

FROM school_levels sl
LEFT JOIN students st ON st.school_id = sl.school_id AND st.level = sl.level
LEFT JOIN fee_payments fp ON fp.student_id = st.id
GROUP BY sl.school_id, sl.school_name, sl.school_group_id, sl.level
ORDER BY sl.school_id, sl.level;

-- Index pour performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_level_financial_stats_school_level 
  ON level_financial_stats(school_id, level);

CREATE INDEX IF NOT EXISTS idx_level_financial_stats_school 
  ON level_financial_stats(school_id);

CREATE INDEX IF NOT EXISTS idx_level_financial_stats_group 
  ON level_financial_stats(school_group_id);

-- Rafraîchir la vue
REFRESH MATERIALIZED VIEW CONCURRENTLY level_financial_stats;

-- FIN
SELECT '✅ VUE level_financial_stats CRÉÉE AVEC SUCCÈS !' AS statut;

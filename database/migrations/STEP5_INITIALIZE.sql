-- ============================================================================
-- ÉTAPE 5 : INITIALISATION
-- Rafraîchir les vues et créer le premier snapshot
-- ============================================================================

-- Rafraîchir toutes les vues
SELECT refresh_financial_views();

-- Créer le snapshot du jour
SELECT create_daily_snapshot();

-- ✅ Initialisation terminée
SELECT 'Installation terminée avec succès !' AS status;
SELECT '📊 3 vues matérialisées créées' AS info1;
SELECT '📅 Snapshots quotidiens activés' AS info2;
SELECT '⏰ Rafraîchissement automatique toutes les heures' AS info3;

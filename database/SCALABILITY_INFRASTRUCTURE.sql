-- INFRASTRUCTURE SCALABILITÉ POUR 500+ GROUPES SCOLAIRES
-- Indexes, vues matérialisées, fonctions optimisées, partitioning

-- =====================================================
-- 1. INDEXES CRITIQUES POUR LA PERFORMANCE
-- =====================================================

-- Index composé pour les requêtes fréquentes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_group_status_dates 
ON subscriptions (school_group_id, status, start_date, end_date);

-- Index pour les recherches full-text
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_school_groups_search 
ON school_groups USING gin(to_tsvector('french', name || ' ' || code || ' ' || COALESCE(description, '')));

-- Index pour les modules par plan (requête très fréquente)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_plan_modules_plan_module 
ON plan_modules (plan_id, module_id);

-- Index pour les configurations de groupe
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_module_configs_group_enabled 
ON group_module_configs (school_group_id, is_enabled, module_id);

-- Index partiel pour les abonnements actifs (90% des requêtes)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_active 
ON subscriptions (school_group_id, plan_id, end_date) 
WHERE status = 'active';

-- Index pour les logs de performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscription_logs_date_action 
ON subscription_logs (created_at DESC, action, subscription_id);

-- =====================================================
-- 2. VUES MATÉRIALISÉES POUR LES AGRÉGATIONS
-- =====================================================

-- Vue des modules par plan (évite les JOINs répétées)
CREATE MATERIALIZED VIEW IF NOT EXISTS plan_modules_view AS
SELECT 
  pm.plan_id,
  pm.module_id,
  m.name as module_name,
  m.slug as module_slug,
  m.icon as module_icon,
  m.color as module_color,
  m.category_id,
  bc.name as category_name,
  bc.color as category_color,
  bc.icon as category_icon
FROM plan_modules pm
JOIN modules m ON pm.module_id = m.id
LEFT JOIN business_categories bc ON m.category_id = bc.id
WHERE m.status = 'active'
AND bc.status = 'active';

-- Index sur la vue matérialisée
CREATE UNIQUE INDEX IF NOT EXISTS idx_plan_modules_view_plan_module 
ON plan_modules_view (plan_id, module_id);

-- Vue des statistiques globales (dashboard admin)
CREATE MATERIALIZED VIEW IF NOT EXISTS global_stats_view AS
SELECT 
  (SELECT COUNT(*) FROM school_groups WHERE status = 'active') as total_groups,
  (SELECT COUNT(*) FROM subscriptions WHERE status = 'active') as active_subscriptions,
  (SELECT COUNT(*) FROM modules WHERE status = 'active') as total_modules,
  (SELECT COUNT(*) FROM business_categories WHERE status = 'active') as total_categories,
  (SELECT COUNT(*) FROM users WHERE role = 'admin_groupe') as admin_users,
  (SELECT SUM(price) FROM subscription_plans sp JOIN subscriptions s ON sp.id = s.plan_id WHERE s.status = 'active') as total_revenue,
  NOW() as last_updated;

-- Vue des statistiques par région
CREATE MATERIALIZED VIEW IF NOT EXISTS regional_stats_view AS
SELECT 
  sg.region,
  COUNT(*) as total_groups,
  COUNT(CASE WHEN s.status = 'active' THEN 1 END) as active_groups,
  AVG(sp.price) as avg_plan_price,
  COUNT(DISTINCT s.plan_id) as unique_plans_used
FROM school_groups sg
LEFT JOIN subscriptions s ON sg.id = s.school_group_id
LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
GROUP BY sg.region;

-- =====================================================
-- 3. FONCTIONS OPTIMISÉES POUR LES OPÉRATIONS BULK
-- =====================================================

-- Fonction de recherche full-text optimisée
CREATE OR REPLACE FUNCTION search_school_groups_fts(
  search_query TEXT,
  result_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  code TEXT,
  region TEXT,
  plan_name TEXT,
  subscription_status TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sg.id,
    sg.name,
    sg.code,
    sg.region,
    sp.name as plan_name,
    s.status as subscription_status,
    ts_rank(to_tsvector('french', sg.name || ' ' || sg.code), plainto_tsquery('french', search_query)) as rank
  FROM school_groups sg
  LEFT JOIN subscriptions s ON sg.id = s.school_group_id AND s.status = 'active'
  LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
  WHERE to_tsvector('french', sg.name || ' ' || sg.code) @@ plainto_tsquery('french', search_query)
  ORDER BY rank DESC, sg.name
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Fonction d'agrégation régionale optimisée
CREATE OR REPLACE FUNCTION get_regional_aggregations()
RETURNS TABLE (
  region TEXT,
  total_groups BIGINT,
  active_subscriptions BIGINT,
  total_revenue NUMERIC,
  avg_modules_per_group NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sg.region,
    COUNT(*) as total_groups,
    COUNT(CASE WHEN s.status = 'active' THEN 1 END) as active_subscriptions,
    COALESCE(SUM(sp.price), 0) as total_revenue,
    AVG(module_counts.module_count) as avg_modules_per_group
  FROM school_groups sg
  LEFT JOIN subscriptions s ON sg.id = s.school_group_id AND s.status = 'active'
  LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
  LEFT JOIN (
    SELECT 
      school_group_id,
      COUNT(*) as module_count
    FROM group_module_configs
    WHERE is_enabled = true
    GROUP BY school_group_id
  ) module_counts ON sg.id = module_counts.school_group_id
  GROUP BY sg.region
  ORDER BY total_groups DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Fonction de création d'abonnements en masse
CREATE OR REPLACE FUNCTION bulk_create_subscriptions(
  group_ids UUID[],
  plan_id UUID,
  start_date TIMESTAMP DEFAULT NOW()
)
RETURNS TABLE (
  success_count INTEGER,
  error_count INTEGER,
  errors TEXT[]
) AS $$
DECLARE
  success_cnt INTEGER := 0;
  error_cnt INTEGER := 0;
  error_list TEXT[] := ARRAY[]::TEXT[];
  group_id UUID;
  end_date TIMESTAMP;
BEGIN
  -- Calculer la date de fin (1 an par défaut)
  end_date := start_date + INTERVAL '1 year';
  
  -- Traitement par groupe
  FOREACH group_id IN ARRAY group_ids
  LOOP
    BEGIN
      INSERT INTO subscriptions (
        id,
        school_group_id,
        plan_id,
        status,
        start_date,
        end_date,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        group_id,
        plan_id,
        'active',
        start_date,
        end_date,
        NOW(),
        NOW()
      );
      
      success_cnt := success_cnt + 1;
      
    EXCEPTION WHEN OTHERS THEN
      error_cnt := error_cnt + 1;
      error_list := error_list || (group_id::TEXT || ': ' || SQLERRM);
    END;
  END LOOP;
  
  RETURN QUERY SELECT success_cnt, error_cnt, error_list;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. TABLES DE LOGS ET AUDIT POUR LA SCALABILITÉ
-- =====================================================

-- Table des logs d'abonnement (partitionnée par mois)
CREATE TABLE IF NOT EXISTS subscription_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id),
  school_group_id UUID REFERENCES school_groups(id),
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  error_message TEXT,
  user_id UUID,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Partitions pour les logs (performance sur gros volumes)
CREATE TABLE IF NOT EXISTS subscription_logs_2024 PARTITION OF subscription_logs
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE IF NOT EXISTS subscription_logs_2025 PARTITION OF subscription_logs
FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- Table de monitoring des performances
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_name TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  group_count INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour les métriques de performance
CREATE INDEX IF NOT EXISTS idx_performance_metrics_operation_date 
ON performance_metrics (operation_name, created_at DESC);

-- =====================================================
-- 5. CONFIGURATION AUTO-SUBSCRIPTION PAR GROUPE
-- =====================================================

-- Ajouter la configuration d'auto-abonnement aux groupes
ALTER TABLE school_groups 
ADD COLUMN IF NOT EXISTS auto_subscription_config JSONB DEFAULT '{
  "auto_renewal": true,
  "billing_cycle": "yearly",
  "grace_period_days": 7,
  "auto_suspend_on_failure": true,
  "max_retry_attempts": 3,
  "notification_days_before_expiry": [30, 15, 7, 3, 1]
}'::jsonb;

-- Index pour la configuration auto
CREATE INDEX IF NOT EXISTS idx_school_groups_auto_config 
ON school_groups USING gin(auto_subscription_config);

-- =====================================================
-- 6. TRIGGERS POUR LA MAINTENANCE AUTOMATIQUE
-- =====================================================

-- Fonction de refresh des vues matérialisées
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY plan_modules_view;
  REFRESH MATERIALIZED VIEW CONCURRENTLY global_stats_view;
  REFRESH MATERIALIZED VIEW CONCURRENTLY regional_stats_view;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour logger les changements d'abonnement
CREATE OR REPLACE FUNCTION log_subscription_changes()
RETURNS trigger AS $$
BEGIN
  INSERT INTO subscription_logs (
    subscription_id,
    school_group_id,
    action,
    old_values,
    new_values,
    created_at
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.school_group_id, OLD.school_group_id),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
    NOW()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger
DROP TRIGGER IF EXISTS subscription_audit_trigger ON subscriptions;
CREATE TRIGGER subscription_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION log_subscription_changes();

-- =====================================================
-- 7. JOBS AUTOMATIQUES (À CONFIGURER AVEC pg_cron)
-- =====================================================

-- Refresh des vues matérialisées toutes les heures
-- SELECT cron.schedule('refresh-views', '0 * * * *', 'SELECT refresh_materialized_views();');

-- Nettoyage des logs anciens (garder 1 an)
-- SELECT cron.schedule('cleanup-logs', '0 2 * * *', 'DELETE FROM subscription_logs WHERE created_at < NOW() - INTERVAL ''1 year'';');

-- Traitement des renouvellements automatiques (quotidien)
-- SELECT cron.schedule('auto-renewals', '0 6 * * *', 'SELECT process_auto_renewals();');

-- =====================================================
-- 8. STATISTIQUES FINALES
-- =====================================================

-- Vérification de l'infrastructure
SELECT 
  'INFRASTRUCTURE SCALABILITÉ INSTALLÉE ✅' as status,
  CONCAT(
    'Indexes: ', (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%'),
    ' | Vues: ', (SELECT COUNT(*) FROM pg_matviews WHERE schemaname = 'public'),
    ' | Fonctions: ', (SELECT COUNT(*) FROM pg_proc WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND prokind = 'f'),
    ' | Triggers: ', (SELECT COUNT(*) FROM pg_trigger WHERE tgname LIKE '%audit%')
  ) as details;

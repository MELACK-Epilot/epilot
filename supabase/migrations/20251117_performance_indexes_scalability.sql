-- =====================================================
-- MIGRATION: INDEXES PERFORMANCE POUR 2000+ UTILISATEURS
-- Date: 17 Novembre 2025
-- Objectif: Optimiser queries pour scalabilité
-- =====================================================

-- =====================================================
-- 1. MODULES - Performance critique
-- =====================================================

-- Index sur school_group_id (FK)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_modules_school_group_id 
ON modules(school_group_id)
WHERE deleted_at IS NULL;

-- Index sur category_id (FK)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_modules_category_id 
ON modules(category_id)
WHERE deleted_at IS NULL;

-- Index composite pour filtrage
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_modules_school_group_category 
ON modules(school_group_id, category_id)
WHERE deleted_at IS NULL;

-- Index full-text search sur nom (avec trigram pour ILIKE)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_modules_name_trgm 
ON modules USING gin(name gin_trgm_ops);

-- Index pour tri par nom
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_modules_name_lower 
ON modules(LOWER(name))
WHERE deleted_at IS NULL;

-- =====================================================
-- 2. USER_MODULE_PERMISSIONS - Table la plus sollicitée
-- =====================================================

-- Index sur user_id (FK)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_modules_user_id 
ON user_module_permissions(user_id);

-- Index sur module_id (FK)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_modules_module_id 
ON user_module_permissions(module_id);

-- Index composite pour queries fréquentes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_modules_composite 
ON user_module_permissions(user_id, module_id);

-- Index pour stats par école
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_modules_school 
ON user_module_permissions(user_id, school_id)
WHERE deleted_at IS NULL;

-- Index pour created_at (historique)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_modules_created 
ON user_module_permissions(created_at DESC);

-- =====================================================
-- 3. USERS - Filtrage et recherche
-- =====================================================

-- Index sur school_group_id (FK)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_school_group_id 
ON users(school_group_id)
WHERE deleted_at IS NULL;

-- Index sur school_id (FK)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_school_id 
ON users(school_id)
WHERE deleted_at IS NULL;

-- Index sur role (filtrage fréquent)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role 
ON users(role)
WHERE deleted_at IS NULL;

-- Index sur status (filtrage actifs)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_status 
ON users(status)
WHERE deleted_at IS NULL;

-- Index composite pour page Permissions & Modules
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_school_group_role 
ON users(school_group_id, role)
WHERE deleted_at IS NULL;

-- Index full-text search sur nom/email
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_search_trgm 
ON users USING gin((first_name || ' ' || last_name || ' ' || email) gin_trgm_ops);

-- Index sur email (login)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_lower 
ON users(LOWER(email))
WHERE deleted_at IS NULL;

-- =====================================================
-- 4. CATEGORIES - Peu de données mais queries fréquentes
-- =====================================================

-- Index sur school_group_id (FK)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_school_group_id 
ON module_categories(school_group_id)
WHERE deleted_at IS NULL;

-- Index sur code (lookup)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_code 
ON module_categories(code)
WHERE deleted_at IS NULL;

-- =====================================================
-- 5. ACCESS_PROFILES - Lookup fréquent
-- =====================================================

-- Index sur code (FK dans users)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_access_profiles_code 
ON access_profiles(code);

-- =====================================================
-- 6. SCHOOLS - FK dans users
-- =====================================================

-- Index sur school_group_id (FK)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_schools_school_group_id 
ON schools(school_group_id)
WHERE deleted_at IS NULL;

-- =====================================================
-- STATISTIQUES - Mettre à jour après création indexes
-- =====================================================

ANALYZE modules;
ANALYZE user_module_permissions;
ANALYZE users;
ANALYZE module_categories;
ANALYZE access_profiles;
ANALYZE schools;

-- =====================================================
-- COMMENTAIRES
-- =====================================================

COMMENT ON INDEX idx_modules_school_group_id IS 'Performance: Filtrage modules par groupe scolaire';
COMMENT ON INDEX idx_modules_name_trgm IS 'Performance: Recherche full-text sur nom module (ILIKE)';
COMMENT ON INDEX idx_user_modules_composite IS 'Performance: Vérification assignation user+module';
COMMENT ON INDEX idx_users_search_trgm IS 'Performance: Recherche utilisateurs par nom/email';
COMMENT ON INDEX idx_users_school_group_role IS 'Performance: Page Permissions & Modules';

-- =====================================================
-- MONITORING - Vérifier utilisation indexes
-- =====================================================

-- Query pour vérifier utilisation indexes
-- SELECT 
--   schemaname,
--   tablename,
--   indexname,
--   idx_scan as scans,
--   idx_tup_read as tuples_read,
--   idx_tup_fetch as tuples_fetched
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;

-- =====================================================
-- FIN MIGRATION
-- =====================================================

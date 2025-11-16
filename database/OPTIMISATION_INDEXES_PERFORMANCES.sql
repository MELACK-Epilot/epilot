-- ⚡ OPTIMISATION PERFORMANCES - CRÉATION D'INDEXES
-- Date: 14 Novembre 2024
-- Objectif: Réduire le temps de chargement à la connexion

-- ============================================
-- 1. INDEX POUR USER_MODULES (Modules Proviseur)
-- ============================================

-- Index composite pour user_id + is_enabled
CREATE INDEX IF NOT EXISTS idx_user_modules_user_enabled 
ON user_modules(user_id, is_enabled) 
WHERE is_enabled = true;

-- Index pour les modules actifs
CREATE INDEX IF NOT EXISTS idx_user_modules_module_active 
ON user_modules(module_id) 
WHERE is_enabled = true;

-- Index pour le tri par date d'accès
CREATE INDEX IF NOT EXISTS idx_user_modules_last_accessed 
ON user_modules(user_id, last_accessed_at DESC NULLS LAST) 
WHERE is_enabled = true;

COMMENT ON INDEX idx_user_modules_user_enabled IS 
'Optimise la requête des modules par utilisateur (useProviseurModules)';

-- ============================================
-- 2. INDEX POUR STUDENTS (Élèves)
-- ============================================

-- Index composite pour school_id + status
CREATE INDEX IF NOT EXISTS idx_students_school_active 
ON students(school_id, status) 
WHERE status = 'active';

-- Index pour school_level_id
CREATE INDEX IF NOT EXISTS idx_students_level_active 
ON students(school_level_id, status) 
WHERE status = 'active';

-- Index pour class_id
CREATE INDEX IF NOT EXISTS idx_students_class_active 
ON students(class_id) 
WHERE status = 'active';

COMMENT ON INDEX idx_students_school_active IS 
'Optimise la requête des élèves par école (StudentsManagement)';

-- ============================================
-- 3. INDEX POUR CLASSES
-- ============================================

-- Index composite pour school_level_id + status
CREATE INDEX IF NOT EXISTS idx_classes_level_active 
ON classes(school_level_id, status) 
WHERE status = 'active';

-- Index pour school_id
CREATE INDEX IF NOT EXISTS idx_classes_school_active 
ON classes(school_id, status) 
WHERE status = 'active';

-- Index pour teacher_id
CREATE INDEX IF NOT EXISTS idx_classes_teacher 
ON classes(teacher_id) 
WHERE status = 'active';

COMMENT ON INDEX idx_classes_level_active IS 
'Optimise le comptage des classes par niveau (DirectorDashboard)';

-- ============================================
-- 4. INDEX POUR USERS (Personnel)
-- ============================================

-- Index composite pour school_id + role + status
CREATE INDEX IF NOT EXISTS idx_users_school_role_active 
ON users(school_id, role, status) 
WHERE status = 'active';

-- Index pour school_group_id
CREATE INDEX IF NOT EXISTS idx_users_group_active 
ON users(school_group_id, status) 
WHERE status = 'active';

-- Index pour le tri par nom
CREATE INDEX IF NOT EXISTS idx_users_name 
ON users(last_name, first_name) 
WHERE status = 'active';

COMMENT ON INDEX idx_users_school_role_active IS 
'Optimise la requête du personnel par école et rôle (PersonnelManagement)';

-- ============================================
-- 5. INDEX POUR SCHOOL_LEVELS
-- ============================================

-- Index composite pour school_group_id + status
CREATE INDEX IF NOT EXISTS idx_school_levels_group_active 
ON school_levels(school_group_id, status) 
WHERE status = 'active';

-- Index pour le tri par ordre
CREATE INDEX IF NOT EXISTS idx_school_levels_order 
ON school_levels(school_group_id, "order") 
WHERE status = 'active';

COMMENT ON INDEX idx_school_levels_group_active IS 
'Optimise la requête des niveaux scolaires (DirectorDashboard, StudentsManagement)';

-- ============================================
-- 6. INDEX POUR PAYMENTS
-- ============================================

-- Index composite pour school_id + payment_date
CREATE INDEX IF NOT EXISTS idx_payments_school_date 
ON payments(school_id, payment_date DESC) 
WHERE status = 'completed';

-- Index pour school_level_id
CREATE INDEX IF NOT EXISTS idx_payments_level_completed 
ON payments(school_level_id, status) 
WHERE status = 'completed';

-- Index pour le montant et la date
CREATE INDEX IF NOT EXISTS idx_payments_amount_date 
ON payments(school_id, amount, payment_date DESC) 
WHERE status = 'completed';

COMMENT ON INDEX idx_payments_school_date IS 
'Optimise le calcul des revenus par école (DirectorDashboard)';

-- ============================================
-- 7. INDEX POUR MODULES
-- ============================================

-- Index pour status + category_id
CREATE INDEX IF NOT EXISTS idx_modules_status_category 
ON modules(status, category_id) 
WHERE status = 'active';

-- Index pour slug (recherche rapide)
CREATE INDEX IF NOT EXISTS idx_modules_slug 
ON modules(slug) 
WHERE status = 'active';

COMMENT ON INDEX idx_modules_status_category IS 
'Optimise les JOINs avec user_modules';

-- ============================================
-- 8. INDEX POUR BUSINESS_CATEGORIES
-- ============================================

-- Index pour status
CREATE INDEX IF NOT EXISTS idx_business_categories_active 
ON business_categories(status) 
WHERE status = 'active';

-- Index pour slug
CREATE INDEX IF NOT EXISTS idx_business_categories_slug 
ON business_categories(slug) 
WHERE status = 'active';

COMMENT ON INDEX idx_business_categories_active IS 
'Optimise les JOINs avec modules';

-- ============================================
-- 9. ANALYSER LES TABLES
-- ============================================

-- Mettre à jour les statistiques pour l'optimiseur de requêtes
ANALYZE user_modules;
ANALYZE students;
ANALYZE classes;
ANALYZE users;
ANALYZE school_levels;
ANALYZE payments;
ANALYZE modules;
ANALYZE business_categories;

-- ============================================
-- 10. VÉRIFICATION DES INDEXES
-- ============================================

-- Afficher tous les indexes créés
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef,
  pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'user_modules', 
    'students', 
    'classes', 
    'users', 
    'school_levels', 
    'payments',
    'modules',
    'business_categories'
  )
ORDER BY tablename, indexname;

-- ============================================
-- 11. STATISTIQUES D'UTILISATION
-- ============================================

-- Vérifier l'utilisation des indexes (après quelques jours)
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'user_modules', 
    'students', 
    'classes', 
    'users', 
    'school_levels', 
    'payments'
  )
ORDER BY idx_scan DESC;

-- ============================================
-- 12. VACUUM ET REINDEX (Maintenance)
-- ============================================

-- À exécuter périodiquement pour maintenir les performances
-- VACUUM ANALYZE user_modules;
-- VACUUM ANALYZE students;
-- VACUUM ANALYZE classes;
-- VACUUM ANALYZE users;
-- VACUUM ANALYZE school_levels;
-- VACUUM ANALYZE payments;

-- ============================================
-- NOTES D'UTILISATION
-- ============================================

/*
IMPACT ATTENDU:
- Réduction de 50-70% du temps de requête
- Amélioration significative du temps de connexion
- Meilleure performance des dashboards

COMMENT TESTER:
1. Exécuter ce script dans Supabase SQL Editor
2. Vérifier les indexes créés avec la requête de vérification
3. Tester la connexion et mesurer le temps
4. Comparer avec les performances avant optimisation

MAINTENANCE:
- Exécuter ANALYZE après des modifications massives de données
- Surveiller l'utilisation des indexes avec pg_stat_user_indexes
- Reindex si nécessaire (rarement nécessaire avec PostgreSQL moderne)

ROLLBACK (si nécessaire):
DROP INDEX IF EXISTS idx_user_modules_user_enabled;
DROP INDEX IF EXISTS idx_students_school_active;
-- etc...
*/

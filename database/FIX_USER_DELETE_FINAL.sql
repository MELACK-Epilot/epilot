/**
 * Correction finale pour permettre la suppression d'utilisateurs
 * Rend les colonnes assigned_by/created_by nullable et corrige les contraintes FK
 * @module FIX_USER_DELETE_FINAL
 */

-- =====================================================
-- ÉTAPE 1 : RENDRE LES COLONNES NULLABLE
-- =====================================================

-- user_module_permissions.assigned_by
ALTER TABLE user_module_permissions 
ALTER COLUMN assigned_by DROP NOT NULL;

-- user_assigned_modules.assigned_by
ALTER TABLE user_assigned_modules 
ALTER COLUMN assigned_by DROP NOT NULL;

-- user_assigned_categories.assigned_by
ALTER TABLE user_assigned_categories 
ALTER COLUMN assigned_by DROP NOT NULL;

-- user_categories.assigned_by (déjà nullable selon la liste)
-- user_modules.assigned_by (déjà nullable selon la liste)

-- assignment_profiles.created_by
ALTER TABLE assignment_profiles 
ALTER COLUMN created_by DROP NOT NULL;

-- fee_payments.created_by
ALTER TABLE fee_payments 
ALTER COLUMN created_by DROP NOT NULL;

-- group_business_categories.enabled_by et disabled_by
ALTER TABLE group_business_categories 
ALTER COLUMN enabled_by DROP NOT NULL;

ALTER TABLE group_business_categories 
ALTER COLUMN disabled_by DROP NOT NULL;

-- group_module_configs.enabled_by et disabled_by
ALTER TABLE group_module_configs 
ALTER COLUMN enabled_by DROP NOT NULL;

ALTER TABLE group_module_configs 
ALTER COLUMN disabled_by DROP NOT NULL;

-- school_expenses.created_by et approved_by
ALTER TABLE school_expenses 
ALTER COLUMN created_by DROP NOT NULL;

ALTER TABLE school_expenses 
ALTER COLUMN approved_by DROP NOT NULL;

-- system_alerts.read_by et resolved_by
ALTER TABLE system_alerts 
ALTER COLUMN read_by DROP NOT NULL;

ALTER TABLE system_alerts 
ALTER COLUMN resolved_by DROP NOT NULL;

-- deletion_logs.deleted_by
ALTER TABLE deletion_logs 
ALTER COLUMN deleted_by DROP NOT NULL;

DO $$
BEGIN
  RAISE NOTICE '✅ Colonnes rendues nullable';
END $$;

-- =====================================================
-- ÉTAPE 2 : CORRIGER LES CONTRAINTES FK (NO ACTION → SET NULL)
-- =====================================================

-- user_module_permissions.assigned_by (déjà SET NULL)
-- Vérifier et corriger si nécessaire
DO $$
BEGIN
  ALTER TABLE user_module_permissions DROP CONSTRAINT IF EXISTS user_module_permissions_assigned_by_fkey;
  ALTER TABLE user_module_permissions
  ADD CONSTRAINT user_module_permissions_assigned_by_fkey
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL;
  RAISE NOTICE '✅ user_module_permissions.assigned_by → SET NULL';
END $$;

-- user_assigned_modules.assigned_by
DO $$
BEGIN
  ALTER TABLE user_assigned_modules DROP CONSTRAINT IF EXISTS user_assigned_modules_assigned_by_fkey;
  ALTER TABLE user_assigned_modules
  ADD CONSTRAINT user_assigned_modules_assigned_by_fkey
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL;
  RAISE NOTICE '✅ user_assigned_modules.assigned_by → SET NULL';
END $$;

-- user_assigned_categories.assigned_by
DO $$
BEGIN
  ALTER TABLE user_assigned_categories DROP CONSTRAINT IF EXISTS user_assigned_categories_assigned_by_fkey;
  ALTER TABLE user_assigned_categories
  ADD CONSTRAINT user_assigned_categories_assigned_by_fkey
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL;
  RAISE NOTICE '✅ user_assigned_categories.assigned_by → SET NULL';
END $$;

-- assignment_profiles.created_by
DO $$
BEGIN
  ALTER TABLE assignment_profiles DROP CONSTRAINT IF EXISTS assignment_profiles_created_by_fkey;
  ALTER TABLE assignment_profiles
  ADD CONSTRAINT assignment_profiles_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
  RAISE NOTICE '✅ assignment_profiles.created_by → SET NULL';
END $$;

-- fee_payments.created_by
DO $$
BEGIN
  ALTER TABLE fee_payments DROP CONSTRAINT IF EXISTS fee_payments_created_by_fkey;
  ALTER TABLE fee_payments
  ADD CONSTRAINT fee_payments_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
  RAISE NOTICE '✅ fee_payments.created_by → SET NULL';
END $$;

-- group_business_categories.enabled_by
DO $$
BEGIN
  ALTER TABLE group_business_categories DROP CONSTRAINT IF EXISTS group_business_categories_enabled_by_fkey;
  ALTER TABLE group_business_categories
  ADD CONSTRAINT group_business_categories_enabled_by_fkey
  FOREIGN KEY (enabled_by) REFERENCES users(id) ON DELETE SET NULL;
  RAISE NOTICE '✅ group_business_categories.enabled_by → SET NULL';
END $$;

-- group_business_categories.disabled_by
DO $$
BEGIN
  ALTER TABLE group_business_categories DROP CONSTRAINT IF EXISTS group_business_categories_disabled_by_fkey;
  ALTER TABLE group_business_categories
  ADD CONSTRAINT group_business_categories_disabled_by_fkey
  FOREIGN KEY (disabled_by) REFERENCES users(id) ON DELETE SET NULL;
  RAISE NOTICE '✅ group_business_categories.disabled_by → SET NULL';
END $$;

-- group_module_configs.enabled_by
DO $$
BEGIN
  ALTER TABLE group_module_configs DROP CONSTRAINT IF EXISTS group_module_configs_enabled_by_fkey;
  ALTER TABLE group_module_configs
  ADD CONSTRAINT group_module_configs_enabled_by_fkey
  FOREIGN KEY (enabled_by) REFERENCES users(id) ON DELETE SET NULL;
  RAISE NOTICE '✅ group_module_configs.enabled_by → SET NULL';
END $$;

-- group_module_configs.disabled_by
DO $$
BEGIN
  ALTER TABLE group_module_configs DROP CONSTRAINT IF EXISTS group_module_configs_disabled_by_fkey;
  ALTER TABLE group_module_configs
  ADD CONSTRAINT group_module_configs_disabled_by_fkey
  FOREIGN KEY (disabled_by) REFERENCES users(id) ON DELETE SET NULL;
  RAISE NOTICE '✅ group_module_configs.disabled_by → SET NULL';
END $$;

-- inscriptions.agent_inscription_id
DO $$
BEGIN
  ALTER TABLE inscriptions DROP CONSTRAINT IF EXISTS inscriptions_agent_inscription_id_fkey;
  ALTER TABLE inscriptions
  ADD CONSTRAINT inscriptions_agent_inscription_id_fkey
  FOREIGN KEY (agent_inscription_id) REFERENCES users(id) ON DELETE SET NULL;
  RAISE NOTICE '✅ inscriptions.agent_inscription_id → SET NULL';
END $$;

-- school_expenses.created_by
DO $$
BEGIN
  ALTER TABLE school_expenses DROP CONSTRAINT IF EXISTS school_expenses_created_by_fkey;
  ALTER TABLE school_expenses
  ADD CONSTRAINT school_expenses_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
  RAISE NOTICE '✅ school_expenses.created_by → SET NULL';
END $$;

-- school_expenses.approved_by
DO $$
BEGIN
  ALTER TABLE school_expenses DROP CONSTRAINT IF EXISTS school_expenses_approved_by_fkey;
  ALTER TABLE school_expenses
  ADD CONSTRAINT school_expenses_approved_by_fkey
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;
  RAISE NOTICE '✅ school_expenses.approved_by → SET NULL';
END $$;

-- system_alerts.read_by
DO $$
BEGIN
  ALTER TABLE system_alerts DROP CONSTRAINT IF EXISTS system_alerts_read_by_fkey;
  ALTER TABLE system_alerts
  ADD CONSTRAINT system_alerts_read_by_fkey
  FOREIGN KEY (read_by) REFERENCES users(id) ON DELETE SET NULL;
  RAISE NOTICE '✅ system_alerts.read_by → SET NULL';
END $$;

-- system_alerts.resolved_by
DO $$
BEGIN
  ALTER TABLE system_alerts DROP CONSTRAINT IF EXISTS system_alerts_resolved_by_fkey;
  ALTER TABLE system_alerts
  ADD CONSTRAINT system_alerts_resolved_by_fkey
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL;
  RAISE NOTICE '✅ system_alerts.resolved_by → SET NULL';
END $$;

-- deletion_logs.deleted_by
DO $$
BEGIN
  ALTER TABLE deletion_logs DROP CONSTRAINT IF EXISTS deletion_logs_deleted_by_fkey;
  ALTER TABLE deletion_logs
  ADD CONSTRAINT deletion_logs_deleted_by_fkey
  FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;
  RAISE NOTICE '✅ deletion_logs.deleted_by → SET NULL';
END $$;

-- =====================================================
-- ÉTAPE 3 : CORRIGER LA CONTRAINTE BLOQUANTE schools.admin_id
-- =====================================================

-- schools.admin_id (RESTRICT → SET NULL)
DO $$
BEGIN
  ALTER TABLE schools DROP CONSTRAINT IF EXISTS schools_admin_id_fkey;
  ALTER TABLE schools
  ADD CONSTRAINT schools_admin_id_fkey
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL;
  RAISE NOTICE '✅ schools.admin_id → SET NULL (était RESTRICT)';
END $$;

-- =====================================================
-- MESSAGES DE CONFIRMATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 CORRECTION COMPLÈTE TERMINÉE !';
  RAISE NOTICE '';
  RAISE NOTICE '✅ COLONNES RENDUES NULLABLE :';
  RAISE NOTICE '   - user_module_permissions.assigned_by';
  RAISE NOTICE '   - user_assigned_modules.assigned_by';
  RAISE NOTICE '   - user_assigned_categories.assigned_by';
  RAISE NOTICE '   - assignment_profiles.created_by';
  RAISE NOTICE '   - fee_payments.created_by';
  RAISE NOTICE '   - group_business_categories.enabled_by/disabled_by';
  RAISE NOTICE '   - group_module_configs.enabled_by/disabled_by';
  RAISE NOTICE '   - school_expenses.created_by/approved_by';
  RAISE NOTICE '   - system_alerts.read_by/resolved_by';
  RAISE NOTICE '   - deletion_logs.deleted_by';
  RAISE NOTICE '';
  RAISE NOTICE '✅ CONTRAINTES FK CORRIGÉES (ON DELETE SET NULL) :';
  RAISE NOTICE '   - Toutes les colonnes assigned_by/created_by/enabled_by/etc.';
  RAISE NOTICE '   - schools.admin_id (était RESTRICT)';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 COMPORTEMENT :';
  RAISE NOTICE '   - Suppression utilisateur → colonnes = NULL';
  RAISE NOTICE '   - Historique préservé';
  RAISE NOTICE '   - Pas de blocage';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Vous pouvez maintenant supprimer des utilisateurs sans erreur !';
END $$;

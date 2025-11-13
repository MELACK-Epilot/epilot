-- ============================================
-- E-PILOT CONGO - RESET COMPLET DE LA BASE
-- ATTENTION: Supprime TOUTES les données existantes
-- ============================================

-- ============================================
-- SUPPRESSION DE TOUT LE SCHÉMA EXISTANT
-- ============================================

-- Désactiver RLS temporairement
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS school_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS schools DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS business_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS modules DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications DISABLE ROW LEVEL SECURITY;

-- Supprimer les politiques RLS
DROP POLICY IF EXISTS "Super Admin can view all users" ON users;
DROP POLICY IF EXISTS "Admin Groupe can view their group users" ON users;
DROP POLICY IF EXISTS "Admin École can view their school users" ON users;
DROP POLICY IF EXISTS "Super Admin can view all school groups" ON school_groups;
DROP POLICY IF EXISTS "Admin Groupe can view their groups" ON school_groups;

-- Supprimer les triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_school_groups_updated_at ON school_groups;
DROP TRIGGER IF EXISTS update_schools_updated_at ON schools;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Supprimer les tables (dans l'ordre des dépendances)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS modules CASCADE;
DROP TABLE IF EXISTS business_categories CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS plans CASCADE;
DROP TABLE IF EXISTS schools CASCADE;
DROP TABLE IF EXISTS school_groups CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Supprimer les types enum
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS subscription_plan CASCADE;
DROP TYPE IF EXISTS status CASCADE;
DROP TYPE IF EXISTS subscription_status CASCADE;

-- ============================================
-- MESSAGE D'AVERTISSEMENT
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Reset complet de la base de données effectué.';
  RAISE NOTICE 'TOUTES LES DONNÉES ONT ÉTÉ SUPPRIMÉES.';
  RAISE NOTICE 'Vous pouvez maintenant exécuter SUPABASE_SQL_SCHEMA.sql pour recréer le schéma complet.';
END $$;

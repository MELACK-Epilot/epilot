-- ============================================
-- E-PILOT CONGO - NETTOYAGE BASE DE DONNÉES
-- Supprime toutes les tables et types existants
-- ============================================

-- Désactiver temporairement les contraintes de clés étrangères
SET session_replication_role = 'replica';

-- Supprimer les tables dans l'ordre inverse des dépendances
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS modules CASCADE;
DROP TABLE IF EXISTS business_categories CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS plans CASCADE;
DROP TABLE IF EXISTS schools CASCADE;
DROP TABLE IF EXISTS school_groups CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Supprimer les types (enums)
DROP TYPE IF EXISTS subscription_status CASCADE;
DROP TYPE IF EXISTS status CASCADE;
DROP TYPE IF EXISTS subscription_plan CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Réactiver les contraintes
SET session_replication_role = 'origin';

-- Message de confirmation
SELECT 'Base de données nettoyée avec succès!' AS message;

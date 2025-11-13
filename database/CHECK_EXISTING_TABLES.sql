-- Script de vérification des tables existantes
-- Exécute ce script pour voir quelle structure de fee_payments existe déjà

-- 1. Vérifier si la table existe
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'fee_payments';

-- 2. Voir la structure de la table fee_payments
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'fee_payments'
ORDER BY ordinal_position;

-- 3. Vérifier toutes les tables financières
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('school_fees', 'student_fees', 'fee_payments', 'school_expenses', 'payment_plans')
ORDER BY table_name;

-- ============================================
-- VÉRIFICATION ÉTAT ACTUEL SUPABASE
-- Date: 29 Octobre 2025
-- ============================================

-- 1. VÉRIFIER L'ENUM user_role ACTUEL
-- ============================================
SELECT enumlabel as "Rôles actuels"
FROM pg_enum 
WHERE enumtypid = (
  SELECT oid 
  FROM pg_type 
  WHERE typname = 'user_role'
)
ORDER BY enumsortorder;

-- 2. VÉRIFIER LA STRUCTURE DE LA TABLE users
-- ============================================
SELECT 
  column_name as "Colonne",
  data_type as "Type",
  is_nullable as "Nullable",
  column_default as "Défaut"
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 3. VÉRIFIER TOUTES LES TABLES QUI EXISTENT
-- ============================================
SELECT 
  table_name as "Tables existantes"
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 4. VÉRIFIER LES TABLES QUI UTILISENT user_role
-- ============================================
SELECT 
  table_name as "Table",
  column_name as "Colonne"
FROM information_schema.columns 
WHERE udt_name = 'user_role'
ORDER BY table_name, column_name;

-- 5. VÉRIFIER TOUTES LES POLITIQUES RLS
-- ============================================
SELECT 
  tablename as "Table",
  policyname as "Politique",
  cmd as "Commande"
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 6. VÉRIFIER L'ÉTAT DU RLS SUR CHAQUE TABLE
-- ============================================
SELECT 
  tablename as "Table",
  CASE 
    WHEN rowsecurity THEN 'ACTIVÉ ✅'
    ELSE 'DÉSACTIVÉ ❌'
  END as "RLS"
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 7. VÉRIFIER LES INDEX SUR users
-- ============================================
SELECT 
  indexname as "Index",
  indexdef as "Définition"
FROM pg_indexes 
WHERE tablename = 'users'
ORDER BY indexname;

-- 8. COMPTER LES UTILISATEURS PAR RÔLE
-- ============================================
SELECT 
  role as "Rôle",
  COUNT(*) as "Nombre"
FROM users
GROUP BY role
ORDER BY role;

-- =====================================================
-- VÉRIFIER TOUTES LES RÉFÉRENCES À admin_id
-- Date : 3 novembre 2025
-- =====================================================

-- =====================================================
-- 1. VÉRIFIER LES COLONNES
-- =====================================================

-- Chercher admin_id dans toutes les tables
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE column_name = 'admin_id'
  AND table_schema = 'public'
ORDER BY table_name;

-- =====================================================
-- 2. VÉRIFIER LES POLICIES RLS
-- =====================================================

-- Lister toutes les policies qui mentionnent admin_id
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE qual::text LIKE '%admin_id%'
   OR with_check::text LIKE '%admin_id%'
ORDER BY tablename, policyname;

-- =====================================================
-- 3. VÉRIFIER LES TRIGGERS
-- =====================================================

-- Lister tous les triggers
SELECT 
  trigger_name,
  event_object_table,
  action_statement,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- 4. VÉRIFIER LES FONCTIONS
-- =====================================================

-- Chercher les fonctions qui mentionnent admin_id
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_definition LIKE '%admin_id%'
ORDER BY routine_name;

-- =====================================================
-- 5. VÉRIFIER LES VUES
-- =====================================================

-- Lister toutes les vues
SELECT 
  table_name,
  view_definition
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- =====================================================
-- 6. VÉRIFIER LES CONTRAINTES
-- =====================================================

-- Lister les contraintes foreign key
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND (kcu.column_name = 'admin_id' OR ccu.column_name = 'admin_id')
ORDER BY tc.table_name;

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================

/*
COLONNES admin_id :
- schools.admin_id → OK (directeur d'école)
- school_groups.admin_id → DOIT ÊTRE ABSENT

POLICIES :
- Aucune policy ne doit mentionner school_groups.admin_id

TRIGGERS :
- Vérifier qu'aucun trigger n'utilise school_groups.admin_id

FONCTIONS :
- get_school_group_admin() → OK (utilise users.school_group_id)
- is_admin_of_group() → OK (utilise users.school_group_id)

VUES :
- school_groups_with_admin → OK (jointure via users)

CONTRAINTES :
- schools.admin_id → users.id → OK
- school_groups.admin_id → DOIT ÊTRE ABSENT
*/

-- ============================================
-- COMPARAISON : UUIDs des groupes vs utilisateurs
-- Date: 10 novembre 2025, 14h09
-- ============================================

-- On sait que ces 3 utilisateurs existent :
-- - vianney@epilot.cg → groupe 914d2ced-663a-4732-a521-edcc2423a012 (LAMARELLE)
-- - intel@epilot.cg → groupe 413976b5-c758-40a0-b026-5a8146542fd1 (L'INTELIGENCE CELESTE)
-- - anais@epilot.cg → groupe 413976b5-c758-40a0-b026-5a8146542fd1 (L'INTELIGENCE CELESTE)

-- 1. Vérifier les UUIDs des groupes qui ont le module
SELECT 
  '=== Groupes avec module "Admission des élèves" ===' as etape,
  gmc.school_group_id,
  sg.name as groupe_name,
  gmc.is_enabled
FROM group_module_configs gmc
JOIN modules m ON m.id = gmc.module_id
JOIN school_groups sg ON sg.id = gmc.school_group_id
WHERE m.name = 'Admission des élèves'
  AND gmc.is_enabled = true;

-- 2. Vérifier si ces UUIDs correspondent aux utilisateurs
SELECT 
  '=== Utilisateurs avec ces UUIDs ===' as etape,
  u.email,
  u.school_group_id,
  CASE 
    WHEN u.school_group_id = '914d2ced-663a-4732-a521-edcc2423a012' THEN 'LAMARELLE ✅'
    WHEN u.school_group_id = '413976b5-c758-40a0-b026-5a8146542fd1' THEN 'L''INTELIGENCE CELESTE ✅'
    ELSE 'Autre groupe ❌'
  END as groupe_match
FROM users u
WHERE u.school_group_id IN (
  '914d2ced-663a-4732-a521-edcc2423a012',
  '413976b5-c758-40a0-b026-5a8146542fd1'
)
AND u.status = 'active';

-- 3. Test avec la requête EXACTE du hook
-- Simuler : .in('school_group_id', groupIds)
SELECT 
  '=== Test opérateur IN ===' as etape,
  COUNT(*) as count_result
FROM users
WHERE school_group_id IN (
  SELECT gmc.school_group_id
  FROM group_module_configs gmc
  JOIN modules m ON m.id = gmc.module_id
  WHERE m.name = 'Admission des élèves'
    AND gmc.is_enabled = true
)
AND status = 'active';

-- 4. Vérifier s'il y a des espaces ou caractères invisibles dans les UUIDs
SELECT 
  '=== Vérification format UUIDs ===' as etape,
  school_group_id,
  LENGTH(school_group_id::text) as longueur,
  school_group_id::text = TRIM(school_group_id::text) as pas_espaces
FROM users
WHERE email IN ('vianney@epilot.cg', 'intel@epilot.cg', 'anais@epilot.cg');

-- 5. Vérifier le type de données
SELECT 
  '=== Type de données school_group_id ===' as etape,
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name = 'school_group_id';

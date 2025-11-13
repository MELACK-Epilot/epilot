-- ============================================
-- VÉRIFICATION : Activité "17h" est-elle vraie ?
-- Date: 10 novembre 2025, 14h15
-- ============================================

-- 1. Vérifier la dernière activation du module "Admission des élèves"
SELECT 
  '=== DERNIÈRE ACTIVATION ===' as etape,
  gmc.enabled_at,
  NOW() - gmc.enabled_at as temps_ecoule,
  EXTRACT(EPOCH FROM (NOW() - gmc.enabled_at)) / 3600 as heures_ecoulees,
  sg.name as groupe_name,
  m.name as module_name
FROM group_module_configs gmc
JOIN modules m ON m.id = gmc.module_id
JOIN school_groups sg ON sg.id = gmc.school_group_id
WHERE m.name = 'Admission des élèves'
  AND gmc.is_enabled = true
ORDER BY gmc.enabled_at DESC
LIMIT 1;

-- 2. Vérifier TOUTES les activations de ce module
SELECT 
  '=== TOUTES LES ACTIVATIONS ===' as etape,
  gmc.enabled_at,
  EXTRACT(EPOCH FROM (NOW() - gmc.enabled_at)) / 3600 as heures_ecoulees,
  sg.name as groupe_name,
  gmc.is_enabled
FROM group_module_configs gmc
JOIN modules m ON m.id = gmc.module_id
JOIN school_groups sg ON sg.id = gmc.school_group_id
WHERE m.name = 'Admission des élèves'
ORDER BY gmc.enabled_at DESC;

-- 3. Vérifier si enabled_at est NULL
SELECT 
  '=== VÉRIFICATION NULL ===' as etape,
  COUNT(*) as total,
  COUNT(enabled_at) as avec_date,
  COUNT(*) - COUNT(enabled_at) as sans_date
FROM group_module_configs gmc
JOIN modules m ON m.id = gmc.module_id
WHERE m.name = 'Admission des élèves'
  AND gmc.is_enabled = true;

-- 4. Calculer le temps écoulé en format lisible
SELECT 
  '=== FORMAT LISIBLE ===' as etape,
  gmc.enabled_at,
  CASE 
    WHEN EXTRACT(EPOCH FROM (NOW() - gmc.enabled_at)) < 60 THEN 
      FLOOR(EXTRACT(EPOCH FROM (NOW() - gmc.enabled_at))) || 's'
    WHEN EXTRACT(EPOCH FROM (NOW() - gmc.enabled_at)) < 3600 THEN 
      FLOOR(EXTRACT(EPOCH FROM (NOW() - gmc.enabled_at)) / 60) || 'min'
    WHEN EXTRACT(EPOCH FROM (NOW() - gmc.enabled_at)) < 86400 THEN 
      FLOOR(EXTRACT(EPOCH FROM (NOW() - gmc.enabled_at)) / 3600) || 'h'
    ELSE 
      FLOOR(EXTRACT(EPOCH FROM (NOW() - gmc.enabled_at)) / 86400) || 'j'
  END as temps_format,
  sg.name as groupe_name
FROM group_module_configs gmc
JOIN modules m ON m.id = gmc.module_id
JOIN school_groups sg ON sg.id = gmc.school_group_id
WHERE m.name = 'Admission des élèves'
  AND gmc.is_enabled = true
ORDER BY gmc.enabled_at DESC
LIMIT 1;

-- 5. Vérifier si c'est bien 17 heures
SELECT 
  '=== VÉRIFICATION 17H ===' as etape,
  gmc.enabled_at,
  NOW() as maintenant,
  NOW() - gmc.enabled_at as difference,
  EXTRACT(EPOCH FROM (NOW() - gmc.enabled_at)) / 3600 as heures_exactes,
  CASE 
    WHEN FLOOR(EXTRACT(EPOCH FROM (NOW() - gmc.enabled_at)) / 3600) = 17 THEN '✅ OUI, c''est bien 17h'
    ELSE '❌ NON, c''est ' || FLOOR(EXTRACT(EPOCH FROM (NOW() - gmc.enabled_at)) / 3600) || 'h'
  END as verification
FROM group_module_configs gmc
JOIN modules m ON m.id = gmc.module_id
WHERE m.name = 'Admission des élèves'
  AND gmc.is_enabled = true
ORDER BY gmc.enabled_at DESC
LIMIT 1;

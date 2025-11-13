-- ============================================================================
-- FIX : Assigner les utilisateurs à leurs groupes scolaires
-- ============================================================================
-- Date : 1er novembre 2025
-- Problème : "Votre compte n'est pas associé à un groupe scolaire"
-- Solution : Mettre à jour school_group_id dans profiles

-- 1. Vérifier les groupes scolaires existants
SELECT 
  id,
  name,
  code,
  city
FROM school_groups
ORDER BY name;

-- 2. Vérifier les utilisateurs sans groupe
SELECT 
  email,
  name,
  role,
  school_group_id,
  is_active
FROM profiles
WHERE school_group_id IS NULL
ORDER BY email;

-- 3. Assigner int@epilot.com au groupe LAMARELLE
-- (Remplacer l'UUID par celui de votre groupe LAMARELLE)
UPDATE profiles
SET school_group_id = '7ee9cdef-9f4b-41a6-992b-e04922345e98'
WHERE email = 'int@epilot.com';

-- 4. Assigner lam@epilot.cg au groupe LAMARELLE
UPDATE profiles
SET school_group_id = '7ee9cdef-9f4b-41a6-992b-e04922345e98'
WHERE email = 'lam@epilot.cg';

-- 5. Assigner ana@epilot.cg au groupe LAMARELLE
UPDATE profiles
SET school_group_id = '7ee9cdef-9f4b-41a6-992b-e04922345e98'
WHERE email = 'ana@epilot.cg';

-- 6. Le Super Admin (admin@epilot.cg) n'a PAS besoin de school_group_id
-- Il reste NULL pour avoir accès à tout

-- 7. Vérifier les assignations
SELECT 
  p.email,
  p.name,
  p.role,
  p.is_active,
  p.school_group_id,
  sg.name as groupe_scolaire,
  sg.code as code_groupe
FROM profiles p
LEFT JOIN school_groups sg ON p.school_group_id = sg.id
ORDER BY p.email;

-- 8. Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Utilisateurs assignés aux groupes scolaires !';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Résumé :';
  RAISE NOTICE '- int@epilot.com → LAMARELLE';
  RAISE NOTICE '- lam@epilot.cg → LAMARELLE';
  RAISE NOTICE '- ana@epilot.cg → LAMARELLE';
  RAISE NOTICE '- admin@epilot.cg → Aucun groupe (Super Admin)';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Vous pouvez maintenant vous connecter !';
END $$;

-- ============================================================================
-- ALTERNATIVE : Si vous ne connaissez pas l'UUID du groupe LAMARELLE
-- ============================================================================

-- Méthode 1 : Trouver l'UUID du groupe par son nom
SELECT id, name, code 
FROM school_groups 
WHERE name ILIKE '%LAMARELLE%';

-- Méthode 2 : Assigner automatiquement en utilisant le nom
UPDATE profiles
SET school_group_id = (
  SELECT id FROM school_groups WHERE name ILIKE '%LAMARELLE%' LIMIT 1
)
WHERE email IN ('int@epilot.com', 'lam@epilot.cg', 'ana@epilot.cg');

-- ============================================================================
-- VÉRIFICATION FINALE
-- ============================================================================

-- Vérifier que tous les admin_groupe ont un school_group_id
SELECT 
  email,
  role,
  school_group_id,
  CASE 
    WHEN school_group_id IS NULL THEN '❌ Manquant'
    ELSE '✅ OK'
  END as statut
FROM profiles
WHERE role = 'admin_groupe';

-- Résultat attendu : Tous les admin_groupe doivent avoir un school_group_id

-- ============================================
-- VÉRIFICATION UTILISATEUR PROVISEUR
-- ============================================
-- Date: 4 Novembre 2025
-- Objectif: Diagnostiquer pourquoi l'espace utilisateur est vide
-- ============================================

-- 1️⃣ VÉRIFIER QUE L'UTILISATEUR EXISTE
-- ============================================
SELECT 
  id,
  email,
  first_name,
  last_name,
  role,
  school_id,
  school_group_id,
  status,
  created_at
FROM users
WHERE email = 'REMPLACER_PAR_EMAIL_PROVISEUR@example.com';

-- ✅ Résultat attendu :
-- - 1 ligne retournée
-- - role = 'proviseur'
-- - school_group_id NOT NULL
-- - first_name NOT NULL
-- - last_name NOT NULL
-- - status = 'active'

-- ============================================
-- 2️⃣ VÉRIFIER LES DONNÉES COMPLÈTES
-- ============================================
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.role,
  u.status,
  u.school_id,
  u.school_group_id,
  s.name as school_name,
  s.status as school_status,
  sg.name as group_name,
  sg.status as group_status
FROM users u
LEFT JOIN schools s ON u.school_id = s.id
LEFT JOIN school_groups sg ON u.school_group_id = sg.id
WHERE u.email = 'REMPLACER_PAR_EMAIL_PROVISEUR@example.com';

-- ✅ Résultat attendu :
-- - school_name : Nom de l'école
-- - school_status : Statut de l'école
-- - group_name : Nom du groupe scolaire
-- - group_status : Statut du groupe

-- ============================================
-- 3️⃣ VÉRIFIER LES ÉCOLES DU GROUPE
-- ============================================
SELECT 
  id,
  name,
  school_group_id,
  status,
  created_at
FROM schools
WHERE school_group_id = (
  SELECT school_group_id 
  FROM users 
  WHERE email = 'REMPLACER_PAR_EMAIL_PROVISEUR@example.com'
)
AND status = 'active';

-- ✅ Résultat attendu :
-- - Au moins 1 école retournée
-- - status = 'active'

-- ============================================
-- 4️⃣ VÉRIFIER LES UTILISATEURS DU GROUPE
-- ============================================
SELECT 
  id,
  email,
  first_name,
  last_name,
  role,
  status
FROM users
WHERE school_group_id = (
  SELECT school_group_id 
  FROM users 
  WHERE email = 'REMPLACER_PAR_EMAIL_PROVISEUR@example.com'
)
AND status = 'active'
ORDER BY created_at DESC;

-- ✅ Résultat attendu :
-- - Plusieurs utilisateurs retournés
-- - Dont le proviseur lui-même

-- ============================================
-- 5️⃣ VÉRIFIER LES RÔLES DISPONIBLES
-- ============================================
SELECT enumlabel as role_name
FROM pg_enum
WHERE enumtypid = 'user_role'::regtype
ORDER BY enumlabel;

-- ✅ Résultat attendu :
-- - 15 rôles dont 'proviseur'

-- ============================================
-- 6️⃣ DIAGNOSTIC COMPLET
-- ============================================
WITH user_info AS (
  SELECT 
    id,
    email,
    first_name,
    last_name,
    role,
    school_id,
    school_group_id,
    status
  FROM users
  WHERE email = 'REMPLACER_PAR_EMAIL_PROVISEUR@example.com'
)
SELECT 
  'Utilisateur existe' as check_name,
  CASE WHEN COUNT(*) > 0 THEN '✅ OUI' ELSE '❌ NON' END as status
FROM user_info

UNION ALL

SELECT 
  'Email renseigné',
  CASE WHEN email IS NOT NULL THEN '✅ OUI' ELSE '❌ NON' END
FROM user_info

UNION ALL

SELECT 
  'Prénom renseigné',
  CASE WHEN first_name IS NOT NULL AND first_name != '' THEN '✅ OUI' ELSE '❌ NON' END
FROM user_info

UNION ALL

SELECT 
  'Nom renseigné',
  CASE WHEN last_name IS NOT NULL AND last_name != '' THEN '✅ OUI' ELSE '❌ NON' END
FROM user_info

UNION ALL

SELECT 
  'Rôle = proviseur',
  CASE WHEN role = 'proviseur' THEN '✅ OUI' ELSE '❌ NON (' || COALESCE(role::text, 'NULL') || ')' END
FROM user_info

UNION ALL

SELECT 
  'school_group_id renseigné',
  CASE WHEN school_group_id IS NOT NULL THEN '✅ OUI' ELSE '❌ NON' END
FROM user_info

UNION ALL

SELECT 
  'Status = active',
  CASE WHEN status = 'active' THEN '✅ OUI' ELSE '❌ NON (' || COALESCE(status::text, 'NULL') || ')' END
FROM user_info;

-- ============================================
-- 7️⃣ CORRECTION SI NÉCESSAIRE
-- ============================================

-- Si first_name ou last_name sont NULL :
-- UPDATE users
-- SET 
--   first_name = 'Prénom',
--   last_name = 'Nom'
-- WHERE email = 'REMPLACER_PAR_EMAIL_PROVISEUR@example.com';

-- Si role n'est pas 'proviseur' :
-- UPDATE users
-- SET role = 'proviseur'
-- WHERE email = 'REMPLACER_PAR_EMAIL_PROVISEUR@example.com';

-- Si school_group_id est NULL :
-- UPDATE users
-- SET school_group_id = 'ID_DU_GROUPE_SCOLAIRE'
-- WHERE email = 'REMPLACER_PAR_EMAIL_PROVISEUR@example.com';

-- Si status n'est pas 'active' :
-- UPDATE users
-- SET status = 'active'
-- WHERE email = 'REMPLACER_PAR_EMAIL_PROVISEUR@example.com';

-- ============================================
-- 8️⃣ VÉRIFIER APRÈS CORRECTION
-- ============================================
SELECT 
  id,
  email,
  first_name || ' ' || last_name as full_name,
  role,
  school_group_id,
  status,
  'Données OK ✅' as validation
FROM users
WHERE email = 'REMPLACER_PAR_EMAIL_PROVISEUR@example.com'
AND first_name IS NOT NULL
AND last_name IS NOT NULL
AND role = 'proviseur'
AND school_group_id IS NOT NULL
AND status = 'active';

-- ✅ Si cette requête retourne 1 ligne, tout est OK !

-- ============================================
-- 📝 NOTES
-- ============================================
-- 1. Remplacer 'REMPLACER_PAR_EMAIL_PROVISEUR@example.com' par l'email réel
-- 2. Exécuter les requêtes dans l'ordre
-- 3. Vérifier chaque résultat
-- 4. Appliquer les corrections si nécessaire
-- 5. Rafraîchir la page /user après correction

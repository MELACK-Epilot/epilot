-- ============================================
-- LISTER TOUS LES UTILISATEURS
-- ============================================
-- Objectif: Voir tous les utilisateurs pour trouver le bon email
-- ============================================

-- 1️⃣ LISTER TOUS LES UTILISATEURS
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
ORDER BY created_at DESC;

-- ============================================
-- 2️⃣ LISTER UNIQUEMENT LES PROVISEURS
-- ============================================
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
WHERE role = 'proviseur'
ORDER BY created_at DESC;

-- ============================================
-- 3️⃣ LISTER LES UTILISATEURS AVEC LEUR GROUPE
-- ============================================
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.role,
  u.status,
  sg.name as group_name,
  s.name as school_name
FROM users u
LEFT JOIN school_groups sg ON u.school_group_id = sg.id
LEFT JOIN schools s ON u.school_id = s.id
ORDER BY u.created_at DESC;

-- ============================================
-- 4️⃣ COMPTER LES UTILISATEURS PAR RÔLE
-- ============================================
SELECT 
  role,
  COUNT(*) as nombre
FROM users
GROUP BY role
ORDER BY nombre DESC;

-- ============================================
-- 5️⃣ VÉRIFIER SI L'EMAIL EXISTE (RECHERCHE PARTIELLE)
-- ============================================
-- Remplace 'proviseur' par une partie de l'email que tu cherches
SELECT 
  id,
  email,
  first_name,
  last_name,
  role,
  school_group_id
FROM users
WHERE email ILIKE '%proviseur%'  -- Recherche insensible à la casse
   OR email ILIKE '%ramses%'     -- Ou ton prénom
   OR email ILIKE '%melack%';    -- Ou ton nom

-- ============================================
-- 6️⃣ DIAGNOSTIC POUR UN UTILISATEUR SPÉCIFIQUE
-- ============================================
-- Une fois que tu as trouvé le bon email, copie-le ici
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
  WHERE email = 'COPIE_L_EMAIL_EXACT_ICI@example.com'  -- ⚠️ Remplace par l'email exact
)
SELECT 
  'Utilisateur existe' as check_name,
  CASE WHEN COUNT(*) > 0 THEN '✅ OUI' ELSE '❌ NON' END as status
FROM user_info

UNION ALL

SELECT 
  'Email',
  email
FROM user_info

UNION ALL

SELECT 
  'Prénom renseigné',
  CASE WHEN first_name IS NOT NULL AND first_name != '' THEN '✅ OUI (' || first_name || ')' ELSE '❌ NON' END
FROM user_info

UNION ALL

SELECT 
  'Nom renseigné',
  CASE WHEN last_name IS NOT NULL AND last_name != '' THEN '✅ OUI (' || last_name || ')' ELSE '❌ NON' END
FROM user_info

UNION ALL

SELECT 
  'Rôle',
  COALESCE(role::text, 'NULL')
FROM user_info

UNION ALL

SELECT 
  'school_group_id renseigné',
  CASE WHEN school_group_id IS NOT NULL THEN '✅ OUI' ELSE '❌ NON' END
FROM user_info

UNION ALL

SELECT 
  'Status',
  COALESCE(status::text, 'NULL')
FROM user_info;

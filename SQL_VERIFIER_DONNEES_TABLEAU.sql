-- ============================================================================
-- SCRIPT DE VÉRIFICATION DES DONNÉES DU TABLEAU
-- ============================================================================

-- ÉTAPE 1 : Trouver votre ID de groupe scolaire
-- ============================================================================
SELECT 
  id as school_group_id,
  name as nom_groupe,
  code,
  plan
FROM school_groups
ORDER BY created_at DESC
LIMIT 5;

-- Copiez l'ID du groupe qui vous intéresse et utilisez-le dans les requêtes suivantes


-- ÉTAPE 2 : Vérifier les utilisateurs du groupe
-- ============================================================================
-- Remplacez 'VOTRE_ID_ICI' par l'ID copié à l'étape 1

SELECT 
  u.id,
  u.first_name,
  u.last_name,
  u.email,
  u.role,
  u.status,
  u.last_login,
  u.school_id,
  s.name as school_name,
  COUNT(ump.module_id) as modules_count
FROM users u
LEFT JOIN schools s ON u.school_id = s.id
LEFT JOIN user_module_permissions ump ON u.id = ump.user_id
WHERE u.school_group_id = 'VOTRE_ID_ICI'
GROUP BY u.id, s.name
ORDER BY u.first_name
LIMIT 20;


-- ÉTAPE 3 : Vérifier les modules assignés
-- ============================================================================

SELECT 
  u.first_name || ' ' || u.last_name as utilisateur,
  COUNT(ump.module_id) as nombre_modules,
  STRING_AGG(ump.module_name, ', ') as modules_assignes
FROM users u
LEFT JOIN user_module_permissions ump ON u.id = ump.user_id
WHERE u.school_group_id = 'VOTRE_ID_ICI'
GROUP BY u.id, u.first_name, u.last_name
HAVING COUNT(ump.module_id) > 0
ORDER BY nombre_modules DESC;


-- ÉTAPE 4 : Vérifier les statuts des utilisateurs
-- ============================================================================

SELECT 
  status,
  COUNT(*) as nombre_utilisateurs
FROM users
WHERE school_group_id = 'VOTRE_ID_ICI'
GROUP BY status;


-- ÉTAPE 5 : Vérifier les dernières connexions
-- ============================================================================

SELECT 
  u.first_name || ' ' || u.last_name as utilisateur,
  u.last_login,
  CASE 
    WHEN u.last_login IS NULL THEN 'Jamais connecté'
    WHEN u.last_login > NOW() - INTERVAL '1 day' THEN 'Aujourd''hui'
    WHEN u.last_login > NOW() - INTERVAL '7 days' THEN 'Cette semaine'
    WHEN u.last_login > NOW() - INTERVAL '30 days' THEN 'Ce mois'
    ELSE 'Plus ancien'
  END as periode_connexion
FROM users u
WHERE u.school_group_id = 'VOTRE_ID_ICI'
ORDER BY u.last_login DESC NULLS LAST
LIMIT 20;


-- ÉTAPE 6 : Si aucun module n'est assigné, vérifier les modules disponibles
-- ============================================================================

SELECT 
  m.id,
  m.name,
  m.slug,
  m.required_plan,
  m.status,
  bc.name as categorie
FROM modules m
LEFT JOIN business_categories bc ON m.category_id = bc.id
WHERE m.status = 'active'
ORDER BY bc.name, m.name
LIMIT 20;


-- ÉTAPE 7 : Activer tous les utilisateurs du groupe (si nécessaire)
-- ============================================================================
-- ATTENTION : Décommentez seulement si vous voulez activer tous les users

-- UPDATE users 
-- SET status = 'active' 
-- WHERE school_group_id = 'VOTRE_ID_ICI'
-- AND status != 'active';


-- ÉTAPE 8 : Créer un utilisateur de test avec données complètes
-- ============================================================================
-- ATTENTION : Décommentez seulement si vous voulez créer un user de test

-- WITH new_user AS (
--   INSERT INTO users (
--     id,
--     email,
--     first_name,
--     last_name,
--     role,
--     status,
--     last_login,
--     school_group_id
--   ) VALUES (
--     gen_random_uuid(),
--     'test.tableau@example.com',
--     'Jean',
--     'Tableau',
--     'enseignant',
--     'active',
--     NOW(),
--     'VOTRE_ID_ICI'
--   ) RETURNING id
-- )
-- INSERT INTO user_module_permissions (
--   user_id,
--   module_id,
--   module_name,
--   module_slug,
--   category_id,
--   category_name,
--   assignment_type,
--   can_read,
--   assigned_by,
--   assigned_at
-- )
-- SELECT 
--   new_user.id,
--   m.id,
--   m.name,
--   m.slug,
--   m.category_id,
--   'Test',
--   'direct',
--   true,
--   (SELECT id FROM users WHERE role = 'admin_groupe' LIMIT 1),
--   NOW()
-- FROM new_user, modules m
-- WHERE m.status = 'active'
-- LIMIT 5;


-- ============================================================================
-- RÉSUMÉ : COMMENT UTILISER CE SCRIPT
-- ============================================================================

-- 1. Exécutez l'ÉTAPE 1 pour trouver votre school_group_id
-- 2. Copiez l'ID du groupe
-- 3. Remplacez 'VOTRE_ID_ICI' par votre ID dans toutes les requêtes suivantes
-- 4. Exécutez les ÉTAPES 2 à 6 pour diagnostiquer
-- 5. Si nécessaire, exécutez l'ÉTAPE 7 pour activer les users
-- 6. Si nécessaire, exécutez l'ÉTAPE 8 pour créer un user de test

-- ============================================================================

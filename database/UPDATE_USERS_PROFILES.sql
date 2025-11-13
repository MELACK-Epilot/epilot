-- ==========================================================
--  MISE À JOUR DES PROFILS UTILISATEURS
--  Date : 04/11/2025
--  Objectif : Compléter les informations des utilisateurs
--             synchronisés depuis auth.users
-- ==========================================================

-- ⚠️ AVANT D'EXÉCUTER :
-- 1. Récupérer l'ID du groupe scolaire
-- 2. Remplacer les emails et informations selon tes besoins

-- 1️⃣ Récupérer l'ID du groupe scolaire
SELECT id, name, status 
FROM school_groups 
ORDER BY created_at DESC;

-- Copie l'ID du groupe (ex: 'xxx-xxx-xxx-xxx')

-- ==========================================================
-- 2️⃣ METTRE À JOUR LES UTILISATEURS
-- ==========================================================

-- Utilisateur 1 : int01@epilot.cg (Proviseur)
UPDATE public.users
SET 
  first_name = 'Ramsès',
  last_name = 'MELACK',
  role = 'proviseur'::user_role,
  school_group_id = 'REMPLACER_PAR_ID_DU_GROUPE',  -- ⚠️ À remplacer
  status = 'active'::user_status,
  updated_at = NOW()
WHERE email = 'int01@epilot.cg';

-- Utilisateur 2 : int2@epilot.cg (exemple : Enseignant)
UPDATE public.users
SET 
  first_name = 'Jean',
  last_name = 'Dupont',
  role = 'enseignant'::user_role,
  school_group_id = 'REMPLACER_PAR_ID_DU_GROUPE',  -- ⚠️ À remplacer
  status = 'active'::user_status,
  updated_at = NOW()
WHERE email = 'int2@epilot.cg';

-- Utilisateur 3 : int@epilot.cg (exemple : CPE)
UPDATE public.users
SET 
  first_name = 'Marie',
  last_name = 'Martin',
  role = 'cpe'::user_role,
  school_group_id = 'REMPLACER_PAR_ID_DU_GROUPE',  -- ⚠️ À remplacer
  status = 'active'::user_status,
  updated_at = NOW()
WHERE email = 'int@epilot.cg';

-- ==========================================================
-- 3️⃣ VÉRIFIER LES MISES À JOUR
-- ==========================================================
SELECT 
  id,
  email,
  first_name,
  last_name,
  role,
  school_group_id,
  status,
  updated_at
FROM public.users
WHERE email IN ('int01@epilot.cg', 'int2@epilot.cg', 'int@epilot.cg')
ORDER BY email;

-- ✅ Résultat attendu :
-- - first_name : Renseigné
-- - last_name : Renseigné
-- - role : proviseur, enseignant, cpe, etc.
-- - school_group_id : UUID du groupe
-- - status : active

-- ==========================================================
-- 4️⃣ TEMPLATE POUR D'AUTRES UTILISATEURS
-- ==========================================================
/*
UPDATE public.users
SET 
  first_name = 'Prénom',
  last_name = 'Nom',
  role = 'ROLE'::user_role,  -- proviseur, directeur, enseignant, cpe, comptable, eleve, parent, etc.
  school_group_id = 'ID_DU_GROUPE',
  school_id = 'ID_DE_L_ECOLE',  -- Optionnel
  status = 'active'::user_status,
  updated_at = NOW()
WHERE email = 'email@epilot.cg';
*/

-- ==========================================================
-- 5️⃣ ROLES DISPONIBLES
-- ==========================================================
-- Liste des 15 rôles :
-- 'super_admin'          - Super admin plateforme
-- 'admin_groupe'         - Admin de groupe scolaire
-- 'proviseur'            - Proviseur (lycée)
-- 'directeur'            - Directeur (collège/primaire)
-- 'directeur_etudes'     - Directeur des études
-- 'enseignant'           - Enseignant
-- 'cpe'                  - CPE (Conseiller Principal d'Éducation)
-- 'comptable'            - Comptable
-- 'secretaire'           - Secrétaire
-- 'bibliothecaire'       - Bibliothécaire
-- 'surveillant'          - Surveillant
-- 'conseiller_orientation' - Conseiller d'orientation
-- 'infirmier'            - Infirmier
-- 'eleve'                - Élève
-- 'parent'               - Parent
-- 'autre'                - Autre (par défaut)

-- ==========================================================
-- 6️⃣ STATUS DISPONIBLES
-- ==========================================================
-- 'active'    - Actif (peut se connecter)
-- 'inactive'  - Inactif (ne peut pas se connecter)
-- 'suspended' - Suspendu (temporairement bloqué)

-- ============================================
-- CORRECTION DU RÔLE school_admin
-- ============================================
-- Date: 4 Novembre 2025
-- Problème: Utilisateurs avec rôle 'school_admin' qui n'existe pas
-- Solution: Remplacer par 'admin_groupe'
-- ============================================

-- 1️⃣ VÉRIFIER LES UTILISATEURS AVEC school_admin
SELECT 
  id,
  email,
  first_name,
  last_name,
  role,
  school_group_id
FROM users
WHERE role = 'school_admin';

-- ============================================
-- 2️⃣ CORRIGER LE RÔLE
-- ============================================
-- Remplacer 'school_admin' par 'admin_groupe'
UPDATE users
SET role = 'admin_groupe'::user_role
WHERE role = 'school_admin';

-- ============================================
-- 3️⃣ VÉRIFIER LA CORRECTION
-- ============================================
SELECT 
  id,
  email,
  first_name,
  last_name,
  role,
  school_group_id
FROM users
WHERE email = 'int01@epilot.cg';

-- ✅ Résultat attendu :
-- role = 'admin_groupe'

-- ============================================
-- 4️⃣ VÉRIFIER QU'IL N'Y A PLUS DE school_admin
-- ============================================
SELECT COUNT(*) as count_school_admin
FROM users
WHERE role = 'school_admin';

-- ✅ Résultat attendu : 0

-- ============================================
-- 📝 NOTES
-- ============================================
-- Hiérarchie des rôles E-Pilot :
-- 
-- 1. super_admin (Super Admin Plateforme)
--    - Gère tous les groupes scolaires
--    - Accès : /dashboard uniquement
--
-- 2. admin_groupe (Admin de Groupe Scolaire)
--    - Gère plusieurs écoles d'un groupe
--    - Crée les utilisateurs des écoles
--    - Accès : /dashboard ET /user
--
-- 3. Utilisateurs École (15 rôles)
--    - proviseur, directeur, enseignant, etc.
--    - Utilisent les modules
--    - Accès : /user uniquement
--
-- ⚠️ Le rôle 'school_admin' N'EXISTE PAS dans le système
-- ============================================

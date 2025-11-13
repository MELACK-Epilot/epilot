-- =====================================================
-- VÉRIFICATION DES POLITIQUES RLS - school_groups
-- Date : 30 octobre 2025
-- Auteur : E-Pilot Congo 🇨🇬
-- =====================================================

-- =====================================================
-- 1. VÉRIFIER SI RLS EST ACTIVÉ
-- =====================================================

SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '🔒 RLS ACTIVÉ'
    ELSE '🔓 RLS DÉSACTIVÉ'
  END as status
FROM pg_tables
WHERE tablename = 'school_groups';

-- =====================================================
-- 2. LISTER TOUTES LES POLITIQUES RLS EXISTANTES
-- =====================================================

SELECT 
  policyname as "Nom de la politique",
  cmd as "Commande (SELECT/INSERT/UPDATE/DELETE)",
  roles as "Rôles autorisés",
  permissive as "Permissive",
  qual as "Condition USING",
  with_check as "Condition WITH CHECK"
FROM pg_policies
WHERE tablename = 'school_groups'
ORDER BY cmd, policyname;

-- =====================================================
-- 3. COMPTER LES POLITIQUES PAR TYPE
-- =====================================================

SELECT 
  cmd as "Type de commande",
  COUNT(*) as "Nombre de politiques"
FROM pg_policies
WHERE tablename = 'school_groups'
GROUP BY cmd
ORDER BY cmd;

-- =====================================================
-- 4. VÉRIFIER LES POLITIQUES SELECT SPÉCIFIQUEMENT
-- =====================================================

SELECT 
  policyname,
  roles,
  qual as condition_using
FROM pg_policies
WHERE tablename = 'school_groups'
  AND cmd = 'SELECT';

-- =====================================================
-- 5. TESTER L'ACCÈS AUX DONNÉES (EN TANT QU'ANON)
-- =====================================================

-- Cette requête simule ce que fait votre application
-- Si elle retourne 0, c'est un problème de RLS
SELECT COUNT(*) as total_accessible
FROM school_groups;

-- =====================================================
-- 6. SOLUTION : CRÉER UNE POLITIQUE SELECT PERMISSIVE
-- =====================================================

-- ⚠️ DÉVELOPPEMENT UNIQUEMENT - À affiner en production

-- Supprimer les anciennes politiques SELECT si elles existent
DROP POLICY IF EXISTS "Allow authenticated users to view school_groups" ON school_groups;
DROP POLICY IF EXISTS "Allow anon users to view school_groups" ON school_groups;
DROP POLICY IF EXISTS "Enable read access for all users" ON school_groups;

-- Créer une politique SELECT pour les utilisateurs authentifiés
CREATE POLICY "Allow authenticated users to view school_groups"
ON school_groups
FOR SELECT
TO authenticated
USING (true);

-- Créer une politique SELECT pour les utilisateurs anonymes (développement)
CREATE POLICY "Allow anon users to view school_groups"
ON school_groups
FOR SELECT
TO anon
USING (true);

-- =====================================================
-- 7. VÉRIFICATION FINALE
-- =====================================================

-- Vérifier que les politiques ont bien été créées
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'school_groups'
  AND cmd = 'SELECT';

-- Compter à nouveau les données accessibles
SELECT COUNT(*) as total_accessible_after_policy
FROM school_groups;

-- Afficher les 3 premiers groupes pour vérifier
SELECT 
  id,
  name,
  code,
  region,
  city,
  plan,
  status
FROM school_groups
ORDER BY created_at DESC
LIMIT 3;

-- =====================================================
-- NOTES IMPORTANTES
-- =====================================================

/*
🔒 SÉCURITÉ EN PRODUCTION :

Au lieu de USING (true), utilisez des conditions basées sur les rôles :

-- Pour Super Admin (accès total)
CREATE POLICY "Super admin can view all school_groups"
ON school_groups
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'super_admin'
);

-- Pour Admin Groupe (ses groupes uniquement)
CREATE POLICY "Admin groupe can view their school_groups"
ON school_groups
FOR SELECT
TO authenticated
USING (
  admin_id = auth.uid()
);

-- Pour Admin École (via relation)
CREATE POLICY "Admin ecole can view their school_group"
ON school_groups
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT school_group_id 
    FROM schools 
    WHERE admin_id = auth.uid()
  )
);
*/

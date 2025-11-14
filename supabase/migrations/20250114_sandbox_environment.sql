-- ============================================
-- ENVIRONNEMENT SANDBOX POUR SUPER ADMIN
-- Permet de créer des données fictives pour tester les modules
-- ============================================

-- ============================================
-- 1. AJOUTER LA COLONNE is_sandbox
-- ============================================

-- Groupes scolaires
ALTER TABLE school_groups 
ADD COLUMN IF NOT EXISTS is_sandbox BOOLEAN DEFAULT FALSE;

-- Écoles
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS is_sandbox BOOLEAN DEFAULT FALSE;

-- Utilisateurs
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_sandbox BOOLEAN DEFAULT FALSE;

-- Élèves (si la table existe)
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS is_sandbox BOOLEAN DEFAULT FALSE;

-- Classes
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS is_sandbox BOOLEAN DEFAULT FALSE;

-- Inscriptions
ALTER TABLE inscriptions 
ADD COLUMN IF NOT EXISTS is_sandbox BOOLEAN DEFAULT FALSE;

-- Notes (si la table existe)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'grades') THEN
    ALTER TABLE grades ADD COLUMN IF NOT EXISTS is_sandbox BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Absences (si la table existe)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'absences') THEN
    ALTER TABLE absences ADD COLUMN IF NOT EXISTS is_sandbox BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Paiements (si la table existe)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
    ALTER TABLE payments ADD COLUMN IF NOT EXISTS is_sandbox BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- ============================================
-- 2. CRÉER DES INDEX POUR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_school_groups_sandbox 
ON school_groups(is_sandbox) 
WHERE is_sandbox = TRUE;

CREATE INDEX IF NOT EXISTS idx_schools_sandbox 
ON schools(is_sandbox) 
WHERE is_sandbox = TRUE;

CREATE INDEX IF NOT EXISTS idx_users_sandbox 
ON users(is_sandbox) 
WHERE is_sandbox = TRUE;

CREATE INDEX IF NOT EXISTS idx_students_sandbox 
ON students(is_sandbox) 
WHERE is_sandbox = TRUE;

CREATE INDEX IF NOT EXISTS idx_inscriptions_sandbox 
ON inscriptions(is_sandbox) 
WHERE is_sandbox = TRUE;

-- ============================================
-- 3. POLICIES RLS POUR SANDBOX
-- ============================================

-- Seul le Super Admin peut voir les données sandbox
DROP POLICY IF EXISTS "Super admin can access sandbox school groups" ON school_groups;
CREATE POLICY "Super admin can access sandbox school groups"
ON school_groups
FOR ALL
TO authenticated
USING (
  CASE 
    WHEN is_sandbox = TRUE THEN
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'super_admin'
      )
    ELSE TRUE
  END
);

DROP POLICY IF EXISTS "Super admin can access sandbox schools" ON schools;
CREATE POLICY "Super admin can access sandbox schools"
ON schools
FOR ALL
TO authenticated
USING (
  CASE 
    WHEN is_sandbox = TRUE THEN
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'super_admin'
      )
    ELSE TRUE
  END
);

DROP POLICY IF EXISTS "Super admin can access sandbox users" ON users;
CREATE POLICY "Super admin can access sandbox users"
ON users
FOR ALL
TO authenticated
USING (
  CASE 
    WHEN is_sandbox = TRUE THEN
      EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.role = 'super_admin'
      )
    ELSE TRUE
  END
);

-- ============================================
-- 4. FONCTION POUR SUPPRIMER LES DONNÉES SANDBOX
-- ============================================

CREATE OR REPLACE FUNCTION delete_sandbox_data()
RETURNS void AS $$
BEGIN
  -- Supprimer dans l'ordre inverse des dépendances
  
  -- Notes
  DELETE FROM grades WHERE is_sandbox = TRUE;
  
  -- Absences
  DELETE FROM absences WHERE is_sandbox = TRUE;
  
  -- Paiements
  DELETE FROM payments WHERE is_sandbox = TRUE;
  
  -- Inscriptions
  DELETE FROM inscriptions WHERE is_sandbox = TRUE;
  
  -- Classes
  DELETE FROM classes WHERE is_sandbox = TRUE;
  
  -- Élèves
  DELETE FROM students WHERE is_sandbox = TRUE;
  
  -- Utilisateurs sandbox
  DELETE FROM users WHERE is_sandbox = TRUE;
  
  -- Écoles
  DELETE FROM schools WHERE is_sandbox = TRUE;
  
  -- Groupes scolaires
  DELETE FROM school_groups WHERE is_sandbox = TRUE;
  
  RAISE NOTICE 'Toutes les données sandbox ont été supprimées';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. FONCTION POUR COMPTER LES DONNÉES SANDBOX
-- ============================================

CREATE OR REPLACE FUNCTION count_sandbox_data()
RETURNS TABLE(
  entity_type text,
  count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 'school_groups'::text, COUNT(*) FROM school_groups WHERE is_sandbox = TRUE
  UNION ALL
  SELECT 'schools'::text, COUNT(*) FROM schools WHERE is_sandbox = TRUE
  UNION ALL
  SELECT 'users'::text, COUNT(*) FROM users WHERE is_sandbox = TRUE
  UNION ALL
  SELECT 'students'::text, COUNT(*) FROM students WHERE is_sandbox = TRUE
  UNION ALL
  SELECT 'classes'::text, COUNT(*) FROM classes WHERE is_sandbox = TRUE
  UNION ALL
  SELECT 'inscriptions'::text, COUNT(*) FROM inscriptions WHERE is_sandbox = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. COMMENTAIRES
-- ============================================

COMMENT ON COLUMN school_groups.is_sandbox IS 
'Indique si ce groupe scolaire fait partie de l''environnement sandbox (données fictives pour tests)';

COMMENT ON COLUMN schools.is_sandbox IS 
'Indique si cette école fait partie de l''environnement sandbox (données fictives pour tests)';

COMMENT ON COLUMN users.is_sandbox IS 
'Indique si cet utilisateur fait partie de l''environnement sandbox (données fictives pour tests)';

COMMENT ON FUNCTION delete_sandbox_data() IS 
'Supprime toutes les données sandbox en cascade';

COMMENT ON FUNCTION count_sandbox_data() IS 
'Compte le nombre d''entités sandbox par type';

-- ============================================
-- 7. VÉRIFICATION
-- ============================================

-- Vérifier que les colonnes ont été ajoutées
SELECT 
  table_name,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE column_name = 'is_sandbox'
AND table_schema = 'public'
ORDER BY table_name;

-- Tester la fonction de comptage
SELECT * FROM count_sandbox_data();

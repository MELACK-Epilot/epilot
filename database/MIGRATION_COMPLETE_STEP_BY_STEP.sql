-- =====================================================
-- MIGRATION COMPLÈTE EN 3 ÉTAPES
-- Suppression de la dépendance circulaire admin_id
-- Date : 3 novembre 2025
-- =====================================================

-- =====================================================
-- ÉTAPE 1 : PRÉPARER LA TABLE NOTIFICATIONS
-- =====================================================

-- Ajouter les colonnes manquantes à notifications
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'is_global'
  ) THEN
    ALTER TABLE notifications ADD COLUMN is_global BOOLEAN DEFAULT false;
    RAISE NOTICE '✅ Colonne is_global ajoutée';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'recipient_role'
  ) THEN
    ALTER TABLE notifications ADD COLUMN recipient_role user_role;
    RAISE NOTICE '✅ Colonne recipient_role ajoutée';
  END IF;
END $$;

-- =====================================================
-- ÉTAPE 2 : VÉRIFIER LA TABLE EXPENSES
-- =====================================================

-- Vérifier que la table expenses existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'expenses'
  ) THEN
    RAISE NOTICE '⚠️ Table expenses n''existe pas - création nécessaire';
    
    -- Créer la table expenses si elle n'existe pas
    CREATE TABLE expenses (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      school_group_id UUID REFERENCES school_groups(id) ON DELETE CASCADE,
      school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
      category TEXT NOT NULL,
      amount NUMERIC(10, 2) NOT NULL,
      description TEXT,
      date DATE NOT NULL DEFAULT CURRENT_DATE,
      created_by UUID REFERENCES users(id),
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Activer RLS
    ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
    
    -- Index
    CREATE INDEX idx_expenses_school_group_id ON expenses(school_group_id);
    CREATE INDEX idx_expenses_school_id ON expenses(school_id);
    CREATE INDEX idx_expenses_date ON expenses(date);
    
    RAISE NOTICE '✅ Table expenses créée';
  ELSE
    RAISE NOTICE '✅ Table expenses existe déjà';
  END IF;
END $$;

-- =====================================================
-- ÉTAPE 3 : EXÉCUTER LA MIGRATION PRINCIPALE
-- =====================================================

-- Supprimer les policies dépendantes
DROP POLICY IF EXISTS "Admin Groupe can view their group notifications" ON notifications;
DROP POLICY IF EXISTS "Admin Groupe can view their expenses" ON expenses;
DROP POLICY IF EXISTS "Admin Groupe can insert their expenses" ON expenses;
DROP POLICY IF EXISTS "Admin Groupe can update their expenses" ON expenses;
DROP POLICY IF EXISTS "Admin Groupe can delete their expenses" ON expenses;

-- Sauvegarder les données admin_id
CREATE TEMP TABLE IF NOT EXISTS temp_school_group_admins AS
SELECT 
  sg.id AS school_group_id,
  sg.admin_id,
  u.email AS admin_email,
  u.first_name,
  u.last_name
FROM school_groups sg
LEFT JOIN users u ON u.id = sg.admin_id
WHERE sg.admin_id IS NOT NULL;

-- Supprimer admin_id
DROP INDEX IF EXISTS idx_school_groups_admin_id;
ALTER TABLE school_groups DROP CONSTRAINT IF EXISTS school_groups_admin_id_fkey;
ALTER TABLE school_groups DROP COLUMN IF EXISTS admin_id CASCADE;

-- Migrer les admins vers users.school_group_id
UPDATE users u
SET 
  school_group_id = t.school_group_id,
  role = 'admin_groupe',
  updated_at = NOW()
FROM temp_school_group_admins t
WHERE u.id = t.admin_id
  AND u.school_group_id IS NULL;

-- Ajouter les contraintes de cohérence
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS check_admin_groupe_has_school_group;

ALTER TABLE users 
ADD CONSTRAINT check_admin_groupe_has_school_group
CHECK (role != 'admin_groupe' OR school_group_id IS NOT NULL);

ALTER TABLE users 
DROP CONSTRAINT IF EXISTS check_super_admin_no_school_group;

ALTER TABLE users 
ADD CONSTRAINT check_super_admin_no_school_group
CHECK (role != 'super_admin' OR school_group_id IS NULL);

-- Créer la vue school_groups_with_admin
CREATE OR REPLACE VIEW school_groups_with_admin AS
SELECT 
  sg.id,
  sg.name,
  sg.code,
  sg.region,
  sg.city,
  sg.address,
  sg.phone,
  sg.website,
  sg.school_count,
  sg.student_count,
  sg.staff_count,
  sg.plan,
  sg.status,
  sg.created_at,
  sg.updated_at,
  u.id AS admin_id,
  u.first_name || ' ' || u.last_name AS admin_name,
  u.email AS admin_email,
  u.phone AS admin_phone,
  u.avatar AS admin_avatar,
  u.status AS admin_status,
  u.last_login AS admin_last_login
FROM school_groups sg
LEFT JOIN users u ON u.school_group_id = sg.id AND u.role = 'admin_groupe';

GRANT SELECT ON school_groups_with_admin TO authenticated;

-- Recréer les policies school_groups
DROP POLICY IF EXISTS "Admin Groupe can view their groups" ON school_groups;
DROP POLICY IF EXISTS "Admin Groupe can view their group" ON school_groups;
DROP POLICY IF EXISTS "Admin Groupe can update their group" ON school_groups;

CREATE POLICY "Admin Groupe can view their group"
ON school_groups FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin_groupe'
    AND users.school_group_id = school_groups.id
  )
);

CREATE POLICY "Admin Groupe can update their group"
ON school_groups FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin_groupe'
    AND users.school_group_id = school_groups.id
  )
);

-- Recréer les policies notifications
CREATE POLICY "Admin Groupe can view their group notifications"
ON notifications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin_groupe'
    AND (
      notifications.is_global = true
      OR notifications.recipient_role = 'admin_groupe'
      OR notifications.recipient_id = auth.uid()
    )
  )
);

-- Recréer les policies expenses
CREATE POLICY "Admin Groupe can view their expenses"
ON expenses FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin_groupe'
    AND users.school_group_id = expenses.school_group_id
  )
);

CREATE POLICY "Admin Groupe can insert their expenses"
ON expenses FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin_groupe'
    AND users.school_group_id = expenses.school_group_id
  )
);

CREATE POLICY "Admin Groupe can update their expenses"
ON expenses FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin_groupe'
    AND users.school_group_id = expenses.school_group_id
  )
);

CREATE POLICY "Admin Groupe can delete their expenses"
ON expenses FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin_groupe'
    AND users.school_group_id = expenses.school_group_id
  )
);

-- Créer les fonctions utilitaires
CREATE OR REPLACE FUNCTION get_school_group_admin(group_id UUID)
RETURNS TABLE (
  admin_id UUID,
  admin_name TEXT,
  admin_email TEXT,
  admin_phone TEXT,
  admin_avatar TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.first_name || ' ' || u.last_name,
    u.email,
    u.phone,
    u.avatar
  FROM users u
  WHERE u.school_group_id = group_id
    AND u.role = 'admin_groupe'
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin_of_group(user_id UUID, group_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = user_id
      AND role = 'admin_groupe'
      AND school_group_id = group_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VÉRIFICATIONS FINALES
-- =====================================================

-- Vérifier que admin_id n'existe plus
DO $$
DECLARE
  col_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_name = 'school_groups' AND column_name = 'admin_id';
  
  IF col_count = 0 THEN
    RAISE NOTICE '✅ Colonne admin_id supprimée avec succès';
  ELSE
    RAISE NOTICE '❌ Colonne admin_id existe encore';
  END IF;
END $$;

-- Vérifier la vue
DO $$
DECLARE
  view_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO view_count
  FROM information_schema.views
  WHERE table_name = 'school_groups_with_admin';
  
  IF view_count > 0 THEN
    RAISE NOTICE '✅ Vue school_groups_with_admin créée';
  ELSE
    RAISE NOTICE '❌ Vue school_groups_with_admin manquante';
  END IF;
END $$;

-- Afficher le résumé
SELECT 
  'Migration terminée' AS status,
  (SELECT COUNT(*) FROM school_groups) AS total_groups,
  (SELECT COUNT(*) FROM users WHERE role = 'admin_groupe') AS total_admins,
  (SELECT COUNT(*) FROM school_groups_with_admin WHERE admin_id IS NOT NULL) AS groups_with_admin;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

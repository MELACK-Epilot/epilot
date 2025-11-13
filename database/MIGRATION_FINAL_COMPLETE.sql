-- =====================================================
-- MIGRATION FINALE COMPLÈTE
-- Suppression de la dépendance circulaire admin_id
-- Date : 3 novembre 2025
-- VERSION FINALE : Gère TOUTES les colonnes manquantes
-- =====================================================

-- =====================================================
-- ÉTAPE 1 : PRÉPARER LA TABLE NOTIFICATIONS
-- =====================================================

-- Ajouter TOUTES les colonnes manquantes à notifications
DO $$ 
BEGIN
  -- Colonne recipient_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'recipient_id'
  ) THEN
    ALTER TABLE notifications ADD COLUMN recipient_id UUID REFERENCES users(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Colonne recipient_id ajoutée';
  ELSE
    RAISE NOTICE '✓ Colonne recipient_id existe déjà';
  END IF;

  -- Colonne is_global
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'is_global'
  ) THEN
    ALTER TABLE notifications ADD COLUMN is_global BOOLEAN DEFAULT false;
    RAISE NOTICE '✅ Colonne is_global ajoutée';
  ELSE
    RAISE NOTICE '✓ Colonne is_global existe déjà';
  END IF;

  -- Colonne recipient_role
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'recipient_role'
  ) THEN
    ALTER TABLE notifications ADD COLUMN recipient_role user_role;
    RAISE NOTICE '✅ Colonne recipient_role ajoutée';
  ELSE
    RAISE NOTICE '✓ Colonne recipient_role existe déjà';
  END IF;
END $$;

-- Créer les index sur notifications
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_role ON notifications(recipient_role);
CREATE INDEX IF NOT EXISTS idx_notifications_is_global ON notifications(is_global);

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
    RAISE NOTICE '⚠️ Table expenses n''existe pas - création';
    
    -- Créer la table expenses
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
    RAISE NOTICE '✓ Table expenses existe déjà';
  END IF;
END $$;

-- =====================================================
-- ÉTAPE 3 : SUPPRIMER LES POLICIES DÉPENDANTES
-- =====================================================

DROP POLICY IF EXISTS "Admin Groupe can view their group notifications" ON notifications;
DROP POLICY IF EXISTS "Admin Groupe can view their expenses" ON expenses;
DROP POLICY IF EXISTS "Admin Groupe can insert their expenses" ON expenses;
DROP POLICY IF EXISTS "Admin Groupe can update their expenses" ON expenses;
DROP POLICY IF EXISTS "Admin Groupe can delete their expenses" ON expenses;

DO $$ BEGIN RAISE NOTICE '✅ Policies dépendantes supprimées'; END $$;

-- =====================================================
-- ÉTAPE 4 : SAUVEGARDER LES DONNÉES
-- =====================================================

-- Créer table temporaire pour sauvegarder admin_id
DROP TABLE IF EXISTS temp_school_group_admins;
CREATE TEMP TABLE temp_school_group_admins AS
SELECT 
  sg.id AS school_group_id,
  sg.admin_id,
  u.email AS admin_email,
  u.first_name,
  u.last_name
FROM school_groups sg
LEFT JOIN users u ON u.id = sg.admin_id
WHERE sg.admin_id IS NOT NULL;

-- Afficher le nombre d'admins à migrer
DO $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM temp_school_group_admins;
  RAISE NOTICE '📊 Nombre d''admins à migrer : %', admin_count;
END $$;

-- =====================================================
-- ÉTAPE 5 : SUPPRIMER admin_id
-- =====================================================

DROP INDEX IF EXISTS idx_school_groups_admin_id;
ALTER TABLE school_groups DROP CONSTRAINT IF EXISTS school_groups_admin_id_fkey;
ALTER TABLE school_groups DROP COLUMN IF EXISTS admin_id CASCADE;

DO $$ BEGIN RAISE NOTICE '✅ Colonne admin_id supprimée'; END $$;

-- =====================================================
-- ÉTAPE 6 : MIGRER LES ADMINS
-- =====================================================

UPDATE users u
SET 
  school_group_id = t.school_group_id,
  role = 'admin_groupe',
  updated_at = NOW()
FROM temp_school_group_admins t
WHERE u.id = t.admin_id
  AND u.school_group_id IS NULL;

-- Afficher le résultat de la migration
DO $$
DECLARE
  migrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO migrated_count 
  FROM users u
  JOIN temp_school_group_admins t ON u.id = t.admin_id;
  
  RAISE NOTICE '✅ Admins migrés : %', migrated_count;
END $$;

-- =====================================================
-- ÉTAPE 7 : AJOUTER LES CONTRAINTES
-- =====================================================

ALTER TABLE users DROP CONSTRAINT IF EXISTS check_admin_groupe_has_school_group;
ALTER TABLE users 
ADD CONSTRAINT check_admin_groupe_has_school_group
CHECK (role != 'admin_groupe' OR school_group_id IS NOT NULL);

ALTER TABLE users DROP CONSTRAINT IF EXISTS check_super_admin_no_school_group;
ALTER TABLE users 
ADD CONSTRAINT check_super_admin_no_school_group
CHECK (role != 'super_admin' OR school_group_id IS NULL);

DO $$ BEGIN RAISE NOTICE '✅ Contraintes de cohérence ajoutées'; END $$;

-- =====================================================
-- ÉTAPE 8 : CRÉER LA VUE
-- =====================================================

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

DO $$ BEGIN RAISE NOTICE '✅ Vue school_groups_with_admin créée'; END $$;

-- =====================================================
-- ÉTAPE 9 : RECRÉER LES POLICIES SCHOOL_GROUPS
-- =====================================================

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

DO $$ BEGIN RAISE NOTICE '✅ Policies school_groups créées'; END $$;

-- =====================================================
-- ÉTAPE 10 : RECRÉER LES POLICIES NOTIFICATIONS
-- =====================================================

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

DO $$ BEGIN RAISE NOTICE '✅ Policy notifications créée'; END $$;

-- =====================================================
-- ÉTAPE 11 : RECRÉER LES POLICIES EXPENSES
-- =====================================================

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

DO $$ BEGIN RAISE NOTICE '✅ Policies expenses créées'; END $$;

-- =====================================================
-- ÉTAPE 12 : CRÉER LES FONCTIONS UTILITAIRES
-- =====================================================

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

DO $$ BEGIN RAISE NOTICE '✅ Fonctions utilitaires créées'; END $$;

-- =====================================================
-- ÉTAPE 13 : VÉRIFICATIONS FINALES
-- =====================================================

DO $$
DECLARE
  admin_id_exists INTEGER;
  view_exists INTEGER;
  total_groups INTEGER;
  total_admins INTEGER;
  groups_with_admin INTEGER;
BEGIN
  -- Vérifier admin_id
  SELECT COUNT(*) INTO admin_id_exists
  FROM information_schema.columns
  WHERE table_name = 'school_groups' AND column_name = 'admin_id';
  
  IF admin_id_exists = 0 THEN
    RAISE NOTICE '✅ Colonne admin_id supprimée avec succès';
  ELSE
    RAISE WARNING '❌ Colonne admin_id existe encore !';
  END IF;
  
  -- Vérifier la vue
  SELECT COUNT(*) INTO view_exists
  FROM information_schema.views
  WHERE table_name = 'school_groups_with_admin';
  
  IF view_exists > 0 THEN
    RAISE NOTICE '✅ Vue school_groups_with_admin créée';
  ELSE
    RAISE WARNING '❌ Vue school_groups_with_admin manquante !';
  END IF;
  
  -- Statistiques
  SELECT COUNT(*) INTO total_groups FROM school_groups;
  SELECT COUNT(*) INTO total_admins FROM users WHERE role = 'admin_groupe';
  SELECT COUNT(*) INTO groups_with_admin FROM school_groups_with_admin WHERE admin_id IS NOT NULL;
  
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '🎉 MIGRATION TERMINÉE AVEC SUCCÈS !';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '📊 Total groupes scolaires : %', total_groups;
  RAISE NOTICE '👥 Total admins de groupe : %', total_admins;
  RAISE NOTICE '🔗 Groupes avec admin assigné : %', groups_with_admin;
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

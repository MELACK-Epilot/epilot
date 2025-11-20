/**
 * Migration: Ajouter colonnes manquantes à school_groups
 * Créé le: 2025-11-20
 * Description: Ajoute les colonnes plan, school_count, student_count, staff_count
 */

-- Ajouter colonne plan si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'school_groups' AND column_name = 'plan'
  ) THEN
    ALTER TABLE school_groups 
    ADD COLUMN plan VARCHAR(50) DEFAULT 'gratuit';
    
    COMMENT ON COLUMN school_groups.plan IS 'Plan d''abonnement du groupe (gratuit, premium, pro, institutionnel)';
  END IF;
END $$;

-- Ajouter colonne school_count si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'school_groups' AND column_name = 'school_count'
  ) THEN
    ALTER TABLE school_groups 
    ADD COLUMN school_count INTEGER DEFAULT 0;
    
    COMMENT ON COLUMN school_groups.school_count IS 'Nombre d''écoles dans le groupe';
  END IF;
END $$;

-- Ajouter colonne student_count si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'school_groups' AND column_name = 'student_count'
  ) THEN
    ALTER TABLE school_groups 
    ADD COLUMN student_count INTEGER DEFAULT 0;
    
    COMMENT ON COLUMN school_groups.student_count IS 'Nombre total d''élèves dans le groupe';
  END IF;
END $$;

-- Ajouter colonne staff_count si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'school_groups' AND column_name = 'staff_count'
  ) THEN
    ALTER TABLE school_groups 
    ADD COLUMN staff_count INTEGER DEFAULT 0;
    
    COMMENT ON COLUMN school_groups.staff_count IS 'Nombre total de personnel dans le groupe';
  END IF;
END $$;

-- Créer un index sur la colonne plan pour les requêtes de filtrage
CREATE INDEX IF NOT EXISTS idx_school_groups_plan ON school_groups(plan);

-- Fonction pour mettre à jour automatiquement school_count
CREATE OR REPLACE FUNCTION update_school_group_school_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE school_groups 
    SET school_count = (
      SELECT COUNT(*) 
      FROM schools 
      WHERE school_group_id = NEW.school_group_id
    )
    WHERE id = NEW.school_group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE school_groups 
    SET school_count = (
      SELECT COUNT(*) 
      FROM schools 
      WHERE school_group_id = OLD.school_group_id
    )
    WHERE id = OLD.school_group_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour school_count automatiquement
DROP TRIGGER IF EXISTS trigger_update_school_count ON schools;
CREATE TRIGGER trigger_update_school_count
  AFTER INSERT OR DELETE ON schools
  FOR EACH ROW
  EXECUTE FUNCTION update_school_group_school_count();

-- Fonction pour mettre à jour automatiquement student_count et staff_count
CREATE OR REPLACE FUNCTION update_school_group_counts()
RETURNS TRIGGER AS $$
DECLARE
  v_school_group_id UUID;
BEGIN
  -- Récupérer le school_group_id depuis la school
  IF TG_OP = 'INSERT' THEN
    SELECT school_group_id INTO v_school_group_id
    FROM schools
    WHERE id = NEW.school_id;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT school_group_id INTO v_school_group_id
    FROM schools
    WHERE id = OLD.school_id;
  END IF;

  -- Mettre à jour les compteurs
  IF v_school_group_id IS NOT NULL THEN
    UPDATE school_groups 
    SET 
      student_count = (
        SELECT COUNT(*) 
        FROM users u
        JOIN schools s ON u.school_id = s.id
        WHERE s.school_group_id = v_school_group_id
          AND u.role = 'eleve'
      ),
      staff_count = (
        SELECT COUNT(*) 
        FROM users u
        JOIN schools s ON u.school_id = s.id
        WHERE s.school_group_id = v_school_group_id
          AND u.role IN ('enseignant', 'proviseur', 'directeur', 'comptable', 'secretaire')
      )
    WHERE id = v_school_group_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour student_count et staff_count automatiquement
DROP TRIGGER IF EXISTS trigger_update_user_counts ON users;
CREATE TRIGGER trigger_update_user_counts
  AFTER INSERT OR DELETE OR UPDATE OF role, school_id ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_school_group_counts();

-- Initialiser les compteurs pour les groupes existants
UPDATE school_groups sg
SET 
  school_count = (
    SELECT COUNT(*) 
    FROM schools 
    WHERE school_group_id = sg.id
  ),
  student_count = (
    SELECT COUNT(*) 
    FROM users u
    JOIN schools s ON u.school_id = s.id
    WHERE s.school_group_id = sg.id
      AND u.role = 'eleve'
  ),
  staff_count = (
    SELECT COUNT(*) 
    FROM users u
    JOIN schools s ON u.school_id = s.id
    WHERE s.school_group_id = sg.id
      AND u.role IN ('enseignant', 'proviseur', 'directeur', 'comptable', 'secretaire')
  );

-- ============================================
-- SCHÉMA SQL - TABLE CLASSES
-- E-Pilot Congo - Gestion des Classes
-- ============================================

-- 1. Créer la table classes
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Référence
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  
  -- Informations de la classe
  name VARCHAR(100) NOT NULL,                    -- Ex: "5EME 1", "6EME A"
  code VARCHAR(50),                              -- Ex: "5E1", "6A"
  level VARCHAR(50) NOT NULL,                    -- Ex: "5EME", "6EME", "CM2"
  serie VARCHAR(50),                             -- Ex: "A", "C", "D" (pour lycée)
  
  -- Capacité
  capacity INTEGER DEFAULT 40,                   -- Nombre max d'élèves
  current_enrollment INTEGER DEFAULT 0,          -- Nombre actuel d'élèves
  
  -- Année académique
  academic_year VARCHAR(20) NOT NULL,            -- Ex: "2024-2025"
  
  -- Enseignant principal (titulaire)
  main_teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Salle
  room_number VARCHAR(50),                       -- Ex: "Salle 101"
  building VARCHAR(100),                         -- Ex: "Bâtiment A"
  
  -- Statut
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  
  -- Métadonnées
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_classes_school ON classes(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_level ON classes(level);
CREATE INDEX IF NOT EXISTS idx_classes_year ON classes(academic_year);
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(main_teacher_id);

-- 3. Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_classes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger pour updated_at
DROP TRIGGER IF EXISTS trigger_update_classes_updated_at ON classes;
CREATE TRIGGER trigger_update_classes_updated_at
  BEFORE UPDATE ON classes
  FOR EACH ROW
  EXECUTE FUNCTION update_classes_updated_at();

-- 5. Fonction pour incrémenter/décrémenter current_enrollment
CREATE OR REPLACE FUNCTION update_class_enrollment()
RETURNS TRIGGER AS $$
BEGIN
  -- Lors d'une inscription validée
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status = 'validee' AND OLD.status != 'validee') THEN
    UPDATE classes
    SET current_enrollment = current_enrollment + 1
    WHERE id = NEW.requested_class_id;
  END IF;
  
  -- Lors d'une annulation/refus
  IF TG_OP = 'UPDATE' AND NEW.status IN ('refusee', 'annulee') AND OLD.status = 'validee' THEN
    UPDATE classes
    SET current_enrollment = GREATEST(current_enrollment - 1, 0)
    WHERE id = NEW.requested_class_id;
  END IF;
  
  -- Lors d'une suppression
  IF TG_OP = 'DELETE' AND OLD.status = 'validee' THEN
    UPDATE classes
    SET current_enrollment = GREATEST(current_enrollment - 1, 0)
    WHERE id = OLD.requested_class_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger sur inscriptions pour mettre à jour l'effectif
DROP TRIGGER IF EXISTS trigger_update_class_enrollment ON inscriptions;
CREATE TRIGGER trigger_update_class_enrollment
  AFTER INSERT OR UPDATE OR DELETE ON inscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_class_enrollment();

-- 7. Vue pour les classes avec informations complètes
CREATE OR REPLACE VIEW classes_complete AS
SELECT
  c.*,
  s.name as school_name,
  u.first_name || ' ' || u.last_name as teacher_name,
  u.email as teacher_email,
  ROUND((c.current_enrollment::NUMERIC / NULLIF(c.capacity, 0)) * 100, 2) as fill_rate
FROM classes c
LEFT JOIN schools s ON c.school_id = s.id
LEFT JOIN users u ON c.main_teacher_id = u.id;

-- 8. Politiques RLS (Row Level Security)
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Super Admin : accès total
CREATE POLICY "Super Admin can do everything on classes"
  ON classes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Admin Groupe : accès aux classes de ses écoles
CREATE POLICY "Admin Groupe can manage classes of their schools"
  ON classes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN school_groups sg ON u.school_group_id = sg.id
      JOIN schools s ON s.school_group_id = sg.id
      WHERE u.id = auth.uid()
      AND u.role = 'admin_groupe'
      AND s.id = classes.school_id
    )
  );

-- Admin École : accès aux classes de son école
CREATE POLICY "Admin École can manage classes of their school"
  ON classes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN schools s ON u.school_id = s.id
      WHERE u.id = auth.uid()
      AND u.role = 'admin_ecole'
      AND s.id = classes.school_id
    )
  );

-- 9. Données de test (optionnel - à commenter en production)
/*
INSERT INTO classes (
  school_id,
  name,
  code,
  level,
  serie,
  capacity,
  academic_year,
  status
) VALUES
  (
    (SELECT id FROM schools LIMIT 1),
    '5EME 1',
    '5E1',
    '5EME',
    'A',
    40,
    '2024-2025',
    'active'
  ),
  (
    (SELECT id FROM schools LIMIT 1),
    '6EME A',
    '6A',
    '6EME',
    'A',
    45,
    '2024-2025',
    'active'
  ),
  (
    (SELECT id FROM schools LIMIT 1),
    'CM2',
    'CM2',
    'CM2',
    NULL,
    35,
    '2024-2025',
    'active'
  );
*/

-- ============================================
-- FIN DU SCHÉMA
-- ============================================

-- Pour vérifier l'installation :
-- SELECT * FROM classes_complete;

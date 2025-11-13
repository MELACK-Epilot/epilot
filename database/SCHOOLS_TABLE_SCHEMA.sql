-- ============================================================================
-- TABLE SCHOOLS (ÉCOLES)
-- Pour Administrateur Groupe Scolaire
-- ============================================================================

-- Créer la table schools
CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_group_id UUID NOT NULL REFERENCES school_groups(id) ON DELETE CASCADE,
  
  -- Informations de base
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) UNIQUE, -- Code établissement (ex: EP-BZV-001)
  logo TEXT, -- URL du logo de l'école
  description TEXT,
  
  -- Adresse complète
  address TEXT,
  city VARCHAR(100),
  department VARCHAR(100),
  region VARCHAR(100) DEFAULT 'Brazzaville',
  postal_code VARCHAR(20),
  
  -- Contact
  phone VARCHAR(20),
  email VARCHAR(100),
  website VARCHAR(200),
  
  -- Administration
  director_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Administrateur d'école
  
  -- Capacité et occupation
  capacity INTEGER DEFAULT 0, -- Nombre d'élèves maximum
  current_students INTEGER DEFAULT 0, -- Nombre actuel d'élèves
  current_staff INTEGER DEFAULT 0, -- Nombre actuel de personnel
  
  -- Niveaux d'enseignement proposés
  has_preschool BOOLEAN DEFAULT false, -- Maternelle
  has_primary BOOLEAN DEFAULT false, -- Primaire
  has_middle BOOLEAN DEFAULT false, -- Collège
  has_high BOOLEAN DEFAULT false, -- Lycée
  
  -- Type d'établissement
  school_type VARCHAR(50) DEFAULT 'generale' CHECK (school_type IN ('generale', 'technique', 'professionnelle', 'mixte')),
  
  -- Statut
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'construction', 'suspended')),
  
  -- Dates importantes
  opening_date DATE,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- Contraintes
  CONSTRAINT valid_capacity CHECK (capacity >= 0),
  CONSTRAINT valid_students CHECK (current_students >= 0 AND current_students <= capacity),
  CONSTRAINT valid_staff CHECK (current_staff >= 0),
  CONSTRAINT at_least_one_level CHECK (has_preschool OR has_primary OR has_middle OR has_high)
);

-- ============================================================================
-- INDEX
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_schools_group ON schools(school_group_id);
CREATE INDEX IF NOT EXISTS idx_schools_status ON schools(status);
CREATE INDEX IF NOT EXISTS idx_schools_director ON schools(director_id);
CREATE INDEX IF NOT EXISTS idx_schools_city ON schools(city);
CREATE INDEX IF NOT EXISTS idx_schools_department ON schools(department);
CREATE INDEX IF NOT EXISTS idx_schools_type ON schools(school_type);
CREATE INDEX IF NOT EXISTS idx_schools_code ON schools(code);

-- ============================================================================
-- TRIGGER MISE À JOUR
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_schools_updated_at ON schools;
CREATE TRIGGER update_schools_updated_at
BEFORE UPDATE ON schools
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FONCTION: Calculer le taux d'occupation
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_school_occupancy(school_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  school_capacity INTEGER;
  school_students INTEGER;
  occupancy_rate NUMERIC;
BEGIN
  SELECT capacity, current_students INTO school_capacity, school_students
  FROM schools
  WHERE id = school_id;
  
  IF school_capacity = 0 THEN
    RETURN 0;
  END IF;
  
  occupancy_rate := (school_students::NUMERIC / school_capacity::NUMERIC) * 100;
  RETURN ROUND(occupancy_rate, 2);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FONCTION: Mettre à jour le nombre d'élèves automatiquement
-- ============================================================================

CREATE OR REPLACE FUNCTION update_school_students_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour le compteur d'élèves de l'école
  UPDATE schools
  SET current_students = (
    SELECT COUNT(*)
    FROM inscriptions
    WHERE school_id = NEW.school_id
    AND status = 'validated'
  )
  WHERE id = NEW.school_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur inscriptions pour mettre à jour automatiquement
DROP TRIGGER IF EXISTS update_school_students_on_inscription ON inscriptions;
CREATE TRIGGER update_school_students_on_inscription
AFTER INSERT OR UPDATE OR DELETE ON inscriptions
FOR EACH ROW
EXECUTE FUNCTION update_school_students_count();

-- ============================================================================
-- FONCTION: Mettre à jour le nombre de personnel automatiquement
-- ============================================================================

CREATE OR REPLACE FUNCTION update_school_staff_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour le compteur de personnel de l'école
  UPDATE schools
  SET current_staff = (
    SELECT COUNT(*)
    FROM users
    WHERE school_id = COALESCE(NEW.school_id, OLD.school_id)
    AND status = 'active'
    AND role IN ('admin_ecole', 'enseignant', 'cpe', 'comptable', 'documentaliste', 'surveillant')
  )
  WHERE id = COALESCE(NEW.school_id, OLD.school_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger sur users pour mettre à jour automatiquement
DROP TRIGGER IF EXISTS update_school_staff_on_user ON users;
CREATE TRIGGER update_school_staff_on_user
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW
EXECUTE FUNCTION update_school_staff_count();

-- ============================================================================
-- VUE: Écoles avec statistiques
-- ============================================================================

CREATE OR REPLACE VIEW schools_with_stats AS
SELECT 
  s.*,
  sg.name AS school_group_name,
  u.first_name AS director_first_name,
  u.last_name AS director_last_name,
  u.email AS director_email,
  CASE 
    WHEN s.capacity > 0 THEN ROUND((s.current_students::NUMERIC / s.capacity::NUMERIC) * 100, 2)
    ELSE 0
  END AS occupancy_rate,
  s.capacity - s.current_students AS available_capacity,
  CASE
    WHEN s.current_students >= s.capacity THEN 'full'
    WHEN s.current_students >= (s.capacity * 0.9) THEN 'almost_full'
    WHEN s.current_students >= (s.capacity * 0.5) THEN 'half_full'
    ELSE 'available'
  END AS capacity_status
FROM schools s
LEFT JOIN school_groups sg ON s.school_group_id = sg.id
LEFT JOIN users u ON s.director_id = u.id;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Activer RLS
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

-- Politique pour Super Admin (voit tout)
DROP POLICY IF EXISTS "super_admin_schools_all" ON schools;
CREATE POLICY "super_admin_schools_all" ON schools
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

-- Politique pour Admin Groupe (voit ses écoles uniquement)
DROP POLICY IF EXISTS "admin_groupe_schools_select" ON schools;
CREATE POLICY "admin_groupe_schools_select" ON schools
FOR SELECT
TO authenticated
USING (
  school_group_id = (
    SELECT school_group_id FROM users
    WHERE id = auth.uid()
    AND role = 'admin_groupe'
  )
);

DROP POLICY IF EXISTS "admin_groupe_schools_insert" ON schools;
CREATE POLICY "admin_groupe_schools_insert" ON schools
FOR INSERT
TO authenticated
WITH CHECK (
  school_group_id = (
    SELECT school_group_id FROM users
    WHERE id = auth.uid()
    AND role = 'admin_groupe'
  )
);

DROP POLICY IF EXISTS "admin_groupe_schools_update" ON schools;
CREATE POLICY "admin_groupe_schools_update" ON schools
FOR UPDATE
TO authenticated
USING (
  school_group_id = (
    SELECT school_group_id FROM users
    WHERE id = auth.uid()
    AND role = 'admin_groupe'
  )
);

DROP POLICY IF EXISTS "admin_groupe_schools_delete" ON schools;
CREATE POLICY "admin_groupe_schools_delete" ON schools
FOR DELETE
TO authenticated
USING (
  school_group_id = (
    SELECT school_group_id FROM users
    WHERE id = auth.uid()
    AND role = 'admin_groupe'
  )
);

-- Politique pour Admin École (voit son école uniquement)
DROP POLICY IF EXISTS "admin_ecole_schools_select" ON schools;
CREATE POLICY "admin_ecole_schools_select" ON schools
FOR SELECT
TO authenticated
USING (
  id = (
    SELECT school_id FROM users
    WHERE id = auth.uid()
    AND role = 'admin_ecole'
  )
);

-- ============================================================================
-- DONNÉES DE TEST
-- ============================================================================

-- Insérer des écoles de test (à adapter selon vos besoins)
/*
INSERT INTO schools (school_group_id, name, code, address, city, department, phone, email, capacity, has_primary, has_middle, has_high, school_type, status)
VALUES
  (
    (SELECT id FROM school_groups LIMIT 1),
    'École Primaire Saint-Joseph',
    'EP-BZV-001',
    '123 Avenue de la Paix',
    'Brazzaville',
    'Brazzaville',
    '+242 06 123 4567',
    'contact@stjoseph-bzv.cg',
    300,
    true,
    false,
    false,
    'generale',
    'active'
  ),
  (
    (SELECT id FROM school_groups LIMIT 1),
    'Collège Technique Moderne',
    'CT-BZV-002',
    '456 Rue de la République',
    'Brazzaville',
    'Brazzaville',
    '+242 06 234 5678',
    'contact@ctm-bzv.cg',
    500,
    false,
    true,
    true,
    'technique',
    'active'
  );
*/

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON TABLE schools IS 'Table des écoles gérées par les groupes scolaires';
COMMENT ON COLUMN schools.code IS 'Code unique de l''établissement (ex: EP-BZV-001)';
COMMENT ON COLUMN schools.capacity IS 'Capacité maximale d''élèves';
COMMENT ON COLUMN schools.current_students IS 'Nombre actuel d''élèves (mis à jour automatiquement)';
COMMENT ON COLUMN schools.current_staff IS 'Nombre actuel de personnel (mis à jour automatiquement)';
COMMENT ON COLUMN schools.director_id IS 'Administrateur d''école assigné';
COMMENT ON COLUMN schools.school_type IS 'Type: generale, technique, professionnelle, mixte';
COMMENT ON COLUMN schools.status IS 'Statut: active, inactive, construction, suspended';

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================

-- Vérifier la création
SELECT 'Table schools créée avec succès!' AS message;
SELECT COUNT(*) AS total_schools FROM schools;

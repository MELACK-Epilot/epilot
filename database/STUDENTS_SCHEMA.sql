-- ============================================================================
-- SCHÉMA TABLE STUDENTS (ÉLÈVES)
-- ============================================================================
-- Table pour la gestion des élèves
-- Prérequis pour le module finances scolaires
-- ============================================================================

-- ============================================================================
-- TABLE : STUDENTS (Élèves)
-- ============================================================================

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Informations personnelles
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT CHECK (gender IN ('M', 'F')),
  place_of_birth TEXT,
  
  -- Informations scolaires
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class TEXT,                                    -- Ex: "6ème A", "CM2 B"
  level TEXT,                                    -- Ex: "primaire", "college", "lycee"
  academic_year TEXT NOT NULL,                   -- Ex: "2024-2025"
  enrollment_date DATE NOT NULL,
  
  -- Informations de contact
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  
  -- Informations parents/tuteurs
  parent_name TEXT,
  parent_phone TEXT,
  parent_email TEXT,
  parent_address TEXT,
  
  -- Informations médicales (optionnel)
  blood_group TEXT,
  allergies TEXT,
  medical_notes TEXT,
  
  -- Photo
  photo_url TEXT,
  
  -- Statut
  status TEXT DEFAULT 'active' CHECK (status IN (
    'active',         -- Actif
    'inactive',       -- Inactif
    'graduated',      -- Diplômé
    'transferred',    -- Transféré
    'suspended',      -- Suspendu
    'expelled'        -- Exclu
  )),
  
  -- Métadonnées
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- ============================================================================
-- INDEX POUR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class);
CREATE INDEX IF NOT EXISTS idx_students_level ON students(level);
CREATE INDEX IF NOT EXISTS idx_students_academic_year ON students(academic_year);
CREATE INDEX IF NOT EXISTS idx_students_enrollment_date ON students(enrollment_date);
CREATE INDEX IF NOT EXISTS idx_students_first_name ON students(first_name);
CREATE INDEX IF NOT EXISTS idx_students_last_name ON students(last_name);

-- Index pour recherche full-text
CREATE INDEX IF NOT EXISTS idx_students_search ON students 
  USING gin(to_tsvector('french', first_name || ' ' || last_name || ' ' || COALESCE(parent_name, '')));

-- ============================================================================
-- TRIGGER POUR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_students_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_students_updated_at();

-- ============================================================================
-- VUE : STATISTIQUES DES ÉLÈVES PAR ÉCOLE
-- ============================================================================

CREATE OR REPLACE VIEW students_stats_by_school AS
SELECT 
  s.id as school_id,
  s.name as school_name,
  s.school_group_id,
  
  -- Total élèves
  COUNT(st.id) as total_students,
  
  -- Par statut
  SUM(CASE WHEN st.status = 'active' THEN 1 ELSE 0 END) as active_students,
  SUM(CASE WHEN st.status = 'inactive' THEN 1 ELSE 0 END) as inactive_students,
  SUM(CASE WHEN st.status = 'graduated' THEN 1 ELSE 0 END) as graduated_students,
  SUM(CASE WHEN st.status = 'transferred' THEN 1 ELSE 0 END) as transferred_students,
  SUM(CASE WHEN st.status = 'suspended' THEN 1 ELSE 0 END) as suspended_students,
  
  -- Par niveau
  SUM(CASE WHEN st.level = 'maternelle' THEN 1 ELSE 0 END) as maternelle_count,
  SUM(CASE WHEN st.level = 'primaire' THEN 1 ELSE 0 END) as primaire_count,
  SUM(CASE WHEN st.level = 'college' THEN 1 ELSE 0 END) as college_count,
  SUM(CASE WHEN st.level = 'lycee' THEN 1 ELSE 0 END) as lycee_count,
  
  -- Par genre
  SUM(CASE WHEN st.gender = 'M' THEN 1 ELSE 0 END) as male_count,
  SUM(CASE WHEN st.gender = 'F' THEN 1 ELSE 0 END) as female_count
  
FROM schools s
LEFT JOIN students st ON st.school_id = s.id
GROUP BY s.id, s.name, s.school_group_id;

-- ============================================================================
-- VUE : STATISTIQUES DES ÉLÈVES PAR GROUPE
-- ============================================================================

CREATE OR REPLACE VIEW students_stats_by_group AS
SELECT 
  sg.id as school_group_id,
  sg.name as group_name,
  
  -- Total élèves
  COUNT(st.id) as total_students,
  
  -- Par statut
  SUM(CASE WHEN st.status = 'active' THEN 1 ELSE 0 END) as active_students,
  SUM(CASE WHEN st.status = 'inactive' THEN 1 ELSE 0 END) as inactive_students,
  
  -- Par niveau
  SUM(CASE WHEN st.level = 'maternelle' THEN 1 ELSE 0 END) as maternelle_count,
  SUM(CASE WHEN st.level = 'primaire' THEN 1 ELSE 0 END) as primaire_count,
  SUM(CASE WHEN st.level = 'college' THEN 1 ELSE 0 END) as college_count,
  SUM(CASE WHEN st.level = 'lycee' THEN 1 ELSE 0 END) as lycee_count,
  
  -- Par genre
  SUM(CASE WHEN st.gender = 'M' THEN 1 ELSE 0 END) as male_count,
  SUM(CASE WHEN st.gender = 'F' THEN 1 ELSE 0 END) as female_count
  
FROM school_groups sg
LEFT JOIN schools s ON s.school_group_id = sg.id
LEFT JOIN students st ON st.school_id = s.id
GROUP BY sg.id, sg.name;

-- ============================================================================
-- POLITIQUES RLS (Row Level Security)
-- ============================================================================

-- Activer RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Politique pour Super Admin : voir tous les élèves
CREATE POLICY "Super admin voit tous les élèves"
  ON students FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

-- Politique pour Admin Groupe : voir les élèves de ses écoles
CREATE POLICY "Admin groupe voit ses élèves"
  ON students FOR ALL
  USING (
    school_id IN (
      SELECT id FROM schools 
      WHERE school_group_id = (
        SELECT school_group_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Politique pour Admin École : voir les élèves de son école
CREATE POLICY "Admin école voit ses élèves"
  ON students FOR ALL
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

-- ============================================================================
-- FONCTION : GÉNÉRER NUMÉRO MATRICULE
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_student_matricule(p_school_id UUID)
RETURNS TEXT AS $$
DECLARE
  school_code TEXT;
  year_code TEXT;
  sequence_num TEXT;
  matricule TEXT;
BEGIN
  -- Récupérer le code de l'école (3 premières lettres du nom en majuscules)
  SELECT UPPER(SUBSTRING(name, 1, 3)) INTO school_code
  FROM schools
  WHERE id = p_school_id;
  
  -- Année en cours (2 derniers chiffres)
  year_code := TO_CHAR(NOW(), 'YY');
  
  -- Numéro de séquence (nombre d'élèves + 1)
  SELECT LPAD((COUNT(*) + 1)::TEXT, 4, '0') INTO sequence_num
  FROM students
  WHERE school_id = p_school_id;
  
  -- Construire le matricule : ÉCOLE-ANNÉE-SÉQUENCE
  matricule := school_code || '-' || year_code || '-' || sequence_num;
  
  RETURN matricule;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- DONNÉES DE TEST (Optionnel)
-- ============================================================================

-- Décommenter pour insérer des données de test
/*
INSERT INTO students (
  first_name, last_name, date_of_birth, gender,
  school_id, class, level, academic_year, enrollment_date,
  parent_name, parent_phone, parent_email,
  status
) VALUES
  (
    'Jean', 'Dupont', '2010-05-15', 'M',
    (SELECT id FROM schools LIMIT 1),
    '6ème A', 'college', '2024-2025', '2024-09-01',
    'Marie Dupont', '+242 06 123 4567', 'marie.dupont@email.com',
    'active'
  ),
  (
    'Sophie', 'Martin', '2011-08-20', 'F',
    (SELECT id FROM schools LIMIT 1),
    '5ème B', 'college', '2024-2025', '2024-09-01',
    'Pierre Martin', '+242 06 234 5678', 'pierre.martin@email.com',
    'active'
  );
*/

-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================

/*
1. **Prérequis** :
   - Table schools doit exister
   - Table profiles doit exister

2. **Champs obligatoires** :
   - first_name, last_name, date_of_birth
   - school_id, academic_year, enrollment_date

3. **Statuts disponibles** :
   - active : Élève actif
   - inactive : Élève inactif
   - graduated : Élève diplômé
   - transferred : Élève transféré
   - suspended : Élève suspendu
   - expelled : Élève exclu

4. **Niveaux** :
   - maternelle
   - primaire
   - college
   - lycee

5. **RLS activé** :
   - Super Admin : voit tous les élèves
   - Admin Groupe : voit les élèves de ses écoles
   - Admin École : voit les élèves de son école

6. **Vues créées** :
   - students_stats_by_school : Statistiques par école
   - students_stats_by_group : Statistiques par groupe

7. **Fonction utilitaire** :
   - generate_student_matricule(school_id) : Génère un matricule unique

8. **Index de performance** :
   - Sur school_id, status, class, level, academic_year
   - Index full-text pour recherche par nom

9. **Prochaines étapes** :
   - Exécuter ce script AVANT SCHOOL_FINANCES_SCHEMA.sql
   - Créer les hooks React Query pour students
   - Créer l'interface de gestion des élèves
*/

-- ============================================
-- SCHÉMA SQL - MODULE INSCRIPTIONS
-- E-Pilot Congo - Gestion des Inscriptions
-- ============================================

-- 1. Créer la table inscriptions
CREATE TABLE IF NOT EXISTS inscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Référence
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  academic_year VARCHAR(20) NOT NULL,              -- Ex: "2024-2025"
  inscription_number VARCHAR(50) UNIQUE NOT NULL,  -- Ex: "INS-2024-001"
  
  -- Élève
  student_first_name VARCHAR(100) NOT NULL,
  student_last_name VARCHAR(100) NOT NULL,
  student_date_of_birth DATE NOT NULL,
  student_place_of_birth VARCHAR(100),
  student_gender VARCHAR(10) NOT NULL CHECK (student_gender IN ('M', 'F')),
  student_photo TEXT,                              -- URL photo
  
  -- Classe demandée
  requested_class_id UUID,                         -- Référence à classes (optionnel - sera lié plus tard)
  requested_level VARCHAR(50) NOT NULL,            -- Ex: "5EME", "6EME", "CM2" (OBLIGATOIRE)
  serie VARCHAR(50),                               -- Ex: "A", "C", "D" (pour lycée)
  
  -- Parent 1 (obligatoire)
  parent1_first_name VARCHAR(100) NOT NULL,
  parent1_last_name VARCHAR(100) NOT NULL,
  parent1_phone VARCHAR(20) NOT NULL,
  parent1_email VARCHAR(100),
  parent1_profession VARCHAR(100),
  
  -- Parent 2 (optionnel)
  parent2_first_name VARCHAR(100),
  parent2_last_name VARCHAR(100),
  parent2_phone VARCHAR(20),
  parent2_email VARCHAR(100),
  parent2_profession VARCHAR(100),
  
  -- Adresse
  address TEXT,
  city VARCHAR(100),
  region VARCHAR(100),
  
  -- Informations académiques supplémentaires
  est_redoublant BOOLEAN DEFAULT false,            -- Redouble la classe (Oui/Non)
  est_affecte BOOLEAN DEFAULT false,               -- Affecté par le ministère (Oui/Non)
  numero_affectation VARCHAR(100),                 -- N° du document d'affectation/transfert
  a_aide_sociale BOOLEAN DEFAULT false,            -- Bénéficie d'une aide sociale (PCS, etc.)
  est_pensionnaire BOOLEAN DEFAULT false,          -- Vit à l'internat (Oui/Non)
  a_bourse BOOLEAN DEFAULT false,                  -- Bénéficie d'une bourse (Oui/Non)
  
  -- Frais (en FCFA)
  frais_inscription DECIMAL(10, 2),                -- Ex: 40000
  frais_scolarite DECIMAL(10, 2),                  -- Ex: 90000
  frais_cantine DECIMAL(10, 2),                    -- Ex: 10000
  frais_transport DECIMAL(10, 2),                  -- Ex: 10000
  
  -- Documents (JSON array)
  documents JSONB DEFAULT '[]'::jsonb,
  
  -- Statut & Workflow
  status VARCHAR(50) DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'en_cours', 'validee', 'refusee', 'annulee')),
  workflow_step VARCHAR(50) DEFAULT 'soumission' CHECK (workflow_step IN ('soumission', 'verification', 'validation', 'finalisation')),
  
  -- Notes internes
  internal_notes TEXT,
  rejection_reason TEXT,
  
  -- Métadonnées
  submitted_at TIMESTAMP DEFAULT NOW(),
  validated_at TIMESTAMP,
  validated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_inscriptions_school ON inscriptions(school_id);
CREATE INDEX IF NOT EXISTS idx_inscriptions_status ON inscriptions(status);
CREATE INDEX IF NOT EXISTS idx_inscriptions_year ON inscriptions(academic_year);
CREATE INDEX IF NOT EXISTS idx_inscriptions_number ON inscriptions(inscription_number);
CREATE INDEX IF NOT EXISTS idx_inscriptions_student_name ON inscriptions(student_last_name, student_first_name);
CREATE INDEX IF NOT EXISTS idx_inscriptions_submitted_at ON inscriptions(submitted_at DESC);

-- 3. Fonction pour générer le numéro d'inscription automatique
CREATE OR REPLACE FUNCTION generate_inscription_number()
RETURNS TRIGGER AS $$
DECLARE
  year_suffix VARCHAR(4);
  next_number INTEGER;
  new_number VARCHAR(50);
BEGIN
  -- Extraire l'année (ex: "2024" de "2024-2025")
  year_suffix := SPLIT_PART(NEW.academic_year, '-', 1);
  
  -- Trouver le prochain numéro pour cette année
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(inscription_number, '-', 3) AS INTEGER)
  ), 0) + 1
  INTO next_number
  FROM inscriptions
  WHERE academic_year = NEW.academic_year;
  
  -- Générer le numéro (ex: "INS-2024-001")
  new_number := 'INS-' || year_suffix || '-' || LPAD(next_number::TEXT, 3, '0');
  
  NEW.inscription_number := new_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger pour générer automatiquement le numéro d'inscription
DROP TRIGGER IF EXISTS trigger_generate_inscription_number ON inscriptions;
CREATE TRIGGER trigger_generate_inscription_number
  BEFORE INSERT ON inscriptions
  FOR EACH ROW
  WHEN (NEW.inscription_number IS NULL OR NEW.inscription_number = '')
  EXECUTE FUNCTION generate_inscription_number();

-- 5. Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_inscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger pour updated_at
DROP TRIGGER IF EXISTS trigger_update_inscriptions_updated_at ON inscriptions;
CREATE TRIGGER trigger_update_inscriptions_updated_at
  BEFORE UPDATE ON inscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_inscriptions_updated_at();

-- 7. Vue pour les statistiques des inscriptions
CREATE OR REPLACE VIEW inscriptions_stats AS
SELECT
  academic_year,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'en_attente') as en_attente,
  COUNT(*) FILTER (WHERE status = 'en_cours') as en_cours,
  COUNT(*) FILTER (WHERE status = 'validee') as validees,
  COUNT(*) FILTER (WHERE status = 'refusee') as refusees,
  COUNT(*) FILTER (WHERE status = 'annulee') as annulees,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'validee')::NUMERIC / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as taux_validation
FROM inscriptions
GROUP BY academic_year;

-- 8. Vue pour les inscriptions avec informations complètes
-- Note: LEFT JOIN sur classes pour gérer le cas où la table n'existe pas encore
CREATE OR REPLACE VIEW inscriptions_complete AS
SELECT
  i.*,
  s.name as school_name,
  u.first_name || ' ' || u.last_name as validated_by_name
FROM inscriptions i
LEFT JOIN schools s ON i.school_id = s.id
LEFT JOIN users u ON i.validated_by = u.id;

-- Vue alternative avec classes (à utiliser quand la table classes existera)
-- CREATE OR REPLACE VIEW inscriptions_with_classes AS
-- SELECT
--   i.*,
--   s.name as school_name,
--   c.name as class_name,
--   c.level as class_level,
--   u.first_name || ' ' || u.last_name as validated_by_name
-- FROM inscriptions i
-- LEFT JOIN schools s ON i.school_id = s.id
-- LEFT JOIN classes c ON i.requested_class_id = c.id
-- LEFT JOIN users u ON i.validated_by = u.id;

-- 9. Fonction pour valider une inscription
CREATE OR REPLACE FUNCTION validate_inscription(
  p_inscription_id UUID,
  p_validated_by UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE inscriptions
  SET
    status = 'validee',
    workflow_step = 'finalisation',
    validated_at = NOW(),
    validated_by = p_validated_by,
    updated_at = NOW()
  WHERE id = p_inscription_id;
END;
$$ LANGUAGE plpgsql;

-- 10. Fonction pour refuser une inscription
CREATE OR REPLACE FUNCTION reject_inscription(
  p_inscription_id UUID,
  p_rejection_reason TEXT,
  p_rejected_by UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE inscriptions
  SET
    status = 'refusee',
    rejection_reason = p_rejection_reason,
    validated_at = NOW(),
    validated_by = p_rejected_by,
    updated_at = NOW()
  WHERE id = p_inscription_id;
END;
$$ LANGUAGE plpgsql;

-- 11. Politiques RLS (Row Level Security)
ALTER TABLE inscriptions ENABLE ROW LEVEL SECURITY;

-- Super Admin : accès total
CREATE POLICY "Super Admin can do everything on inscriptions"
  ON inscriptions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Admin Groupe : accès aux inscriptions de toutes les écoles de son groupe
CREATE POLICY "Admin Groupe can manage inscriptions of their schools"
  ON inscriptions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN school_groups sg ON u.school_group_id = sg.id
      JOIN schools s ON s.school_group_id = sg.id
      WHERE u.id = auth.uid()
      AND u.role = 'admin_groupe'
      AND s.id = inscriptions.school_id
    )
  );

-- 12. Données de test (optionnel - à commenter en production)
/*
INSERT INTO inscriptions (
  school_id,
  academic_year,
  student_first_name,
  student_last_name,
  student_date_of_birth,
  student_gender,
  requested_level,
  parent1_first_name,
  parent1_last_name,
  parent1_phone,
  status
) VALUES
  (
    (SELECT id FROM schools LIMIT 1),
    '2024-2025',
    'Jean',
    'Dupont',
    '2010-05-15',
    'M',
    '6ème',
    'Pierre',
    'Dupont',
    '+242 06 123 4567',
    'en_attente'
  ),
  (
    (SELECT id FROM schools LIMIT 1),
    '2024-2025',
    'Marie',
    'Koumba',
    '2011-08-22',
    'F',
    '5ème',
    'Joseph',
    'Koumba',
    '+242 06 234 5678',
    'validee'
  ),
  (
    (SELECT id FROM schools LIMIT 1),
    '2024-2025',
    'Paul',
    'Mbemba',
    '2012-03-10',
    'M',
    'CM2',
    'André',
    'Mbemba',
    '+242 06 345 6789',
    'en_cours'
  );
*/

-- ============================================
-- FIN DU SCHÉMA
-- ============================================

-- Pour vérifier l'installation :
-- SELECT * FROM inscriptions_stats;
-- SELECT * FROM inscriptions_complete LIMIT 10;

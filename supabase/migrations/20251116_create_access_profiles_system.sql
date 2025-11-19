-- Migration: Système de profils d'accès pour E-Pilot Congo
-- Scalable pour 500 groupes et 7000 écoles

-- 1. Table des profils d'accès (référence)
CREATE TABLE IF NOT EXISTS access_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name_fr VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  description TEXT,
  
  -- Permissions par domaine (JSONB pour flexibilité)
  permissions JSONB NOT NULL,
  
  -- Métadonnées
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_access_profiles_code ON access_profiles(code);
CREATE INDEX IF NOT EXISTS idx_access_profiles_active ON access_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_permissions ON access_profiles USING GIN (permissions);

-- 2. Ajouter colonne access_profile_code à user_module_permissions
ALTER TABLE user_module_permissions
ADD COLUMN IF NOT EXISTS access_profile_code VARCHAR(50) DEFAULT 'chef_etablissement';

-- Index pour performance (CRUCIAL pour 2M+ lignes)
CREATE INDEX IF NOT EXISTS idx_ump_access_profile ON user_module_permissions(access_profile_code);
CREATE INDEX IF NOT EXISTS idx_ump_user_module ON user_module_permissions(user_id, module_id);
CREATE INDEX IF NOT EXISTS idx_ump_user_profile ON user_module_permissions(user_id, access_profile_code);

-- 3. Table relations parent-élève
CREATE TABLE IF NOT EXISTS parent_student_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Type de relation
  relation_type VARCHAR(20) CHECK (relation_type IN ('pere', 'mere', 'tuteur', 'autre')),
  is_primary_contact BOOLEAN DEFAULT false,
  
  -- Permissions granulaires
  can_view_grades BOOLEAN DEFAULT true,
  can_view_absences BOOLEAN DEFAULT true,
  can_view_payments BOOLEAN DEFAULT true,
  can_receive_notifications BOOLEAN DEFAULT true,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contrainte unicité
  UNIQUE(parent_id, student_id)
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_psr_parent ON parent_student_relations(parent_id);
CREATE INDEX IF NOT EXISTS idx_psr_student ON parent_student_relations(student_id);
CREATE INDEX IF NOT EXISTS idx_psr_primary ON parent_student_relations(is_primary_contact) WHERE is_primary_contact = true;

-- 4. Insérer les 6 profils d'accès
INSERT INTO access_profiles (code, name_fr, description, permissions) VALUES
('chef_etablissement', 'Chef d''Établissement', 'Directeur (Primaire/Collège) ou Proviseur (Lycée) - Accès complet', '{
  "pedagogie": {"read": true, "write": true, "delete": false, "export": true, "validate": true},
  "vie_scolaire": {"read": true, "write": true, "delete": false, "export": true, "validate": true},
  "administration": {"read": true, "write": true, "delete": false, "export": true, "validate": true},
  "finances": {"read": true, "write": false, "delete": false, "export": true, "validate": true},
  "statistiques": {"read": true, "write": false, "delete": false, "export": true, "validate": false},
  "scope": "TOUTE_LECOLE"
}'::jsonb),

('financier_sans_suppression', 'Comptable/Économe', 'Gestion financière uniquement, sans suppression', '{
  "pedagogie": {"read": false, "write": false, "delete": false, "export": false, "validate": false},
  "vie_scolaire": {"read": false, "write": false, "delete": false, "export": false, "validate": false},
  "administration": {"read": true, "write": false, "delete": false, "export": false, "validate": false},
  "finances": {"read": true, "write": true, "delete": false, "export": true, "validate": false},
  "statistiques": {"read": true, "write": false, "delete": false, "export": true, "validate": false},
  "scope": "TOUTE_LECOLE"
}'::jsonb),

('administratif_basique', 'Secrétaire', 'Administration et consultation pédagogie', '{
  "pedagogie": {"read": true, "write": false, "delete": false, "export": false, "validate": false},
  "vie_scolaire": {"read": true, "write": false, "delete": false, "export": false, "validate": false},
  "administration": {"read": true, "write": true, "delete": false, "export": true, "validate": false},
  "finances": {"read": false, "write": false, "delete": false, "export": false, "validate": false},
  "statistiques": {"read": true, "write": false, "delete": false, "export": true, "validate": false},
  "scope": "TOUTE_LECOLE"
}'::jsonb),

('enseignant_saisie_notes', 'Enseignant', 'Saisie notes uniquement (optionnel)', '{
  "pedagogie": {"read": true, "write": true, "delete": false, "export": false, "validate": false},
  "vie_scolaire": {"read": true, "write": false, "delete": false, "export": false, "validate": false},
  "administration": {"read": false, "write": false, "delete": false, "export": false, "validate": false},
  "finances": {"read": false, "write": false, "delete": false, "export": false, "validate": false},
  "statistiques": {"read": false, "write": false, "delete": false, "export": false, "validate": false},
  "scope": "SES_CLASSES_ET_MATIERES"
}'::jsonb),

('parent_consultation', 'Parent', 'Consultation ses enfants uniquement', '{
  "pedagogie": {"read": true, "write": false, "delete": false, "export": false, "validate": false},
  "vie_scolaire": {"read": true, "write": false, "delete": false, "export": false, "validate": false},
  "administration": {"read": false, "write": false, "delete": false, "export": false, "validate": false},
  "finances": {"read": true, "write": false, "delete": false, "export": false, "validate": false},
  "statistiques": {"read": false, "write": false, "delete": false, "export": false, "validate": false},
  "scope": "SES_ENFANTS_UNIQUEMENT"
}'::jsonb),

('eleve_consultation', 'Élève', 'Consultation ses propres données', '{
  "pedagogie": {"read": true, "write": false, "delete": false, "export": false, "validate": false},
  "vie_scolaire": {"read": true, "write": false, "delete": false, "export": false, "validate": false},
  "administration": {"read": false, "write": false, "delete": false, "export": false, "validate": false},
  "finances": {"read": false, "write": false, "delete": false, "export": false, "validate": false},
  "statistiques": {"read": false, "write": false, "delete": false, "export": false, "validate": false},
  "scope": "LUI_MEME_UNIQUEMENT"
}'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- 5. Grants
GRANT SELECT ON access_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON parent_student_relations TO authenticated;

COMMENT ON TABLE access_profiles IS 'Profils d''accès simplifiés pour E-Pilot Congo (6 profils)';
COMMENT ON TABLE parent_student_relations IS 'Relations parent-élève pour accès consultation';
COMMENT ON COLUMN user_module_permissions.access_profile_code IS 'Code du profil d''accès appliqué';

-- ============================================
-- SCHÉMA SQL COMPLET - TABLE SCHOOLS
-- E-Pilot Congo - Gestion des Écoles
-- ============================================

-- 1. Créer ou mettre à jour la table schools
CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 🏫 Informations générales
  school_group_id UUID REFERENCES school_groups(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100) UNIQUE NOT NULL,                -- Code unique de l'école
  type_etablissement VARCHAR(50) DEFAULT 'prive' CHECK (type_etablissement IN ('public', 'prive', 'confessionnel', 'autre')),
  niveau_enseignement VARCHAR(50)[] DEFAULT ARRAY['primaire'],  -- Array: peut avoir plusieurs niveaux
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'archived')),
  
  -- 📍 Localisation
  address TEXT,
  city VARCHAR(100),
  commune VARCHAR(100),
  departement VARCHAR(100),                         -- Département / Région
  pays VARCHAR(100) DEFAULT 'Congo',
  code_postal VARCHAR(20),
  gps_latitude DECIMAL(10, 8),                      -- Ex: -4.2634
  gps_longitude DECIMAL(11, 8),                     -- Ex: 15.2429
  
  -- 👤 Responsable de l'école
  directeur_nom_complet VARCHAR(255),
  directeur_telephone VARCHAR(20),
  directeur_email VARCHAR(100),
  directeur_fonction VARCHAR(100) DEFAULT 'Directeur',  -- Directeur, Proviseur, Principal
  
  -- ☎️ Contacts de l'école
  telephone_fixe VARCHAR(20),
  telephone_mobile VARCHAR(20),
  email_institutionnel VARCHAR(100),
  site_web TEXT,
  
  -- 👨‍🏫 Données administratives
  nombre_eleves_actuels INTEGER DEFAULT 0,
  nombre_enseignants INTEGER DEFAULT 0,
  nombre_classes INTEGER DEFAULT 0,
  annee_ouverture INTEGER,                          -- Ex: 2010
  identifiant_fiscal VARCHAR(100),                  -- NIF ou autre
  identifiant_administratif VARCHAR(100),           -- Numéro ministère
  
  -- 💳 Abonnement / Gestion E-Pilot (hérité du groupe)
  -- Note: Ces infos viennent du school_group, mais on peut les dupliquer pour performance
  plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL,
  max_eleves_autorises INTEGER,                     -- Quota spécifique à cette école
  date_debut_abonnement DATE,
  date_expiration_abonnement DATE,
  statut_paiement VARCHAR(50) DEFAULT 'a_jour' CHECK (statut_paiement IN ('a_jour', 'en_retard', 'suspendu', 'gratuit')),
  
  -- 🗂️ Autres informations
  logo_url TEXT,                                    -- URL du logo
  devise VARCHAR(10) DEFAULT 'FCFA',                -- FCFA, EUR, USD
  fuseau_horaire VARCHAR(50) DEFAULT 'Africa/Brazzaville',
  description TEXT,                                 -- Présentation de l'école
  notes_internes TEXT,                              -- Notes admin E-Pilot
  
  -- 📊 Métadonnées
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- 2. Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_schools_group ON schools(school_group_id);
CREATE INDEX IF NOT EXISTS idx_schools_code ON schools(code);
CREATE INDEX IF NOT EXISTS idx_schools_status ON schools(status);
CREATE INDEX IF NOT EXISTS idx_schools_type ON schools(type_etablissement);
CREATE INDEX IF NOT EXISTS idx_schools_city ON schools(city);
CREATE INDEX IF NOT EXISTS idx_schools_departement ON schools(departement);
CREATE INDEX IF NOT EXISTS idx_schools_plan ON schools(plan_id);

-- 3. Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_schools_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger pour updated_at
DROP TRIGGER IF EXISTS trigger_update_schools_updated_at ON schools;
CREATE TRIGGER trigger_update_schools_updated_at
  BEFORE UPDATE ON schools
  FOR EACH ROW
  EXECUTE FUNCTION update_schools_updated_at();

-- 5. Fonction pour générer un code d'école automatique
CREATE OR REPLACE FUNCTION generate_school_code()
RETURNS TRIGGER AS $$
DECLARE
  group_code VARCHAR(10);
  next_number INTEGER;
  new_code VARCHAR(100);
BEGIN
  -- Si le code est déjà fourni, ne rien faire
  IF NEW.code IS NOT NULL AND NEW.code != '' THEN
    RETURN NEW;
  END IF;
  
  -- Récupérer un préfixe du groupe (3 premières lettres du nom)
  SELECT UPPER(LEFT(REGEXP_REPLACE(name, '[^a-zA-Z]', '', 'g'), 3))
  INTO group_code
  FROM school_groups
  WHERE id = NEW.school_group_id;
  
  -- Si pas de groupe trouvé, utiliser 'SCH'
  IF group_code IS NULL OR group_code = '' THEN
    group_code := 'SCH';
  END IF;
  
  -- Trouver le prochain numéro
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(code FROM '[0-9]+$') AS INTEGER)
  ), 0) + 1
  INTO next_number
  FROM schools
  WHERE school_group_id = NEW.school_group_id;
  
  -- Générer le code (ex: "SAG-001" pour Sagesse)
  new_code := group_code || '-' || LPAD(next_number::TEXT, 3, '0');
  
  NEW.code := new_code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger pour générer le code automatiquement
DROP TRIGGER IF EXISTS trigger_generate_school_code ON schools;
CREATE TRIGGER trigger_generate_school_code
  BEFORE INSERT ON schools
  FOR EACH ROW
  WHEN (NEW.code IS NULL OR NEW.code = '')
  EXECUTE FUNCTION generate_school_code();

-- 7. Vue pour les écoles avec informations complètes
CREATE OR REPLACE VIEW schools_complete AS
SELECT
  s.*,
  sg.name as group_name,
  sg.admin_user_id as group_admin_id,
  p.name as plan_name,
  p.slug as plan_slug,
  u_created.first_name || ' ' || u_created.last_name as created_by_name,
  u_updated.first_name || ' ' || u_updated.last_name as updated_by_name,
  -- Calcul du taux de remplissage
  CASE 
    WHEN s.max_eleves_autorises > 0 THEN
      ROUND((s.nombre_eleves_actuels::NUMERIC / s.max_eleves_autorises) * 100, 2)
    ELSE 0
  END as taux_remplissage
FROM schools s
LEFT JOIN school_groups sg ON s.school_group_id = sg.id
LEFT JOIN subscription_plans p ON s.plan_id = p.id
LEFT JOIN users u_created ON s.created_by = u_created.id
LEFT JOIN users u_updated ON s.updated_by = u_updated.id;

-- 8. Vue pour les statistiques des écoles par groupe
CREATE OR REPLACE VIEW schools_stats_by_group AS
SELECT
  school_group_id,
  COUNT(*) as total_ecoles,
  COUNT(*) FILTER (WHERE status = 'active') as ecoles_actives,
  COUNT(*) FILTER (WHERE status = 'inactive') as ecoles_inactives,
  SUM(nombre_eleves_actuels) as total_eleves,
  SUM(nombre_enseignants) as total_enseignants,
  SUM(nombre_classes) as total_classes,
  AVG(nombre_eleves_actuels) as moyenne_eleves_par_ecole
FROM schools
GROUP BY school_group_id;

-- 9. Fonction pour mettre à jour les compteurs
CREATE OR REPLACE FUNCTION update_school_counters(
  p_school_id UUID,
  p_nombre_eleves INTEGER DEFAULT NULL,
  p_nombre_enseignants INTEGER DEFAULT NULL,
  p_nombre_classes INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE schools
  SET
    nombre_eleves_actuels = COALESCE(p_nombre_eleves, nombre_eleves_actuels),
    nombre_enseignants = COALESCE(p_nombre_enseignants, nombre_enseignants),
    nombre_classes = COALESCE(p_nombre_classes, nombre_classes),
    updated_at = NOW()
  WHERE id = p_school_id;
END;
$$ LANGUAGE plpgsql;

-- 10. Politiques RLS (Row Level Security)
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

-- Super Admin : accès total
CREATE POLICY "Super Admin can do everything on schools"
  ON schools
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Admin Groupe : accès aux écoles de son groupe uniquement
CREATE POLICY "Admin Groupe can manage their schools"
  ON schools
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin_groupe'
      AND u.school_group_id = schools.school_group_id
    )
  );

-- 11. Contraintes supplémentaires
ALTER TABLE schools
  ADD CONSTRAINT check_nombre_eleves CHECK (nombre_eleves_actuels >= 0),
  ADD CONSTRAINT check_nombre_enseignants CHECK (nombre_enseignants >= 0),
  ADD CONSTRAINT check_nombre_classes CHECK (nombre_classes >= 0),
  ADD CONSTRAINT check_annee_ouverture CHECK (annee_ouverture >= 1900 AND annee_ouverture <= EXTRACT(YEAR FROM NOW()) + 1);

-- 12. Données de test (optionnel - à commenter en production)
/*
INSERT INTO schools (
  school_group_id,
  name,
  type_etablissement,
  niveau_enseignement,
  address,
  city,
  departement,
  pays,
  directeur_nom_complet,
  directeur_telephone,
  directeur_email,
  telephone_mobile,
  email_institutionnel,
  nombre_eleves_actuels,
  nombre_enseignants,
  nombre_classes,
  annee_ouverture,
  devise,
  description,
  status
) VALUES
  (
    (SELECT id FROM school_groups LIMIT 1),
    'Collège Privé La Sagesse',
    'prive',
    ARRAY['primaire', 'college'],
    'Avenue de la Paix, Quartier Moungali',
    'Brazzaville',
    'Brazzaville',
    'Congo',
    'Dr. Jean Dupont',
    '+242 06 123 4567',
    'directeur@sagesse.cg',
    '+242 06 123 4567',
    'contact@sagesse.cg',
    450,
    35,
    18,
    2005,
    'FCFA',
    'Établissement d''excellence offrant un enseignement de qualité',
    'active'
  ),
  (
    (SELECT id FROM school_groups LIMIT 1),
    'Lycée La Sagesse',
    'prive',
    ARRAY['lycee'],
    'Avenue de la Paix, Quartier Moungali',
    'Brazzaville',
    'Brazzaville',
    'Congo',
    'Mme. Marie Koumba',
    '+242 06 234 5678',
    'proviseur@sagesse-lycee.cg',
    '+242 06 234 5678',
    'contact@sagesse-lycee.cg',
    320,
    28,
    12,
    2010,
    'FCFA',
    'Lycée préparant aux examens nationaux avec un taux de réussite élevé',
    'active'
  );
*/

-- ============================================
-- FIN DU SCHÉMA
-- ============================================

-- Pour vérifier l'installation :
-- SELECT * FROM schools_complete;
-- SELECT * FROM schools_stats_by_group;

-- ============================================
-- MIGRATION - Ajouter colonnes manquantes à SCHOOLS
-- E-Pilot Congo
-- ============================================
-- Ce script ajoute les colonnes manquantes si la table schools existe déjà

-- ⚠️ Supprimer les vues existantes pour éviter les conflits
DROP VIEW IF EXISTS schools_complete CASCADE;
DROP VIEW IF EXISTS schools_stats_by_group CASCADE;

-- 🏫 Informations générales (colonnes de base)
ALTER TABLE schools ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS code VARCHAR(100);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'archived'));
ALTER TABLE schools ADD COLUMN IF NOT EXISTS type_etablissement VARCHAR(50) DEFAULT 'prive' CHECK (type_etablissement IN ('public', 'prive', 'confessionnel', 'autre'));
ALTER TABLE schools ADD COLUMN IF NOT EXISTS niveau_enseignement VARCHAR(50)[] DEFAULT ARRAY['primaire'];

-- 📍 Localisation (colonnes de base)
ALTER TABLE schools ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS region VARCHAR(100);

-- 📍 Localisation
ALTER TABLE schools ADD COLUMN IF NOT EXISTS commune VARCHAR(100);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS departement VARCHAR(100);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS pays VARCHAR(100) DEFAULT 'Congo';
ALTER TABLE schools ADD COLUMN IF NOT EXISTS code_postal VARCHAR(20);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS gps_latitude DECIMAL(10, 8);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS gps_longitude DECIMAL(11, 8);

-- 👤 Responsable de l'école
ALTER TABLE schools ADD COLUMN IF NOT EXISTS directeur_nom_complet VARCHAR(255);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS directeur_telephone VARCHAR(20);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS directeur_email VARCHAR(100);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS directeur_fonction VARCHAR(100) DEFAULT 'Directeur';

-- ☎️ Contacts de l'école
ALTER TABLE schools ADD COLUMN IF NOT EXISTS telephone_fixe VARCHAR(20);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS telephone_mobile VARCHAR(20);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS email_institutionnel VARCHAR(100);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS site_web TEXT;

-- 👨‍🏫 Données administratives
ALTER TABLE schools ADD COLUMN IF NOT EXISTS nombre_eleves_actuels INTEGER DEFAULT 0;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS nombre_enseignants INTEGER DEFAULT 0;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS nombre_classes INTEGER DEFAULT 0;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS annee_ouverture INTEGER;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS identifiant_fiscal VARCHAR(100);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS identifiant_administratif VARCHAR(100);

-- 💳 Abonnement
ALTER TABLE schools ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS max_eleves_autorises INTEGER;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS date_debut_abonnement DATE;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS date_expiration_abonnement DATE;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS statut_paiement VARCHAR(50) DEFAULT 'a_jour' CHECK (statut_paiement IN ('a_jour', 'en_retard', 'suspendu', 'gratuit'));

-- 🗂️ Autres informations
ALTER TABLE schools ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS devise VARCHAR(10) DEFAULT 'FCFA';
ALTER TABLE schools ADD COLUMN IF NOT EXISTS fuseau_horaire VARCHAR(50) DEFAULT 'Africa/Brazzaville';
ALTER TABLE schools ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS notes_internes TEXT;

-- 📊 Métadonnées
ALTER TABLE schools ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE schools ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE schools ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Ajouter les index
CREATE INDEX IF NOT EXISTS idx_schools_group ON schools(school_group_id);
CREATE INDEX IF NOT EXISTS idx_schools_code ON schools(code);
CREATE INDEX IF NOT EXISTS idx_schools_status ON schools(status);
CREATE INDEX IF NOT EXISTS idx_schools_type ON schools(type_etablissement);
CREATE INDEX IF NOT EXISTS idx_schools_city ON schools(city);
CREATE INDEX IF NOT EXISTS idx_schools_departement ON schools(departement);
CREATE INDEX IF NOT EXISTS idx_schools_plan ON schools(plan_id);

-- Recréer les vues avec les nouvelles colonnes
CREATE OR REPLACE VIEW schools_complete AS
SELECT
  s.*,
  sg.name as group_name,
  p.name as plan_name,
  CASE 
    WHEN s.max_eleves_autorises > 0 THEN
      ROUND((s.nombre_eleves_actuels::NUMERIC / s.max_eleves_autorises) * 100, 2)
    ELSE 0
  END as taux_remplissage
FROM schools s
LEFT JOIN school_groups sg ON s.school_group_id = sg.id
LEFT JOIN subscription_plans p ON s.plan_id = p.id;

CREATE OR REPLACE VIEW schools_stats_by_group AS
SELECT
  school_group_id,
  COUNT(*) as total_ecoles,
  COUNT(*) FILTER (WHERE status = 'active') as ecoles_actives,
  COUNT(*) FILTER (WHERE status = 'inactive') as ecoles_inactives,
  SUM(nombre_eleves_actuels) as total_eleves,
  SUM(nombre_enseignants) as total_enseignants,
  SUM(nombre_classes) as total_classes
FROM schools
GROUP BY school_group_id;

-- Message de succès
DO $$
BEGIN
  RAISE NOTICE '✅ Migration terminée : Colonnes ajoutées à la table schools';
  RAISE NOTICE '✅ Vues recréées : schools_complete, schools_stats_by_group';
END $$;

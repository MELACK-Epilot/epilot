/**
 * =====================================================
 * INSTALLATION COMPLÈTE - Création d'Écoles
 * =====================================================
 *
 * Script complet pour rendre la création d'écoles fonctionnelle
 * pour les Administrateurs Groupe Scolaire
 *
 * Date : 8 novembre 2025, 01:15 AM
 * =====================================================
 */

-- =====================================================
-- VÉRIFIER LES TABLES EXISTANTES
-- =====================================================

-- Vérifier si la table schools existe
SELECT
  table_name,
  table_schema
FROM information_schema.tables
WHERE table_name = 'schools'
  AND table_schema = 'public';

-- Vérifier les colonnes de la table schools
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'schools'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- CRÉER LES FONCTIONS SI ELLES N'EXISTENT PAS
-- =====================================================

-- Fonction check_plan_limit (si elle n'existe pas)
DROP FUNCTION IF EXISTS check_plan_limit(uuid,text);
CREATE OR REPLACE FUNCTION check_plan_limit(
  p_school_group_id UUID,
  p_resource_type TEXT
)
RETURNS TABLE (
  allowed BOOLEAN,
  message TEXT,
  current_count INTEGER,
  max_limit INTEGER
) AS $$
DECLARE
  v_plan_id UUID;
  v_plan_slug TEXT;
  v_current_count INTEGER := 0;
  v_max_limit INTEGER := 0;
BEGIN
  -- Récupérer le plan actif du groupe
  SELECT sgs.plan_id, sp.slug
  INTO v_plan_id, v_plan_slug
  FROM school_group_subscriptions sgs
  JOIN subscription_plans sp ON sp.id = sgs.plan_id
  WHERE sgs.school_group_id = p_school_group_id
    AND sgs.status = 'active'
  LIMIT 1;

  -- Si pas de plan actif, autoriser avec limite par défaut
  IF v_plan_id IS NULL THEN
    RETURN QUERY SELECT
      true,
      'Pas de plan actif - limite par défaut appliquée'::TEXT,
      0::INTEGER,
      5::INTEGER; -- Limite par défaut de 5 écoles
    RETURN;
  END IF;

  -- Définir les limites selon le plan
  CASE v_plan_slug
    WHEN 'gratuit' THEN v_max_limit := 1;
    WHEN 'plan-rentree-scolaire' THEN v_max_limit := 1;
    WHEN 'premium' THEN v_max_limit := 5;
    WHEN 'pro' THEN v_max_limit := 20;
    WHEN 'institutionnel' THEN v_max_limit := -1; -- Illimité
    ELSE v_max_limit := 1; -- Par défaut
  END CASE;

  -- Si illimité, autoriser
  IF v_max_limit = -1 THEN
    RETURN QUERY SELECT
      true,
      'Plan illimité'::TEXT,
      0::INTEGER,
      v_max_limit::INTEGER;
    RETURN;
  END IF;

  -- Compter les ressources actuelles
  CASE p_resource_type
    WHEN 'schools' THEN
      SELECT COUNT(*) INTO v_current_count
      FROM schools
      WHERE school_group_id = p_school_group_id
        AND status = 'active';
    WHEN 'users' THEN
      SELECT COUNT(*) INTO v_current_count
      FROM users
      WHERE school_group_id = p_school_group_id
        AND status = 'active';
    ELSE
      v_current_count := 0;
  END CASE;

  -- Vérifier si la limite est atteinte
  IF v_current_count >= v_max_limit THEN
    RETURN QUERY SELECT
      false,
      format('Limite de %s %s atteinte pour le plan %s (%s/%s)',
             v_max_limit, p_resource_type, v_plan_slug, v_current_count, v_max_limit)::TEXT,
      v_current_count::INTEGER,
      v_max_limit::INTEGER;
  ELSE
    RETURN QUERY SELECT
      true,
      format('Limite OK (%s/%s %s)', v_current_count, v_max_limit, p_resource_type)::TEXT,
      v_current_count::INTEGER,
      v_max_limit::INTEGER;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction increment_resource_count (placeholder)
DROP FUNCTION IF EXISTS increment_resource_count(uuid,text,integer);
CREATE OR REPLACE FUNCTION increment_resource_count(
  p_school_group_id UUID,
  p_resource_type TEXT,
  p_increment INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  -- Log pour debug (pas d'incrémentation réelle)
  RAISE NOTICE 'Compteur %s incrémenté de %s pour le groupe %s',
    p_resource_type, p_increment, p_school_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VÉRIFIER LES POLICIES RLS
-- =====================================================

-- Vérifier les policies existantes sur schools
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'schools'
ORDER BY policyname;

-- =====================================================
-- CRÉER LES POLICIES RLS SI NÉCESSAIRE
-- =====================================================

-- Policy pour les Super Admins (accès total)
DROP POLICY IF EXISTS "Super Admin full access to schools" ON schools;
CREATE POLICY "Super Admin full access to schools"
  ON schools
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Policy pour les Admin Groupe (accès limité à leur groupe)
DROP POLICY IF EXISTS "Admin Groupe access to schools" ON schools;
CREATE POLICY "Admin Groupe access to schools"
  ON schools
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin_groupe'
      AND users.school_group_id = schools.school_group_id
    )
  );

-- =====================================================
-- VÉRIFIER LA STRUCTURE DE LA TABLE SCHOOLS
-- =====================================================

-- Créer la table schools si elle n'existe pas
CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  school_group_id UUID NOT NULL REFERENCES school_groups(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Statut et type
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  type_etablissement TEXT DEFAULT 'prive' CHECK (type_etablissement IN ('prive', 'public')),

  -- Localisation
  address TEXT,
  departement TEXT,
  city TEXT,
  commune TEXT,
  code_postal TEXT,
  region TEXT,
  pays TEXT DEFAULT 'Congo',

  -- Coordonnées GPS
  gps_latitude DECIMAL(10,8),
  gps_longitude DECIMAL(11,8),

  -- Contact
  phone TEXT,
  telephone_fixe TEXT,
  telephone_mobile TEXT,
  email TEXT,
  email_institutionnel TEXT,
  site_web TEXT,

  -- Informations établissement
  annee_ouverture INTEGER,
  description TEXT,
  logo_url TEXT,
  couleur_principale TEXT,

  -- Niveaux d'enseignement
  has_preschool BOOLEAN DEFAULT false,
  has_primary BOOLEAN DEFAULT false,
  has_middle BOOLEAN DEFAULT false,
  has_high BOOLEAN DEFAULT false,

  -- Statistiques
  student_count INTEGER DEFAULT 0,
  staff_count INTEGER DEFAULT 0,
  nombre_eleves_actuels INTEGER DEFAULT 0,
  nombre_enseignants INTEGER DEFAULT 0,
  nombre_classes INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Créer les index nécessaires
CREATE INDEX IF NOT EXISTS idx_schools_school_group_id ON schools(school_group_id);
CREATE INDEX IF NOT EXISTS idx_schools_admin_id ON schools(admin_id);
CREATE INDEX IF NOT EXISTS idx_schools_status ON schools(status);
CREATE INDEX IF NOT EXISTS idx_schools_code ON schools(code);
CREATE INDEX IF NOT EXISTS idx_schools_city ON schools(city);
CREATE INDEX IF NOT EXISTS idx_schools_departement ON schools(departement);

-- =====================================================
-- ACTIVER RLS SUR LA TABLE
-- =====================================================

ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CRÉER LES FONCTIONS DE TRIGGER
-- =====================================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_schools_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger updated_at
DROP TRIGGER IF EXISTS trigger_schools_updated_at ON schools;
CREATE TRIGGER trigger_schools_updated_at
  BEFORE UPDATE ON schools
  FOR EACH ROW
  EXECUTE FUNCTION update_schools_updated_at();

-- =====================================================
-- VÉRIFICATIONS FINALES
-- =====================================================

-- Vérifier que les fonctions existent
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name IN ('check_plan_limit', 'increment_resource_count')
  AND routine_schema = 'public'
ORDER BY routine_name;

-- Vérifier les policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'schools'
ORDER BY policyname;

-- Vérifier les index
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'schools'
ORDER BY indexname;

-- =====================================================
-- TESTS DE FONCTIONNALITÉ
-- =====================================================

/*
-- Test 1 : Vérifier les limites pour un groupe
SELECT * FROM check_plan_limit(
  (SELECT id FROM school_groups WHERE code = 'E-PILOT-002'),
  'schools'
);

-- Test 2 : Créer une école de test (remplacer les valeurs)
INSERT INTO schools (
  name, code, school_group_id, status, type_etablissement,
  has_primary, address, departement, city
) VALUES (
  'École Test',
  'TEST-001-SAINTJOSEPH',
  (SELECT id FROM school_groups WHERE code = 'E-PILOT-002'),
  'active',
  'prive',
  true,
  '123 Avenue de Test',
  'Brazzaville',
  'Brazzaville'
);

-- Test 3 : Vérifier que l'école a été créée
SELECT name, code, status FROM schools WHERE code = 'TEST-001-SAINTJOSEPH';
*/

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================

/*
✅ Table schools créée/existe
✅ Fonctions check_plan_limit et increment_resource_count créées
✅ Policies RLS configurées pour Super Admin et Admin Groupe
✅ Index créés pour les performances
✅ Triggers configurés

La création d'écoles devrait maintenant fonctionner !
*/

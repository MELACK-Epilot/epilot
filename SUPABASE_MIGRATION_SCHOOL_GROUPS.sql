-- ============================================
-- MIGRATION: Ajout des champs manquants à school_groups
-- Date: 2025-01-29
-- Description: Ajout des champs pour le formulaire amélioré
-- ============================================

-- Ajouter les nouveaux champs à la table school_groups
ALTER TABLE school_groups 
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS founded_year INTEGER,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS logo TEXT;

-- Ajouter des contraintes de validation (ignorer si déjà existantes)
DO $$
BEGIN
  -- Contrainte pour founded_year
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_founded_year' 
    AND conrelid = 'school_groups'::regclass
  ) THEN
    ALTER TABLE school_groups
      ADD CONSTRAINT check_founded_year CHECK (founded_year IS NULL OR (founded_year >= 1900 AND founded_year <= EXTRACT(YEAR FROM CURRENT_DATE)));
    RAISE NOTICE 'Contrainte check_founded_year ajoutée';
  ELSE
    RAISE NOTICE 'Contrainte check_founded_year existe déjà';
  END IF;

  -- Contrainte pour phone
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_phone_format' 
    AND conrelid = 'school_groups'::regclass
  ) THEN
    ALTER TABLE school_groups
      ADD CONSTRAINT check_phone_format CHECK (phone IS NULL OR phone ~ '^\+?[0-9\s-]{8,20}$');
    RAISE NOTICE 'Contrainte check_phone_format ajoutée';
  ELSE
    RAISE NOTICE 'Contrainte check_phone_format existe déjà';
  END IF;
END $$;

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_school_groups_founded_year ON school_groups(founded_year);

-- Ajouter des commentaires
COMMENT ON COLUMN school_groups.address IS 'Adresse complète du groupe scolaire';
COMMENT ON COLUMN school_groups.phone IS 'Numéro de téléphone de contact';
COMMENT ON COLUMN school_groups.website IS 'Site web du groupe scolaire';
COMMENT ON COLUMN school_groups.founded_year IS 'Année de création du groupe';
COMMENT ON COLUMN school_groups.description IS 'Histoire et description du groupe scolaire';
COMMENT ON COLUMN school_groups.logo IS 'Logo du groupe (Base64 ou URL)';

-- ============================================
-- ACTIVER REALTIME SUR LA TABLE
-- ============================================

-- Activer les publications realtime (ignorer si déjà activé)
DO $$
BEGIN
  -- Vérifier si la table est déjà dans la publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'school_groups'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE school_groups;
    RAISE NOTICE 'Realtime activé sur school_groups';
  ELSE
    RAISE NOTICE 'Realtime déjà activé sur school_groups';
  END IF;
END $$;

-- ============================================
-- POLITIQUES RLS SUPPLÉMENTAIRES
-- ============================================

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Super Admin can insert school groups" ON school_groups;
DROP POLICY IF EXISTS "Super Admin can update school groups" ON school_groups;
DROP POLICY IF EXISTS "Super Admin can delete school groups" ON school_groups;
DROP POLICY IF EXISTS "Admin Groupe can update their group" ON school_groups;

-- Super Admin peut créer des groupes
CREATE POLICY "Super Admin can insert school groups"
ON school_groups FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

-- Super Admin peut modifier des groupes
CREATE POLICY "Super Admin can update school groups"
ON school_groups FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

-- Super Admin peut supprimer des groupes
CREATE POLICY "Super Admin can delete school groups"
ON school_groups FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

-- Admin Groupe peut modifier son propre groupe
CREATE POLICY "Admin Groupe can update their group"
ON school_groups FOR UPDATE
TO authenticated
USING (admin_id = auth.uid());

-- ============================================
-- DONNÉES DE TEST (Optionnel)
-- ============================================

-- Insérer des groupes scolaires de test
INSERT INTO school_groups (
  name, 
  code, 
  region, 
  city, 
  address,
  phone,
  website,
  founded_year,
  description,
  admin_id, 
  plan, 
  school_count, 
  student_count, 
  staff_count,
  status
) VALUES
(
  'Groupe Scolaire Excellence Brazzaville',
  'GSE-BZV-001',
  'Brazzaville',
  'Brazzaville',
  '123 Avenue de l''Indépendance, Brazzaville',
  '+242 06 123 45 67',
  'https://gse-brazzaville.cg',
  2010,
  'Le Groupe Scolaire Excellence est un réseau d''établissements privés fondé en 2010, dédié à l''excellence académique et au développement intégral des élèves. Nous offrons un enseignement de qualité du préscolaire au secondaire.',
  (SELECT id FROM users WHERE email = 'admin@epilot.cg' LIMIT 1),
  'pro',
  5,
  1250,
  85,
  'active'
),
(
  'Groupe Scolaire Pointe-Noire Centre',
  'GSP-PNR-002',
  'Pointe-Noire',
  'Pointe-Noire',
  '45 Boulevard du Port, Pointe-Noire',
  '+242 06 234 56 78',
  'https://gsp-pointenoire.cg',
  2015,
  'Fondé en 2015, le Groupe Scolaire Pointe-Noire Centre s''engage à former les leaders de demain à travers un enseignement moderne et innovant.',
  (SELECT id FROM users WHERE email = 'admin@epilot.cg' LIMIT 1),
  'premium',
  3,
  780,
  52,
  'active'
),
(
  'Groupe Scolaire Dolisie',
  'GSD-DLS-003',
  'Niari',
  'Dolisie',
  '78 Rue de la Paix, Dolisie',
  '+242 06 345 67 89',
  NULL,
  2018,
  'Le Groupe Scolaire Dolisie, créé en 2018, offre une éducation de qualité dans la région du Niari avec un accent sur les valeurs traditionnelles et le progrès.',
  (SELECT id FROM users WHERE email = 'admin@epilot.cg' LIMIT 1),
  'gratuit',
  2,
  450,
  28,
  'active'
)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- VÉRIFICATION
-- ============================================

-- Vérifier que les colonnes ont été ajoutées
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'school_groups'
AND column_name IN ('address', 'phone', 'website', 'founded_year', 'description', 'logo')
ORDER BY ordinal_position;

-- Vérifier les politiques RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'school_groups'
ORDER BY policyname;

-- Compter les groupes scolaires
SELECT 
  COUNT(*) as total_groups,
  COUNT(*) FILTER (WHERE status = 'active') as active_groups,
  COUNT(*) FILTER (WHERE status = 'inactive') as inactive_groups,
  COUNT(*) FILTER (WHERE status = 'suspended') as suspended_groups
FROM school_groups;

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================

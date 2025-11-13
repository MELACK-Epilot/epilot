-- ============================================
-- E-PILOT CONGO - DONNÉES DE TEST
-- Insertion de données de test pour les groupes scolaires
-- ============================================

-- Vérifier d'abord s'il y a des utilisateurs
SELECT count(*) as user_count FROM users;

-- Insérer quelques groupes scolaires de test (seulement s'ils n'existent pas)
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
  plan, 
  school_count, 
  student_count, 
  staff_count,
  status
) 
SELECT 
  'Groupe Scolaire Excellence', 
  'GSE-001', 
  'Brazzaville', 
  'Brazzaville',
  '123 Avenue de l''Indépendance',
  '+242 06 123 45 67',
  'https://gse.cg',
  2010,
  'Un groupe scolaire d''excellence fondé en 2010, offrant une éducation de qualité dans la capitale.',
  'premium', 
  3, 
  450, 
  35,
  'active'
WHERE NOT EXISTS (SELECT 1 FROM school_groups WHERE code = 'GSE-001');

INSERT INTO school_groups (
  name, 
  code, 
  region, 
  city, 
  address,
  phone,
  founded_year,
  description,
  plan, 
  school_count, 
  student_count, 
  staff_count,
  status
) 
SELECT 
  'Réseau Éducatif Moderne', 
  'REM-002', 
  'Pointe-Noire', 
  'Pointe-Noire',
  '456 Boulevard du Port',
  '+242 05 987 65 43',
  2015,
  'Réseau d''écoles modernes avec une approche pédagogique innovante.',
  'pro', 
  5, 
  800, 
  60,
  'active'
WHERE NOT EXISTS (SELECT 1 FROM school_groups WHERE code = 'REM-002');

INSERT INTO school_groups (
  name, 
  code, 
  region, 
  city, 
  plan, 
  school_count, 
  student_count, 
  staff_count,
  status
) 
SELECT 
  'École Communautaire Dolisie', 
  'ECD-003', 
  'Niari', 
  'Dolisie',
  'gratuit', 
  1, 
  120, 
  8,
  'active'
WHERE NOT EXISTS (SELECT 1 FROM school_groups WHERE code = 'ECD-003');

-- Vérifier les données insérées
SELECT 
  name, 
  code, 
  region, 
  city, 
  plan, 
  school_count, 
  student_count, 
  status,
  created_at
FROM school_groups 
ORDER BY created_at DESC;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Données de test insérées avec succès !';
  RAISE NOTICE 'Vous pouvez maintenant tester la liste des groupes scolaires.';
END $$;

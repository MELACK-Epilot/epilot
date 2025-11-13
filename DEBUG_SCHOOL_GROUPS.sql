-- =====================================================
-- DEBUG : Vérifier les données school_groups
-- =====================================================

-- 1. Compter le nombre total de groupes
SELECT COUNT(*) as total_groups FROM school_groups;

-- 2. Afficher les 5 derniers groupes créés
SELECT 
  id,
  name,
  code,
  region,
  city,
  plan,
  status,
  created_at
FROM school_groups 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Vérifier toutes les colonnes du dernier groupe créé
SELECT * FROM school_groups 
ORDER BY created_at DESC 
LIMIT 1;

-- 4. Vérifier si admin_id est NULL (problème potentiel)
SELECT 
  id,
  name,
  code,
  admin_id,
  CASE 
    WHEN admin_id IS NULL THEN 'NULL ⚠️'
    ELSE 'OK ✅'
  END as admin_id_status
FROM school_groups 
ORDER BY created_at DESC 
LIMIT 5;

-- 5. Vérifier la structure de la table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'school_groups'
ORDER BY ordinal_position;

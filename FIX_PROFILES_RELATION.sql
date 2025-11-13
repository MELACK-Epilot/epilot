-- ============================================================================
-- FIX : Ajouter la relation entre profiles et school_groups
-- ============================================================================
-- Date : 1er novembre 2025
-- Problème : Could not find a relationship between 'profiles' and 'school_groups'
-- Solution : Ajouter la colonne school_group_id et la foreign key

-- 1. Ajouter la colonne school_group_id si elle n'existe pas
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS school_group_id UUID;

-- 2. Créer la foreign key vers school_groups
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_school_group_id_fkey'
  ) THEN
    ALTER TABLE profiles
    ADD CONSTRAINT profiles_school_group_id_fkey
    FOREIGN KEY (school_group_id)
    REFERENCES school_groups(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_profiles_school_group_id 
ON profiles(school_group_id);

-- 4. Vérifier que la relation existe
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='profiles'
  AND kcu.column_name='school_group_id';

-- 5. Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Relation profiles → school_groups créée avec succès !';
  RAISE NOTICE 'Colonne : school_group_id';
  RAISE NOTICE 'Foreign Key : profiles_school_group_id_fkey';
  RAISE NOTICE 'Index : idx_profiles_school_group_id';
END $$;

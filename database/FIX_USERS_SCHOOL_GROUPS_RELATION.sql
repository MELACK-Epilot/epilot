-- =====================================================
-- FIX : Créer la relation entre users et school_groups
-- Date : 30 octobre 2025
-- =====================================================

-- 1. Vérifier si la contrainte existe déjà
SELECT constraint_name, table_name, column_name
FROM information_schema.key_column_usage
WHERE table_name = 'users' 
  AND column_name = 'school_group_id';

-- 2. Supprimer l'ancienne contrainte si elle existe (au cas où)
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_school_group_id_fkey;

ALTER TABLE users 
DROP CONSTRAINT IF EXISTS fk_users_school_groups;

-- 3. Créer la foreign key correctement
ALTER TABLE users
ADD CONSTRAINT users_school_group_id_fkey 
FOREIGN KEY (school_group_id) 
REFERENCES school_groups(id)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- 4. Créer un index pour améliorer les performances des jointures
CREATE INDEX IF NOT EXISTS idx_users_school_group_id 
ON users(school_group_id);

-- 5. Vérification finale
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'users'
  AND kcu.column_name = 'school_group_id';

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================
/*
Vous devriez voir :

constraint_name: users_school_group_id_fkey
table_name: users
column_name: school_group_id
foreign_table_name: school_groups
foreign_column_name: id

✅ Si vous voyez cela, la relation est correctement créée !
*/

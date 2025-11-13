-- =====================================================
-- FIX : Créer la relation entre school_groups et users (admin)
-- Date : 30 octobre 2025
-- =====================================================

-- 1. Vérifier si la contrainte existe déjà
SELECT constraint_name, table_name, column_name
FROM information_schema.key_column_usage
WHERE table_name = 'school_groups' 
  AND column_name = 'admin_id';

-- 2. Supprimer l'ancienne contrainte si elle existe (au cas où)
ALTER TABLE school_groups 
DROP CONSTRAINT IF EXISTS school_groups_admin_id_fkey;

ALTER TABLE school_groups 
DROP CONSTRAINT IF EXISTS fk_school_groups_users;

-- 3. Créer la foreign key correctement
ALTER TABLE school_groups
ADD CONSTRAINT school_groups_admin_id_fkey 
FOREIGN KEY (admin_id) 
REFERENCES users(id)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- 4. Créer un index pour améliorer les performances des jointures
CREATE INDEX IF NOT EXISTS idx_school_groups_admin_id 
ON school_groups(admin_id);

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
  AND tc.table_name = 'school_groups'
  AND kcu.column_name = 'admin_id';

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================
/*
Vous devriez voir :

constraint_name: school_groups_admin_id_fkey
table_name: school_groups
column_name: admin_id
foreign_table_name: users
foreign_column_name: id

✅ Si vous voyez cela, la relation est correctement créée !
*/

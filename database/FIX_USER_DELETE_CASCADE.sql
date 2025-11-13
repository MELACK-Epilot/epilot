-- =====================================================
-- FIX : Suppression Admin Groupe - Cascade
-- =====================================================
-- Date: 10 Novembre 2025, 01:42
-- Objectif: Permettre suppression utilisateur avec cascade
-- =====================================================

BEGIN;

-- =====================================================
-- ÉTAPE 1 : Vérifier les foreign keys existantes
-- =====================================================
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.table_name = 'user_module_permissions'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'assigned_by';

-- =====================================================
-- ÉTAPE 2 : Supprimer l'ancienne contrainte
-- =====================================================
ALTER TABLE user_module_permissions
DROP CONSTRAINT IF EXISTS user_module_permissions_assigned_by_fkey;

-- =====================================================
-- ÉTAPE 3 : Recréer avec ON DELETE SET NULL
-- =====================================================
ALTER TABLE user_module_permissions
ADD CONSTRAINT user_module_permissions_assigned_by_fkey
FOREIGN KEY (assigned_by)
REFERENCES users(id)
ON DELETE SET NULL;  -- ✅ Mettre NULL au lieu de bloquer

-- =====================================================
-- ÉTAPE 4 : Vérifier d'autres tables problématiques
-- =====================================================

-- Vérifier toutes les FK vers users
SELECT
  tc.table_name,
  kcu.column_name,
  tc.constraint_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE ccu.table_name = 'users'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND rc.delete_rule = 'NO ACTION'
ORDER BY tc.table_name, kcu.column_name;

-- =====================================================
-- ÉTAPE 5 : Fixer autres contraintes si nécessaire
-- =====================================================

-- group_module_configs.created_by
ALTER TABLE group_module_configs
DROP CONSTRAINT IF EXISTS group_module_configs_created_by_fkey;

ALTER TABLE group_module_configs
ADD CONSTRAINT group_module_configs_created_by_fkey
FOREIGN KEY (created_by)
REFERENCES users(id)
ON DELETE SET NULL;

-- group_module_configs.updated_by
ALTER TABLE group_module_configs
DROP CONSTRAINT IF EXISTS group_module_configs_updated_by_fkey;

ALTER TABLE group_module_configs
ADD CONSTRAINT group_module_configs_updated_by_fkey
FOREIGN KEY (updated_by)
REFERENCES users(id)
ON DELETE SET NULL;

-- subscriptions (si colonnes created_by/updated_by existent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_created_by_fkey;
    ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_updated_by_fkey;
    ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_updated_by_fkey
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- plans (si colonnes created_by/updated_by existent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'plans' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_created_by_fkey;
    ALTER TABLE plans ADD CONSTRAINT plans_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'plans' AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_updated_by_fkey;
    ALTER TABLE plans ADD CONSTRAINT plans_updated_by_fkey
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

COMMIT;

-- =====================================================
-- VÉRIFICATION FINALE
-- =====================================================
SELECT
  tc.table_name,
  kcu.column_name,
  tc.constraint_name,
  rc.delete_rule AS action_suppression
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE ccu.table_name = 'users'
  AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, kcu.column_name;

-- =====================================================
-- ✅ RÉSULTAT ATTENDU
-- =====================================================
-- Toutes les FK vers users doivent avoir :
-- - ON DELETE CASCADE (pour données critiques)
-- - ON DELETE SET NULL (pour métadonnées created_by/updated_by/assigned_by)
-- 
-- Suppression admin groupe → OK
-- - user_module_permissions.assigned_by → NULL
-- - group_module_configs.created_by → NULL
-- - group_module_configs.updated_by → NULL
-- =====================================================

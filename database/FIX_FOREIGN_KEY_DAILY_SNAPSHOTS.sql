/**
 * =====================================================
 * CORRECTION - Contrainte Foreign Key daily_financial_snapshots
 * =====================================================
 *
 * Problème : Impossible de supprimer un groupe scolaire à cause de
 * la contrainte foreign key sur daily_financial_snapshots
 *
 * Erreur : update or delete on table "school_groups" violates 
 * foreign key constraint "daily_financial_snapshots_school_group_id_fkey"
 *
 * Solution : Modifier la contrainte pour CASCADE DELETE
 * =====================================================
 */

-- =====================================================
-- ÉTAPE 1 : VÉRIFIER LA CONTRAINTE ACTUELLE
-- =====================================================

SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS referenced_table,
  confdeltype AS on_delete_action,
  CASE confdeltype
    WHEN 'a' THEN 'NO ACTION'
    WHEN 'r' THEN 'RESTRICT'
    WHEN 'c' THEN 'CASCADE'
    WHEN 'n' THEN 'SET NULL'
    WHEN 'd' THEN 'SET DEFAULT'
  END AS on_delete_action_text
FROM pg_constraint
WHERE conname = 'daily_financial_snapshots_school_group_id_fkey';

-- =====================================================
-- ÉTAPE 2 : SUPPRIMER L'ANCIENNE CONTRAINTE
-- =====================================================

ALTER TABLE daily_financial_snapshots
DROP CONSTRAINT IF EXISTS daily_financial_snapshots_school_group_id_fkey;

-- =====================================================
-- ÉTAPE 3 : RECRÉER LA CONTRAINTE AVEC CASCADE
-- =====================================================

ALTER TABLE daily_financial_snapshots
ADD CONSTRAINT daily_financial_snapshots_school_group_id_fkey
FOREIGN KEY (school_group_id)
REFERENCES school_groups(id)
ON DELETE CASCADE;

-- =====================================================
-- ÉTAPE 4 : VÉRIFIER TOUTES LES AUTRES CONTRAINTES
-- =====================================================

-- Lister toutes les contraintes foreign key vers school_groups
SELECT
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'school_groups'
ORDER BY tc.table_name;

-- =====================================================
-- ÉTAPE 5 : CORRIGER TOUTES LES CONTRAINTES MANQUANTES
-- =====================================================

-- Vérifier et corriger les autres tables qui référencent school_groups

-- Table: schools
ALTER TABLE schools
DROP CONSTRAINT IF EXISTS schools_school_group_id_fkey;

ALTER TABLE schools
ADD CONSTRAINT schools_school_group_id_fkey
FOREIGN KEY (school_group_id)
REFERENCES school_groups(id)
ON DELETE CASCADE;

-- Table: users
ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_school_group_id_fkey;

ALTER TABLE users
ADD CONSTRAINT users_school_group_id_fkey
FOREIGN KEY (school_group_id)
REFERENCES school_groups(id)
ON DELETE SET NULL; -- SET NULL pour les utilisateurs (ne pas les supprimer)

-- Table: school_group_subscriptions
ALTER TABLE school_group_subscriptions
DROP CONSTRAINT IF EXISTS school_group_subscriptions_school_group_id_fkey;

ALTER TABLE school_group_subscriptions
ADD CONSTRAINT school_group_subscriptions_school_group_id_fkey
FOREIGN KEY (school_group_id)
REFERENCES school_groups(id)
ON DELETE CASCADE;

-- Note: school_group_modules n'existe pas dans cette base de données
-- Les modules sont gérés via une autre structure

-- =====================================================
-- ÉTAPE 6 : VÉRIFICATION FINALE
-- =====================================================

-- Vérifier que toutes les contraintes sont correctement configurées
SELECT
  tc.table_name,
  tc.constraint_name,
  rc.delete_rule,
  CASE rc.delete_rule
    WHEN 'CASCADE' THEN '✅ CASCADE'
    WHEN 'SET NULL' THEN '⚠️ SET NULL'
    WHEN 'NO ACTION' THEN '❌ NO ACTION'
    WHEN 'RESTRICT' THEN '❌ RESTRICT'
    ELSE '❓ UNKNOWN'
  END AS status
FROM information_schema.table_constraints AS tc
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'school_groups'
ORDER BY tc.table_name;

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================

/*
✅ daily_financial_snapshots → CASCADE
✅ schools → CASCADE
✅ school_group_subscriptions → CASCADE
⚠️ users → SET NULL (intentionnel)

Maintenant, la suppression d'un groupe scolaire supprimera automatiquement :
- Toutes les écoles du groupe
- Tous les snapshots financiers
- Tous les abonnements du groupe

Les utilisateurs ne seront PAS supprimés, mais leur school_group_id sera mis à NULL.

Note: Les modules sont gérés via une structure différente (pas de table school_group_modules).
*/

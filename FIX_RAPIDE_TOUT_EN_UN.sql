-- ============================================================================
-- FIX RAPIDE TOUT-EN-UN : Résoudre toutes les erreurs de connexion
-- ============================================================================
-- Date : 1er novembre 2025
-- Exécuter ce script dans Supabase SQL Editor

-- ============================================================================
-- ÉTAPE 1 : Vérifier et créer la relation profiles → school_groups
-- ============================================================================

-- Ajouter la colonne school_group_id
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS school_group_id UUID;

-- Créer la foreign key
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

-- Créer un index
CREATE INDEX IF NOT EXISTS idx_profiles_school_group_id 
ON profiles(school_group_id);

-- ============================================================================
-- ÉTAPE 2 : Assigner les utilisateurs à leurs groupes
-- ============================================================================

-- Assigner automatiquement tous les admin_groupe au groupe LAMARELLE
UPDATE profiles
SET school_group_id = (
  SELECT id FROM school_groups 
  WHERE name ILIKE '%LAMARELLE%' 
  LIMIT 1
)
WHERE email IN ('int@epilot.com', 'lam@epilot.cg', 'ana@epilot.cg')
  AND role = 'admin_groupe';

-- Le Super Admin reste sans groupe (NULL)
UPDATE profiles
SET school_group_id = NULL
WHERE email = 'admin@epilot.cg'
  AND role = 'SUPER_ADMIN';

-- ============================================================================
-- ÉTAPE 3 : Vérification complète
-- ============================================================================

-- Vérifier la relation
SELECT 
  'Relation profiles → school_groups' as verification,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'profiles_school_group_id_fkey'
    ) THEN '✅ OK'
    ELSE '❌ Manquante'
  END as statut;

-- Vérifier les assignations
SELECT 
  email,
  name,
  role,
  school_group_id,
  (SELECT name FROM school_groups WHERE id = profiles.school_group_id) as groupe,
  CASE 
    WHEN role = 'admin_groupe' AND school_group_id IS NULL THEN '❌ Manquant'
    WHEN role = 'SUPER_ADMIN' AND school_group_id IS NULL THEN '✅ OK (Super Admin)'
    WHEN school_group_id IS NOT NULL THEN '✅ OK'
    ELSE '⚠️ À vérifier'
  END as statut
FROM profiles
ORDER BY email;

-- ============================================================================
-- RÉSULTAT ATTENDU
-- ============================================================================
-- email            | name        | role          | groupe      | statut
-- -----------------|-------------|---------------|-------------|--------
-- admin@epilot.cg  | Admin       | SUPER_ADMIN   | NULL        | ✅ OK
-- ana@epilot.cg    | Utilisateur | admin_groupe  | LAMARELLE   | ✅ OK
-- int@epilot.com   | Utilisateur | admin_groupe  | LAMARELLE   | ✅ OK
-- lam@epilot.cg    | Utilisateur | admin_groupe  | LAMARELLE   | ✅ OK

-- ============================================================================
-- MESSAGE FINAL
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ CONFIGURATION TERMINÉE !';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Résumé des modifications :';
  RAISE NOTICE '1. ✅ Relation profiles → school_groups créée';
  RAISE NOTICE '2. ✅ Utilisateurs assignés aux groupes';
  RAISE NOTICE '3. ✅ Super Admin configuré';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Prochaines étapes :';
  RAISE NOTICE '1. Recharger votre application (Ctrl+R)';
  RAISE NOTICE '2. Se connecter avec int@epilot.com';
  RAISE NOTICE '3. Vérifier que le dashboard s''affiche';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

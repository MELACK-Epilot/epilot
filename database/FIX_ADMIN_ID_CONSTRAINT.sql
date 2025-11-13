-- ============================================================================
-- CORRECTION CONTRAINTE ADMIN_ID - TABLE SCHOOLS
-- ============================================================================
-- Le champ admin_id est actuellement NOT NULL mais devrait être nullable
-- car le directeur sera assigné plus tard via la page Utilisateurs
-- ============================================================================

-- 1. Vérifier la contrainte actuelle
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'schools'
  AND column_name = 'admin_id';

-- 2. Modifier la colonne admin_id pour accepter NULL
ALTER TABLE schools 
ALTER COLUMN admin_id DROP NOT NULL;

-- 3. Mettre à jour les écoles existantes avec admin_id vide
UPDATE schools 
SET admin_id = NULL 
WHERE admin_id = '' OR admin_id IS NULL;

-- 4. Vérifier le résultat
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'schools'
  AND column_name = 'admin_id';

-- ============================================================================
-- RÉSULTAT ATTENDU
-- ============================================================================
-- 
-- Avant :
-- admin_id | uuid | NO | NULL
-- 
-- Après :
-- admin_id | uuid | YES | NULL
-- 
-- ✅ La colonne admin_id accepte maintenant NULL
-- ✅ Les écoles peuvent être créées sans directeur
-- ✅ Le directeur sera assigné plus tard via la page Utilisateurs
-- 
-- ============================================================================

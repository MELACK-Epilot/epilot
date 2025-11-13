/**
 * =====================================================
 * CORRECTION - Colonne ID avec DEFAULT
 * =====================================================
 * 
 * Problème : La colonne id n'a pas de DEFAULT uuid_generate_v4()
 * Solution : Ajouter le DEFAULT
 * 
 * Date : 7 novembre 2025, 23:17 PM
 * =====================================================
 */

-- =====================================================
-- ÉTAPE 1 : VÉRIFIER L'ÉTAT ACTUEL
-- =====================================================

SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'group_business_categories'
  AND column_name = 'id';

-- =====================================================
-- ÉTAPE 2 : ACTIVER L'EXTENSION uuid-ossp
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ÉTAPE 3 : AJOUTER LE DEFAULT SUR LA COLONNE ID
-- =====================================================

ALTER TABLE group_business_categories 
ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- =====================================================
-- ÉTAPE 4 : VÉRIFIER LA CORRECTION
-- =====================================================

SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'group_business_categories'
  AND column_name = 'id';

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================

/*
Avant :
column_name | data_type | column_default | is_nullable
------------|-----------|----------------|------------
id          | uuid      | null           | NO

Après :
column_name | data_type | column_default          | is_nullable
------------|-----------|-------------------------|------------
id          | uuid      | uuid_generate_v4()      | NO

Si vous voyez uuid_generate_v4() dans column_default :
✅ C'est corrigé !

Réexécutez ensuite FIX_TOUS_LES_GROUPES.sql ÉTAPE 2
*/

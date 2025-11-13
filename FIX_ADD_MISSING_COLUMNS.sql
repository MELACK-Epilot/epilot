/**
 * =====================================================
 * CORRECTION - Ajouter Colonnes Manquantes
 * =====================================================
 * 
 * Problème : La table group_business_categories existe mais
 * sans les colonnes enabled_by et disabled_by
 * 
 * Solution : Ajouter les colonnes manquantes
 * 
 * Date : 7 novembre 2025, 23:13 PM
 * =====================================================
 */

-- =====================================================
-- AJOUTER LES COLONNES MANQUANTES
-- =====================================================

-- Ajouter enabled_by si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'group_business_categories' 
    AND column_name = 'enabled_by'
  ) THEN
    ALTER TABLE group_business_categories 
    ADD COLUMN enabled_by UUID REFERENCES users(id);
    
    RAISE NOTICE '✅ Colonne enabled_by ajoutée';
  ELSE
    RAISE NOTICE '✅ Colonne enabled_by existe déjà';
  END IF;
END $$;

-- Ajouter disabled_by si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'group_business_categories' 
    AND column_name = 'disabled_by'
  ) THEN
    ALTER TABLE group_business_categories 
    ADD COLUMN disabled_by UUID REFERENCES users(id);
    
    RAISE NOTICE '✅ Colonne disabled_by ajoutée';
  ELSE
    RAISE NOTICE '✅ Colonne disabled_by existe déjà';
  END IF;
END $$;

-- =====================================================
-- VÉRIFIER LES COLONNES
-- =====================================================

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'group_business_categories'
ORDER BY ordinal_position;

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================

/*
Vous devriez voir toutes les colonnes, incluant :
- enabled_by (uuid, YES)
- disabled_by (uuid, YES)

Si vous voyez ces colonnes, réexécutez le script FIX_TOUS_LES_GROUPES.sql
*/

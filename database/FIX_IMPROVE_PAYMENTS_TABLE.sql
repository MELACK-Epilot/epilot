/**
 * CORRECTIF : IMPROVE_PAYMENTS_TABLE.sql
 * Corrige l'erreur des colonnes manquantes dans school_groups
 * @module FIX_IMPROVE_PAYMENTS_TABLE
 */

-- =====================================================
-- VÉRIFIER LA STRUCTURE DE school_groups
-- =====================================================

DO $$
DECLARE
  v_has_email BOOLEAN;
  v_has_phone BOOLEAN;
BEGIN
  -- Vérifier si email existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'school_groups' AND column_name = 'email'
  ) INTO v_has_email;
  
  -- Vérifier si phone existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'school_groups' AND column_name = 'phone'
  ) INTO v_has_phone;
  
  RAISE NOTICE 'Colonnes school_groups:';
  RAISE NOTICE '  - email: %', CASE WHEN v_has_email THEN '✅' ELSE '❌' END;
  RAISE NOTICE '  - phone: %', CASE WHEN v_has_phone THEN '✅' ELSE '❌' END;
END $$;

-- Afficher les colonnes réelles
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'school_groups'
ORDER BY ordinal_position;

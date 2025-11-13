-- =====================================================
-- FIX : Ajouter les colonnes manquantes à la table notifications
-- Date : 3 novembre 2025
-- =====================================================

-- Vérifier la structure actuelle de la table notifications
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- Ajouter la colonne is_global si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'is_global'
  ) THEN
    ALTER TABLE notifications ADD COLUMN is_global BOOLEAN DEFAULT false;
    RAISE NOTICE 'Colonne is_global ajoutée à notifications';
  ELSE
    RAISE NOTICE 'Colonne is_global existe déjà';
  END IF;
END $$;

-- Ajouter la colonne recipient_role si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'recipient_role'
  ) THEN
    ALTER TABLE notifications ADD COLUMN recipient_role user_role;
    RAISE NOTICE 'Colonne recipient_role ajoutée à notifications';
  ELSE
    RAISE NOTICE 'Colonne recipient_role existe déjà';
  END IF;
END $$;

-- Vérifier la structure finale
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================
/*
✅ Colonnes ajoutées :
- is_global BOOLEAN DEFAULT false
- recipient_role user_role (peut être NULL)

Structure finale attendue :
- id UUID
- type TEXT
- title TEXT
- message TEXT
- recipient_id UUID (peut être NULL)
- recipient_role user_role (peut être NULL)
- is_global BOOLEAN (défaut: false)
- status TEXT
- action_url TEXT
- created_at TIMESTAMP
- read_at TIMESTAMP
*/

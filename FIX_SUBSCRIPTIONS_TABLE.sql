-- ============================================
-- FIX : Ajout de la colonne next_billing_date manquante
-- ============================================
-- Description : Correction de la table subscriptions
-- Date : 2025-01-30
-- ============================================

-- Option 1 : Ajouter la colonne si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' 
    AND column_name = 'next_billing_date'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN next_billing_date TIMESTAMPTZ;
    RAISE NOTICE 'Colonne next_billing_date ajoutée avec succès';
  ELSE
    RAISE NOTICE 'Colonne next_billing_date existe déjà';
  END IF;
END $$;

-- Créer l'index maintenant que la colonne existe
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_subscriptions_next_billing') THEN
    CREATE INDEX idx_subscriptions_next_billing ON subscriptions(next_billing_date);
    RAISE NOTICE 'Index idx_subscriptions_next_billing créé avec succès';
  ELSE
    RAISE NOTICE 'Index idx_subscriptions_next_billing existe déjà';
  END IF;
END $$;

-- Vérification
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'subscriptions'
AND column_name IN ('next_billing_date', 'auto_renew', 'notes')
ORDER BY column_name;

-- Afficher les index de la table subscriptions
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'subscriptions'
ORDER BY indexname;

SELECT '✅ Correction appliquée avec succès!' AS status;

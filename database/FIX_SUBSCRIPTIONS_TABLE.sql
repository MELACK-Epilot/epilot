-- =====================================================
-- FIX : Table subscriptions - Ajouter colonnes manquantes
-- =====================================================
-- Date: 10 Novembre 2025, 01:22
-- Objectif: Adapter la table subscriptions
-- =====================================================

BEGIN;

-- =====================================================
-- ÉTAPE 1 : Vérifier la structure actuelle
-- =====================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'subscriptions'
ORDER BY ordinal_position;

-- =====================================================
-- ÉTAPE 2 : Ajouter colonnes manquantes
-- =====================================================

-- Ajouter billing_period si elle n'existe pas
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS billing_period VARCHAR(20) DEFAULT 'monthly';

-- Ajouter payment_status si elle n'existe pas
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';

-- Ajouter payment_method si elle n'existe pas
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'bank_transfer';

-- Ajouter auto_renew si elle n'existe pas
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT true;

-- Ajouter currency si elle n'existe pas
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'FCFA';

-- Ajouter amount si elle n'existe pas
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2) DEFAULT 0;

-- Ajouter notes si elle n'existe pas
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- =====================================================
-- ÉTAPE 3 : Créer les index
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_subscriptions_billing_period 
ON subscriptions(billing_period);

CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_status 
ON subscriptions(payment_status);

COMMIT;

-- =====================================================
-- ✅ VÉRIFICATION
-- =====================================================
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'subscriptions'
  AND column_name IN (
    'billing_period',
    'payment_status',
    'payment_method',
    'auto_renew',
    'currency',
    'amount'
  )
ORDER BY column_name;

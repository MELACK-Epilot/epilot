-- ============================================
-- CORRECTION IMMÉDIATE : Tables subscriptions ET payments
-- ============================================
-- Exécutez ce script MAINTENANT pour corriger toutes les erreurs
-- ============================================

-- ============================================
-- PARTIE 1 : TABLE SUBSCRIPTIONS
-- ============================================

-- Étape 1 : Supprimer les index problématiques s'ils existent
DROP INDEX IF EXISTS idx_subscriptions_next_billing;

-- Étape 2 : Ajouter les colonnes manquantes
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT TRUE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS notes TEXT;

-- Étape 3 : Créer les index maintenant que les colonnes existent
CREATE INDEX IF NOT EXISTS idx_subscriptions_school_group ON subscriptions(school_group_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON subscriptions(end_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing ON subscriptions(next_billing_date);

-- ============================================
-- PARTIE 2 : TABLE PAYMENTS
-- ============================================

-- Étape 1 : Supprimer les index problématiques s'ils existent
DROP INDEX IF EXISTS idx_payments_method;

-- Étape 2 : Ajouter TOUTES les colonnes manquantes
ALTER TABLE payments ADD COLUMN IF NOT EXISTS method VARCHAR(50);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider VARCHAR(50);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(100) UNIQUE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS reference VARCHAR(100) UNIQUE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS account_number VARCHAR(50);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10, 2);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_reason TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS description TEXT;

-- Étape 3 : Créer les index maintenant que les colonnes existent
CREATE INDEX IF NOT EXISTS idx_payments_subscription ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_school_group ON payments(school_group_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(method);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(reference);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payments(paid_at DESC);

-- ============================================
-- VÉRIFICATIONS FINALES
-- ============================================

-- Vérification subscriptions
SELECT 
  '✅ SUBSCRIPTIONS - Colonnes ajoutées' AS status,
  COUNT(*) AS colonnes_ajoutees
FROM information_schema.columns
WHERE table_name = 'subscriptions'
AND column_name IN ('next_billing_date', 'auto_renew', 'notes');

-- Vérification payments
SELECT 
  '✅ PAYMENTS - Colonnes ajoutées' AS status,
  COUNT(*) AS colonnes_ajoutees
FROM information_schema.columns
WHERE table_name = 'payments'
AND column_name IN ('method', 'provider', 'transaction_id', 'reference', 'phone_number', 'account_number', 
                    'paid_at', 'failed_at', 'refunded_at', 'cancelled_at', 
                    'refund_amount', 'refund_reason', 'error_message', 'description');

-- Afficher la structure complète subscriptions
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'subscriptions'
ORDER BY ordinal_position;

-- Afficher les index créés
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'subscriptions'
ORDER BY indexname;

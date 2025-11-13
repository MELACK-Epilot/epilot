-- ============================================
-- SCHEMA SQL SIMPLIFIÉ - PAIEMENTS
-- Sans dépendances à d'autres tables
-- ============================================

-- 1. CRÉER LA TABLE payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID,
  
  -- Informations de facturation
  invoice_number TEXT UNIQUE NOT NULL,
  transaction_id TEXT UNIQUE,
  
  -- Montant et devise
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'FCFA',
  
  -- Méthode de paiement
  payment_method TEXT NOT NULL,
  
  -- Statut du paiement
  status TEXT NOT NULL DEFAULT 'pending',
  
  -- Dates importantes
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  
  -- Notes
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CRÉER LES INDEX
CREATE INDEX IF NOT EXISTS idx_payments_subscription ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payments(paid_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_number);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- 3. CRÉER LA VUE payment_stats
CREATE OR REPLACE VIEW payment_stats AS
SELECT
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
  COUNT(*) FILTER (WHERE status = 'refunded') as refunded_count,
  COUNT(*) as total_count,
  COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as completed_amount,
  COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) as pending_amount,
  COALESCE(SUM(amount), 0) as total_amount,
  COALESCE(AVG(amount) FILTER (WHERE status = 'completed'), 0) as avg_payment_amount
FROM payments;

-- 4. INSÉRER DES DONNÉES DE TEST
INSERT INTO payments (
  invoice_number,
  transaction_id,
  amount,
  currency,
  payment_method,
  status,
  paid_at
) VALUES
  (
    'INV-2025-001',
    'TXN-ABC123',
    50000,
    'FCFA',
    'mobile_money',
    'completed',
    NOW() - INTERVAL '2 days'
  ),
  (
    'INV-2025-002',
    'TXN-DEF456',
    75000,
    'FCFA',
    'carte_bancaire',
    'completed',
    NOW() - INTERVAL '5 days'
  ),
  (
    'INV-2025-003',
    'TXN-GHI789',
    100000,
    'FCFA',
    'virement',
    'failed',
    NULL
  ),
  (
    'INV-2025-004',
    'TXN-JKL012',
    60000,
    'FCFA',
    'mobile_money',
    'pending',
    NULL
  ),
  (
    'INV-2025-005',
    'TXN-MNO345',
    85000,
    'FCFA',
    'carte_bancaire',
    'completed',
    NOW() - INTERVAL '1 day'
  );

-- 5. VÉRIFICATIONS
SELECT 'Table payments créée' as status, COUNT(*) as count FROM payments;
SELECT 'Vue payment_stats créée' as status;

-- 6. AFFICHER LES STATISTIQUES
SELECT * FROM payment_stats;

-- 7. AFFICHER LES PAIEMENTS
SELECT 
  invoice_number,
  amount,
  currency,
  payment_method,
  status,
  paid_at,
  created_at
FROM payments
ORDER BY created_at DESC;

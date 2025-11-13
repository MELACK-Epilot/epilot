/**
 * AMÉLIORATION PAYMENTS - PARTIE 1/2
 * Colonnes + Vues SQL
 * @module IMPROVE_PAYMENTS_PART1
 */

-- =====================================================
-- 1. AJOUTER COLONNES MANQUANTES
-- =====================================================

-- Métadonnées utilisateur (audit trail)
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP WITH TIME ZONE;

-- Informations de facturation
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS billing_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS billing_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS billing_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS billing_address TEXT;

-- Informations de reçu
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS receipt_url TEXT,
ADD COLUMN IF NOT EXISTS receipt_sent_at TIMESTAMP WITH TIME ZONE;

-- Échéances et rappels
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0;

-- Métadonnées JSON pour flexibilité
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Statut de paiement étendu
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS payment_gateway VARCHAR(50),
ADD COLUMN IF NOT EXISTS gateway_response JSONB;

COMMENT ON COLUMN payments.metadata IS 'Données flexibles pour intégrations tierces';
COMMENT ON COLUMN payments.gateway_response IS 'Réponse complète du gateway de paiement';

-- =====================================================
-- 2. CRÉER VUE ENRICHIE POUR LE FRONTEND
-- =====================================================

-- Vue enrichie avec colonnes réelles de school_groups
-- Colonnes disponibles: name, code, phone, address, city, region, website, logo
-- Note: school_groups n'a PAS de colonne 'email'
CREATE OR REPLACE VIEW payments_enriched AS
SELECT 
  p.*,
  
  -- Informations abonnement
  s.start_date as subscription_start_date,
  s.end_date as subscription_end_date,
  s.status as subscription_status,
  
  -- Informations groupe scolaire
  sg.name as school_group_name,
  sg.code as school_group_code,
  sg.phone as school_group_phone,
  sg.address as school_group_address,
  sg.city as school_group_city,
  sg.region as school_group_region,
  
  -- Informations plan
  pl.name as plan_name,
  pl.price as plan_price,
  
  -- Calculs
  CASE 
    WHEN p.status = 'pending' AND p.due_date < CURRENT_DATE THEN 'overdue'
    ELSE p.status
  END as detailed_status,
  
  CASE 
    WHEN p.due_date IS NOT NULL THEN 
      (CURRENT_DATE - p.due_date::DATE)
    ELSE NULL
  END as days_overdue,
  
  -- Utilisateurs
  CONCAT(u_created.first_name, ' ', u_created.last_name) as created_by_name,
  CONCAT(u_validated.first_name, ' ', u_validated.last_name) as validated_by_name
  
FROM payments p
LEFT JOIN subscriptions s ON p.subscription_id = s.id
LEFT JOIN school_groups sg ON p.school_group_id = sg.id
LEFT JOIN plans pl ON s.plan_id = pl.id
LEFT JOIN users u_created ON p.created_by = u_created.id
LEFT JOIN users u_validated ON p.validated_by = u_validated.id;

COMMENT ON VIEW payments_enriched IS 'Vue enrichie des paiements avec toutes les relations';

-- =====================================================
-- 3. CRÉER VUE STATISTIQUES PAIEMENTS
-- =====================================================

CREATE OR REPLACE VIEW payment_statistics AS
SELECT
  -- Statistiques globales
  COUNT(*) as total_payments,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
  COUNT(*) FILTER (WHERE status = 'refunded') as refunded_count,
  COUNT(*) FILTER (WHERE status = 'pending' AND due_date < CURRENT_DATE) as overdue_count,
  
  -- Montants
  COALESCE(SUM(amount), 0) as total_amount,
  COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as completed_amount,
  COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) as pending_amount,
  COALESCE(SUM(amount) FILTER (WHERE status = 'failed'), 0) as failed_amount,
  COALESCE(SUM(refund_amount), 0) as refunded_amount,
  COALESCE(SUM(amount) FILTER (WHERE status = 'pending' AND due_date < CURRENT_DATE), 0) as overdue_amount,
  
  -- Moyennes
  COALESCE(AVG(amount), 0) as average_payment,
  COALESCE(AVG(amount) FILTER (WHERE status = 'completed'), 0) as average_completed,
  
  -- Taux
  ROUND(
    (COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 
    2
  ) as completion_rate,
  
  ROUND(
    (COUNT(*) FILTER (WHERE status = 'failed')::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 
    2
  ) as failure_rate,
  
  -- Période
  MIN(paid_at) as first_payment_date,
  MAX(paid_at) as last_payment_date,
  
  -- Compteurs par méthode (calculés séparément)
  COUNT(*) FILTER (WHERE payment_method = 'bank_transfer') as bank_transfer_count,
  COUNT(*) FILTER (WHERE payment_method = 'mobile_money') as mobile_money_count,
  COUNT(*) FILTER (WHERE payment_method = 'card') as card_count,
  COUNT(*) FILTER (WHERE payment_method = 'cash') as cash_count
  
FROM payments;

COMMENT ON VIEW payment_statistics IS 'Statistiques globales des paiements';

-- =====================================================
-- 4. CRÉER VUE PAIEMENTS PAR MOIS
-- =====================================================

CREATE OR REPLACE VIEW payment_monthly_stats AS
SELECT
  DATE_TRUNC('month', paid_at) as month,
  TO_CHAR(DATE_TRUNC('month', paid_at), 'Mon YYYY') as month_label,
  
  COUNT(*) as payment_count,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
  
  COALESCE(SUM(amount), 0) as total_amount,
  COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as completed_amount,
  
  COALESCE(AVG(amount), 0) as average_amount,
  
  -- Croissance par rapport au mois précédent
  COALESCE(
    ROUND(
      ((SUM(amount) - LAG(SUM(amount)) OVER (ORDER BY DATE_TRUNC('month', paid_at))) 
      / NULLIF(LAG(SUM(amount)) OVER (ORDER BY DATE_TRUNC('month', paid_at)), 0)) * 100,
      2
    ),
    0
  ) as growth_rate

FROM payments
WHERE paid_at IS NOT NULL
GROUP BY DATE_TRUNC('month', paid_at)
ORDER BY month DESC;

COMMENT ON VIEW payment_monthly_stats IS 'Statistiques mensuelles des paiements';

-- =====================================================
-- 5. CRÉER INDEX SUPPLÉMENTAIRES
-- =====================================================

-- Index pour recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_payments_detailed_status 
ON payments (status, due_date) 
WHERE status = 'pending';

-- Index pour paiements en attente avec échéance
-- Note: On ne peut pas utiliser CURRENT_DATE dans WHERE (non IMMUTABLE)
CREATE INDEX IF NOT EXISTS idx_payments_overdue 
ON payments (status, due_date) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_payments_metadata 
ON payments USING gin(metadata);

CREATE INDEX IF NOT EXISTS idx_payments_gateway_response 
ON payments USING gin(gateway_response);

CREATE INDEX IF NOT EXISTS idx_payments_receipt_number 
ON payments (receipt_number) 
WHERE receipt_number IS NOT NULL;

-- Index pour statistiques (sur paid_at directement, pas DATE_TRUNC)
-- Note: DATE_TRUNC n'est pas IMMUTABLE, on indexe la colonne brute
CREATE INDEX IF NOT EXISTS idx_payments_paid_at_month 
ON payments (paid_at);

-- =====================================================
-- RÉSUMÉ PARTIE 1
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ PARTIE 1/2 TERMINÉE :';
  RAISE NOTICE '1. Colonnes ajoutées (audit, facturation, reçus, échéances)';
  RAISE NOTICE '2. Vue payments_enriched créée';
  RAISE NOTICE '3. Vue payment_statistics créée';
  RAISE NOTICE '4. Vue payment_monthly_stats créée';
  RAISE NOTICE '5. Index optimisés créés';
  RAISE NOTICE '';
  RAISE NOTICE '➡️  EXÉCUTEZ MAINTENANT : IMPROVE_PAYMENTS_PART2_FUNCTIONS.sql';
END $$;

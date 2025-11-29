-- Migration pour corriger la vue payment_statistics
-- Problème : Les paiements en retard sont comptés à la fois dans "pending" ET "overdue"
-- Solution : Exclure les paiements en retard du compteur "pending"

DROP VIEW IF EXISTS payment_statistics CASCADE;

CREATE OR REPLACE VIEW payment_statistics AS
SELECT
  -- Compteurs de paiements
  COUNT(*) as total_payments,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
  
  -- Paiements en attente (SANS les retards)
  COUNT(*) FILTER (WHERE status = 'pending' AND due_date >= CURRENT_DATE) as pending_count,
  
  COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
  COUNT(*) FILTER (WHERE status = 'refunded') as refunded_count,
  
  -- Paiements en retard (pending avec date dépassée)
  COUNT(*) FILTER (WHERE status = 'pending' AND due_date < CURRENT_DATE) as overdue_count,
  
  -- Montants totaux
  COALESCE(SUM(amount), 0) as total_amount,
  COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as completed_amount,
  
  -- Montant en attente (SANS les retards)
  COALESCE(SUM(amount) FILTER (WHERE status = 'pending' AND due_date >= CURRENT_DATE), 0) as pending_amount,
  
  COALESCE(SUM(amount) FILTER (WHERE status = 'failed'), 0) as failed_amount,
  COALESCE(SUM(amount) FILTER (WHERE status = 'refunded'), 0) as refunded_amount,
  
  -- Montant en retard (pending avec date dépassée)
  COALESCE(SUM(amount) FILTER (WHERE status = 'pending' AND due_date < CURRENT_DATE), 0) as overdue_amount,
  
  -- Statistiques
  COALESCE(AVG(amount), 0) as average_payment,
  COALESCE(AVG(amount) FILTER (WHERE status = 'completed'), 0) as average_completed,
  
  -- Taux
  CASE 
    WHEN COUNT(*) > 0 
    THEN ROUND((COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / COUNT(*)) * 100, 2)
    ELSE 0
  END as completion_rate,
  
  CASE 
    WHEN COUNT(*) > 0 
    THEN ROUND((COUNT(*) FILTER (WHERE status = 'failed')::DECIMAL / COUNT(*)) * 100, 2)
    ELSE 0
  END as failure_rate,
  
  -- Dates
  MIN(paid_at) as first_payment_date,
  MAX(paid_at) as last_payment_date,
  
  -- Méthodes de paiement
  COUNT(*) FILTER (WHERE payment_method = 'bank_transfer') as bank_transfer_count,
  COUNT(*) FILTER (WHERE payment_method = 'mobile_money') as mobile_money_count,
  COUNT(*) FILTER (WHERE payment_method = 'card') as card_count,
  COUNT(*) FILTER (WHERE payment_method = 'cash') as cash_count
  
FROM payments;

-- Commentaire
COMMENT ON VIEW payment_statistics IS 'Statistiques globales des paiements - Les paiements en retard sont exclus du compteur "pending"';

-- Vérification
SELECT 
  total_payments,
  completed_count,
  pending_count,
  overdue_count,
  pending_amount,
  overdue_amount
FROM payment_statistics;

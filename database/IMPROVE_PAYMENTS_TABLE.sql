/**
 * AMÉLIORATIONS TABLE PAYMENTS
 * Ajoute fonctionnalités manquantes pour une gestion complète des paiements
 * @module IMPROVE_PAYMENTS_TABLE
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
-- 5. FONCTION : GÉNÉRER NUMÉRO DE REÇU
-- =====================================================

CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.receipt_number IS NULL THEN
    NEW.receipt_number := 'REC-' || 
                          TO_CHAR(NEW.paid_at, 'YYYYMMDD') || '-' || 
                          LPAD(NEXTVAL('receipt_number_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer la séquence
CREATE SEQUENCE IF NOT EXISTS receipt_number_seq START 1;

-- Créer le trigger
DROP TRIGGER IF EXISTS generate_receipt_trigger ON payments;
CREATE TRIGGER generate_receipt_trigger
  BEFORE INSERT OR UPDATE OF status ON payments
  FOR EACH ROW
  EXECUTE FUNCTION generate_receipt_number();

COMMENT ON FUNCTION generate_receipt_number() IS 'Génère automatiquement un numéro de reçu lors de la complétion';

-- =====================================================
-- 6. FONCTION : ENVOYER RAPPEL AUTOMATIQUE
-- =====================================================

CREATE OR REPLACE FUNCTION check_overdue_payments()
RETURNS TABLE(
  payment_id UUID,
  invoice_number VARCHAR,
  school_group_name VARCHAR,
  amount NUMERIC,
  days_overdue INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.invoice_number,
    sg.name,
    p.amount,
    (CURRENT_DATE - p.due_date::DATE) as days_overdue
  FROM payments p
  JOIN school_groups sg ON p.school_group_id = sg.id
  WHERE p.status = 'pending'
    AND p.due_date < CURRENT_DATE
    AND (p.reminder_sent_at IS NULL OR p.reminder_sent_at < CURRENT_DATE - INTERVAL '7 days')
  ORDER BY p.due_date ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_overdue_payments() IS 'Identifie les paiements en retard nécessitant un rappel';

-- =====================================================
-- 7. FONCTION : VALIDER UN PAIEMENT
-- =====================================================

CREATE OR REPLACE FUNCTION validate_payment(
  p_payment_id UUID,
  p_validated_by UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Mettre à jour le paiement
  UPDATE payments
  SET 
    status = 'completed',
    paid_at = COALESCE(paid_at, NOW()),
    validated_by = p_validated_by,
    validated_at = NOW(),
    notes = COALESCE(p_notes, notes),
    updated_at = NOW()
  WHERE id = p_payment_id
    AND status = 'pending'
  RETURNING jsonb_build_object(
    'id', id,
    'invoice_number', invoice_number,
    'amount', amount,
    'status', status
  ) INTO v_result;
  
  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Paiement non trouvé ou déjà validé';
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_payment IS 'Valide un paiement en attente';

-- =====================================================
-- 8. FONCTION : REMBOURSER UN PAIEMENT
-- =====================================================

CREATE OR REPLACE FUNCTION refund_payment(
  p_payment_id UUID,
  p_refund_amount NUMERIC,
  p_refund_reason TEXT,
  p_refunded_by UUID
)
RETURNS JSONB AS $$
DECLARE
  v_payment_amount NUMERIC;
  v_result JSONB;
BEGIN
  -- Vérifier le montant
  SELECT amount INTO v_payment_amount
  FROM payments
  WHERE id = p_payment_id AND status = 'completed';
  
  IF v_payment_amount IS NULL THEN
    RAISE EXCEPTION 'Paiement non trouvé ou non complété';
  END IF;
  
  IF p_refund_amount > v_payment_amount THEN
    RAISE EXCEPTION 'Le montant du remboursement ne peut pas dépasser le montant du paiement';
  END IF;
  
  -- Effectuer le remboursement
  UPDATE payments
  SET 
    status = 'refunded',
    refunded_at = NOW(),
    refund_amount = p_refund_amount,
    refund_reason = p_refund_reason,
    updated_by = p_refunded_by,
    updated_at = NOW()
  WHERE id = p_payment_id
  RETURNING jsonb_build_object(
    'id', id,
    'invoice_number', invoice_number,
    'original_amount', amount,
    'refund_amount', refund_amount,
    'status', status
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refund_payment IS 'Rembourse un paiement complété';

-- =====================================================
-- 9. TRIGGER : MISE À JOUR AUTOMATIQUE updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS payments_updated_at_trigger ON payments;
CREATE TRIGGER payments_updated_at_trigger
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_updated_at();

-- =====================================================
-- 10. CRÉER INDEX SUPPLÉMENTAIRES
-- =====================================================

-- Index pour recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_payments_detailed_status 
ON payments (status, due_date) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_payments_overdue 
ON payments (due_date) 
WHERE status = 'pending' AND due_date < CURRENT_DATE;

CREATE INDEX IF NOT EXISTS idx_payments_metadata 
ON payments USING gin(metadata);

CREATE INDEX IF NOT EXISTS idx_payments_gateway_response 
ON payments USING gin(gateway_response);

CREATE INDEX IF NOT EXISTS idx_payments_receipt_number 
ON payments (receipt_number) 
WHERE receipt_number IS NOT NULL;

-- Index pour statistiques
CREATE INDEX IF NOT EXISTS idx_payments_paid_at_month 
ON payments (DATE_TRUNC('month', paid_at));

-- =====================================================
-- 11. POLITIQUES RLS (Row Level Security)
-- =====================================================

-- Activer RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Super Admin : Accès total
CREATE POLICY "Super Admin full access" ON payments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Admin Groupe : Voir ses paiements
CREATE POLICY "Admin Groupe can view own payments" ON payments
  FOR SELECT
  TO authenticated
  USING (
    school_group_id IN (
      SELECT school_group_id FROM users
      WHERE id = auth.uid()
      AND role = 'admin_groupe'
    )
  );

-- Admin Groupe : Créer paiements pour son groupe
CREATE POLICY "Admin Groupe can create payments" ON payments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    school_group_id IN (
      SELECT school_group_id FROM users
      WHERE id = auth.uid()
      AND role = 'admin_groupe'
    )
  );

-- =====================================================
-- 12. CRÉER ALERTES AUTOMATIQUES
-- =====================================================

CREATE OR REPLACE FUNCTION create_payment_alert()
RETURNS TRIGGER AS $$
BEGIN
  -- Alerte si paiement en retard
  IF NEW.status = 'pending' AND NEW.due_date < CURRENT_DATE THEN
    INSERT INTO system_alerts (
      type,
      severity,
      title,
      message,
      entity_type,
      entity_id,
      entity_name,
      school_group_id,
      action_required,
      action_url
    ) VALUES (
      'payment',
      'warning',
      'Paiement en retard',
      'Le paiement ' || NEW.invoice_number || ' est en retard de ' || 
      (CURRENT_DATE - NEW.due_date::DATE) || ' jours',
      'payment',
      NEW.id,
      NEW.invoice_number,
      NEW.school_group_id,
      true,
      '/dashboard/finances/paiements?id=' || NEW.id
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Alerte si paiement échoué
  IF NEW.status = 'failed' AND OLD.status != 'failed' THEN
    INSERT INTO system_alerts (
      type,
      severity,
      title,
      message,
      entity_type,
      entity_id,
      entity_name,
      school_group_id,
      action_required
    ) VALUES (
      'payment',
      'error',
      'Paiement échoué',
      'Le paiement ' || NEW.invoice_number || ' a échoué : ' || COALESCE(NEW.error_message, 'Raison inconnue'),
      'payment',
      NEW.id,
      NEW.invoice_number,
      NEW.school_group_id,
      true
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS payment_alert_trigger ON payments;
CREATE TRIGGER payment_alert_trigger
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION create_payment_alert();

-- =====================================================
-- 13. DONNÉES DE TEST (OPTIONNEL)
-- =====================================================

-- Fonction pour générer des paiements de test
CREATE OR REPLACE FUNCTION generate_test_payments(p_count INTEGER DEFAULT 10)
RETURNS TEXT AS $$
DECLARE
  v_subscription_id UUID;
  v_school_group_id UUID;
  v_count INTEGER := 0;
BEGIN
  -- Récupérer un abonnement existant
  SELECT id, school_group_id INTO v_subscription_id, v_school_group_id
  FROM subscriptions
  LIMIT 1;
  
  IF v_subscription_id IS NULL THEN
    RETURN 'Aucun abonnement trouvé. Créez d''abord un abonnement.';
  END IF;
  
  -- Générer les paiements
  FOR i IN 1..p_count LOOP
    INSERT INTO payments (
      subscription_id,
      school_group_id,
      amount,
      payment_method,
      status,
      paid_at,
      due_date
    ) VALUES (
      v_subscription_id,
      v_school_group_id,
      (RANDOM() * 500000 + 50000)::NUMERIC(10,2),
      (ARRAY['bank_transfer', 'mobile_money', 'card', 'cash'])[FLOOR(RANDOM() * 4 + 1)],
      (ARRAY['completed', 'pending', 'failed'])[FLOOR(RANDOM() * 3 + 1)],
      NOW() - (RANDOM() * 180 || ' days')::INTERVAL,
      CURRENT_DATE + (RANDOM() * 60 - 30 || ' days')::INTERVAL
    );
    v_count := v_count + 1;
  END LOOP;
  
  RETURN '✅ ' || v_count || ' paiements de test créés avec succès';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RÉSUMÉ DES AMÉLIORATIONS
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ AMÉLIORATIONS APPLIQUÉES :';
  RAISE NOTICE '1. Colonnes audit trail (created_by, validated_by)';
  RAISE NOTICE '2. Informations de facturation';
  RAISE NOTICE '3. Gestion des reçus';
  RAISE NOTICE '4. Échéances et rappels';
  RAISE NOTICE '5. Métadonnées JSON flexibles';
  RAISE NOTICE '6. Vue enrichie payments_enriched';
  RAISE NOTICE '7. Vue statistiques payment_statistics';
  RAISE NOTICE '8. Vue mensuelle payment_monthly_stats';
  RAISE NOTICE '9. Fonction génération reçu automatique';
  RAISE NOTICE '10. Fonction check_overdue_payments()';
  RAISE NOTICE '11. Fonction validate_payment()';
  RAISE NOTICE '12. Fonction refund_payment()';
  RAISE NOTICE '13. Trigger updated_at automatique';
  RAISE NOTICE '14. Index optimisés (GIN, partial)';
  RAISE NOTICE '15. Politiques RLS sécurisées';
  RAISE NOTICE '16. Alertes automatiques';
  RAISE NOTICE '17. Fonction generate_test_payments()';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 TABLE PAYMENTS NIVEAU PRODUCTION READY !';
END $$;

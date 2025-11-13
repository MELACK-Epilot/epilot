/**
 * AMÉLIORATION PAYMENTS - PARTIE 2/2
 * Fonctions + Triggers + RLS + Alertes
 * @module IMPROVE_PAYMENTS_PART2
 */

-- =====================================================
-- 1. SUPPRIMER FONCTIONS EXISTANTES (si conflit)
-- =====================================================

DROP FUNCTION IF EXISTS generate_receipt_number() CASCADE;
DROP TRIGGER IF EXISTS generate_receipt_trigger ON payments;

-- =====================================================
-- 2. FONCTION : GÉNÉRER NUMÉRO DE REÇU
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
CREATE TRIGGER generate_receipt_trigger
  BEFORE INSERT OR UPDATE OF status ON payments
  FOR EACH ROW
  EXECUTE FUNCTION generate_receipt_number();

COMMENT ON FUNCTION generate_receipt_number() IS 'Génère automatiquement un numéro de reçu lors de la complétion';

-- =====================================================
-- 3. FONCTION : ENVOYER RAPPEL AUTOMATIQUE
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
-- 4. FONCTION : VALIDER UN PAIEMENT
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
-- 5. FONCTION : REMBOURSER UN PAIEMENT
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
-- 6. TRIGGER : MISE À JOUR AUTOMATIQUE updated_at
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
-- 7. POLITIQUES RLS (Row Level Security)
-- =====================================================

-- Activer RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Supprimer anciennes politiques si elles existent
DROP POLICY IF EXISTS "Super Admin full access" ON payments;
DROP POLICY IF EXISTS "Admin Groupe can view own payments" ON payments;
DROP POLICY IF EXISTS "Admin Groupe can create payments" ON payments;

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
-- 8. CRÉER ALERTES AUTOMATIQUES
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
-- 9. FONCTION GÉNÉRATION DONNÉES DE TEST
-- =====================================================

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
-- RÉSUMÉ FINAL
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ PARTIE 2/2 TERMINÉE :';
  RAISE NOTICE '6. Fonction generate_receipt_number()';
  RAISE NOTICE '7. Fonction check_overdue_payments()';
  RAISE NOTICE '8. Fonction validate_payment()';
  RAISE NOTICE '9. Fonction refund_payment()';
  RAISE NOTICE '10. Trigger updated_at automatique';
  RAISE NOTICE '11. Politiques RLS sécurisées';
  RAISE NOTICE '12. Alertes automatiques';
  RAISE NOTICE '13. Fonction generate_test_payments()';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 TABLE PAYMENTS NIVEAU PRODUCTION READY !';
  RAISE NOTICE '';
  RAISE NOTICE '📝 TESTS RECOMMANDÉS :';
  RAISE NOTICE '  SELECT * FROM payments_enriched LIMIT 5;';
  RAISE NOTICE '  SELECT * FROM payment_statistics;';
  RAISE NOTICE '  SELECT * FROM payment_monthly_stats;';
  RAISE NOTICE '  SELECT generate_test_payments(20);';
END $$;

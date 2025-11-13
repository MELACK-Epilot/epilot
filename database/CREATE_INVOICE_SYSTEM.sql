/**
 * SYSTÈME DE GÉNÉRATION AUTOMATIQUE DE FACTURES
 * Création, numérotation, et gestion des factures
 * @module CREATE_INVOICE_SYSTEM
 */

-- =====================================================
-- 1. FONCTION : GÉNÉRER NUMÉRO DE FACTURE
-- =====================================================

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  v_year TEXT;
  v_month TEXT;
  v_sequence INTEGER;
  v_invoice_number TEXT;
BEGIN
  -- Si la facture a déjà un numéro, ne rien faire
  IF NEW.invoice_number IS NOT NULL AND NEW.invoice_number != '' THEN
    RETURN NEW;
  END IF;

  -- Extraire année et mois
  v_year := TO_CHAR(COALESCE(NEW.paid_at, NEW.created_at, NOW()), 'YYYY');
  v_month := TO_CHAR(COALESCE(NEW.paid_at, NEW.created_at, NOW()), 'MM');

  -- Obtenir le prochain numéro de séquence pour ce mois
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(invoice_number FROM 'INV-[0-9]{8}-([0-9]+)') AS INTEGER
    )
  ), 0) + 1
  INTO v_sequence
  FROM payments
  WHERE invoice_number LIKE 'INV-' || v_year || v_month || '-%';

  -- Générer le numéro de facture : INV-YYYYMMDD-XXXXXX
  v_invoice_number := 'INV-' || 
                      v_year || v_month || 
                      TO_CHAR(COALESCE(NEW.paid_at, NEW.created_at, NOW()), 'DD') || 
                      '-' || 
                      LPAD(v_sequence::TEXT, 6, '0');

  NEW.invoice_number := v_invoice_number;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_invoice_number() IS 'Génère automatiquement un numéro de facture unique au format INV-YYYYMMDD-XXXXXX';

-- =====================================================
-- 2. TRIGGER : GÉNÉRER FACTURE À LA CRÉATION
-- =====================================================

DROP TRIGGER IF EXISTS generate_invoice_number_trigger ON payments;

CREATE TRIGGER generate_invoice_number_trigger
  BEFORE INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION generate_invoice_number();

COMMENT ON TRIGGER generate_invoice_number_trigger ON payments IS 'Génère automatiquement le numéro de facture lors de la création d''un paiement';

-- =====================================================
-- 3. METTRE À JOUR LES FACTURES EXISTANTES
-- =====================================================

-- Générer des numéros pour les paiements existants sans facture
DO $$
DECLARE
  v_payment RECORD;
  v_year TEXT;
  v_month TEXT;
  v_day TEXT;
  v_sequence INTEGER := 1;
  v_invoice_number TEXT;
BEGIN
  FOR v_payment IN 
    SELECT id, paid_at, created_at 
    FROM payments 
    WHERE invoice_number IS NULL OR invoice_number = ''
    ORDER BY COALESCE(paid_at, created_at)
  LOOP
    -- Extraire date
    v_year := TO_CHAR(COALESCE(v_payment.paid_at, v_payment.created_at), 'YYYY');
    v_month := TO_CHAR(COALESCE(v_payment.paid_at, v_payment.created_at), 'MM');
    v_day := TO_CHAR(COALESCE(v_payment.paid_at, v_payment.created_at), 'DD');
    
    -- Générer numéro
    v_invoice_number := 'INV-' || v_year || v_month || v_day || '-' || LPAD(v_sequence::TEXT, 6, '0');
    
    -- Mettre à jour
    UPDATE payments
    SET invoice_number = v_invoice_number
    WHERE id = v_payment.id;
    
    v_sequence := v_sequence + 1;
    
    RAISE NOTICE 'Facture générée : %', v_invoice_number;
  END LOOP;
  
  RAISE NOTICE '✅ % factures générées', v_sequence - 1;
END $$;

-- =====================================================
-- 4. FONCTION : CRÉER FACTURE POUR ABONNEMENT
-- =====================================================

CREATE OR REPLACE FUNCTION create_invoice_for_subscription(
  p_subscription_id UUID,
  p_amount NUMERIC,
  p_payment_method TEXT DEFAULT 'bank_transfer',
  p_due_date DATE DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_subscription RECORD;
  v_payment_id UUID;
  v_invoice_number TEXT;
BEGIN
  -- Récupérer l'abonnement
  SELECT 
    s.*,
    sg.name as school_group_name
  INTO v_subscription
  FROM subscriptions s
  JOIN school_groups sg ON s.school_group_id = sg.id
  WHERE s.id = p_subscription_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Abonnement non trouvé';
  END IF;
  
  -- Créer le paiement (le trigger générera le numéro de facture)
  INSERT INTO payments (
    subscription_id,
    school_group_id,
    amount,
    currency,
    payment_method,
    status,
    due_date,
    notes
  ) VALUES (
    p_subscription_id,
    v_subscription.school_group_id,
    p_amount,
    'FCFA',
    p_payment_method,
    'pending',
    COALESCE(p_due_date, CURRENT_DATE + INTERVAL '7 days'),
    'Facture créée automatiquement pour abonnement'
  )
  RETURNING id, invoice_number INTO v_payment_id, v_invoice_number;
  
  RETURN jsonb_build_object(
    'success', true,
    'payment_id', v_payment_id,
    'invoice_number', v_invoice_number,
    'school_group', v_subscription.school_group_name,
    'amount', p_amount,
    'due_date', COALESCE(p_due_date, CURRENT_DATE + INTERVAL '7 days')
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_invoice_for_subscription IS 'Crée une facture pour un abonnement';

-- =====================================================
-- 5. FONCTION : CRÉER FACTURES MENSUELLES AUTOMATIQUES
-- =====================================================

CREATE OR REPLACE FUNCTION create_monthly_invoices()
RETURNS TABLE(
  invoice_number TEXT,
  school_group_name TEXT,
  amount NUMERIC,
  status TEXT
) AS $$
DECLARE
  v_subscription RECORD;
  v_result JSONB;
BEGIN
  -- Pour chaque abonnement actif
  FOR v_subscription IN
    SELECT 
      s.id,
      s.school_group_id,
      s.amount,
      sg.name as school_group_name
    FROM subscriptions s
    JOIN school_groups sg ON s.school_group_id = sg.id
    WHERE s.status = 'active'
      -- Pas de paiement ce mois-ci
      AND NOT EXISTS (
        SELECT 1 FROM payments p
        WHERE p.subscription_id = s.id
        AND DATE_TRUNC('month', p.created_at) = DATE_TRUNC('month', CURRENT_DATE)
      )
  LOOP
    -- Créer la facture
    SELECT create_invoice_for_subscription(
      v_subscription.id,
      v_subscription.amount,
      'bank_transfer',
      CURRENT_DATE + INTERVAL '7 days'
    ) INTO v_result;
    
    -- Retourner le résultat
    invoice_number := v_result->>'invoice_number';
    school_group_name := v_result->>'school_group';
    amount := (v_result->>'amount')::NUMERIC;
    status := 'created';
    
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_monthly_invoices IS 'Crée automatiquement les factures mensuelles pour tous les abonnements actifs';

-- =====================================================
-- 6. VUE : FACTURES EN ATTENTE
-- =====================================================

CREATE OR REPLACE VIEW pending_invoices AS
SELECT 
  p.invoice_number,
  p.amount,
  p.currency,
  p.due_date,
  p.created_at,
  (CURRENT_DATE - p.due_date::DATE) as days_overdue,
  sg.name as school_group_name,
  sg.phone as school_group_phone,
  sg.city as school_group_city,
  s.plan_name
FROM payments p
JOIN school_groups sg ON p.school_group_id = sg.id
LEFT JOIN subscriptions s ON p.subscription_id = s.id
WHERE p.status = 'pending'
ORDER BY p.due_date ASC;

COMMENT ON VIEW pending_invoices IS 'Liste des factures en attente de paiement';

-- =====================================================
-- 7. FONCTION : MARQUER FACTURE COMME PAYÉE
-- =====================================================

CREATE OR REPLACE FUNCTION mark_invoice_as_paid(
  p_invoice_number TEXT,
  p_paid_at TIMESTAMP DEFAULT NOW(),
  p_payment_method TEXT DEFAULT NULL,
  p_transaction_id TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_payment RECORD;
BEGIN
  -- Mettre à jour le paiement
  UPDATE payments
  SET 
    status = 'completed',
    paid_at = p_paid_at,
    payment_method = COALESCE(p_payment_method, payment_method),
    transaction_id = COALESCE(p_transaction_id, transaction_id),
    updated_at = NOW()
  WHERE invoice_number = p_invoice_number
    AND status = 'pending'
  RETURNING * INTO v_payment;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Facture non trouvée ou déjà payée: %', p_invoice_number;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'invoice_number', v_payment.invoice_number,
    'amount', v_payment.amount,
    'paid_at', v_payment.paid_at,
    'status', v_payment.status
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION mark_invoice_as_paid IS 'Marque une facture comme payée';

-- =====================================================
-- 8. STATISTIQUES FACTURES
-- =====================================================

CREATE OR REPLACE VIEW invoice_statistics AS
SELECT
  COUNT(*) as total_invoices,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_invoices,
  COUNT(*) FILTER (WHERE status = 'completed') as paid_invoices,
  COUNT(*) FILTER (WHERE status = 'pending' AND due_date < CURRENT_DATE) as overdue_invoices,
  
  COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) as pending_amount,
  COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as paid_amount,
  COALESCE(SUM(amount) FILTER (WHERE status = 'pending' AND due_date < CURRENT_DATE), 0) as overdue_amount,
  
  ROUND(
    (COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
    2
  ) as payment_rate
FROM payments;

COMMENT ON VIEW invoice_statistics IS 'Statistiques globales des factures';

-- =====================================================
-- RÉSUMÉ
-- =====================================================

DO $$
DECLARE
  v_total INTEGER;
  v_with_invoice INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total FROM payments;
  SELECT COUNT(*) INTO v_with_invoice FROM payments WHERE invoice_number IS NOT NULL;
  
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '✅ SYSTÈME DE FACTURES CRÉÉ';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE 'Total paiements : %', v_total;
  RAISE NOTICE 'Avec numéro de facture : %', v_with_invoice;
  RAISE NOTICE '';
  RAISE NOTICE 'Fonctions créées :';
  RAISE NOTICE '  - generate_invoice_number() : Génération auto';
  RAISE NOTICE '  - create_invoice_for_subscription() : Créer facture';
  RAISE NOTICE '  - create_monthly_invoices() : Factures mensuelles';
  RAISE NOTICE '  - mark_invoice_as_paid() : Marquer comme payé';
  RAISE NOTICE '';
  RAISE NOTICE 'Vues créées :';
  RAISE NOTICE '  - pending_invoices : Factures en attente';
  RAISE NOTICE '  - invoice_statistics : Statistiques';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 EXEMPLES D''UTILISATION :';
  RAISE NOTICE '';
  RAISE NOTICE '-- Créer facture pour un abonnement';
  RAISE NOTICE 'SELECT create_invoice_for_subscription(''uuid'', 50000);';
  RAISE NOTICE '';
  RAISE NOTICE '-- Créer toutes les factures mensuelles';
  RAISE NOTICE 'SELECT * FROM create_monthly_invoices();';
  RAISE NOTICE '';
  RAISE NOTICE '-- Marquer facture comme payée';
  RAISE NOTICE 'SELECT mark_invoice_as_paid(''INV-20251109-000001'');';
  RAISE NOTICE '';
  RAISE NOTICE '-- Voir factures en attente';
  RAISE NOTICE 'SELECT * FROM pending_invoices;';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
END $$;

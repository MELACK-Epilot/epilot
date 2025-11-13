/**
 * VÉRIFICATION : PAIEMENTS EXISTANTS
 * Vérifie si des paiements existent déjà dans la base
 * @module CHECK_EXISTING_PAYMENTS
 */

-- =====================================================
-- 1. VÉRIFIER SI LA TABLE PAYMENTS EXISTE
-- =====================================================

SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'payments';

-- =====================================================
-- 2. COMPTER LES PAIEMENTS EXISTANTS
-- =====================================================

SELECT COUNT(*) as total_payments FROM payments;

-- =====================================================
-- 3. VOIR LES PAIEMENTS PAR STATUT
-- =====================================================

SELECT 
  status,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM payments
GROUP BY status
ORDER BY count DESC;

-- =====================================================
-- 4. VOIR LES PAIEMENTS PAR GROUPE
-- =====================================================

SELECT 
  sg.name as groupe,
  COUNT(p.id) as nb_paiements,
  SUM(p.amount) as total_paye,
  p.status
FROM payments p
JOIN school_groups sg ON p.school_group_id = sg.id
GROUP BY sg.name, p.status
ORDER BY total_paye DESC;

-- =====================================================
-- 5. VÉRIFIER LES ABONNEMENTS SANS PAIEMENTS
-- =====================================================

SELECT 
  sg.name as groupe,
  s.status as statut_abonnement,
  s.amount as montant_abonnement,
  s.start_date,
  s.end_date,
  COUNT(p.id) as nb_paiements
FROM subscriptions s
JOIN school_groups sg ON s.school_group_id = sg.id
LEFT JOIN payments p ON p.subscription_id = s.id
GROUP BY sg.name, s.status, s.amount, s.start_date, s.end_date
HAVING COUNT(p.id) = 0
ORDER BY s.start_date DESC;

-- =====================================================
-- 6. CRÉER PAIEMENTS POUR ABONNEMENTS ACTIFS SANS PAIEMENT
-- =====================================================

-- Cette fonction crée automatiquement un paiement "completed" 
-- pour chaque abonnement actif qui n'a pas encore de paiement

CREATE OR REPLACE FUNCTION create_missing_payments()
RETURNS TABLE(
  subscription_id UUID,
  school_group_name TEXT,
  amount NUMERIC,
  payment_id UUID
) AS $$
DECLARE
  v_subscription RECORD;
  v_payment_id UUID;
BEGIN
  -- Pour chaque abonnement actif sans paiement
  FOR v_subscription IN
    SELECT 
      s.id,
      s.school_group_id,
      s.amount,
      sg.name as school_group_name,
      s.start_date
    FROM subscriptions s
    JOIN school_groups sg ON s.school_group_id = sg.id
    LEFT JOIN payments p ON p.subscription_id = s.id
    WHERE s.status = 'active'
    GROUP BY s.id, s.school_group_id, s.amount, sg.name, s.start_date
    HAVING COUNT(p.id) = 0
  LOOP
    -- Créer un paiement completed
    INSERT INTO payments (
      subscription_id,
      school_group_id,
      amount,
      currency,
      payment_method,
      status,
      paid_at,
      due_date
    ) VALUES (
      v_subscription.id,
      v_subscription.school_group_id,
      v_subscription.amount,
      'FCFA',
      'bank_transfer',
      'completed',
      v_subscription.start_date,
      v_subscription.start_date
    )
    RETURNING id INTO v_payment_id;
    
    -- Retourner les infos
    subscription_id := v_subscription.id;
    school_group_name := v_subscription.school_group_name;
    amount := v_subscription.amount;
    payment_id := v_payment_id;
    
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. EXÉCUTER LA CRÉATION DES PAIEMENTS MANQUANTS
-- =====================================================

-- Décommenter pour exécuter
-- SELECT * FROM create_missing_payments();

-- =====================================================
-- 8. VÉRIFIER LE RÉSULTAT
-- =====================================================

-- Après exécution, vérifier que tous les abonnements actifs ont un paiement
SELECT 
  sg.name as groupe,
  s.status as statut_abonnement,
  s.amount as montant_abonnement,
  COUNT(p.id) as nb_paiements,
  COALESCE(SUM(p.amount), 0) as total_paye
FROM subscriptions s
JOIN school_groups sg ON s.school_group_id = sg.id
LEFT JOIN payments p ON p.subscription_id = s.id
WHERE s.status = 'active'
GROUP BY sg.name, s.status, s.amount
ORDER BY sg.name;

-- =====================================================
-- RÉSUMÉ
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ VÉRIFICATION TERMINÉE';
  RAISE NOTICE '';
  RAISE NOTICE 'Étapes suivantes :';
  RAISE NOTICE '1. Vérifier le nombre de paiements existants';
  RAISE NOTICE '2. Identifier les abonnements sans paiement';
  RAISE NOTICE '3. Exécuter create_missing_payments() si nécessaire';
  RAISE NOTICE '4. Vérifier que tous les abonnements actifs ont un paiement';
END $$;

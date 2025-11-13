/**
 * CRÉATION PAIEMENTS HISTORIQUES - SOLUTION EXPERTE
 * Crée automatiquement les paiements pour les abonnements existants
 * Avec logique intelligente et meilleures pratiques
 * @module CREATE_HISTORICAL_PAYMENTS
 */

-- =====================================================
-- 1. FONCTION EXPERTE : CRÉER PAIEMENTS HISTORIQUES
-- =====================================================

CREATE OR REPLACE FUNCTION create_historical_payments()
RETURNS TABLE(
  action TEXT,
  subscription_id UUID,
  school_group_name TEXT,
  amount NUMERIC,
  payment_id UUID,
  status TEXT
) AS $$
DECLARE
  v_subscription RECORD;
  v_payment_id UUID;
  v_invoice_number TEXT;
  v_count INTEGER := 0;
BEGIN
  RAISE NOTICE '🚀 DÉBUT CRÉATION PAIEMENTS HISTORIQUES';
  RAISE NOTICE '';
  
  -- Pour chaque abonnement (actif, pending, expired)
  FOR v_subscription IN
    SELECT 
      s.id,
      s.school_group_id,
      s.amount,
      s.status as subscription_status,
      sg.name as school_group_name,
      s.start_date,
      s.end_date,
      s.created_at
    FROM subscriptions s
    JOIN school_groups sg ON s.school_group_id = sg.id
    LEFT JOIN payments p ON p.subscription_id = s.id
    GROUP BY s.id, s.school_group_id, s.amount, s.status, sg.name, s.start_date, s.end_date, s.created_at
    HAVING COUNT(p.id) = 0
    ORDER BY s.created_at ASC
  LOOP
    v_count := v_count + 1;
    
    -- Déterminer le statut du paiement selon l'abonnement
    DECLARE
      v_payment_status TEXT;
      v_paid_at TIMESTAMP;
      v_due_date DATE;
    BEGIN
      CASE v_subscription.subscription_status
        -- Abonnement actif → Paiement complété
        WHEN 'active' THEN
          v_payment_status := 'completed';
          v_paid_at := v_subscription.start_date;
          v_due_date := v_subscription.start_date::DATE;
        
        -- Abonnement expiré → Paiement complété (historique)
        WHEN 'expired' THEN
          v_payment_status := 'completed';
          v_paid_at := v_subscription.start_date;
          v_due_date := v_subscription.start_date::DATE;
        
        -- Abonnement en attente → Paiement en attente
        WHEN 'pending' THEN
          v_payment_status := 'pending';
          v_paid_at := NULL;
          v_due_date := CURRENT_DATE + INTERVAL '7 days';
        
        -- Abonnement annulé → Paiement échoué
        WHEN 'cancelled' THEN
          v_payment_status := 'failed';
          v_paid_at := NULL;
          v_due_date := v_subscription.start_date::DATE;
        
        -- Abonnement suspendu → Paiement en attente
        WHEN 'suspended' THEN
          v_payment_status := 'pending';
          v_paid_at := NULL;
          v_due_date := CURRENT_DATE;
        
        ELSE
          v_payment_status := 'pending';
          v_paid_at := NULL;
          v_due_date := CURRENT_DATE;
      END CASE;
      
      -- Créer le paiement
      INSERT INTO payments (
        subscription_id,
        school_group_id,
        amount,
        currency,
        payment_method,
        status,
        paid_at,
        due_date,
        notes,
        created_at
      ) VALUES (
        v_subscription.id,
        v_subscription.school_group_id,
        v_subscription.amount,
        'FCFA',
        'bank_transfer', -- Méthode par défaut
        v_payment_status,
        v_paid_at,
        v_due_date,
        'Paiement historique créé automatiquement',
        v_subscription.created_at -- Même date de création que l'abonnement
      )
      RETURNING id INTO v_payment_id;
      
      -- Retourner les infos
      action := 'CREATED';
      subscription_id := v_subscription.id;
      school_group_name := v_subscription.school_group_name;
      amount := v_subscription.amount;
      payment_id := v_payment_id;
      status := v_payment_status;
      
      RAISE NOTICE '✅ Paiement créé : % - % FCFA - Statut: %', 
        v_subscription.school_group_name, 
        v_subscription.amount,
        v_payment_status;
      
      RETURN NEXT;
    END;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 TERMINÉ : % paiement(s) historique(s) créé(s)', v_count;
  
  -- Si aucun paiement créé
  IF v_count = 0 THEN
    action := 'NO_ACTION';
    school_group_name := 'Tous les abonnements ont déjà des paiements';
    RETURN NEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_historical_payments() IS 'Crée les paiements historiques pour tous les abonnements sans paiement avec logique intelligente';

-- =====================================================
-- 2. FONCTION : VÉRIFIER COHÉRENCE
-- =====================================================

CREATE OR REPLACE FUNCTION check_payment_coherence()
RETURNS TABLE(
  check_name TEXT,
  status TEXT,
  details TEXT
) AS $$
BEGIN
  -- Check 1 : Tous les abonnements actifs ont un paiement completed
  SELECT 
    'Abonnements actifs avec paiement' as check_name,
    CASE 
      WHEN COUNT(*) = 0 THEN '✅ OK'
      ELSE '❌ PROBLÈME'
    END as status,
    COUNT(*)::TEXT || ' abonnement(s) actif(s) sans paiement completed' as details
  FROM subscriptions s
  LEFT JOIN payments p ON p.subscription_id = s.id AND p.status = 'completed'
  WHERE s.status = 'active'
  GROUP BY s.id
  HAVING COUNT(p.id) = 0
  INTO check_name, status, details;
  
  IF FOUND THEN
    RETURN NEXT;
  ELSE
    check_name := 'Abonnements actifs avec paiement';
    status := '✅ OK';
    details := 'Tous les abonnements actifs ont un paiement';
    RETURN NEXT;
  END IF;
  
  -- Check 2 : Cohérence montants
  check_name := 'Cohérence montants';
  SELECT 
    CASE 
      WHEN COUNT(*) = 0 THEN '✅ OK'
      ELSE '⚠️  ATTENTION'
    END,
    COUNT(*)::TEXT || ' paiement(s) avec montant différent de l''abonnement'
  FROM payments p
  JOIN subscriptions s ON p.subscription_id = s.id
  WHERE p.amount != s.amount
  INTO status, details;
  RETURN NEXT;
  
  -- Check 3 : Statistiques globales
  check_name := 'Statistiques globales';
  status := 'ℹ️  INFO';
  SELECT 
    'Total: ' || COUNT(*) || ' paiements | ' ||
    'Completed: ' || COUNT(*) FILTER (WHERE status = 'completed') || ' | ' ||
    'Pending: ' || COUNT(*) FILTER (WHERE status = 'pending') || ' | ' ||
    'Total: ' || COALESCE(SUM(amount), 0) || ' FCFA'
  FROM payments
  INTO details;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_payment_coherence() IS 'Vérifie la cohérence entre abonnements et paiements';

-- =====================================================
-- 3. EXÉCUTION AUTOMATIQUE
-- =====================================================

DO $$
DECLARE
  v_result RECORD;
  v_total INTEGER := 0;
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '🎯 CRÉATION PAIEMENTS HISTORIQUES - SOLUTION EXPERTE';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '';
  
  -- Exécuter la création
  FOR v_result IN SELECT * FROM create_historical_payments()
  LOOP
    v_total := v_total + 1;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '✅ RÉSULTAT : % paiement(s) créé(s)', v_total;
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '';
  
  -- Vérifier la cohérence
  RAISE NOTICE '🔍 VÉRIFICATION COHÉRENCE :';
  RAISE NOTICE '';
  FOR v_result IN SELECT * FROM check_payment_coherence()
  LOOP
    RAISE NOTICE '  % : % - %', v_result.check_name, v_result.status, v_result.details;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '🎉 TERMINÉ AVEC SUCCÈS !';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
END $$;

-- =====================================================
-- 4. AFFICHER LE RÉSULTAT
-- =====================================================

-- Statistiques finales
SELECT 
  '📊 STATISTIQUES PAIEMENTS' as titre,
  COUNT(*) as total_paiements,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  COALESCE(SUM(amount), 0) as montant_total,
  COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as montant_paye
FROM payments;

-- Paiements par groupe
SELECT 
  '📋 PAIEMENTS PAR GROUPE' as titre,
  sg.name as groupe,
  COUNT(p.id) as nb_paiements,
  SUM(p.amount) as total_paye,
  STRING_AGG(DISTINCT p.status, ', ') as statuts
FROM payments p
JOIN school_groups sg ON p.school_group_id = sg.id
GROUP BY sg.name
ORDER BY total_paye DESC;

-- Vérification cohérence
SELECT * FROM check_payment_coherence();

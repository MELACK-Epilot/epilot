/**
 * VÉRIFICATION : PAIEMENTS EN ATTENTE
 * Identifie pourquoi "En Attente" affiche 0
 */

-- =====================================================
-- 1. VÉRIFIER LES STATUTS DES PAIEMENTS
-- =====================================================

SELECT 
  '📊 TOUS LES PAIEMENTS' as info,
  invoice_number,
  sg.name as groupe,
  p.amount,
  p.status,
  p.paid_at
FROM payments p
JOIN school_groups sg ON p.school_group_id = sg.id
ORDER BY p.created_at DESC;

-- =====================================================
-- 2. COMPTER PAR STATUT
-- =====================================================

SELECT 
  '📋 PAR STATUT' as info,
  status,
  COUNT(*) as nombre
FROM payments
GROUP BY status;

-- =====================================================
-- 3. VÉRIFIER LES ABONNEMENTS
-- =====================================================

SELECT 
  '🔍 ABONNEMENTS' as info,
  sg.name as groupe,
  s.status as statut_abonnement,
  s.amount,
  COUNT(p.id) as nb_paiements,
  STRING_AGG(p.status, ', ') as statuts_paiements
FROM subscriptions s
JOIN school_groups sg ON s.school_group_id = sg.id
LEFT JOIN payments p ON p.subscription_id = s.id
GROUP BY sg.name, s.status, s.amount
ORDER BY sg.name;

-- =====================================================
-- 4. CRÉER UN PAIEMENT EN ATTENTE SI NÉCESSAIRE
-- =====================================================

-- Si LAMARELLE a payment_status='pending' dans subscriptions,
-- créer un paiement pending

INSERT INTO payments (
  subscription_id,
  school_group_id,
  amount,
  currency,
  payment_method,
  status,
  paid_at,
  due_date,
  notes
)
SELECT 
  s.id,
  s.school_group_id,
  s.amount,
  'FCFA',
  'bank_transfer',
  'pending', -- EN ATTENTE
  NULL, -- Pas encore payé
  CURRENT_DATE + INTERVAL '7 days', -- Échéance dans 7 jours
  'Paiement en attente de validation'
FROM subscriptions s
JOIN school_groups sg ON s.school_group_id = sg.id
WHERE sg.name = 'LAMARELLE'
  AND NOT EXISTS (
    SELECT 1 FROM payments p 
    WHERE p.subscription_id = s.id 
    AND p.status = 'pending'
  )
  AND s.status = 'active';

-- =====================================================
-- 5. VÉRIFIER LE RÉSULTAT
-- =====================================================

SELECT 
  '✅ RÉSULTAT' as info,
  status,
  COUNT(*) as nombre,
  SUM(amount) as montant_total
FROM payments
GROUP BY status;

-- =====================================================
-- 6. STATISTIQUES FINALES
-- =====================================================

SELECT * FROM payment_statistics;

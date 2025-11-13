/**
 * DÉBOGAGE ET CORRECTION - PAIEMENTS
 * Identifie le problème et crée les paiements manuellement
 */

-- =====================================================
-- 1. VÉRIFIER LES ABONNEMENTS
-- =====================================================

SELECT 
  '🔍 ABONNEMENTS EXISTANTS' as info,
  COUNT(*) as total
FROM subscriptions;

SELECT 
  '📋 DÉTAIL ABONNEMENTS' as info,
  s.id,
  sg.name as groupe,
  s.status,
  s.amount,
  s.start_date,
  s.end_date
FROM subscriptions s
JOIN school_groups sg ON s.school_group_id = sg.id
ORDER BY s.created_at DESC;

-- =====================================================
-- 2. VÉRIFIER SI PAIEMENTS EXISTENT DÉJÀ
-- =====================================================

SELECT 
  '💰 PAIEMENTS EXISTANTS' as info,
  COUNT(*) as total
FROM payments;

-- =====================================================
-- 3. CRÉER PAIEMENTS MANUELLEMENT (SIMPLE)
-- =====================================================

-- Pour chaque abonnement, créer un paiement
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
  s.id as subscription_id,
  s.school_group_id,
  s.amount,
  'FCFA' as currency,
  'bank_transfer' as payment_method,
  CASE 
    WHEN s.status = 'active' THEN 'completed'
    WHEN s.status = 'expired' THEN 'completed'
    WHEN s.status = 'pending' THEN 'pending'
    WHEN s.status = 'cancelled' THEN 'failed'
    ELSE 'pending'
  END as status,
  CASE 
    WHEN s.status IN ('active', 'expired') THEN s.start_date
    ELSE NULL
  END as paid_at,
  s.start_date::DATE as due_date,
  'Paiement créé automatiquement' as notes
FROM subscriptions s
WHERE NOT EXISTS (
  SELECT 1 FROM payments p 
  WHERE p.subscription_id = s.id
);

-- =====================================================
-- 4. VÉRIFIER LE RÉSULTAT
-- =====================================================

SELECT 
  '✅ RÉSULTAT' as info,
  COUNT(*) as paiements_crees
FROM payments;

SELECT 
  '📊 DÉTAIL PAIEMENTS' as info,
  p.invoice_number,
  sg.name as groupe,
  p.amount,
  p.status,
  p.paid_at
FROM payments p
JOIN school_groups sg ON p.school_group_id = sg.id
ORDER BY p.created_at DESC;

-- =====================================================
-- 5. STATISTIQUES
-- =====================================================

SELECT * FROM payment_statistics;

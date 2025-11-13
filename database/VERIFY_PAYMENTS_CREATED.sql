/**
 * VÉRIFICATION : PAIEMENTS CRÉÉS
 * Vérifie que les paiements historiques ont bien été créés
 */

-- =====================================================
-- 1. COMPTER LES PAIEMENTS
-- =====================================================

SELECT 
  '📊 TOTAL PAIEMENTS' as info,
  COUNT(*) as nombre
FROM payments;

-- =====================================================
-- 2. PAIEMENTS PAR STATUT
-- =====================================================

SELECT 
  '📋 PAR STATUT' as info,
  status,
  COUNT(*) as nombre,
  SUM(amount) as montant_total
FROM payments
GROUP BY status
ORDER BY nombre DESC;

-- =====================================================
-- 3. PAIEMENTS PAR GROUPE
-- =====================================================

SELECT 
  '🏫 PAR GROUPE' as info,
  sg.name as groupe,
  p.status,
  p.amount as montant,
  p.paid_at as date_paiement,
  p.invoice_number as facture
FROM payments p
JOIN school_groups sg ON p.school_group_id = sg.id
ORDER BY p.created_at DESC;

-- =====================================================
-- 4. VÉRIFIER VUE ENRICHIE
-- =====================================================

SELECT 
  '✨ VUE ENRICHIE' as info,
  invoice_number,
  school_group_name,
  amount,
  detailed_status,
  days_overdue
FROM payments_enriched
ORDER BY created_at DESC
LIMIT 5;

-- =====================================================
-- 5. STATISTIQUES GLOBALES
-- =====================================================

SELECT 
  '📈 STATISTIQUES' as info,
  *
FROM payment_statistics;

-- =====================================================
-- 6. ÉVOLUTION MENSUELLE
-- =====================================================

SELECT 
  '📅 MENSUEL' as info,
  month_label,
  payment_count,
  completed_count,
  completed_amount
FROM payment_monthly_stats
ORDER BY month DESC
LIMIT 6;

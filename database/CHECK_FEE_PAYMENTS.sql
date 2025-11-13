-- =====================================================
-- VÉRIFICATION : TABLE FEE_PAYMENTS
-- =====================================================
-- Vérifie si la table fee_payments contient des données
-- =====================================================

-- 1. Vérifier si la table existe
SELECT 
  '1. TABLE EXISTE ?' as section,
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'fee_payments') as nb_colonnes
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'fee_payments';

-- 2. Compter les paiements
SELECT 
  '2. NOMBRE DE PAIEMENTS' as section,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'completed') as completes,
  COUNT(*) FILTER (WHERE status = 'pending') as en_attente,
  COUNT(*) FILTER (WHERE status = 'overdue') as en_retard,
  COUNT(*) FILTER (WHERE status = 'cancelled') as annules
FROM fee_payments;

-- 3. Montants totaux
SELECT 
  '3. MONTANTS' as section,
  COALESCE(SUM(amount), 0) as total_tous_statuts,
  COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as total_completes,
  COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) as total_en_attente,
  COALESCE(SUM(amount) FILTER (WHERE status = 'overdue'), 0) as total_en_retard
FROM fee_payments;

-- 4. Paiements par mois
SELECT 
  '4. PAIEMENTS PAR MOIS' as section,
  DATE_TRUNC('month', payment_date) as mois,
  COUNT(*) as nb_paiements,
  SUM(amount) as montant_total
FROM fee_payments
WHERE status = 'completed'
GROUP BY DATE_TRUNC('month', payment_date)
ORDER BY mois DESC
LIMIT 6;

-- 5. Structure de la table
SELECT 
  '5. COLONNES DE FEE_PAYMENTS' as section,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'fee_payments'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Échantillon de données
SELECT 
  '6. ÉCHANTILLON' as section,
  id,
  amount,
  status,
  payment_date,
  created_at
FROM fee_payments
ORDER BY created_at DESC
LIMIT 5;

-- 7. Vérifier la vue financial_stats
SELECT 
  '7. VUE FINANCIAL_STATS' as section,
  total_revenue,
  monthly_revenue,
  yearly_revenue,
  average_revenue_per_group
FROM financial_stats;

-- 8. Calculer ARPU et LTV manuellement
SELECT 
  '8. CALCUL ARPU ET LTV' as section,
  (SELECT COALESCE(SUM(amount), 0) FROM fee_payments WHERE status = 'completed') as total_revenue,
  (SELECT COUNT(*) FROM school_groups WHERE status = 'active') as total_groups,
  CASE 
    WHEN (SELECT COUNT(*) FROM school_groups WHERE status = 'active') > 0 
    THEN (SELECT COALESCE(SUM(amount), 0) FROM fee_payments WHERE status = 'completed') / 
         (SELECT COUNT(*) FROM school_groups WHERE status = 'active')
    ELSE 0
  END as arpu_calcule,
  CASE 
    WHEN (SELECT COUNT(DISTINCT school_group_id) FROM school_group_subscriptions WHERE status IN ('active', 'expired', 'cancelled')) > 0 
    THEN (SELECT COALESCE(SUM(amount), 0) FROM fee_payments WHERE status = 'completed') / 
         (SELECT COUNT(DISTINCT school_group_id) FROM school_group_subscriptions WHERE status IN ('active', 'expired', 'cancelled'))
    ELSE 0
  END as ltv_calcule;

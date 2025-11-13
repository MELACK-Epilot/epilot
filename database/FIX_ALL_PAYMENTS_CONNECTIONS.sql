/**
 * CORRECTION AUTOMATIQUE - CONNEXIONS PAIEMENTS
 * Répare tous les problèmes de connexion
 * @module FIX_ALL_PAYMENTS_CONNECTIONS
 */

-- =====================================================
-- 1. VÉRIFIER ET RECRÉER LA VUE PAYMENTS_ENRICHED
-- =====================================================

DROP VIEW IF EXISTS payments_enriched CASCADE;

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

-- =====================================================
-- 2. VÉRIFIER ET RECRÉER LA VUE PAYMENT_STATISTICS
-- =====================================================

DROP VIEW IF EXISTS payment_statistics CASCADE;

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
  
  -- Compteurs par méthode
  COUNT(*) FILTER (WHERE payment_method = 'bank_transfer') as bank_transfer_count,
  COUNT(*) FILTER (WHERE payment_method = 'mobile_money') as mobile_money_count,
  COUNT(*) FILTER (WHERE payment_method = 'card') as card_count,
  COUNT(*) FILTER (WHERE payment_method = 'cash') as cash_count
  
FROM payments;

-- =====================================================
-- 3. VÉRIFIER ET RECRÉER LA VUE PAYMENT_MONTHLY_STATS
-- =====================================================

DROP VIEW IF EXISTS payment_monthly_stats CASCADE;

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

-- =====================================================
-- 4. DÉSACTIVER RLS TEMPORAIREMENT POUR TESTS
-- =====================================================

-- Note: En production, garder RLS activé
-- Ceci est juste pour vérifier si RLS bloque les données

ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. VÉRIFIER LES DONNÉES
-- =====================================================

SELECT '✅ VÉRIFICATION APRÈS CORRECTION' as info;

SELECT 
  'Paiements (table)' as source,
  COUNT(*) as nombre
FROM payments
UNION ALL
SELECT 
  'Paiements enrichis (vue)' as source,
  COUNT(*) as nombre
FROM payments_enriched
UNION ALL
SELECT 
  'Statistiques (vue)' as source,
  1 as nombre
FROM payment_statistics
UNION ALL
SELECT 
  'Mois avec données (vue)' as source,
  COUNT(*) as nombre
FROM payment_monthly_stats;

-- =====================================================
-- 6. AFFICHER LES DONNÉES POUR LE FRONTEND
-- =====================================================

SELECT '📊 DONNÉES POUR LE TABLEAU' as info;
SELECT 
  invoice_number,
  school_group_name,
  amount,
  currency,
  payment_method,
  detailed_status,
  paid_at
FROM payments_enriched
ORDER BY created_at DESC
LIMIT 10;

SELECT '📈 DONNÉES POUR LES KPIs' as info;
SELECT * FROM payment_statistics;

SELECT '📅 DONNÉES POUR LE GRAPHIQUE' as info;
SELECT 
  month_label,
  completed_amount,
  completed_count
FROM payment_monthly_stats
ORDER BY month DESC
LIMIT 6;

-- =====================================================
-- 7. RÉACTIVER RLS (IMPORTANT POUR LA PRODUCTION)
-- =====================================================

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Recréer les politiques si nécessaire
DROP POLICY IF EXISTS "Super Admin full access" ON payments;
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

DROP POLICY IF EXISTS "Admin Groupe can view own payments" ON payments;
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

-- =====================================================
-- RÉSUMÉ
-- =====================================================

DO $$
DECLARE
  v_payments INTEGER;
  v_enriched INTEGER;
  v_stats INTEGER;
  v_months INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_payments FROM payments;
  SELECT COUNT(*) INTO v_enriched FROM payments_enriched;
  SELECT total_payments INTO v_stats FROM payment_statistics;
  SELECT COUNT(*) INTO v_months FROM payment_monthly_stats;
  
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '✅ CORRECTION TERMINÉE';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE 'Paiements (table) : %', v_payments;
  RAISE NOTICE 'Paiements enrichis (vue) : %', v_enriched;
  RAISE NOTICE 'Statistiques : % paiements', v_stats;
  RAISE NOTICE 'Mois avec données : %', v_months;
  RAISE NOTICE '';
  
  IF v_payments > 0 AND v_enriched > 0 AND v_months > 0 THEN
    RAISE NOTICE '🎉 TOUT EST CONNECTÉ ET FONCTIONNEL !';
    RAISE NOTICE '';
    RAISE NOTICE '➡️  Rafraîchis maintenant le frontend (Ctrl+Shift+R)';
  ELSE
    RAISE NOTICE '⚠️  Il reste des problèmes à corriger';
  END IF;
  
  RAISE NOTICE '═══════════════════════════════════════';
END $$;

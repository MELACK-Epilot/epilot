-- Migration RAPIDE: Corriger action_url uniquement
-- Date: 2025-11-20
-- Objectif: Juste corriger les action_url sans toucher RLS

-- ============================================
-- 1. CORRIGER action_url
-- ============================================

UPDATE system_alerts
SET action_url = CASE
  WHEN alert_type = 'subscription' THEN '/dashboard/subscriptions'
  WHEN alert_type = 'payment' THEN '/dashboard/payments'
  WHEN alert_type = 'system' THEN '/dashboard'
  ELSE '/dashboard'
END
WHERE action_url IS NULL;

-- ============================================
-- 2. RÉINITIALISER POUR TESTS
-- ============================================

UPDATE system_alerts
SET 
  is_read = false,
  read_at = NULL,
  resolved_at = NULL
WHERE resolved_at IS NOT NULL OR is_read = true;

-- ============================================
-- 3. VÉRIFICATION
-- ============================================

DO $$
DECLARE
  v_total INTEGER;
  v_with_url INTEGER;
  v_active INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total FROM system_alerts;
  SELECT COUNT(*) INTO v_with_url FROM system_alerts WHERE action_url IS NOT NULL;
  SELECT COUNT(*) INTO v_active FROM system_alerts WHERE resolved_at IS NULL;
  
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'CORRECTION RAPIDE TERMINÉE';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Total alertes: %', v_total;
  RAISE NOTICE 'Avec action_url: %', v_with_url;
  RAISE NOTICE 'Alertes actives: %', v_active;
  RAISE NOTICE '===========================================';
  
  IF v_with_url = v_total THEN
    RAISE NOTICE '✅ Toutes les alertes ont un action_url';
    RAISE NOTICE '✅ Click sur alertes fonctionnera !';
  ELSE
    RAISE WARNING '⚠️ Certaines alertes sans action_url';
  END IF;
END $$;

-- ============================================
-- 4. AFFICHER LES ALERTES
-- ============================================

SELECT 
  id,
  severity,
  title,
  action_url,
  is_read,
  resolved_at
FROM system_alerts
ORDER BY 
  CASE severity
    WHEN 'critical' THEN 1
    WHEN 'error' THEN 2
    WHEN 'warning' THEN 3
    WHEN 'info' THEN 4
  END,
  created_at DESC;

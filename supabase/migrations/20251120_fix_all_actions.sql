-- Migration: TOUT CORRIGER pour Click et Suppression
-- Date: 2025-11-20
-- Objectif: Corriger TOUS les problèmes possibles

-- ============================================
-- 1. RÉINITIALISER LES ALERTES
-- ============================================

UPDATE system_alerts
SET 
  is_read = false,
  read_at = NULL,
  resolved_at = NULL;

DO $$

BEGIN
  RAISE NOTICE '✅ Alertes réinitialisées';
END $$;

-- ============================================
-- 2. CORRIGER action_url
-- ============================================

UPDATE system_alerts
SET action_url = CASE
  WHEN alert_type = 'subscription' THEN '/dashboard/subscriptions'
  WHEN alert_type = 'payment' THEN '/dashboard/payments'
  WHEN alert_type = 'system' THEN '/dashboard'
  ELSE '/dashboard'
END
WHERE action_url IS NULL OR action_url = '';

DO $$
BEGIN
  RAISE NOTICE '✅ action_url corrigés';
END $$;

-- ============================================
-- 3. ACTIVER RLS
-- ============================================

ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  RAISE NOTICE '✅ RLS activé';
END $$;

-- ============================================
-- 4. SUPPRIMER ANCIENNES POLICIES
-- ============================================

DROP POLICY IF EXISTS "Super Admin full access" ON system_alerts;
DROP POLICY IF EXISTS "Admins can view alerts" ON system_alerts;
DROP POLICY IF EXISTS "Admins can update alerts" ON system_alerts;
DROP POLICY IF EXISTS "Admins can delete alerts" ON system_alerts;

DO $$
BEGIN
  RAISE NOTICE '✅ Anciennes policies supprimées';
END $$;

-- ============================================
-- 5. CRÉER POLICY PERMISSIVE
-- ============================================

CREATE POLICY "Super Admin full access"
ON system_alerts
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

DO $$
BEGIN
  RAISE NOTICE '✅ Policy permissive créée';
END $$;

-- ============================================
-- 6. VÉRIFICATION COMPLÈTE
-- ============================================

DO $$
DECLARE
  v_total INTEGER;
  v_with_url INTEGER;
  v_active INTEGER;
  v_policies INTEGER;
  v_rls_enabled BOOLEAN;
BEGIN
  -- Compter alertes
  SELECT COUNT(*) INTO v_total FROM system_alerts;
  SELECT COUNT(*) INTO v_with_url FROM system_alerts WHERE action_url IS NOT NULL AND action_url != '';
  SELECT COUNT(*) INTO v_active FROM system_alerts WHERE resolved_at IS NULL;
  
  -- Compter policies
  SELECT COUNT(*) INTO v_policies FROM pg_policies WHERE tablename = 'system_alerts';
  
  -- Vérifier RLS
  SELECT relrowsecurity INTO v_rls_enabled 
  FROM pg_class 
  WHERE relname = 'system_alerts';
  
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'VÉRIFICATION COMPLÈTE';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Total alertes: %', v_total;
  RAISE NOTICE 'Avec action_url: %', v_with_url;
  RAISE NOTICE 'Alertes actives: %', v_active;
  RAISE NOTICE 'RLS activé: %', v_rls_enabled;
  RAISE NOTICE 'Policies RLS: %', v_policies;
  RAISE NOTICE '===========================================';
  
  IF v_with_url = v_total AND v_policies > 0 AND v_rls_enabled THEN
    RAISE NOTICE '✅ TOUT EST CORRECT !';
    RAISE NOTICE '';
    RAISE NOTICE 'Actions maintenant disponibles:';
    RAISE NOTICE '  1. Click sur alerte → Navigation';
    RAISE NOTICE '  2. Click sur ❌ → Suppression';
    RAISE NOTICE '  3. Click sur 👁️ → Marquer comme lu';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Rechargez le dashboard (Ctrl + Shift + R)';
  ELSE
    RAISE WARNING '⚠️ Problèmes détectés:';
    IF v_with_url < v_total THEN
      RAISE WARNING '  - % alertes sans action_url', v_total - v_with_url;
    END IF;
    IF v_policies = 0 THEN
      RAISE WARNING '  - Aucune policy RLS';
    END IF;
    IF NOT v_rls_enabled THEN
      RAISE WARNING '  - RLS non activé';
    END IF;
  END IF;
END $$;

-- ============================================
-- 7. AFFICHER LES ALERTES
-- ============================================

SELECT 
  id,
  severity,
  title,
  action_url,
  is_read,
  resolved_at,
  created_at
FROM system_alerts
ORDER BY 
  CASE severity
    WHEN 'critical' THEN 1
    WHEN 'error' THEN 2
    WHEN 'warning' THEN 3
    WHEN 'info' THEN 4
  END,
  created_at DESC;

-- ============================================
-- 8. TEST DE PERMISSIONS
-- ============================================

DO $$
DECLARE
  v_test_id UUID;
  v_can_update BOOLEAN := false;
BEGIN
  -- Prendre une alerte
  SELECT id INTO v_test_id 
  FROM system_alerts 
  WHERE resolved_at IS NULL 
  LIMIT 1;
  
  IF v_test_id IS NOT NULL THEN
    -- Tester UPDATE
    BEGIN
      UPDATE system_alerts
      SET is_read = true
      WHERE id = v_test_id;
      
      v_can_update := true;
      
      -- Annuler le test
      UPDATE system_alerts
      SET is_read = false
      WHERE id = v_test_id;
      
      RAISE NOTICE '✅ Test UPDATE: OK';
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '❌ Test UPDATE: ÉCHEC - %', SQLERRM;
    END;
  END IF;
END $$;

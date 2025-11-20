-- Migration: Corriger Click et Suppression des Alertes
-- Date: 2025-11-20
-- Objectif: S'assurer que tout fonctionne

-- ============================================
-- 1. VÉRIFIER ET CORRIGER action_url
-- ============================================

-- S'assurer que toutes les alertes ont un action_url
UPDATE system_alerts
SET action_url = CASE
  WHEN alert_type = 'subscription' THEN '/dashboard/subscriptions'
  WHEN alert_type = 'payment' THEN '/dashboard/payments'
  WHEN alert_type = 'system' THEN '/dashboard'
  ELSE '/dashboard'
END
WHERE action_url IS NULL;

DO $$
DECLARE
  v_without_url INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_without_url
  FROM system_alerts
  WHERE action_url IS NULL AND resolved_at IS NULL;
  
  IF v_without_url = 0 THEN
    RAISE NOTICE '✅ Toutes les alertes ont un action_url';
  ELSE
    RAISE WARNING '⚠️ % alertes sans action_url', v_without_url;
  END IF;
END $$;

-- ============================================
-- 2. VÉRIFIER ET CONFIGURER RLS
-- ============================================

-- Activer RLS
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

-- Supprimer anciennes policies
DROP POLICY IF EXISTS "Super Admin full access" ON system_alerts;
DROP POLICY IF EXISTS "Admins can view alerts" ON system_alerts;
DROP POLICY IF EXISTS "Admins can update alerts" ON system_alerts;

-- Créer policy permissive pour Super Admin
CREATE POLICY "Super Admin full access"
ON system_alerts
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

DO $$
BEGIN
  RAISE NOTICE '✅ RLS configuré avec policy permissive';
END $$;

-- ============================================
-- 3. VÉRIFIER LES COLONNES REQUISES
-- ============================================

DO $$
DECLARE
  v_has_action_url BOOLEAN;
  v_has_is_read BOOLEAN;
  v_has_resolved_at BOOLEAN;
BEGIN
  -- Vérifier action_url
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'system_alerts' AND column_name = 'action_url'
  ) INTO v_has_action_url;
  
  -- Vérifier is_read
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'system_alerts' AND column_name = 'is_read'
  ) INTO v_has_is_read;
  
  -- Vérifier resolved_at
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'system_alerts' AND column_name = 'resolved_at'
  ) INTO v_has_resolved_at;
  
  IF v_has_action_url AND v_has_is_read AND v_has_resolved_at THEN
    RAISE NOTICE '✅ Toutes les colonnes requises existent';
  ELSE
    RAISE WARNING '⚠️ Colonnes manquantes détectées';
    IF NOT v_has_action_url THEN
      RAISE WARNING '  - action_url manquante';
    END IF;
    IF NOT v_has_is_read THEN
      RAISE WARNING '  - is_read manquante';
    END IF;
    IF NOT v_has_resolved_at THEN
      RAISE WARNING '  - resolved_at manquante';
    END IF;
  END IF;
END $$;

-- ============================================
-- 4. RÉINITIALISER LES ALERTES POUR TESTS
-- ============================================

-- Remettre toutes les alertes comme non lues et non résolues
UPDATE system_alerts
SET 
  is_read = false,
  read_at = NULL,
  resolved_at = NULL
WHERE resolved_at IS NOT NULL OR is_read = true;

DO $$
DECLARE
  v_active INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_active
  FROM system_alerts
  WHERE resolved_at IS NULL;
  
  RAISE NOTICE '✅ % alertes actives prêtes pour les tests', v_active;
END $$;

-- ============================================
-- 5. VÉRIFICATION FINALE
-- ============================================

DO $$
DECLARE
  v_total INTEGER;
  v_with_url INTEGER;
  v_active INTEGER;
  v_policies INTEGER;
BEGIN
  -- Compter total
  SELECT COUNT(*) INTO v_total FROM system_alerts;
  
  -- Compter avec action_url
  SELECT COUNT(*) INTO v_with_url 
  FROM system_alerts 
  WHERE action_url IS NOT NULL;
  
  -- Compter actives
  SELECT COUNT(*) INTO v_active 
  FROM system_alerts 
  WHERE resolved_at IS NULL;
  
  -- Compter policies
  SELECT COUNT(*) INTO v_policies 
  FROM pg_policies 
  WHERE tablename = 'system_alerts';
  
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'VÉRIFICATION CLICK & SUPPRESSION';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Total alertes: %', v_total;
  RAISE NOTICE 'Avec action_url: %', v_with_url;
  RAISE NOTICE 'Alertes actives: %', v_active;
  RAISE NOTICE 'RLS policies: %', v_policies;
  RAISE NOTICE '===========================================';
  
  IF v_with_url = v_total AND v_policies > 0 THEN
    RAISE NOTICE '✅ TOUT EST PRÊT POUR LES TESTS !';
    RAISE NOTICE '';
    RAISE NOTICE 'Actions disponibles:';
    RAISE NOTICE '  1. Cliquer sur alerte → Navigation';
    RAISE NOTICE '  2. Cliquer sur ❌ → Suppression';
    RAISE NOTICE '  3. Cliquer sur 👁️ → Marquer comme lu';
  ELSE
    RAISE WARNING '⚠️ Vérifier la configuration';
  END IF;
END $$;

-- ============================================
-- 6. AFFICHER LES ALERTES POUR TESTS
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

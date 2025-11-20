-- Migration: Nettoyer les alertes et triggers incorrects
-- Date: 2025-11-20
-- Contexte: Supprimer alertes écoles/users (hors scope Super Admin)

-- ============================================
-- 1. SUPPRIMER LES MAUVAISES ALERTES
-- ============================================

-- Supprimer alertes "École sans directeur"
DELETE FROM system_alerts
WHERE alert_type = 'school'
  AND category = 'missing_director';

-- Supprimer alertes "Utilisateur bloqué"
DELETE FROM system_alerts
WHERE alert_type = 'security'
  AND category = 'account_locked';

-- Supprimer toutes alertes liées aux écoles individuelles
DELETE FROM system_alerts
WHERE entity_type = 'school';

-- Supprimer toutes alertes liées aux utilisateurs
DELETE FROM system_alerts
WHERE entity_type = 'user';

-- ============================================
-- 2. SUPPRIMER LES MAUVAIS TRIGGERS
-- ============================================

-- Supprimer trigger "École sans directeur"
DROP TRIGGER IF EXISTS school_without_director_alert ON schools;
DROP FUNCTION IF EXISTS check_school_without_director();

-- Supprimer trigger "Utilisateur bloqué"
DROP TRIGGER IF EXISTS user_locked_alert ON users;
DROP FUNCTION IF EXISTS check_user_locked();

-- ============================================
-- 3. VÉRIFICATION
-- ============================================

DO $$
DECLARE
  v_remaining_alerts INTEGER;
  v_school_alerts INTEGER;
  v_user_alerts INTEGER;
BEGIN
  -- Compter alertes restantes
  SELECT COUNT(*) INTO v_remaining_alerts
  FROM system_alerts
  WHERE resolved_at IS NULL;
  
  -- Compter alertes écoles (devrait être 0)
  SELECT COUNT(*) INTO v_school_alerts
  FROM system_alerts
  WHERE entity_type = 'school' AND resolved_at IS NULL;
  
  -- Compter alertes users (devrait être 0)
  SELECT COUNT(*) INTO v_user_alerts
  FROM system_alerts
  WHERE entity_type = 'user' AND resolved_at IS NULL;
  
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'NETTOYAGE TERMINÉ:';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Alertes actives restantes: %', v_remaining_alerts;
  RAISE NOTICE 'Alertes écoles (devrait être 0): %', v_school_alerts;
  RAISE NOTICE 'Alertes users (devrait être 0): %', v_user_alerts;
  RAISE NOTICE '===========================================';
  
  IF v_school_alerts > 0 OR v_user_alerts > 0 THEN
    RAISE WARNING 'ATTENTION: Des alertes écoles/users existent encore!';
  ELSE
    RAISE NOTICE '✅ Toutes les alertes incorrectes ont été supprimées';
  END IF;
END $$;

-- ============================================
-- 4. AFFICHER LES ALERTES RESTANTES
-- ============================================

SELECT 
  alert_type,
  severity,
  category,
  title,
  entity_type,
  created_at
FROM system_alerts
WHERE resolved_at IS NULL
ORDER BY 
  CASE severity
    WHEN 'critical' THEN 1
    WHEN 'error' THEN 2
    WHEN 'warning' THEN 3
    WHEN 'info' THEN 4
  END,
  created_at DESC;

-- DIAGNOSTIC COMPLET: Identifier le problème
-- Date: 2025-11-20

-- ============================================
-- 1. VÉRIFIER QUE LA TABLE EXISTE
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_alerts') THEN
    RAISE NOTICE '✅ Table system_alerts existe';
  ELSE
    RAISE WARNING '❌ Table system_alerts N''EXISTE PAS !';
  END IF;
END $$;

-- ============================================
-- 2. COMPTER LES ALERTES
-- ============================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM system_alerts;
  RAISE NOTICE 'Nombre total d''alertes: %', v_count;
  
  IF v_count = 0 THEN
    RAISE WARNING '❌ AUCUNE ALERTE dans la table !';
  END IF;
END $$;

-- ============================================
-- 3. VÉRIFIER LES COLONNES
-- ============================================

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'system_alerts'
ORDER BY ordinal_position;

-- ============================================
-- 4. AFFICHER TOUTES LES ALERTES
-- ============================================

SELECT 
  id,
  alert_type,
  severity,
  title,
  action_url,
  is_read,
  resolved_at,
  created_at
FROM system_alerts
ORDER BY created_at DESC;

-- ============================================
-- 5. VÉRIFIER RLS
-- ============================================

DO $$
DECLARE
  v_rls_enabled BOOLEAN;
BEGIN
  SELECT relrowsecurity INTO v_rls_enabled 
  FROM pg_class 
  WHERE relname = 'system_alerts';
  
  IF v_rls_enabled THEN
    RAISE NOTICE '✅ RLS est activé';
  ELSE
    RAISE WARNING '❌ RLS N''EST PAS activé !';
  END IF;
END $$;

-- ============================================
-- 6. VÉRIFIER LES POLICIES
-- ============================================

SELECT 
  policyname,
  cmd,
  qual::text as using_clause,
  with_check::text as with_check_clause
FROM pg_policies
WHERE tablename = 'system_alerts';

-- ============================================
-- 7. COMPTER PAR STATUT
-- ============================================

SELECT 
  'Actives (resolved_at IS NULL)' as statut,
  COUNT(*) as count
FROM system_alerts
WHERE resolved_at IS NULL

UNION ALL

SELECT 
  'Résolues (resolved_at NOT NULL)',
  COUNT(*)
FROM system_alerts
WHERE resolved_at IS NOT NULL

UNION ALL

SELECT 
  'Lues (is_read = true)',
  COUNT(*)
FROM system_alerts
WHERE is_read = true

UNION ALL

SELECT 
  'Non lues (is_read = false)',
  COUNT(*)
FROM system_alerts
WHERE is_read = false

UNION ALL

SELECT 
  'Avec action_url',
  COUNT(*)
FROM system_alerts
WHERE action_url IS NOT NULL AND action_url != '';

-- ============================================
-- 8. RÉSUMÉ FINAL
-- ============================================

DO $$
DECLARE
  v_total INTEGER;
  v_active INTEGER;
  v_with_url INTEGER;
  v_policies INTEGER;
  v_rls BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO v_total FROM system_alerts;
  SELECT COUNT(*) INTO v_active FROM system_alerts WHERE resolved_at IS NULL;
  SELECT COUNT(*) INTO v_with_url FROM system_alerts WHERE action_url IS NOT NULL;
  SELECT COUNT(*) INTO v_policies FROM pg_policies WHERE tablename = 'system_alerts';
  SELECT relrowsecurity INTO v_rls FROM pg_class WHERE relname = 'system_alerts';
  
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'DIAGNOSTIC COMPLET';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Total alertes: %', v_total;
  RAISE NOTICE 'Alertes actives: %', v_active;
  RAISE NOTICE 'Avec action_url: %', v_with_url;
  RAISE NOTICE 'RLS activé: %', v_rls;
  RAISE NOTICE 'Policies RLS: %', v_policies;
  RAISE NOTICE '===========================================';
  
  -- Diagnostics
  IF v_total = 0 THEN
    RAISE WARNING '❌ PROBLÈME: Aucune alerte dans la table !';
    RAISE NOTICE 'SOLUTION: Exécuter 20251120_setup_complete_alerts.sql';
  ELSIF v_with_url = 0 THEN
    RAISE WARNING '❌ PROBLÈME: Aucune alerte n''a d''action_url !';
    RAISE NOTICE 'SOLUTION: Exécuter UPDATE pour corriger action_url';
  ELSIF v_policies = 0 THEN
    RAISE WARNING '❌ PROBLÈME: Aucune policy RLS !';
    RAISE NOTICE 'SOLUTION: Créer policy RLS';
  ELSIF NOT v_rls THEN
    RAISE WARNING '❌ PROBLÈME: RLS non activé !';
    RAISE NOTICE 'SOLUTION: ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY';
  ELSE
    RAISE NOTICE '✅ Base de données OK !';
    RAISE NOTICE 'Si les actions ne marchent pas, le problème est dans le frontend.';
  END IF;
END $$;

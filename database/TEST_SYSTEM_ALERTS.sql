-- =====================================================
-- SCRIPT DE TEST - SYSTÈME D'ALERTES
-- =====================================================
-- Génère des alertes de test pour vérifier le système
-- Date: 6 novembre 2025
-- =====================================================

-- 1. VÉRIFIER LES ALERTES EXISTANTES
-- =====================================================

SELECT 
  COUNT(*) as total_alerts,
  COUNT(*) FILTER (WHERE severity = 'critical') as critical,
  COUNT(*) FILTER (WHERE severity = 'error') as error,
  COUNT(*) FILTER (WHERE severity = 'warning') as warning,
  COUNT(*) FILTER (WHERE severity = 'info') as info,
  COUNT(*) FILTER (WHERE is_read = false) as unread,
  COUNT(*) FILTER (WHERE resolved_at IS NULL) as unresolved
FROM public.system_alerts;

-- 2. GÉNÉRER DES ALERTES DE TEST
-- =====================================================

-- Alerte critique : Abonnement expirant
SELECT public.create_system_alert(
  'subscription',
  'critical',
  'Abonnement expirant dans 1 jour',
  'L''abonnement du Groupe Scolaire Test expire demain',
  'subscription',
  gen_random_uuid(),
  'Groupe Scolaire Test',
  true,
  '/dashboard/subscriptions',
  (SELECT id FROM public.school_groups LIMIT 1),
  NULL,
  jsonb_build_object('days_remaining', 1)
);

-- Alerte erreur : Paiements en retard
SELECT public.create_system_alert(
  'payment',
  'error',
  '8 paiement(s) en retard',
  'École Primaire Test - Total: 2500000 FCFA',
  'school',
  (SELECT id FROM public.schools LIMIT 1),
  'École Primaire Test',
  true,
  format('/dashboard/finances/ecole/%s', (SELECT id FROM public.schools LIMIT 1)),
  (SELECT school_group_id FROM public.schools LIMIT 1),
  (SELECT id FROM public.schools LIMIT 1),
  jsonb_build_object('overdue_count', 8, 'overdue_amount', 2500000)
);

-- Alerte warning : Utilisateurs inactifs
SELECT public.create_system_alert(
  'user',
  'warning',
  '12 utilisateur(s) inactif(s)',
  'Groupe Scolaire Test - Pas de connexion depuis 30 jours',
  'school_group',
  (SELECT id FROM public.school_groups LIMIT 1),
  'Groupe Scolaire Test',
  false,
  '/dashboard/users',
  (SELECT id FROM public.school_groups LIMIT 1),
  NULL,
  jsonb_build_object('inactive_count', 12)
);

-- Alerte info : Mise à jour disponible
SELECT public.create_system_alert(
  'system',
  'info',
  'Mise à jour disponible',
  'Une nouvelle version de E-Pilot est disponible (v2.1.0)',
  'system',
  NULL,
  NULL,
  false,
  '/dashboard/settings',
  NULL,
  NULL,
  jsonb_build_object('version', '2.1.0')
);

-- 3. VÉRIFIER LES ALERTES CRÉÉES
-- =====================================================

SELECT 
  id,
  type,
  severity,
  title,
  message,
  entity_name,
  is_read,
  resolved_at,
  created_at
FROM public.system_alerts
ORDER BY created_at DESC
LIMIT 10;

-- 4. TESTER LA GÉNÉRATION AUTOMATIQUE
-- =====================================================

-- Exécuter la vérification de toutes les alertes
SELECT public.check_all_alerts();

-- Vérifier les nouvelles alertes
SELECT 
  type,
  severity,
  COUNT(*) as count
FROM public.system_alerts
WHERE created_at > NOW() - INTERVAL '5 minutes'
GROUP BY type, severity
ORDER BY severity, type;

-- 5. TESTER LA RÉSOLUTION AUTOMATIQUE
-- =====================================================

-- Résoudre les alertes obsolètes
SELECT public.auto_resolve_alerts();

-- Compter les alertes résolues
SELECT 
  COUNT(*) as resolved_count
FROM public.system_alerts
WHERE resolved_at IS NOT NULL
  AND resolved_at > NOW() - INTERVAL '5 minutes';

-- 6. TESTER LES VUES
-- =====================================================

-- Vue des alertes non lues
SELECT * FROM public.unread_alerts LIMIT 5;

-- Statistiques par groupe
SELECT * FROM public.alert_stats_by_group;

-- 7. TESTER LES FILTRES
-- =====================================================

-- Alertes critiques non résolues
SELECT COUNT(*) as critical_unresolved
FROM public.system_alerts
WHERE severity = 'critical'
  AND resolved_at IS NULL;

-- Alertes par type
SELECT 
  type,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE is_read = false) as unread
FROM public.system_alerts
WHERE resolved_at IS NULL
GROUP BY type
ORDER BY count DESC;

-- Alertes par école
SELECT 
  s.name as school_name,
  COUNT(sa.id) as alert_count,
  COUNT(*) FILTER (WHERE sa.severity = 'critical') as critical
FROM public.schools s
LEFT JOIN public.system_alerts sa ON sa.school_id = s.id
  AND sa.resolved_at IS NULL
GROUP BY s.id, s.name
ORDER BY alert_count DESC
LIMIT 10;

-- 8. TESTER LA PERFORMANCE
-- =====================================================

-- Temps d'exécution de check_all_alerts
EXPLAIN ANALYZE SELECT public.check_all_alerts();

-- Index utilisés
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename = 'system_alerts'
ORDER BY idx_scan DESC;

-- 9. NETTOYER LES ALERTES DE TEST
-- =====================================================

-- Marquer toutes les alertes de test comme résolues
UPDATE public.system_alerts
SET resolved_at = NOW()
WHERE title LIKE '%Test%'
  OR message LIKE '%Test%';

-- Supprimer les alertes de test (optionnel)
-- DELETE FROM public.system_alerts WHERE title LIKE '%Test%';

-- 10. RÉSUMÉ FINAL
-- =====================================================

SELECT 
  '=== RÉSUMÉ DES ALERTES ===' as section,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE severity = 'critical') as critical,
  COUNT(*) FILTER (WHERE severity = 'error') as error,
  COUNT(*) FILTER (WHERE severity = 'warning') as warning,
  COUNT(*) FILTER (WHERE severity = 'info') as info,
  COUNT(*) FILTER (WHERE is_read = false) as unread,
  COUNT(*) FILTER (WHERE resolved_at IS NULL) as active,
  COUNT(*) FILTER (WHERE resolved_at IS NOT NULL) as resolved
FROM public.system_alerts;

-- =====================================================
-- FIN DU SCRIPT DE TEST
-- =====================================================

-- Pour exécuter ce script:
-- psql -h [HOST] -U [USER] -d [DATABASE] -f database/TEST_SYSTEM_ALERTS.sql

-- Ou via Supabase SQL Editor:
-- 1. Copier-coller ce script
-- 2. Exécuter section par section
-- 3. Vérifier les résultats

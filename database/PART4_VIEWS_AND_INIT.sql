-- =====================================================
-- PARTIE 4/4 : VUES ET INITIALISATION
-- =====================================================

-- 1. VUE: Alertes non lues
-- =====================================================

CREATE OR REPLACE VIEW public.unread_alerts AS
SELECT 
  sa.*,
  CASE 
    WHEN sa.created_at > NOW() - INTERVAL '1 hour' THEN 'recent'
    WHEN sa.created_at > NOW() - INTERVAL '24 hours' THEN 'today'
    ELSE 'older'
  END as age_category,
  EXTRACT(EPOCH FROM (NOW() - sa.created_at))::INTEGER as age_seconds
FROM public.system_alerts sa
WHERE sa.is_read = false
  AND sa.resolved_at IS NULL
ORDER BY 
  CASE sa.severity
    WHEN 'critical' THEN 1
    WHEN 'error' THEN 2
    WHEN 'warning' THEN 3
    ELSE 4
  END,
  sa.created_at DESC;

-- 2. VUE: Statistiques alertes par groupe
-- =====================================================

CREATE OR REPLACE VIEW public.alert_stats_by_group AS
SELECT 
  sg.id as school_group_id,
  sg.name as school_group_name,
  COUNT(*) FILTER (WHERE sa.severity = 'critical') as critical_count,
  COUNT(*) FILTER (WHERE sa.severity = 'error') as error_count,
  COUNT(*) FILTER (WHERE sa.severity = 'warning') as warning_count,
  COUNT(*) FILTER (WHERE sa.severity = 'info') as info_count,
  COUNT(*) FILTER (WHERE sa.is_read = false) as unread_count,
  COUNT(*) as total_count,
  MAX(sa.created_at) as last_alert_at
FROM public.school_groups sg
LEFT JOIN public.system_alerts sa ON sa.school_group_id = sg.id
  AND sa.resolved_at IS NULL
GROUP BY sg.id, sg.name;

-- 3. VUE: Résumé des alertes
-- =====================================================

CREATE OR REPLACE VIEW public.alert_summary AS
SELECT 
  COUNT(*) as total_alerts,
  COUNT(*) FILTER (WHERE severity = 'critical') as critical,
  COUNT(*) FILTER (WHERE severity = 'error') as error,
  COUNT(*) FILTER (WHERE severity = 'warning') as warning,
  COUNT(*) FILTER (WHERE severity = 'info') as info,
  COUNT(*) FILTER (WHERE is_read = false) as unread,
  COUNT(*) FILTER (WHERE resolved_at IS NULL) as active,
  COUNT(*) FILTER (WHERE resolved_at IS NOT NULL) as resolved,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as last_24h,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') as last_hour
FROM public.system_alerts;

-- 4. INITIALISATION: Générer les alertes actuelles
-- =====================================================

SELECT * FROM public.check_all_alerts();

-- 5. AFFICHER LE RÉSUMÉ
-- =====================================================

SELECT * FROM public.alert_summary;

-- 6. COMMENTAIRES
-- =====================================================

COMMENT ON TABLE public.system_alerts IS 'Système d''alertes temps réel professionnel - Niveau mondial';
COMMENT ON FUNCTION public.create_system_alert IS 'Créer une alerte système (évite les doublons automatiquement)';
COMMENT ON FUNCTION public.check_all_alerts IS 'Vérifier toutes les sources d''alertes et retourner les compteurs';
COMMENT ON FUNCTION public.auto_resolve_alerts IS 'Résoudre automatiquement les alertes obsolètes';
COMMENT ON VIEW public.unread_alerts IS 'Vue des alertes non lues triées par priorité';
COMMENT ON VIEW public.alert_stats_by_group IS 'Statistiques des alertes par groupe scolaire';
COMMENT ON VIEW public.alert_summary IS 'Résumé global des alertes';

SELECT '✅ PARTIE 4/4 : Vues créées et alertes générées !' as status,
       (SELECT COUNT(*) FROM public.system_alerts WHERE resolved_at IS NULL) as alertes_actives;

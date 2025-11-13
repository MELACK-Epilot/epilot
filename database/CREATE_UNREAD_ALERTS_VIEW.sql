-- ============================================
-- CRÉER LA VUE unread_alerts
-- ============================================

-- Supprimer la vue si elle existe
DROP VIEW IF EXISTS unread_alerts CASCADE;

-- Créer la vue pour les alertes non lues
CREATE VIEW unread_alerts AS
SELECT 
  sa.*,
  sg.name AS school_group_name,
  s.name AS school_name
FROM system_alerts sa
LEFT JOIN school_groups sg ON sa.school_group_id = sg.id
LEFT JOIN schools s ON sa.school_id = s.id
WHERE sa.is_read = FALSE
ORDER BY sa.created_at DESC;

-- Désactiver RLS sur la vue
ALTER VIEW unread_alerts SET (security_invoker = false);

-- ============================================
-- FIN
-- ============================================

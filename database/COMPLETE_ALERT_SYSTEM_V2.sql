-- =====================================================
-- SYSTÈME D'ALERTES COMPLET V2 - NIVEAU MONDIAL
-- =====================================================
-- Système d'alertes temps réel professionnel
-- Supprime et recrée tout proprement
-- Date: 6 novembre 2025
-- =====================================================

-- 1. NETTOYAGE COMPLET
-- =====================================================

-- Supprimer les vues
DROP VIEW IF EXISTS public.unread_alerts CASCADE;
DROP VIEW IF EXISTS public.alert_stats_by_group CASCADE;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS public.create_system_alert CASCADE;
DROP FUNCTION IF EXISTS public.check_subscription_alerts CASCADE;
DROP FUNCTION IF EXISTS public.check_payment_alerts CASCADE;
DROP FUNCTION IF EXISTS public.check_user_alerts CASCADE;
DROP FUNCTION IF EXISTS public.check_all_alerts CASCADE;
DROP FUNCTION IF EXISTS public.auto_resolve_alerts CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_old_alerts CASCADE;

-- Supprimer la table
DROP TABLE IF EXISTS public.system_alerts CASCADE;

-- 2. CRÉATION TABLE SYSTEM_ALERTS
-- =====================================================

CREATE TABLE public.system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Classification
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('subscription', 'payment', 'user', 'school', 'system', 'security', 'performance')),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'error', 'warning', 'info')),
  category VARCHAR(50),
  
  -- Contenu
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Entité concernée
  entity_type VARCHAR(50),
  entity_id UUID,
  entity_name TEXT,
  
  -- Action
  action_required BOOLEAN DEFAULT false,
  action_url TEXT,
  action_label VARCHAR(100),
  
  -- Contexte
  school_group_id UUID REFERENCES public.school_groups(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  
  -- État
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  read_by UUID REFERENCES public.users(id),
  
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.users(id),
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX idx_alerts_school_group ON public.system_alerts(school_group_id) WHERE resolved_at IS NULL;
CREATE INDEX idx_alerts_school ON public.system_alerts(school_id) WHERE resolved_at IS NULL;
CREATE INDEX idx_alerts_severity ON public.system_alerts(severity) WHERE resolved_at IS NULL;
CREATE INDEX idx_alerts_type ON public.system_alerts(alert_type) WHERE resolved_at IS NULL;
CREATE INDEX idx_alerts_unread ON public.system_alerts(is_read) WHERE is_read = false AND resolved_at IS NULL;
CREATE INDEX idx_alerts_created_at ON public.system_alerts(created_at DESC);
CREATE INDEX idx_alerts_entity ON public.system_alerts(entity_type, entity_id) WHERE resolved_at IS NULL;

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_system_alerts_updated_at
  BEFORE UPDATE ON public.system_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 3. RLS (Row Level Security)
-- =====================================================

ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

-- Super Admin voit tout
CREATE POLICY "Super Admin can view all alerts"
  ON public.system_alerts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Admin Groupe voit les alertes de son groupe
CREATE POLICY "Admin Groupe can view group alerts"
  ON public.system_alerts FOR SELECT
  TO authenticated
  USING (
    school_group_id IN (
      SELECT school_group_id FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin_groupe'
    )
  );

-- Directeur voit les alertes de son école
CREATE POLICY "Directeur can view school alerts"
  ON public.system_alerts FOR SELECT
  TO authenticated
  USING (
    school_id IN (
      SELECT school_id FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'directeur'
    )
  );

-- Tous peuvent marquer comme lu/résolu
CREATE POLICY "Users can update alerts"
  ON public.system_alerts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin_groupe', 'directeur')
    )
  );

-- 4. FONCTION: Créer une alerte
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_system_alert(
  p_alert_type VARCHAR,
  p_severity VARCHAR,
  p_title TEXT,
  p_message TEXT,
  p_entity_type VARCHAR DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_entity_name TEXT DEFAULT NULL,
  p_action_required BOOLEAN DEFAULT false,
  p_action_url TEXT DEFAULT NULL,
  p_action_label VARCHAR DEFAULT 'Voir détails',
  p_school_group_id UUID DEFAULT NULL,
  p_school_id UUID DEFAULT NULL,
  p_category VARCHAR DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_alert_id UUID;
BEGIN
  -- Vérifier si une alerte similaire existe déjà (éviter les doublons)
  SELECT id INTO v_alert_id
  FROM public.system_alerts
  WHERE alert_type = p_alert_type
    AND entity_type = p_entity_type
    AND entity_id = p_entity_id
    AND resolved_at IS NULL
    AND created_at > NOW() - INTERVAL '24 hours'
  LIMIT 1;
  
  -- Si l'alerte existe déjà, la retourner
  IF v_alert_id IS NOT NULL THEN
    RETURN v_alert_id;
  END IF;
  
  -- Créer la nouvelle alerte
  INSERT INTO public.system_alerts (
    alert_type,
    severity,
    title,
    message,
    entity_type,
    entity_id,
    entity_name,
    action_required,
    action_url,
    action_label,
    school_group_id,
    school_id,
    category,
    metadata
  ) VALUES (
    p_alert_type,
    p_severity,
    p_title,
    p_message,
    p_entity_type,
    p_entity_id,
    p_entity_name,
    p_action_required,
    p_action_url,
    p_action_label,
    p_school_group_id,
    p_school_id,
    p_category,
    p_metadata
  )
  RETURNING id INTO v_alert_id;
  
  RETURN v_alert_id;
END;
$$;

-- 5. FONCTION: Vérifier alertes abonnements
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_subscription_alerts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subscription RECORD;
  v_days_remaining INTEGER;
  v_count INTEGER := 0;
BEGIN
  -- Abonnements expirant dans moins de 7 jours
  FOR v_subscription IN
    SELECT 
      s.id,
      s.school_group_id,
      s.end_date,
      sg.name as group_name,
      EXTRACT(DAY FROM (s.end_date - NOW()))::INTEGER as days_remaining
    FROM public.subscriptions s
    JOIN public.school_groups sg ON s.school_group_id = sg.id
    WHERE s.status = 'active'
      AND s.end_date > NOW()
      AND s.end_date <= NOW() + INTERVAL '7 days'
  LOOP
    v_days_remaining := v_subscription.days_remaining;
    
    PERFORM public.create_system_alert(
      'subscription',
      CASE 
        WHEN v_days_remaining <= 1 THEN 'critical'
        WHEN v_days_remaining <= 3 THEN 'error'
        ELSE 'warning'
      END,
      format('Abonnement expirant dans %s jour(s)', v_days_remaining),
      format('L''abonnement de %s expire le %s', v_subscription.group_name, to_char(v_subscription.end_date, 'DD/MM/YYYY')),
      'subscription',
      v_subscription.id,
      v_subscription.group_name,
      true,
      '/dashboard/subscriptions',
      'Renouveler',
      v_subscription.school_group_id,
      NULL,
      'expiration',
      jsonb_build_object(
        'end_date', v_subscription.end_date,
        'days_remaining', v_days_remaining
      )
    );
    v_count := v_count + 1;
  END LOOP;
  
  -- Abonnements expirés
  FOR v_subscription IN
    SELECT 
      s.id,
      s.school_group_id,
      s.end_date,
      sg.name as group_name
    FROM public.subscriptions s
    JOIN public.school_groups sg ON s.school_group_id = sg.id
    WHERE s.status = 'active'
      AND s.end_date < NOW()
  LOOP
    PERFORM public.create_system_alert(
      'subscription',
      'critical',
      'Abonnement expiré',
      format('L''abonnement de %s a expiré le %s', v_subscription.group_name, to_char(v_subscription.end_date, 'DD/MM/YYYY')),
      'subscription',
      v_subscription.id,
      v_subscription.group_name,
      true,
      '/dashboard/subscriptions',
      'Renouveler maintenant',
      v_subscription.school_group_id,
      NULL,
      'expired',
      jsonb_build_object('end_date', v_subscription.end_date)
    );
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$;

-- 6. FONCTION: Vérifier alertes utilisateurs
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_user_alerts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_group RECORD;
  v_count INTEGER := 0;
BEGIN
  -- Utilisateurs inactifs par groupe (>30 jours sans connexion)
  FOR v_group IN
    SELECT 
      sg.id as group_id,
      sg.name as group_name,
      COUNT(u.id) as inactive_count
    FROM public.school_groups sg
    JOIN public.users u ON u.school_group_id = sg.id
    WHERE u.status = 'inactive'
      OR (u.last_login IS NOT NULL AND u.last_login < NOW() - INTERVAL '30 days')
    GROUP BY sg.id, sg.name
    HAVING COUNT(u.id) >= 5  -- Seulement si au moins 5 utilisateurs inactifs
  LOOP
    PERFORM public.create_system_alert(
      'user',
      CASE 
        WHEN v_group.inactive_count >= 20 THEN 'warning'
        ELSE 'info'
      END,
      format('%s utilisateur(s) inactif(s)', v_group.inactive_count),
      format('%s - Aucune connexion depuis 30 jours ou plus', v_group.group_name),
      'school_group',
      v_group.group_id,
      v_group.group_name,
      false,
      '/dashboard/users',
      'Gérer les utilisateurs',
      v_group.group_id,
      NULL,
      'inactive_users',
      jsonb_build_object('inactive_count', v_group.inactive_count)
    );
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$;

-- 7. FONCTION: Vérifier alertes écoles
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_school_alerts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_school RECORD;
  v_count INTEGER := 0;
BEGIN
  -- Écoles sans directeur assigné
  FOR v_school IN
    SELECT 
      s.id,
      s.name,
      s.school_group_id
    FROM public.schools s
    WHERE NOT EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.school_id = s.id
      AND u.role = 'directeur'
      AND u.status = 'active'
    )
  LOOP
    PERFORM public.create_system_alert(
      'school',
      'warning',
      'École sans directeur',
      format('L''école %s n''a pas de directeur assigné', v_school.name),
      'school',
      v_school.id,
      v_school.name,
      true,
      format('/dashboard/schools/%s', v_school.id),
      'Assigner un directeur',
      v_school.school_group_id,
      v_school.id,
      'no_director',
      jsonb_build_object('school_id', v_school.id)
    );
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$;

-- 8. FONCTION: Vérifier toutes les alertes
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_all_alerts()
RETURNS TABLE(
  alert_type TEXT,
  count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subscription_count INTEGER;
  v_user_count INTEGER;
  v_school_count INTEGER;
BEGIN
  -- Exécuter toutes les vérifications
  v_subscription_count := public.check_subscription_alerts();
  v_user_count := public.check_user_alerts();
  v_school_count := public.check_school_alerts();
  
  -- Retourner les résultats
  RETURN QUERY
  SELECT 'subscriptions'::TEXT, v_subscription_count
  UNION ALL
  SELECT 'users'::TEXT, v_user_count
  UNION ALL
  SELECT 'schools'::TEXT, v_school_count;
END;
$$;

-- 9. FONCTION: Auto-résoudre les alertes obsolètes
-- =====================================================

CREATE OR REPLACE FUNCTION public.auto_resolve_alerts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Résoudre les alertes d'abonnement si l'abonnement est renouvelé
  UPDATE public.system_alerts
  SET resolved_at = NOW()
  WHERE alert_type = 'subscription'
    AND resolved_at IS NULL
    AND entity_id IN (
      SELECT id FROM public.subscriptions
      WHERE status = 'active'
        AND end_date > NOW() + INTERVAL '7 days'
    );
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN v_count;
END;
$$;

-- 10. FONCTION: Nettoyer les vieilles alertes
-- =====================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_alerts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  DELETE FROM public.system_alerts
  WHERE resolved_at IS NOT NULL
    AND resolved_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN v_count;
END;
$$;

-- 11. VUE: Alertes non lues
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

-- 12. VUE: Statistiques alertes par groupe
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

-- 13. VUE: Résumé des alertes
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

-- 14. INITIALISATION: Générer les alertes actuelles
-- =====================================================

SELECT * FROM public.check_all_alerts();

-- 15. AFFICHER LE RÉSUMÉ
-- =====================================================

SELECT * FROM public.alert_summary;

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================

COMMENT ON TABLE public.system_alerts IS 'Système d''alertes temps réel professionnel - Niveau mondial';
COMMENT ON FUNCTION public.create_system_alert IS 'Créer une alerte système (évite les doublons automatiquement)';
COMMENT ON FUNCTION public.check_all_alerts IS 'Vérifier toutes les sources d''alertes et retourner les compteurs';
COMMENT ON FUNCTION public.auto_resolve_alerts IS 'Résoudre automatiquement les alertes obsolètes';
COMMENT ON VIEW public.unread_alerts IS 'Vue des alertes non lues triées par priorité';
COMMENT ON VIEW public.alert_stats_by_group IS 'Statistiques des alertes par groupe scolaire';
COMMENT ON VIEW public.alert_summary IS 'Résumé global des alertes';

SELECT '✅ Système d''alertes complet créé avec succès !' as status,
       (SELECT COUNT(*) FROM public.system_alerts WHERE resolved_at IS NULL) as alertes_actives;

-- =====================================================
-- CRÉATION TABLE SYSTEM_ALERTS + TRIGGERS AUTOMATIQUES
-- =====================================================
-- Système d'alertes temps réel basé sur les données réelles
-- Date: 6 novembre 2025
-- =====================================================

-- 1. TABLE SYSTEM_ALERTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Métadonnées
  "type" VARCHAR(50) NOT NULL CHECK ("type" IN ('subscription', 'payment', 'user', 'school', 'system', 'security', 'performance')),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'error', 'warning', 'info')),
  
  -- Contenu
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Entité concernée
  entity_type VARCHAR(50), -- 'school', 'user', 'subscription', 'payment', etc.
  entity_id UUID,
  entity_name VARCHAR(255),
  
  -- Action
  action_required BOOLEAN DEFAULT false,
  action_url VARCHAR(500),
  
  -- Contexte
  school_group_id UUID REFERENCES public.school_groups(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  
  -- État
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  
  -- Métadonnées additionnelles
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_system_alerts_school_group ON public.system_alerts(school_group_id) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_system_alerts_school ON public.system_alerts(school_id) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_system_alerts_severity ON public.system_alerts(severity) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_system_alerts_type ON public.system_alerts("type") WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_system_alerts_unread ON public.system_alerts(is_read) WHERE is_read = false AND resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_system_alerts_created_at ON public.system_alerts(created_at DESC);

-- RLS
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

-- Policy: Super Admin voit tout
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

-- Policy: Admin Groupe voit les alertes de son groupe
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

-- Policy: Directeur voit les alertes de son école
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

-- Policy: Marquer comme lu
CREATE POLICY "Users can mark alerts as read"
  ON public.system_alerts FOR UPDATE
  TO authenticated
  USING (
    -- Super Admin
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
    OR
    -- Admin Groupe
    (school_group_id IN (
      SELECT school_group_id FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin_groupe'
    ))
    OR
    -- Directeur
    (school_id IN (
      SELECT school_id FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'directeur'
    ))
  );

-- 2. FONCTION: Créer une alerte
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_system_alert(
  p_type VARCHAR,
  p_severity VARCHAR,
  p_title VARCHAR,
  p_message TEXT,
  p_entity_type VARCHAR DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_entity_name VARCHAR DEFAULT NULL,
  p_action_required BOOLEAN DEFAULT false,
  p_action_url VARCHAR DEFAULT NULL,
  p_school_group_id UUID DEFAULT NULL,
  p_school_id UUID DEFAULT NULL,
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
  FROM public.system_alerts sa
  WHERE sa."type" = p_type
    AND sa.entity_type = p_entity_type
    AND sa.entity_id = p_entity_id
    AND sa.resolved_at IS NULL
    AND sa.created_at > NOW() - INTERVAL '24 hours'
  LIMIT 1;
  
  -- Si l'alerte existe déjà, la retourner
  IF v_alert_id IS NOT NULL THEN
    RETURN v_alert_id;
  END IF;
  
  -- Créer la nouvelle alerte
  INSERT INTO public.system_alerts (
    "type",
    severity,
    title,
    message,
    entity_type,
    entity_id,
    entity_name,
    action_required,
    action_url,
    school_group_id,
    school_id,
    metadata
  ) VALUES (
    p_type,
    p_severity,
    p_title,
    p_message,
    p_entity_type,
    p_entity_id,
    p_entity_name,
    p_action_required,
    p_action_url,
    p_school_group_id,
    p_school_id,
    p_metadata
  )
  RETURNING id INTO v_alert_id;
  
  RETURN v_alert_id;
END;
$$;

-- 3. FONCTION: Vérifier et créer alertes abonnements
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_subscription_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subscription RECORD;
  v_days_remaining INTEGER;
BEGIN
  -- Abonnements expirant dans moins de 7 jours
  FOR v_subscription IN
    SELECT 
      s.*,
      sg.name as group_name,
      EXTRACT(DAY FROM (s.end_date - NOW())) as days_remaining
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
      'Abonnement expirant bientôt',
      format('L''abonnement de %s expire dans %s jour(s)', v_subscription.group_name, v_days_remaining),
      'subscription',
      v_subscription.id,
      v_subscription.group_name,
      true,
      '/dashboard/subscriptions',
      v_subscription.school_group_id,
      NULL,
      jsonb_build_object(
        'end_date', v_subscription.end_date,
        'days_remaining', v_days_remaining
      )
    );
  END LOOP;
  
  -- Abonnements expirés
  FOR v_subscription IN
    SELECT 
      s.*,
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
      format('L''abonnement de %s a expiré', v_subscription.group_name),
      'subscription',
      v_subscription.id,
      v_subscription.group_name,
      true,
      '/dashboard/subscriptions',
      v_subscription.school_group_id,
      NULL,
      jsonb_build_object('end_date', v_subscription.end_date)
    );
  END LOOP;
END;
$$;

-- 4. FONCTION: Vérifier et créer alertes paiements
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_payment_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_school RECORD;
  v_overdue_count INTEGER;
  v_overdue_amount NUMERIC;
BEGIN
  -- Paiements en retard par école
  FOR v_school IN
    SELECT 
      s.id as school_id,
      s.name as school_name,
      s.school_group_id,
      COUNT(fp.id) as overdue_count,
      SUM(fp.amount) as overdue_amount
    FROM public.schools s
    JOIN public.fee_payments fp ON fp.school_id = s.id
    WHERE fp.status = 'pending'
      AND fp.due_date < NOW()
    GROUP BY s.id, s.name, s.school_group_id
    HAVING COUNT(fp.id) > 0
  LOOP
    PERFORM public.create_system_alert(
      'payment',
      CASE 
        WHEN v_school.overdue_count >= 10 THEN 'critical'
        WHEN v_school.overdue_count >= 5 THEN 'error'
        ELSE 'warning'
      END,
      format('%s paiement(s) en retard', v_school.overdue_count),
      format('%s - Total: %s FCFA', v_school.school_name, ROUND(v_school.overdue_amount)),
      'school',
      v_school.school_id,
      v_school.school_name,
      true,
      format('/dashboard/finances/ecole/%s', v_school.school_id),
      v_school.school_group_id,
      v_school.school_id,
      jsonb_build_object(
        'overdue_count', v_school.overdue_count,
        'overdue_amount', v_school.overdue_amount
      )
    );
  END LOOP;
END;
$$;

-- 5. FONCTION: Vérifier et créer alertes utilisateurs
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_user_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_group RECORD;
  v_inactive_count INTEGER;
BEGIN
  -- Utilisateurs inactifs par groupe
  FOR v_group IN
    SELECT 
      sg.id as group_id,
      sg.name as group_name,
      COUNT(u.id) as inactive_count
    FROM public.school_groups sg
    JOIN public.users u ON u.school_group_id = sg.id
    WHERE u.status = 'inactive'
      OR (u.last_login_at IS NOT NULL AND u.last_login_at < NOW() - INTERVAL '30 days')
    GROUP BY sg.id, sg.name
    HAVING COUNT(u.id) > 0
  LOOP
    PERFORM public.create_system_alert(
      'user',
      CASE 
        WHEN v_group.inactive_count >= 10 THEN 'warning'
        ELSE 'info'
      END,
      format('%s utilisateur(s) inactif(s)', v_group.inactive_count),
      format('%s - Pas de connexion depuis 30 jours', v_group.group_name),
      'school_group',
      v_group.group_id,
      v_group.group_name,
      false,
      '/dashboard/users',
      v_group.group_id,
      NULL,
      jsonb_build_object('inactive_count', v_group.inactive_count)
    );
  END LOOP;
END;
$$;

-- 6. FONCTION: Vérifier toutes les alertes
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_all_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.check_subscription_alerts();
  PERFORM public.check_payment_alerts();
  PERFORM public.check_user_alerts();
END;
$$;

-- 7. TRIGGER: Auto-résoudre les alertes obsolètes
-- =====================================================

CREATE OR REPLACE FUNCTION public.auto_resolve_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Résoudre les alertes d'abonnement si l'abonnement est renouvelé
  UPDATE public.system_alerts sa
  SET resolved_at = NOW()
  WHERE sa."type" = 'subscription'
    AND sa.resolved_at IS NULL
    AND sa.entity_id IN (
      SELECT id FROM public.subscriptions
      WHERE status = 'active'
        AND end_date > NOW() + INTERVAL '7 days'
    );
  
  -- Résoudre les alertes de paiement si tous les paiements sont à jour
  UPDATE public.system_alerts sa
  SET resolved_at = NOW()
  WHERE sa."type" = 'payment'
    AND sa.resolved_at IS NULL
    AND sa.school_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.fee_payments fp
      WHERE fp.school_id = sa.school_id
        AND fp.status = 'pending'
        AND fp.due_date < NOW()
    );
END;
$$;

-- 8. VUE: Alertes non lues
-- =====================================================

CREATE OR REPLACE VIEW public.unread_alerts AS
SELECT 
  sa.*,
  CASE 
    WHEN sa.created_at > NOW() - INTERVAL '1 hour' THEN 'recent'
    WHEN sa.created_at > NOW() - INTERVAL '24 hours' THEN 'today'
    ELSE 'older'
  END as age_category
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

-- 9. VUE: Statistiques alertes par groupe
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
  COUNT(*) as total_count
FROM public.school_groups sg
LEFT JOIN public.system_alerts sa ON sa.school_group_id = sg.id
  AND sa.resolved_at IS NULL
GROUP BY sg.id, sg.name;

-- 10. CRON JOB: Vérifier les alertes toutes les 5 minutes
-- =====================================================
-- Note: Nécessite l'extension pg_cron (disponible sur Supabase)

-- SELECT cron.schedule(
--   'check-system-alerts',
--   '*/5 * * * *', -- Toutes les 5 minutes
--   $$SELECT public.check_all_alerts()$$
-- );

-- SELECT cron.schedule(
--   'auto-resolve-alerts',
--   '*/10 * * * *', -- Toutes les 10 minutes
--   $$SELECT public.auto_resolve_alerts()$$
-- );

-- 11. FONCTION: Nettoyer les vieilles alertes résolues
-- =====================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.system_alerts
  WHERE resolved_at IS NOT NULL
    AND resolved_at < NOW() - INTERVAL '30 days';
END;
$$;

-- 12. INITIALISATION: Créer les alertes actuelles
-- =====================================================

SELECT public.check_all_alerts();

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================

COMMENT ON TABLE public.system_alerts IS 'Alertes système temps réel basées sur les données réelles';
COMMENT ON FUNCTION public.create_system_alert IS 'Créer une alerte système (évite les doublons)';
COMMENT ON FUNCTION public.check_all_alerts IS 'Vérifier toutes les sources d''alertes';
COMMENT ON FUNCTION public.auto_resolve_alerts IS 'Résoudre automatiquement les alertes obsolètes';
COMMENT ON VIEW public.unread_alerts IS 'Vue des alertes non lues triées par priorité';

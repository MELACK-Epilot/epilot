-- =====================================================
-- CRÉATION FONCTIONS ALERTES UNIQUEMENT
-- =====================================================
-- Ce script crée uniquement les fonctions sans toucher à la table
-- Date: 6 novembre 2025
-- =====================================================

-- 1. FONCTION: Créer une alerte
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

-- 2. FONCTION: Vérifier et créer alertes abonnements
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

-- 3. FONCTION: Vérifier et créer alertes paiements
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_payment_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_school RECORD;
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

-- 4. FONCTION: Vérifier et créer alertes utilisateurs
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_user_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_group RECORD;
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

-- 5. FONCTION: Vérifier toutes les alertes
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

-- 6. FONCTION: Auto-résoudre les alertes obsolètes
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

-- 7. FONCTION: Nettoyer les vieilles alertes résolues
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

-- 8. INITIALISATION: Créer les alertes actuelles
-- =====================================================

SELECT public.check_all_alerts();

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================

SELECT 'Fonctions créées avec succès ! Alertes générées.' as status;

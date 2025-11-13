-- =====================================================
-- PARTIE 3/4 : FONCTIONS DE VÉRIFICATION
-- =====================================================

-- 1. FONCTION: Vérifier alertes abonnements
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

-- 2. FONCTION: Vérifier alertes utilisateurs
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

-- 3. FONCTION: Vérifier alertes écoles
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

-- 4. FONCTION: Vérifier toutes les alertes
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

SELECT '✅ PARTIE 3/4 : Fonctions de vérification créées' as status;

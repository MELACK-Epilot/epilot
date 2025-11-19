-- =====================================================
-- RPC FUNCTIONS: Profil Utilisateur
-- Description: Fonctions pour gérer le profil complet
-- Date: 2025-11-17
-- =====================================================

-- =====================================================
-- 1. FONCTION: Mettre à jour préférences utilisateur
-- =====================================================
CREATE OR REPLACE FUNCTION update_user_preferences(
  p_user_id UUID,
  p_language VARCHAR DEFAULT NULL,
  p_timezone VARCHAR DEFAULT NULL,
  p_date_format VARCHAR DEFAULT NULL,
  p_time_format VARCHAR DEFAULT NULL,
  p_theme VARCHAR DEFAULT NULL,
  p_accent_color VARCHAR DEFAULT NULL,
  p_density VARCHAR DEFAULT NULL,
  p_animations_enabled BOOLEAN DEFAULT NULL,
  p_dashboard_layout JSONB DEFAULT NULL,
  p_favorite_widgets JSONB DEFAULT NULL,
  p_auto_refresh_interval INTEGER DEFAULT NULL,
  p_default_view VARCHAR DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Vérifier que l'utilisateur existe
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Utilisateur non trouvé';
  END IF;
  
  -- Mettre à jour les préférences (uniquement les champs non NULL)
  UPDATE user_preferences
  SET
    language = COALESCE(p_language, language),
    timezone = COALESCE(p_timezone, timezone),
    date_format = COALESCE(p_date_format, date_format),
    time_format = COALESCE(p_time_format, time_format),
    theme = COALESCE(p_theme, theme),
    accent_color = COALESCE(p_accent_color, accent_color),
    density = COALESCE(p_density, density),
    animations_enabled = COALESCE(p_animations_enabled, animations_enabled),
    dashboard_layout = COALESCE(p_dashboard_layout, dashboard_layout),
    favorite_widgets = COALESCE(p_favorite_widgets, favorite_widgets),
    auto_refresh_interval = COALESCE(p_auto_refresh_interval, auto_refresh_interval),
    default_view = COALESCE(p_default_view, default_view),
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Retourner les préférences mises à jour
  SELECT row_to_json(up.*)::jsonb INTO v_result
  FROM user_preferences up
  WHERE up.user_id = p_user_id;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. FONCTION: Mettre à jour paramètres notifications
-- =====================================================
CREATE OR REPLACE FUNCTION update_notification_settings(
  p_user_id UUID,
  p_email_enabled BOOLEAN DEFAULT NULL,
  p_email_general BOOLEAN DEFAULT NULL,
  p_email_new_users BOOLEAN DEFAULT NULL,
  p_email_new_schools BOOLEAN DEFAULT NULL,
  p_email_modules_assigned BOOLEAN DEFAULT NULL,
  p_email_weekly_report BOOLEAN DEFAULT NULL,
  p_email_monthly_report BOOLEAN DEFAULT NULL,
  p_email_annual_report BOOLEAN DEFAULT NULL,
  p_push_enabled BOOLEAN DEFAULT NULL,
  p_push_browser BOOLEAN DEFAULT NULL,
  p_push_mobile BOOLEAN DEFAULT NULL,
  p_push_sound BOOLEAN DEFAULT NULL,
  p_push_vibration BOOLEAN DEFAULT NULL,
  p_dnd_enabled BOOLEAN DEFAULT NULL,
  p_dnd_start_time TIME DEFAULT NULL,
  p_dnd_end_time TIME DEFAULT NULL,
  p_sms_enabled BOOLEAN DEFAULT NULL,
  p_sms_critical_only BOOLEAN DEFAULT NULL,
  p_sms_phone_number VARCHAR DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Vérifier que l'utilisateur existe
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Utilisateur non trouvé';
  END IF;
  
  -- Mettre à jour les paramètres
  UPDATE notification_settings
  SET
    email_enabled = COALESCE(p_email_enabled, email_enabled),
    email_general = COALESCE(p_email_general, email_general),
    email_new_users = COALESCE(p_email_new_users, email_new_users),
    email_new_schools = COALESCE(p_email_new_schools, email_new_schools),
    email_modules_assigned = COALESCE(p_email_modules_assigned, email_modules_assigned),
    email_weekly_report = COALESCE(p_email_weekly_report, email_weekly_report),
    email_monthly_report = COALESCE(p_email_monthly_report, email_monthly_report),
    email_annual_report = COALESCE(p_email_annual_report, email_annual_report),
    push_enabled = COALESCE(p_push_enabled, push_enabled),
    push_browser = COALESCE(p_push_browser, push_browser),
    push_mobile = COALESCE(p_push_mobile, push_mobile),
    push_sound = COALESCE(p_push_sound, push_sound),
    push_vibration = COALESCE(p_push_vibration, push_vibration),
    dnd_enabled = COALESCE(p_dnd_enabled, dnd_enabled),
    dnd_start_time = COALESCE(p_dnd_start_time, dnd_start_time),
    dnd_end_time = COALESCE(p_dnd_end_time, dnd_end_time),
    sms_enabled = COALESCE(p_sms_enabled, sms_enabled),
    sms_critical_only = COALESCE(p_sms_critical_only, sms_critical_only),
    sms_phone_number = COALESCE(p_sms_phone_number, sms_phone_number),
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Retourner les paramètres mis à jour
  SELECT row_to_json(ns.*)::jsonb INTO v_result
  FROM notification_settings ns
  WHERE ns.user_id = p_user_id;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. FONCTION: Récupérer historique connexions
-- =====================================================
CREATE OR REPLACE FUNCTION get_login_history(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Récupérer l'historique
  SELECT json_agg(row_to_json(lh.*))::jsonb INTO v_result
  FROM (
    SELECT 
      id,
      login_at,
      logout_at,
      session_duration,
      device_type,
      device_os,
      browser,
      ip_address::text,
      location_city,
      location_country,
      status,
      failure_reason
    FROM login_history
    WHERE user_id = p_user_id
    ORDER BY login_at DESC
    LIMIT p_limit
    OFFSET p_offset
  ) lh;
  
  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. FONCTION: Activer/Désactiver 2FA
-- =====================================================
CREATE OR REPLACE FUNCTION toggle_two_factor_auth(
  p_user_id UUID,
  p_enabled BOOLEAN,
  p_method VARCHAR DEFAULT 'app',
  p_secret VARCHAR DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Vérifier que l'utilisateur existe
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Utilisateur non trouvé';
  END IF;
  
  -- Mettre à jour les paramètres 2FA
  UPDATE user_security_settings
  SET
    two_factor_enabled = p_enabled,
    two_factor_method = CASE WHEN p_enabled THEN p_method ELSE NULL END,
    two_factor_secret = CASE WHEN p_enabled THEN p_secret ELSE NULL END,
    two_factor_enabled_at = CASE WHEN p_enabled THEN NOW() ELSE NULL END,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Retourner le statut
  SELECT jsonb_build_object(
    'user_id', p_user_id,
    'two_factor_enabled', p_enabled,
    'two_factor_method', CASE WHEN p_enabled THEN p_method ELSE NULL END,
    'enabled_at', CASE WHEN p_enabled THEN NOW() ELSE NULL END
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. FONCTION: Récupérer sessions actives
-- =====================================================
CREATE OR REPLACE FUNCTION get_active_sessions(
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Nettoyer les sessions expirées d'abord
  DELETE FROM active_sessions
  WHERE user_id = p_user_id AND expires_at < NOW();
  
  -- Récupérer les sessions actives
  SELECT json_agg(row_to_json(s.*))::jsonb INTO v_result
  FROM (
    SELECT 
      id,
      session_id,
      started_at,
      last_activity_at,
      expires_at,
      device_type,
      device_os,
      browser,
      ip_address::text,
      location_city,
      location_country,
      is_current
    FROM active_sessions
    WHERE user_id = p_user_id
    ORDER BY last_activity_at DESC
  ) s;
  
  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. FONCTION: Déconnecter une session
-- =====================================================
CREATE OR REPLACE FUNCTION terminate_session(
  p_user_id UUID,
  p_session_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_deleted BOOLEAN;
BEGIN
  -- Supprimer la session
  DELETE FROM active_sessions
  WHERE user_id = p_user_id AND session_id = p_session_id;
  
  GET DIAGNOSTICS v_deleted = FOUND;
  
  -- Enregistrer dans l'historique
  IF v_deleted THEN
    UPDATE login_history
    SET 
      logout_at = NOW(),
      session_duration = EXTRACT(EPOCH FROM (NOW() - login_at))::INTEGER
    WHERE user_id = p_user_id AND session_id = p_session_id;
  END IF;
  
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. FONCTION: Récupérer profil complet
-- =====================================================
CREATE OR REPLACE FUNCTION get_complete_user_profile(
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'user', (SELECT row_to_json(u.*) FROM users u WHERE id = p_user_id),
    'preferences', (SELECT row_to_json(up.*) FROM user_preferences up WHERE user_id = p_user_id),
    'notifications', (SELECT row_to_json(ns.*) FROM notification_settings ns WHERE user_id = p_user_id),
    'security', (SELECT row_to_json(uss.*) FROM user_security_settings uss WHERE user_id = p_user_id),
    'recent_logins', (SELECT get_login_history(p_user_id, 10, 0)),
    'active_sessions', (SELECT get_active_sessions(p_user_id))
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. FONCTION: Changer mot de passe
-- =====================================================
CREATE OR REPLACE FUNCTION change_user_password(
  p_user_id UUID,
  p_old_password VARCHAR,
  p_new_password VARCHAR
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- TODO: Vérifier l'ancien mot de passe avec Supabase Auth
  -- Cette fonction doit être appelée après vérification côté client
  
  -- Mettre à jour la date de changement
  UPDATE user_security_settings
  SET
    password_last_changed = NOW(),
    password_expires_at = NOW() + (password_expiry_days || ' days')::INTERVAL,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Retourner le statut
  SELECT jsonb_build_object(
    'success', true,
    'password_changed_at', NOW(),
    'message', 'Mot de passe mis à jour avec succès'
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTAIRES
-- =====================================================
COMMENT ON FUNCTION update_user_preferences IS 'Met à jour les préférences utilisateur';
COMMENT ON FUNCTION update_notification_settings IS 'Met à jour les paramètres de notifications';
COMMENT ON FUNCTION get_login_history IS 'Récupère l\'historique des connexions';
COMMENT ON FUNCTION toggle_two_factor_auth IS 'Active/Désactive l\'authentification 2FA';
COMMENT ON FUNCTION get_active_sessions IS 'Récupère les sessions actives';
COMMENT ON FUNCTION terminate_session IS 'Déconnecte une session spécifique';
COMMENT ON FUNCTION get_complete_user_profile IS 'Récupère le profil complet avec toutes les données';
COMMENT ON FUNCTION change_user_password IS 'Change le mot de passe utilisateur';

-- =====================================================
-- FIN DES RPC FUNCTIONS
-- =====================================================

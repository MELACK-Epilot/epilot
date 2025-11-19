-- =====================================================
-- MIGRATION: Système de Profil Utilisateur Complet
-- Description: Tables pour préférences, sécurité, notifications
-- Date: 2025-11-17
-- Auteur: E-Pilot Team
-- =====================================================

-- =====================================================
-- 1. TABLE: user_preferences
-- Stocke les préférences utilisateur (langue, thème, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Langue et région
  language VARCHAR(5) DEFAULT 'fr' CHECK (language IN ('fr', 'en')),
  timezone VARCHAR(50) DEFAULT 'Africa/Brazzaville',
  date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
  time_format VARCHAR(10) DEFAULT '24h' CHECK (time_format IN ('12h', '24h')),
  
  -- Apparence
  theme VARCHAR(10) DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  accent_color VARCHAR(20) DEFAULT 'blue',
  density VARCHAR(20) DEFAULT 'normal' CHECK (density IN ('compact', 'normal', 'comfortable')),
  animations_enabled BOOLEAN DEFAULT true,
  
  -- Tableau de bord
  dashboard_layout JSONB DEFAULT '[]'::jsonb,
  favorite_widgets JSONB DEFAULT '[]'::jsonb,
  auto_refresh_interval INTEGER DEFAULT 60, -- en secondes
  default_view VARCHAR(20) DEFAULT 'table' CHECK (default_view IN ('table', 'grid', 'list')),
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contrainte: 1 préférence par utilisateur
  UNIQUE(user_id)
);

-- Index pour performance
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();

-- =====================================================
-- 2. TABLE: notification_settings
-- Paramètres de notifications par utilisateur
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Notifications Email
  email_enabled BOOLEAN DEFAULT true,
  email_general BOOLEAN DEFAULT true,
  email_new_users BOOLEAN DEFAULT true,
  email_new_schools BOOLEAN DEFAULT true,
  email_modules_assigned BOOLEAN DEFAULT true,
  email_security_alerts BOOLEAN DEFAULT true, -- Toujours ON
  email_weekly_report BOOLEAN DEFAULT true,
  email_monthly_report BOOLEAN DEFAULT true,
  email_annual_report BOOLEAN DEFAULT false,
  
  -- Notifications Push
  push_enabled BOOLEAN DEFAULT true,
  push_browser BOOLEAN DEFAULT true,
  push_mobile BOOLEAN DEFAULT false,
  push_sound BOOLEAN DEFAULT true,
  push_vibration BOOLEAN DEFAULT true,
  
  -- Ne pas déranger
  dnd_enabled BOOLEAN DEFAULT false,
  dnd_start_time TIME DEFAULT '22:00:00',
  dnd_end_time TIME DEFAULT '07:00:00',
  
  -- Notifications SMS
  sms_enabled BOOLEAN DEFAULT false,
  sms_critical_only BOOLEAN DEFAULT true,
  sms_phone_number VARCHAR(20),
  sms_phone_verified BOOLEAN DEFAULT false,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contrainte: 1 paramètre par utilisateur
  UNIQUE(user_id)
);

-- Index
CREATE INDEX idx_notification_settings_user_id ON notification_settings(user_id);

-- Trigger updated_at
CREATE TRIGGER trigger_update_notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();

-- =====================================================
-- 3. TABLE: user_security_settings
-- Paramètres de sécurité (2FA, sessions, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_security_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Mot de passe
  password_last_changed TIMESTAMPTZ DEFAULT NOW(),
  password_expires_at TIMESTAMPTZ,
  password_expiry_days INTEGER DEFAULT 90,
  
  -- 2FA
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_method VARCHAR(20) CHECK (two_factor_method IN ('sms', 'email', 'app')),
  two_factor_secret VARCHAR(255),
  two_factor_backup_codes JSONB DEFAULT '[]'::jsonb,
  two_factor_enabled_at TIMESTAMPTZ,
  
  -- Sessions
  max_concurrent_sessions INTEGER DEFAULT 5,
  session_timeout_minutes INTEGER DEFAULT 480, -- 8 heures
  
  -- Appareils de confiance
  trusted_devices JSONB DEFAULT '[]'::jsonb,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contrainte
  UNIQUE(user_id)
);

-- Index
CREATE INDEX idx_user_security_settings_user_id ON user_security_settings(user_id);

-- Trigger
CREATE TRIGGER trigger_update_user_security_settings_updated_at
  BEFORE UPDATE ON user_security_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();

-- =====================================================
-- 4. TABLE: login_history
-- Historique des connexions utilisateur
-- =====================================================
CREATE TABLE IF NOT EXISTS login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Informations connexion
  login_at TIMESTAMPTZ DEFAULT NOW(),
  logout_at TIMESTAMPTZ,
  session_duration INTEGER, -- en secondes
  
  -- Appareil et localisation
  device_type VARCHAR(50), -- 'Windows PC', 'iPhone 13', etc.
  device_os VARCHAR(50),
  browser VARCHAR(50),
  ip_address INET,
  location_city VARCHAR(100),
  location_country VARCHAR(100),
  location_coordinates POINT,
  
  -- Statut
  status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failed', 'blocked')),
  failure_reason VARCHAR(255),
  
  -- Métadonnées
  user_agent TEXT,
  session_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX idx_login_history_user_id ON login_history(user_id);
CREATE INDEX idx_login_history_login_at ON login_history(login_at DESC);
CREATE INDEX idx_login_history_status ON login_history(status);

-- Partitioning par mois (pour scalabilité)
-- Note: À activer si > 1M entrées
-- CREATE TABLE login_history_2025_11 PARTITION OF login_history
--   FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

-- =====================================================
-- 5. TABLE: active_sessions
-- Sessions actives des utilisateurs
-- =====================================================
CREATE TABLE IF NOT EXISTS active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL UNIQUE,
  
  -- Informations session
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Appareil
  device_type VARCHAR(50),
  device_os VARCHAR(50),
  browser VARCHAR(50),
  ip_address INET,
  location_city VARCHAR(100),
  location_country VARCHAR(100),
  
  -- Statut
  is_current BOOLEAN DEFAULT false, -- Session actuelle
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_active_sessions_user_id ON active_sessions(user_id);
CREATE INDEX idx_active_sessions_session_id ON active_sessions(session_id);
CREATE INDEX idx_active_sessions_expires_at ON active_sessions(expires_at);

-- =====================================================
-- 6. FONCTION: Créer préférences par défaut
-- Appelée automatiquement à la création d'un utilisateur
-- =====================================================
CREATE OR REPLACE FUNCTION create_default_user_profile_settings()
RETURNS TRIGGER AS $$
BEGIN
  -- Créer préférences par défaut
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Créer paramètres notifications par défaut
  INSERT INTO notification_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Créer paramètres sécurité par défaut
  INSERT INTO user_security_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur création utilisateur
CREATE TRIGGER trigger_create_default_user_profile_settings
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_user_profile_settings();

-- =====================================================
-- 7. FONCTION: Enregistrer connexion
-- =====================================================
CREATE OR REPLACE FUNCTION log_user_login(
  p_user_id UUID,
  p_device_type VARCHAR,
  p_device_os VARCHAR,
  p_browser VARCHAR,
  p_ip_address INET,
  p_location_city VARCHAR DEFAULT NULL,
  p_location_country VARCHAR DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_login_id UUID;
BEGIN
  INSERT INTO login_history (
    user_id,
    device_type,
    device_os,
    browser,
    ip_address,
    location_city,
    location_country,
    user_agent,
    status
  ) VALUES (
    p_user_id,
    p_device_type,
    p_device_os,
    p_browser,
    p_ip_address,
    p_location_city,
    p_location_country,
    p_user_agent,
    'success'
  )
  RETURNING id INTO v_login_id;
  
  RETURN v_login_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. FONCTION: Nettoyer anciennes sessions
-- À exécuter périodiquement (cron job)
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM active_sessions
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. VUES: Faciliter les requêtes
-- =====================================================

-- Vue: Profil complet utilisateur
CREATE OR REPLACE VIEW user_complete_profile AS
SELECT 
  u.id,
  u.first_name,
  u.last_name,
  u.email,
  u.role,
  u.avatar,
  u.phone,
  u.gender,
  u.date_of_birth,
  u.school_group_id,
  u.school_id,
  u.created_at,
  
  -- Préférences
  up.language,
  up.timezone,
  up.theme,
  up.accent_color,
  
  -- Notifications
  ns.email_enabled,
  ns.push_enabled,
  ns.sms_enabled,
  
  -- Sécurité
  uss.two_factor_enabled,
  uss.password_last_changed
  
FROM users u
LEFT JOIN user_preferences up ON u.id = up.user_id
LEFT JOIN notification_settings ns ON u.id = ns.user_id
LEFT JOIN user_security_settings uss ON u.id = uss.user_id;

-- Vue: Dernières connexions
CREATE OR REPLACE VIEW user_recent_logins AS
SELECT 
  lh.id,
  lh.user_id,
  lh.login_at,
  lh.device_type,
  lh.location_city,
  lh.location_country,
  lh.status,
  u.first_name,
  u.last_name,
  u.email
FROM login_history lh
JOIN users u ON lh.user_id = u.id
ORDER BY lh.login_at DESC;

-- =====================================================
-- 10. COMMENTAIRES
-- =====================================================
COMMENT ON TABLE user_preferences IS 'Préférences utilisateur (langue, thème, etc.)';
COMMENT ON TABLE notification_settings IS 'Paramètres de notifications par utilisateur';
COMMENT ON TABLE user_security_settings IS 'Paramètres de sécurité (2FA, sessions)';
COMMENT ON TABLE login_history IS 'Historique des connexions utilisateur';
COMMENT ON TABLE active_sessions IS 'Sessions actives des utilisateurs';

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

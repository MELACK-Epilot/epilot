/**
 * Migration: Système de Rate Limiting
 * Créé le: 2025-11-20
 * Description: Tables pour gérer les limites de requêtes et violations
 */

-- =====================================================
-- 1. TABLE: rate_limit_counters
-- Stocke les compteurs de requêtes par utilisateur/action
-- =====================================================

CREATE TABLE IF NOT EXISTS rate_limit_counters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(255) UNIQUE NOT NULL, -- Format: "user_id:action" ou "ip:action"
  count INTEGER NOT NULL DEFAULT 0,
  reset_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX idx_rate_limit_key ON rate_limit_counters(key);
CREATE INDEX idx_rate_limit_reset ON rate_limit_counters(reset_at);

-- Fonction pour auto-cleanup des compteurs expirés
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limit_counters
  WHERE reset_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_rate_limit_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rate_limit_counters_updated_at
  BEFORE UPDATE ON rate_limit_counters
  FOR EACH ROW
  EXECUTE FUNCTION update_rate_limit_updated_at();

-- =====================================================
-- 2. TABLE: rate_limit_violations
-- Stocke les violations pour monitoring et alertes
-- =====================================================

CREATE TABLE IF NOT EXISTS rate_limit_violations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  limit_exceeded INTEGER NOT NULL, -- Nombre de requêtes au-delà de la limite
  metadata JSONB, -- Données supplémentaires (endpoint, params, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance et recherche
CREATE INDEX idx_violations_user ON rate_limit_violations(user_id);
CREATE INDEX idx_violations_action ON rate_limit_violations(action);
CREATE INDEX idx_violations_created ON rate_limit_violations(created_at DESC);
CREATE INDEX idx_violations_ip ON rate_limit_violations(ip_address);

-- =====================================================
-- 3. TABLE: rate_limit_config
-- Configuration des limites par action
-- =====================================================

CREATE TABLE IF NOT EXISTS rate_limit_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action VARCHAR(100) UNIQUE NOT NULL,
  max_requests INTEGER NOT NULL,
  window_seconds INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER rate_limit_config_updated_at
  BEFORE UPDATE ON rate_limit_config
  FOR EACH ROW
  EXECUTE FUNCTION update_rate_limit_updated_at();

-- =====================================================
-- 4. FONCTION: check_rate_limit
-- Vérifie et incrémente le compteur de rate limit
-- =====================================================

CREATE OR REPLACE FUNCTION check_rate_limit(
  p_key VARCHAR(255),
  p_action VARCHAR(100),
  p_user_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_config RECORD;
  v_counter RECORD;
  v_now TIMESTAMPTZ := NOW();
  v_reset_at TIMESTAMPTZ;
  v_allowed BOOLEAN := TRUE;
  v_remaining INTEGER;
BEGIN
  -- Récupérer la configuration pour cette action
  SELECT * INTO v_config
  FROM rate_limit_config
  WHERE action = p_action AND is_active = TRUE;
  
  -- Si pas de config, autoriser
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'allowed', TRUE,
      'remaining', 999999,
      'reset_at', NULL
    );
  END IF;
  
  -- Calculer la date de reset
  v_reset_at := v_now + (v_config.window_seconds || ' seconds')::INTERVAL;
  
  -- Récupérer ou créer le compteur
  SELECT * INTO v_counter
  FROM rate_limit_counters
  WHERE key = p_key;
  
  IF NOT FOUND THEN
    -- Créer nouveau compteur
    INSERT INTO rate_limit_counters (key, count, reset_at)
    VALUES (p_key, 1, v_reset_at)
    RETURNING * INTO v_counter;
    
    v_remaining := v_config.max_requests - 1;
  ELSE
    -- Vérifier si la fenêtre est expirée
    IF v_counter.reset_at < v_now THEN
      -- Reset le compteur
      UPDATE rate_limit_counters
      SET count = 1, reset_at = v_reset_at
      WHERE key = p_key
      RETURNING * INTO v_counter;
      
      v_remaining := v_config.max_requests - 1;
    ELSE
      -- Vérifier la limite
      IF v_counter.count >= v_config.max_requests THEN
        v_allowed := FALSE;
        v_remaining := 0;
        
        -- Enregistrer la violation
        INSERT INTO rate_limit_violations (
          user_id, action, ip_address, user_agent, limit_exceeded, metadata
        ) VALUES (
          p_user_id,
          p_action,
          p_ip_address,
          p_user_agent,
          v_counter.count - v_config.max_requests,
          jsonb_build_object(
            'limit', v_config.max_requests,
            'window_seconds', v_config.window_seconds,
            'current_count', v_counter.count
          )
        );
      ELSE
        -- Incrémenter le compteur
        UPDATE rate_limit_counters
        SET count = count + 1
        WHERE key = p_key
        RETURNING * INTO v_counter;
        
        v_remaining := v_config.max_requests - v_counter.count;
      END IF;
    END IF;
  END IF;
  
  -- Retourner le résultat
  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'remaining', v_remaining,
    'reset_at', EXTRACT(EPOCH FROM v_counter.reset_at)::BIGINT,
    'limit', v_config.max_requests,
    'window_seconds', v_config.window_seconds
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. FONCTION: get_user_violations_count
-- Compte les violations d'un utilisateur sur une période
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_violations_count(
  p_user_id UUID,
  p_hours INTEGER DEFAULT 24
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM rate_limit_violations
  WHERE user_id = p_user_id
    AND created_at >= NOW() - (p_hours || ' hours')::INTERVAL;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. INSERTION DES CONFIGURATIONS PAR DÉFAUT
-- =====================================================

INSERT INTO rate_limit_config (action, max_requests, window_seconds, description) VALUES
  -- Authentification
  ('auth:login', 5, 900, 'Tentatives de connexion (5 par 15min)'),
  ('auth:reset_password', 3, 3600, 'Demandes de reset password (3 par heure)'),
  ('auth:register', 3, 86400, 'Creations de compte (3 par jour)'),
  
  -- Création de données
  ('create:school_group', 10, 3600, 'Creations de groupes scolaires (10 par heure)'),
  ('create:school', 50, 3600, 'Creations d''ecoles (50 par heure)'),
  ('create:user', 100, 3600, 'Creations d''utilisateurs (100 par heure)'),
  
  -- Lecture
  ('read:api', 100, 60, 'Requetes API GET (100 par minute)'),
  ('read:export', 10, 3600, 'Exports de donnees (10 par heure)'),
  
  -- Modification
  ('update:data', 50, 60, 'Modifications de donnees (50 par minute)'),
  ('delete:data', 20, 3600, 'Suppressions de donnees (20 par heure)'),
  ('bulk:action', 5, 3600, 'Actions en masse (5 par heure)')
ON CONFLICT (action) DO NOTHING;

-- =====================================================
-- 7. RLS (Row Level Security)
-- =====================================================

-- Activer RLS
ALTER TABLE rate_limit_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_config ENABLE ROW LEVEL SECURITY;

-- Policies pour rate_limit_counters (seulement via fonction)
CREATE POLICY "Service role only" ON rate_limit_counters
  FOR ALL USING (auth.role() = 'service_role');

-- Policies pour rate_limit_violations (admins peuvent voir)
CREATE POLICY "Super admins can view violations" ON rate_limit_violations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role = 'super_admin'
    )
  );

-- Policies pour rate_limit_config (admins peuvent gérer)
CREATE POLICY "Super admins can manage config" ON rate_limit_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role = 'super_admin'
    )
  );

-- Lecture publique de la config (pour afficher les limites aux users)
CREATE POLICY "Anyone can view config" ON rate_limit_config
  FOR SELECT USING (TRUE);

-- =====================================================
-- 8. COMMENTAIRES
-- =====================================================

COMMENT ON TABLE rate_limit_counters IS 'Compteurs de requetes pour le rate limiting';
COMMENT ON TABLE rate_limit_violations IS 'Historique des violations de rate limit';
COMMENT ON TABLE rate_limit_config IS 'Configuration des limites par action';
COMMENT ON FUNCTION check_rate_limit IS 'Verifie et incremente le compteur de rate limit';
COMMENT ON FUNCTION get_user_violations_count IS 'Compte les violations d''un utilisateur';

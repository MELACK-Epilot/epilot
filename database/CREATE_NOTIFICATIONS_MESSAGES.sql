-- ============================================
-- SYSTÈME DE NOTIFICATIONS ET MESSAGES
-- Date: 10 novembre 2025, 14h24
-- ============================================

BEGIN;

-- ============================================
-- 1️⃣ TABLE : notifications
-- Système d'alertes et notifications temps réel
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'info', 'success', 'warning', 'error', 'system'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  action_url VARCHAR(500),
  action_label VARCHAR(100),
  icon VARCHAR(50), -- 'bell', 'check', 'alert', 'info', etc.
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Notification temporaire
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Index pour performance
  CONSTRAINT notifications_type_check CHECK (type IN ('info', 'success', 'warning', 'error', 'system'))
);

-- Index
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Commentaires
COMMENT ON TABLE notifications IS 'Système de notifications temps réel pour les utilisateurs';
COMMENT ON COLUMN notifications.type IS 'Type de notification : info, success, warning, error, system';
COMMENT ON COLUMN notifications.is_read IS 'Notification lue ou non';
COMMENT ON COLUMN notifications.expires_at IS 'Date d''expiration de la notification (optionnel)';

-- ============================================
-- 2️⃣ TABLE : messages
-- Système de messagerie interne
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  is_starred BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  parent_message_id UUID REFERENCES messages(id) ON DELETE SET NULL, -- Pour les réponses
  attachments JSONB DEFAULT '[]'::jsonb, -- [{name, url, size, type}]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Empêcher l'envoi de message à soi-même
  CONSTRAINT messages_different_users CHECK (sender_id != recipient_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_parent_message_id ON messages(parent_message_id);

-- Commentaires
COMMENT ON TABLE messages IS 'Système de messagerie interne entre utilisateurs';
COMMENT ON COLUMN messages.parent_message_id IS 'ID du message parent pour les réponses';
COMMENT ON COLUMN messages.attachments IS 'Pièces jointes au format JSON';

-- ============================================
-- 3️⃣ TRIGGERS
-- ============================================

-- Trigger pour updated_at sur messages
CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_messages_updated_at();

-- Trigger pour créer une notification quand un message est reçu
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    action_url,
    action_label,
    icon,
    metadata
  )
  VALUES (
    NEW.recipient_id,
    'info',
    'Nouveau message',
    'Vous avez reçu un nouveau message de ' || (SELECT first_name || ' ' || last_name FROM users WHERE id = NEW.sender_id),
    '/dashboard/messages/' || NEW.id,
    'Lire le message',
    'mail',
    jsonb_build_object('message_id', NEW.id, 'sender_id', NEW.sender_id)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER message_notification_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION create_message_notification();

-- ============================================
-- 4️⃣ ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Politiques pour notifications
-- Super Admin peut voir toutes les notifications
CREATE POLICY "Super Admin can view all notifications" ON notifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'super_admin'
    )
  );

-- Utilisateurs peuvent voir leurs propres notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- Utilisateurs peuvent marquer leurs notifications comme lues
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE
  USING (user_id = auth.uid());

-- Système peut créer des notifications
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT
  WITH CHECK (true);

-- Politiques pour messages
-- Super Admin peut voir tous les messages
CREATE POLICY "Super Admin can view all messages" ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'super_admin'
    )
  );

-- Utilisateurs peuvent voir leurs messages (envoyés ou reçus)
CREATE POLICY "Users can view their messages" ON messages
  FOR SELECT
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- Utilisateurs peuvent envoyer des messages
CREATE POLICY "Users can send messages" ON messages
  FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- Utilisateurs peuvent mettre à jour leurs messages reçus (marquer comme lu, etc.)
CREATE POLICY "Users can update received messages" ON messages
  FOR UPDATE
  USING (recipient_id = auth.uid());

-- ============================================
-- 5️⃣ DONNÉES DE TEST
-- ============================================

-- Créer quelques notifications de test pour le Super Admin
DO $$
DECLARE
  v_super_admin_id UUID;
BEGIN
  -- Récupérer l'ID du Super Admin
  SELECT id INTO v_super_admin_id
  FROM users
  WHERE role = 'super_admin'
  LIMIT 1;
  
  IF v_super_admin_id IS NOT NULL THEN
    -- Notification 1 : Nouveau groupe scolaire
    INSERT INTO notifications (user_id, type, title, message, action_url, action_label, icon)
    VALUES (
      v_super_admin_id,
      'success',
      'Nouveau groupe scolaire',
      'Le groupe scolaire "École ABC" vient de s''inscrire sur la plateforme',
      '/dashboard/school-groups',
      'Voir le groupe',
      'building'
    );
    
    -- Notification 2 : Paiement reçu
    INSERT INTO notifications (user_id, type, title, message, action_url, action_label, icon)
    VALUES (
      v_super_admin_id,
      'success',
      'Paiement reçu',
      'Un paiement de 50 000 FCFA a été reçu pour l''abonnement Premium',
      '/dashboard/finances',
      'Voir les finances',
      'dollar-sign'
    );
    
    -- Notification 3 : Alerte système
    INSERT INTO notifications (user_id, type, title, message, action_url, action_label, icon)
    VALUES (
      v_super_admin_id,
      'warning',
      'Mise à jour disponible',
      'Une nouvelle version de la plateforme est disponible',
      '/dashboard/settings',
      'Mettre à jour',
      'alert-circle'
    );
    
    RAISE NOTICE '✅ Notifications de test créées pour le Super Admin';
  ELSE
    RAISE NOTICE '⚠️ Aucun Super Admin trouvé';
  END IF;
END $$;

COMMIT;

-- ============================================
-- 6️⃣ FONCTIONS UTILITAIRES
-- ============================================

-- Fonction pour marquer toutes les notifications comme lues
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notifications
  SET is_read = true, read_at = NOW()
  WHERE user_id = p_user_id AND is_read = false;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour supprimer les notifications expirées
CREATE OR REPLACE FUNCTION delete_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour compter les notifications non lues
CREATE OR REPLACE FUNCTION count_unread_notifications(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM notifications
    WHERE user_id = p_user_id AND is_read = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour compter les messages non lus
CREATE OR REPLACE FUNCTION count_unread_messages(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM messages
    WHERE recipient_id = p_user_id AND is_read = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7️⃣ VÉRIFICATION
-- ============================================

-- Vérifier que les tables ont été créées
SELECT 
  '=== TABLES CRÉÉES ===' as etape,
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('notifications', 'messages')
ORDER BY table_name;

-- Vérifier les notifications de test
SELECT 
  '=== NOTIFICATIONS DE TEST ===' as etape,
  COUNT(*) as nb_notifications
FROM notifications;

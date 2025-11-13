-- =====================================================
-- SCHÉMA SQL MESSAGERIE E-PILOT CONGO
-- Module: Communication - Messagerie interne
-- Version: 1.0
-- Date: 30 octobre 2025
-- =====================================================

-- =====================================================
-- 1. TYPES ENUM
-- =====================================================

-- Type de message
CREATE TYPE message_type AS ENUM ('direct', 'group', 'broadcast');

-- Statut du message
CREATE TYPE message_status AS ENUM ('draft', 'sent', 'delivered', 'read', 'archived', 'deleted');

-- =====================================================
-- 2. TABLES PRINCIPALES
-- =====================================================

-- Table des conversations/threads
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255),
  type message_type NOT NULL DEFAULT 'direct',
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE,
  is_archived BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Table des participants aux conversations
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  is_admin BOOLEAN DEFAULT FALSE,
  is_muted BOOLEAN DEFAULT FALSE,
  last_read_at TIMESTAMP WITH TIME ZONE,
  unread_count INTEGER DEFAULT 0,
  UNIQUE(conversation_id, user_id)
);

-- Table des messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_message_id UUID REFERENCES messages(id) ON DELETE SET NULL, -- Pour les réponses
  subject VARCHAR(500),
  content TEXT NOT NULL,
  status message_status NOT NULL DEFAULT 'sent',
  is_important BOOLEAN DEFAULT FALSE,
  is_forwarded BOOLEAN DEFAULT FALSE,
  forwarded_from_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Table des destinataires de messages
CREATE TABLE IF NOT EXISTS message_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  is_archived BOOLEAN DEFAULT FALSE,
  is_starred BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Table des pièces jointes
CREATE TABLE IF NOT EXISTS message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL,
  file_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des brouillons
CREATE TABLE IF NOT EXISTS message_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  subject VARCHAR(500),
  content TEXT,
  recipients JSONB DEFAULT '[]'::jsonb, -- Array d'IDs utilisateurs
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. INDEX POUR PERFORMANCE
-- =====================================================

-- Conversations
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_archived ON conversations(is_archived);

-- Participants
CREATE INDEX IF NOT EXISTS idx_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_unread ON conversation_participants(unread_count) WHERE unread_count > 0;

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_parent ON messages(parent_message_id) WHERE parent_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_deleted ON messages(deleted_at) WHERE deleted_at IS NOT NULL;

-- Destinataires
CREATE INDEX IF NOT EXISTS idx_recipients_message ON message_recipients(message_id);
CREATE INDEX IF NOT EXISTS idx_recipients_user ON message_recipients(user_id);
CREATE INDEX IF NOT EXISTS idx_recipients_unread ON message_recipients(is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_recipients_starred ON message_recipients(is_starred) WHERE is_starred = TRUE;

-- Pièces jointes
CREATE INDEX IF NOT EXISTS idx_attachments_message ON message_attachments(message_id);

-- Brouillons
CREATE INDEX IF NOT EXISTS idx_drafts_user ON message_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_drafts_updated ON message_drafts(updated_at DESC);

-- =====================================================
-- 4. VUES SQL
-- =====================================================

-- Vue des conversations avec statistiques
CREATE OR REPLACE VIEW conversations_with_stats AS
SELECT 
  c.id,
  c.title,
  c.type,
  c.created_by,
  c.created_at,
  c.updated_at,
  c.last_message_at,
  c.is_archived,
  COUNT(DISTINCT cp.user_id) as participants_count,
  COUNT(DISTINCT m.id) as messages_count,
  (
    SELECT COUNT(*)
    FROM message_recipients mr
    JOIN messages m2 ON mr.message_id = m2.id
    WHERE m2.conversation_id = c.id AND mr.is_read = FALSE
  ) as unread_count
FROM conversations c
LEFT JOIN conversation_participants cp ON c.id = cp.conversation_id AND cp.left_at IS NULL
LEFT JOIN messages m ON c.id = m.conversation_id AND m.deleted_at IS NULL
GROUP BY c.id;

-- Vue des messages avec détails
CREATE OR REPLACE VIEW messages_with_details AS
SELECT 
  m.id,
  m.conversation_id,
  m.sender_id,
  CONCAT(u.first_name, ' ', u.last_name) as sender_name,
  u.email as sender_email,
  u.avatar as sender_avatar,
  m.subject,
  m.content,
  m.status,
  m.is_important,
  m.is_forwarded,
  m.sent_at,
  m.created_at,
  COUNT(DISTINCT ma.id) as attachments_count,
  COUNT(DISTINCT mr.id) as recipients_count,
  COUNT(DISTINCT CASE WHEN mr.is_read = TRUE THEN mr.id END) as read_count,
  ARRAY_AGG(DISTINCT jsonb_build_object(
    'id', ma.id,
    'name', ma.file_name,
    'type', ma.file_type,
    'size', ma.file_size,
    'url', ma.file_url
  )) FILTER (WHERE ma.id IS NOT NULL) as attachments
FROM messages m
JOIN users u ON m.sender_id = u.id
LEFT JOIN message_attachments ma ON m.id = ma.message_id
LEFT JOIN message_recipients mr ON m.id = mr.message_id
WHERE m.deleted_at IS NULL
GROUP BY m.id, u.id;

-- Vue des statistiques utilisateur
CREATE OR REPLACE VIEW user_messaging_stats AS
SELECT 
  u.id as user_id,
  COUNT(DISTINCT CASE WHEN m.sender_id = u.id THEN m.id END) as sent_count,
  COUNT(DISTINCT CASE WHEN mr.user_id = u.id THEN mr.message_id END) as received_count,
  COUNT(DISTINCT CASE WHEN mr.user_id = u.id AND mr.is_read = FALSE THEN mr.message_id END) as unread_count,
  COUNT(DISTINCT CASE WHEN md.user_id = u.id THEN md.id END) as drafts_count,
  COUNT(DISTINCT CASE WHEN mr.user_id = u.id AND mr.is_starred = TRUE THEN mr.message_id END) as starred_count,
  COUNT(DISTINCT CASE WHEN mr.user_id = u.id AND mr.is_archived = TRUE THEN mr.message_id END) as archived_count
FROM users u
LEFT JOIN messages m ON u.id = m.sender_id AND m.deleted_at IS NULL
LEFT JOIN message_recipients mr ON u.id = mr.user_id AND mr.is_deleted = FALSE
LEFT JOIN message_drafts md ON u.id = md.user_id
GROUP BY u.id;

-- =====================================================
-- 5. FONCTIONS
-- =====================================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour incrémenter le compteur de non-lus
CREATE OR REPLACE FUNCTION increment_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversation_participants
  SET unread_count = unread_count + 1
  WHERE conversation_id = NEW.conversation_id
    AND user_id != NEW.sender_id
    AND left_at IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour décrémenter le compteur de non-lus
CREATE OR REPLACE FUNCTION decrement_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_read = TRUE AND OLD.is_read = FALSE THEN
    UPDATE conversation_participants
    SET unread_count = GREATEST(unread_count - 1, 0),
        last_read_at = NOW()
    WHERE conversation_id = (
      SELECT conversation_id FROM messages WHERE id = NEW.message_id
    )
    AND user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour last_message_at
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.sent_at,
      updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer automatiquement les destinataires
CREATE OR REPLACE FUNCTION create_message_recipients()
RETURNS TRIGGER AS $$
BEGIN
  -- Créer un destinataire pour chaque participant de la conversation
  INSERT INTO message_recipients (message_id, user_id)
  SELECT NEW.id, cp.user_id
  FROM conversation_participants cp
  WHERE cp.conversation_id = NEW.conversation_id
    AND cp.user_id != NEW.sender_id
    AND cp.left_at IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. TRIGGERS
-- =====================================================

-- Trigger updated_at sur conversations
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger updated_at sur messages
DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger updated_at sur drafts
DROP TRIGGER IF EXISTS update_drafts_updated_at ON message_drafts;
CREATE TRIGGER update_drafts_updated_at
  BEFORE UPDATE ON message_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour incrémenter unread_count
DROP TRIGGER IF EXISTS trigger_increment_unread ON messages;
CREATE TRIGGER trigger_increment_unread
  AFTER INSERT ON messages
  FOR EACH ROW
  WHEN (NEW.status = 'sent')
  EXECUTE FUNCTION increment_unread_count();

-- Trigger pour décrémenter unread_count
DROP TRIGGER IF EXISTS trigger_decrement_unread ON message_recipients;
CREATE TRIGGER trigger_decrement_unread
  AFTER UPDATE ON message_recipients
  FOR EACH ROW
  EXECUTE FUNCTION decrement_unread_count();

-- Trigger pour mettre à jour last_message_at
DROP TRIGGER IF EXISTS trigger_update_last_message ON messages;
CREATE TRIGGER trigger_update_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Trigger pour créer les destinataires automatiquement
DROP TRIGGER IF EXISTS trigger_create_recipients ON messages;
CREATE TRIGGER trigger_create_recipients
  AFTER INSERT ON messages
  FOR EACH ROW
  WHEN (NEW.status = 'sent')
  EXECUTE FUNCTION create_message_recipients();

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_drafts ENABLE ROW LEVEL SECURITY;

-- Politiques pour conversations
CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  USING (
    id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Conversation creators can update"
  ON conversations FOR UPDATE
  USING (created_by = auth.uid());

-- Politiques pour participants
CREATE POLICY "Users can view participants of their conversations"
  ON conversation_participants FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join conversations"
  ON conversation_participants FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their participation"
  ON conversation_participants FOR UPDATE
  USING (user_id = auth.uid());

-- Politiques pour messages
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "Users can send messages in their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

CREATE POLICY "Senders can update their messages"
  ON messages FOR UPDATE
  USING (sender_id = auth.uid());

-- Politiques pour destinataires
CREATE POLICY "Users can view their message receipts"
  ON message_recipients FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their message receipts"
  ON message_recipients FOR UPDATE
  USING (user_id = auth.uid());

-- Politiques pour pièces jointes
CREATE POLICY "Users can view attachments of their messages"
  ON message_attachments FOR SELECT
  USING (
    message_id IN (
      SELECT m.id FROM messages m
      JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
      WHERE cp.user_id = auth.uid() AND cp.left_at IS NULL
    )
  );

CREATE POLICY "Users can upload attachments to their messages"
  ON message_attachments FOR INSERT
  WITH CHECK (
    message_id IN (
      SELECT id FROM messages WHERE sender_id = auth.uid()
    )
  );

-- Politiques pour brouillons
CREATE POLICY "Users can view their own drafts"
  ON message_drafts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own drafts"
  ON message_drafts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own drafts"
  ON message_drafts FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own drafts"
  ON message_drafts FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- 8. COMMENTAIRES
-- =====================================================

COMMENT ON TABLE conversations IS 'Table des conversations/threads de messagerie';
COMMENT ON TABLE conversation_participants IS 'Table des participants aux conversations';
COMMENT ON TABLE messages IS 'Table des messages';
COMMENT ON TABLE message_recipients IS 'Table des destinataires de messages';
COMMENT ON TABLE message_attachments IS 'Table des pièces jointes';
COMMENT ON TABLE message_drafts IS 'Table des brouillons';

-- =====================================================
-- FIN DU SCHÉMA MESSAGERIE
-- =====================================================

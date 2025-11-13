-- =============================================
-- TABLE NOTIFICATIONS - SYSTÈME TEMPS RÉEL
-- =============================================

-- Création de la table notifications si elle n'existe pas
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category VARCHAR(50) NOT NULL CHECK (category IN ('system', 'message', 'grade', 'payment', 'schedule')),
  action_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- RLS (Row Level Security)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs voient uniquement leurs notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- Politique : Les utilisateurs peuvent marquer leurs notifications comme lues
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Politique : Les utilisateurs peuvent supprimer leurs notifications
CREATE POLICY "Users can delete their own notifications" ON notifications
  FOR DELETE USING (user_id = auth.uid());

-- Politique : Seuls les admins/système peuvent créer des notifications
CREATE POLICY "Admins can create notifications" ON notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin_groupe', 'proviseur', 'directeur')
    )
  );

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_notifications_updated_at_trigger ON notifications;
CREATE TRIGGER update_notifications_updated_at_trigger
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- =============================================
-- FONCTIONS UTILITAIRES
-- =============================================

-- Fonction RPC pour récupérer les notifications d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_notifications(p_user_id UUID, p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  id UUID,
  title VARCHAR(255),
  message TEXT,
  type VARCHAR(20),
  priority VARCHAR(20),
  category VARCHAR(50),
  action_url TEXT,
  is_read BOOLEAN,
  read_at TIMESTAMPTZ,
  user_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.title,
    n.message,
    n.type,
    n.priority,
    n.category,
    n.action_url,
    n.is_read,
    n.read_at,
    n.user_id,
    n.created_by,
    n.created_at,
    n.updated_at
  FROM notifications n
  WHERE n.user_id = p_user_id
  ORDER BY n.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer une notification système
CREATE OR REPLACE FUNCTION create_system_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_priority TEXT DEFAULT 'medium',
  p_category TEXT DEFAULT 'system',
  p_action_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id, title, message, type, priority, category, action_url, created_by
  ) VALUES (
    p_user_id, p_title, p_message, p_type, p_priority, p_category, p_action_url, auth.uid()
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour notifier tous les utilisateurs d'un groupe
CREATE OR REPLACE FUNCTION create_group_notification(
  p_school_group_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_priority TEXT DEFAULT 'medium',
  p_category TEXT DEFAULT 'system',
  p_action_url TEXT DEFAULT NULL,
  p_roles TEXT[] DEFAULT NULL -- Filtrer par rôles spécifiques
)
RETURNS INTEGER AS $$
DECLARE
  user_record RECORD;
  notification_count INTEGER := 0;
BEGIN
  FOR user_record IN 
    SELECT id FROM users 
    WHERE school_group_id = p_school_group_id 
    AND status = 'active'
    AND (p_roles IS NULL OR role = ANY(p_roles))
  LOOP
    PERFORM create_system_notification(
      user_record.id, p_title, p_message, p_type, p_priority, p_category, p_action_url
    );
    notification_count := notification_count + 1;
  END LOOP;
  
  RETURN notification_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour nettoyer les anciennes notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications(days_old INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM notifications 
  WHERE created_at < NOW() - INTERVAL '1 day' * days_old
  AND is_read = TRUE;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- DONNÉES DE TEST
-- =============================================

-- Fonction pour générer des notifications de test
CREATE OR REPLACE FUNCTION generate_test_notifications(p_user_id UUID, count INTEGER DEFAULT 5)
RETURNS INTEGER AS $$
DECLARE
  i INTEGER;
  titles TEXT[] := ARRAY[
    'Nouveau message reçu',
    'Notes mises à jour', 
    'Paiement confirmé',
    'Réunion programmée',
    'Rapport disponible',
    'Maintenance système',
    'Nouvelle inscription'
  ];
  messages TEXT[] := ARRAY[
    'Vous avez reçu un nouveau message de Marie Dubois',
    '25 nouvelles notes ont été saisies en Mathématiques',
    'Paiement de 150€ confirmé pour l''élève Pierre Martin',
    'Conseil de classe prévu demain à 14h00',
    'Le rapport mensuel est maintenant disponible',
    'Maintenance programmée ce soir de 22h à 23h',
    'Nouvelle inscription validée pour la classe de 6ème A'
  ];
  types TEXT[] := ARRAY['info', 'success', 'warning', 'error'];
  priorities TEXT[] := ARRAY['low', 'medium', 'high', 'urgent'];
  categories TEXT[] := ARRAY['system', 'message', 'grade', 'payment', 'schedule'];
BEGIN
  FOR i IN 1..count LOOP
    INSERT INTO notifications (
      user_id, title, message, type, priority, category,
      is_read, created_at
    ) VALUES (
      p_user_id,
      titles[1 + (random() * (array_length(titles, 1) - 1))::int],
      messages[1 + (random() * (array_length(messages, 1) - 1))::int],
      types[1 + (random() * (array_length(types, 1) - 1))::int],
      priorities[1 + (random() * (array_length(priorities, 1) - 1))::int],
      categories[1 + (random() * (array_length(categories, 1) - 1))::int],
      random() > 0.7, -- 30% de chance d'être lue
      NOW() - INTERVAL '1 hour' * (random() * 24 * 7) -- Dans la dernière semaine
    );
  END LOOP;
  
  RETURN count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- COMMENTAIRES ET DOCUMENTATION
-- =============================================

COMMENT ON TABLE notifications IS 'Table des notifications utilisateur avec support temps réel';
COMMENT ON COLUMN notifications.user_id IS 'Utilisateur destinataire de la notification';
COMMENT ON COLUMN notifications.title IS 'Titre court de la notification';
COMMENT ON COLUMN notifications.message IS 'Message détaillé de la notification';
COMMENT ON COLUMN notifications.type IS 'Type visuel: info, success, warning, error';
COMMENT ON COLUMN notifications.priority IS 'Priorité: low, medium, high, urgent';
COMMENT ON COLUMN notifications.category IS 'Catégorie fonctionnelle pour le filtrage';
COMMENT ON COLUMN notifications.action_url IS 'URL optionnelle pour action au clic';
COMMENT ON COLUMN notifications.is_read IS 'Statut de lecture de la notification';
COMMENT ON COLUMN notifications.read_at IS 'Timestamp de lecture';
COMMENT ON COLUMN notifications.created_by IS 'Utilisateur ou système ayant créé la notification';

-- Exemple d'utilisation :
-- SELECT generate_test_notifications('user-uuid-here', 10);
-- SELECT create_group_notification('group-uuid', 'Maintenance', 'Système en maintenance ce soir', 'warning', 'high');
-- SELECT cleanup_old_notifications(30); -- Nettoie les notifications lues de plus de 30 jours

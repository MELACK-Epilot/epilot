-- =====================================================
-- SYSTÈME DE COMMUNICATION E-PILOT
-- Gestion de +500 groupes scolaires
-- Tickets, Messagerie, Annonces, Plaintes
-- Date: 2025-11-27
-- =====================================================

-- =====================================================
-- 1. TABLE: tickets (Plaintes et Support)
-- =====================================================
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informations de base
  ticket_number VARCHAR(20) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  
  -- Classification
  category VARCHAR(50) NOT NULL DEFAULT 'autre' 
    CHECK (category IN ('technique', 'pedagogique', 'financier', 'administratif', 'plainte', 'suggestion', 'autre')),
  priority VARCHAR(20) NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent', 'critical')),
  status VARCHAR(20) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'waiting_response', 'resolved', 'closed', 'cancelled')),
  
  -- Relations
  school_group_id UUID REFERENCES school_groups(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- SLA et métriques
  sla_deadline TIMESTAMP WITH TIME ZONE,
  first_response_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  
  -- Métadonnées
  tags TEXT[] DEFAULT '{}',
  attachments JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Séquence pour numéro de ticket
CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 1000;

-- Fonction pour générer le numéro de ticket
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ticket_number := 'TKT-' || LPAD(nextval('ticket_number_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_ticket_number
  BEFORE INSERT ON tickets
  FOR EACH ROW
  WHEN (NEW.ticket_number IS NULL)
  EXECUTE FUNCTION generate_ticket_number();

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_school_group ON tickets(school_group_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category);

-- =====================================================
-- 2. TABLE: ticket_comments (Réponses aux tickets)
-- =====================================================
CREATE TABLE IF NOT EXISTS ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE, -- Note interne (non visible par le client)
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket ON ticket_comments(ticket_id);

-- =====================================================
-- 3. TABLE: messages (Messagerie directe)
-- =====================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Type de message
  message_type VARCHAR(20) NOT NULL DEFAULT 'direct'
    CHECK (message_type IN ('direct', 'group', 'broadcast', 'system')),
  
  -- Contenu
  subject VARCHAR(255),
  content TEXT NOT NULL,
  content_html TEXT, -- Version HTML pour les messages riches
  
  -- Expéditeur
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Destinataires (pour broadcast)
  recipient_type VARCHAR(20) DEFAULT 'user'
    CHECK (recipient_type IN ('user', 'group', 'role', 'all')),
  recipient_filter JSONB DEFAULT '{}', -- Filtres pour ciblage (plan, région, etc.)
  
  -- Métadonnées
  priority VARCHAR(20) DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  attachments JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  
  -- Planification
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Statut
  status VARCHAR(20) DEFAULT 'sent'
    CHECK (status IN ('draft', 'scheduled', 'sent', 'delivered', 'failed')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(message_type);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- =====================================================
-- 4. TABLE: message_recipients (Destinataires)
-- =====================================================
CREATE TABLE IF NOT EXISTS message_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Statut de lecture
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Statut de livraison
  is_delivered BOOLEAN DEFAULT FALSE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  
  -- Actions
  is_archived BOOLEAN DEFAULT FALSE,
  is_starred BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(message_id, recipient_id)
);

CREATE INDEX IF NOT EXISTS idx_message_recipients_recipient ON message_recipients(recipient_id);
CREATE INDEX IF NOT EXISTS idx_message_recipients_message ON message_recipients(message_id);
CREATE INDEX IF NOT EXISTS idx_message_recipients_unread ON message_recipients(recipient_id, is_read) WHERE is_read = FALSE;

-- =====================================================
-- 5. TABLE: announcements (Annonces officielles)
-- =====================================================
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Contenu
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  content_html TEXT,
  excerpt VARCHAR(500),
  
  -- Classification
  type VARCHAR(30) NOT NULL DEFAULT 'info'
    CHECK (type IN ('info', 'update', 'maintenance', 'alert', 'promotion', 'event')),
  priority VARCHAR(20) DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  
  -- Ciblage
  target_audience VARCHAR(30) DEFAULT 'all'
    CHECK (target_audience IN ('all', 'super_admin', 'admin_groupe', 'specific_groups', 'specific_plans')),
  target_groups UUID[] DEFAULT '{}',
  target_plans TEXT[] DEFAULT '{}',
  
  -- Affichage
  is_pinned BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  show_popup BOOLEAN DEFAULT FALSE,
  
  -- Dates
  published_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Auteur
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Métadonnées
  attachments JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  view_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_type ON announcements(type);
CREATE INDEX IF NOT EXISTS idx_announcements_pinned ON announcements(is_pinned) WHERE is_pinned = TRUE;

-- =====================================================
-- 6. TABLE: announcement_reads (Lectures d'annonces)
-- =====================================================
CREATE TABLE IF NOT EXISTS announcement_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(announcement_id, user_id)
);

-- =====================================================
-- 7. TABLE: message_templates (Modèles de messages)
-- =====================================================
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL DEFAULT 'general'
    CHECK (category IN ('general', 'support', 'billing', 'onboarding', 'notification', 'marketing')),
  
  subject VARCHAR(255),
  content TEXT NOT NULL,
  content_html TEXT,
  
  -- Variables disponibles
  variables JSONB DEFAULT '[]', -- [{name: 'group_name', description: 'Nom du groupe'}]
  
  -- Métadonnées
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. VUES pour faciliter les requêtes
-- =====================================================

-- Vue détaillée des tickets
CREATE OR REPLACE VIEW tickets_detailed AS
SELECT 
  t.*,
  p_creator.first_name || ' ' || p_creator.last_name AS created_by_name,
  p_creator.email AS created_by_email,
  p_creator.avatar_url AS created_by_avatar,
  p_creator.role AS created_by_role,
  sg.name AS school_group_name,
  sg.code AS school_group_code,
  p_assigned.first_name || ' ' || p_assigned.last_name AS assigned_to_name,
  p_assigned.avatar_url AS assigned_to_avatar,
  (SELECT COUNT(*) FROM ticket_comments tc WHERE tc.ticket_id = t.id) AS comments_count,
  EXTRACT(EPOCH FROM (COALESCE(t.first_response_at, NOW()) - t.created_at)) / 3600 AS hours_to_first_response,
  EXTRACT(EPOCH FROM (COALESCE(t.resolved_at, NOW()) - t.created_at)) / 3600 AS hours_to_resolution
FROM tickets t
LEFT JOIN profiles p_creator ON t.created_by = p_creator.id
LEFT JOIN profiles p_assigned ON t.assigned_to = p_assigned.id
LEFT JOIN school_groups sg ON t.school_group_id = sg.id;

-- Vue des statistiques des tickets
CREATE OR REPLACE VIEW tickets_stats AS
SELECT 
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE status = 'open') AS open,
  COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
  COUNT(*) FILTER (WHERE status = 'waiting_response') AS waiting_response,
  COUNT(*) FILTER (WHERE status = 'resolved') AS resolved,
  COUNT(*) FILTER (WHERE status = 'closed') AS closed,
  COUNT(*) FILTER (WHERE priority = 'urgent' OR priority = 'critical') AS urgent,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') AS today,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS this_week,
  AVG(EXTRACT(EPOCH FROM (COALESCE(first_response_at, NOW()) - created_at)) / 3600) 
    FILTER (WHERE first_response_at IS NOT NULL) AS avg_first_response_hours,
  AVG(EXTRACT(EPOCH FROM (COALESCE(resolved_at, NOW()) - created_at)) / 3600) 
    FILTER (WHERE resolved_at IS NOT NULL) AS avg_resolution_hours
FROM tickets;

-- Vue des messages avec détails
CREATE OR REPLACE VIEW messages_detailed AS
SELECT 
  m.*,
  p_sender.first_name || ' ' || p_sender.last_name AS sender_name,
  p_sender.email AS sender_email,
  p_sender.avatar_url AS sender_avatar,
  p_sender.role AS sender_role,
  (SELECT COUNT(*) FROM message_recipients mr WHERE mr.message_id = m.id) AS recipients_count,
  (SELECT COUNT(*) FROM message_recipients mr WHERE mr.message_id = m.id AND mr.is_read = TRUE) AS read_count
FROM messages m
LEFT JOIN profiles p_sender ON m.sender_id = p_sender.id;

-- Vue des statistiques de messagerie
CREATE OR REPLACE VIEW messaging_stats AS
SELECT 
  (SELECT COUNT(*) FROM messages WHERE status = 'sent') AS total_sent,
  (SELECT COUNT(*) FROM message_recipients WHERE is_read = FALSE) AS total_unread,
  (SELECT COUNT(*) FROM messages WHERE message_type = 'broadcast') AS total_broadcasts,
  (SELECT COUNT(*) FROM messages WHERE created_at >= NOW() - INTERVAL '24 hours') AS sent_today,
  (SELECT COUNT(*) FROM messages WHERE created_at >= NOW() - INTERVAL '7 days') AS sent_this_week;

-- =====================================================
-- 9. FONCTIONS RPC
-- =====================================================

-- Créer un ticket
CREATE OR REPLACE FUNCTION create_ticket(
  p_title VARCHAR(255),
  p_description TEXT,
  p_category VARCHAR(50) DEFAULT 'autre',
  p_priority VARCHAR(20) DEFAULT 'medium',
  p_school_group_id UUID DEFAULT NULL,
  p_attachments JSONB DEFAULT '[]'
)
RETURNS UUID AS $$
DECLARE
  v_ticket_id UUID;
  v_user_id UUID;
  v_sla_hours INTEGER;
BEGIN
  -- Récupérer l'utilisateur courant
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifié';
  END IF;
  
  -- Calculer le SLA selon la priorité
  v_sla_hours := CASE p_priority
    WHEN 'critical' THEN 2
    WHEN 'urgent' THEN 4
    WHEN 'high' THEN 24
    WHEN 'medium' THEN 48
    ELSE 72
  END;
  
  -- Créer le ticket
  INSERT INTO tickets (
    title, description, category, priority, 
    school_group_id, created_by, attachments,
    sla_deadline
  ) VALUES (
    p_title, p_description, p_category, p_priority,
    p_school_group_id, v_user_id, p_attachments,
    NOW() + (v_sla_hours || ' hours')::INTERVAL
  )
  RETURNING id INTO v_ticket_id;
  
  RETURN v_ticket_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Répondre à un ticket
CREATE OR REPLACE FUNCTION add_ticket_comment(
  p_ticket_id UUID,
  p_content TEXT,
  p_is_internal BOOLEAN DEFAULT FALSE,
  p_attachments JSONB DEFAULT '[]'
)
RETURNS UUID AS $$
DECLARE
  v_comment_id UUID;
  v_user_id UUID;
  v_ticket_status VARCHAR(20);
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifié';
  END IF;
  
  -- Vérifier que le ticket existe
  SELECT status INTO v_ticket_status FROM tickets WHERE id = p_ticket_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket non trouvé';
  END IF;
  
  -- Ajouter le commentaire
  INSERT INTO ticket_comments (ticket_id, user_id, content, is_internal, attachments)
  VALUES (p_ticket_id, v_user_id, p_content, p_is_internal, p_attachments)
  RETURNING id INTO v_comment_id;
  
  -- Mettre à jour first_response_at si c'est la première réponse d'un admin
  UPDATE tickets 
  SET 
    first_response_at = COALESCE(first_response_at, NOW()),
    status = CASE WHEN status = 'open' THEN 'in_progress' ELSE status END,
    updated_at = NOW()
  WHERE id = p_ticket_id
    AND first_response_at IS NULL
    AND EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id AND role = 'super_admin');
  
  RETURN v_comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mettre à jour le statut d'un ticket
CREATE OR REPLACE FUNCTION update_ticket_status(
  p_ticket_id UUID,
  p_status VARCHAR(20),
  p_comment TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  UPDATE tickets SET
    status = p_status,
    resolved_at = CASE WHEN p_status = 'resolved' THEN NOW() ELSE resolved_at END,
    closed_at = CASE WHEN p_status = 'closed' THEN NOW() ELSE closed_at END,
    updated_at = NOW()
  WHERE id = p_ticket_id;
  
  -- Ajouter un commentaire système si fourni
  IF p_comment IS NOT NULL THEN
    INSERT INTO ticket_comments (ticket_id, user_id, content, is_internal)
    VALUES (p_ticket_id, v_user_id, p_comment, FALSE);
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Envoyer un message broadcast
CREATE OR REPLACE FUNCTION send_broadcast_message(
  p_subject VARCHAR(255),
  p_content TEXT,
  p_recipient_type VARCHAR(20) DEFAULT 'all',
  p_recipient_filter JSONB DEFAULT '{}',
  p_priority VARCHAR(20) DEFAULT 'normal'
)
RETURNS UUID AS $$
DECLARE
  v_message_id UUID;
  v_user_id UUID;
  v_recipient RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifié';
  END IF;
  
  -- Vérifier que l'utilisateur est super_admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id AND role = 'super_admin') THEN
    RAISE EXCEPTION 'Seul un Super Admin peut envoyer des broadcasts';
  END IF;
  
  -- Créer le message
  INSERT INTO messages (
    message_type, subject, content, sender_id, 
    recipient_type, recipient_filter, priority, status, sent_at
  ) VALUES (
    'broadcast', p_subject, p_content, v_user_id,
    p_recipient_type, p_recipient_filter, p_priority, 'sent', NOW()
  )
  RETURNING id INTO v_message_id;
  
  -- Ajouter les destinataires selon le type
  IF p_recipient_type = 'all' THEN
    INSERT INTO message_recipients (message_id, recipient_id)
    SELECT v_message_id, id FROM profiles WHERE role != 'super_admin';
  ELSIF p_recipient_type = 'role' THEN
    INSERT INTO message_recipients (message_id, recipient_id)
    SELECT v_message_id, id FROM profiles 
    WHERE role = (p_recipient_filter->>'role')::TEXT;
  ELSIF p_recipient_type = 'group' THEN
    INSERT INTO message_recipients (message_id, recipient_id)
    SELECT v_message_id, id FROM profiles 
    WHERE school_group_id = ANY(
      SELECT jsonb_array_elements_text(p_recipient_filter->'group_ids')::UUID
    );
  END IF;
  
  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. RLS Policies
-- =====================================================

-- Activer RLS
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Policies pour tickets
CREATE POLICY "super_admin_all_tickets" ON tickets FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

CREATE POLICY "users_own_tickets" ON tickets FOR SELECT
  USING (created_by = auth.uid() OR school_group_id IN (
    SELECT school_group_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "users_create_tickets" ON tickets FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Policies pour messages
CREATE POLICY "super_admin_all_messages" ON messages FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

CREATE POLICY "users_sent_messages" ON messages FOR SELECT
  USING (sender_id = auth.uid());

CREATE POLICY "users_received_messages" ON message_recipients FOR SELECT
  USING (recipient_id = auth.uid());

-- Policies pour annonces
CREATE POLICY "super_admin_manage_announcements" ON announcements FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

CREATE POLICY "users_view_published_announcements" ON announcements FOR SELECT
  USING (is_published = TRUE AND (expires_at IS NULL OR expires_at > NOW()));

-- =====================================================
-- 11. Données initiales (Templates)
-- =====================================================
INSERT INTO message_templates (name, description, category, subject, content, variables) VALUES
('Bienvenue', 'Message de bienvenue pour les nouveaux groupes', 'onboarding', 
 'Bienvenue sur E-Pilot, {{group_name}} !',
 'Bonjour {{admin_name}},\n\nNous sommes ravis de vous accueillir sur E-Pilot ! Votre groupe scolaire {{group_name}} est maintenant actif.\n\nVotre plan actuel : {{plan_name}}\n\nN''hésitez pas à nous contacter si vous avez des questions.\n\nL''équipe E-Pilot 🇨🇬',
 '[{"name": "group_name", "description": "Nom du groupe scolaire"}, {"name": "admin_name", "description": "Nom de l''administrateur"}, {"name": "plan_name", "description": "Nom du plan"}]'
),
('Maintenance planifiée', 'Notification de maintenance', 'notification',
 '🔧 Maintenance planifiée - {{date}}',
 'Bonjour,\n\nUne maintenance est planifiée le {{date}} de {{start_time}} à {{end_time}}.\n\nLa plateforme sera temporairement indisponible.\n\nMerci de votre compréhension.\n\nL''équipe E-Pilot',
 '[{"name": "date", "description": "Date de maintenance"}, {"name": "start_time", "description": "Heure de début"}, {"name": "end_time", "description": "Heure de fin"}]'
),
('Rappel de paiement', 'Rappel pour facture impayée', 'billing',
 '💳 Rappel : Facture en attente',
 'Bonjour {{admin_name}},\n\nNous vous rappelons que votre facture de {{amount}} FCFA pour le mois de {{month}} est en attente de paiement.\n\nMerci de régulariser votre situation pour continuer à profiter de tous les services E-Pilot.\n\nCordialement,\nL''équipe E-Pilot',
 '[{"name": "admin_name", "description": "Nom de l''administrateur"}, {"name": "amount", "description": "Montant"}, {"name": "month", "description": "Mois concerné"}]'
)
ON CONFLICT DO NOTHING;

-- Accorder les permissions
GRANT SELECT ON tickets_detailed TO authenticated;
GRANT SELECT ON tickets_stats TO authenticated;
GRANT SELECT ON messages_detailed TO authenticated;
GRANT SELECT ON messaging_stats TO authenticated;

SELECT 'Système de communication créé avec succès!' AS result;

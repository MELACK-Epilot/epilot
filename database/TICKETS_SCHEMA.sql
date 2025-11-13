-- =====================================================
-- SCHÉMA SQL TICKETS E-PILOT CONGO
-- Module: Communication - Système de tickets support
-- Version: 1.0
-- Date: 30 octobre 2025
-- =====================================================

-- =====================================================
-- 1. TYPES ENUM
-- =====================================================

-- Catégorie de ticket
CREATE TYPE ticket_category AS ENUM ('technique', 'pedagogique', 'financier', 'administratif', 'autre');

-- Priorité du ticket
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Statut du ticket
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');

-- =====================================================
-- 2. TABLES PRINCIPALES
-- =====================================================

-- Table des tickets
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number VARCHAR(20) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  category ticket_category NOT NULL,
  priority ticket_priority NOT NULL DEFAULT 'medium',
  status ticket_status NOT NULL DEFAULT 'open',
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  school_group_id UUID REFERENCES school_groups(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  resolution_time_minutes INTEGER, -- Temps de résolution en minutes
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Table des commentaires de tickets
CREATE TABLE IF NOT EXISTS ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE, -- Commentaire interne (non visible par le créateur)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des pièces jointes de tickets
CREATE TABLE IF NOT EXISTS ticket_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL,
  file_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table de l'historique des changements de statut
CREATE TABLE IF NOT EXISTS ticket_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  old_status ticket_status,
  new_status ticket_status NOT NULL,
  changed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des assignations de tickets (historique)
CREATE TABLE IF NOT EXISTS ticket_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unassigned_at TIMESTAMP WITH TIME ZONE
);

-- Table des watchers (observateurs de tickets)
CREATE TABLE IF NOT EXISTS ticket_watchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ticket_id, user_id)
);

-- =====================================================
-- 3. INDEX POUR PERFORMANCE
-- =====================================================

-- Tickets
CREATE INDEX IF NOT EXISTS idx_tickets_number ON tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_school_group ON tickets(school_group_id);
CREATE INDEX IF NOT EXISTS idx_tickets_school ON tickets(school_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_open ON tickets(status) WHERE status IN ('open', 'in_progress');

-- Commentaires
CREATE INDEX IF NOT EXISTS idx_comments_ticket ON ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON ticket_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON ticket_comments(created_at DESC);

-- Pièces jointes
CREATE INDEX IF NOT EXISTS idx_attachments_ticket ON ticket_attachments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_by ON ticket_attachments(uploaded_by);

-- Historique statut
CREATE INDEX IF NOT EXISTS idx_status_history_ticket ON ticket_status_history(ticket_id);
CREATE INDEX IF NOT EXISTS idx_status_history_changed ON ticket_status_history(changed_at DESC);

-- Assignations
CREATE INDEX IF NOT EXISTS idx_assignments_ticket ON ticket_assignments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_assignments_user ON ticket_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_assignments_active ON ticket_assignments(assigned_to) WHERE unassigned_at IS NULL;

-- Watchers
CREATE INDEX IF NOT EXISTS idx_watchers_ticket ON ticket_watchers(ticket_id);
CREATE INDEX IF NOT EXISTS idx_watchers_user ON ticket_watchers(user_id);

-- =====================================================
-- 4. VUES SQL
-- =====================================================

-- Vue des tickets avec détails complets
CREATE OR REPLACE VIEW tickets_with_details AS
SELECT 
  t.id,
  t.ticket_number,
  t.title,
  t.description,
  t.category,
  t.priority,
  t.status,
  t.created_at,
  t.updated_at,
  t.resolved_at,
  t.closed_at,
  t.resolution_time_minutes,
  -- Créateur
  creator.id as creator_id,
  CONCAT(creator.first_name, ' ', creator.last_name) as creator_name,
  creator.email as creator_email,
  creator.avatar as creator_avatar,
  creator.role as creator_role,
  -- Assigné à
  assignee.id as assignee_id,
  CONCAT(assignee.first_name, ' ', assignee.last_name) as assignee_name,
  assignee.email as assignee_email,
  assignee.avatar as assignee_avatar,
  -- Groupe scolaire
  sg.id as school_group_id,
  sg.name as school_group_name,
  -- École
  s.id as school_id,
  s.name as school_name,
  -- Statistiques
  COUNT(DISTINCT tc.id) as comments_count,
  COUNT(DISTINCT ta.id) as attachments_count,
  COUNT(DISTINCT tw.id) as watchers_count
FROM tickets t
JOIN users creator ON t.created_by = creator.id
LEFT JOIN users assignee ON t.assigned_to = assignee.id
LEFT JOIN school_groups sg ON t.school_group_id = sg.id
LEFT JOIN schools s ON t.school_id = s.id
LEFT JOIN ticket_comments tc ON t.id = tc.ticket_id
LEFT JOIN ticket_attachments ta ON t.id = ta.ticket_id
LEFT JOIN ticket_watchers tw ON t.id = tw.ticket_id
GROUP BY t.id, creator.id, assignee.id, sg.id, s.id;

-- Vue des statistiques globales des tickets
CREATE OR REPLACE VIEW tickets_global_stats AS
SELECT 
  COUNT(*) as total_tickets,
  COUNT(*) FILTER (WHERE status = 'open') as open_tickets,
  COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_tickets,
  COUNT(*) FILTER (WHERE status = 'resolved') as resolved_tickets,
  COUNT(*) FILTER (WHERE status = 'closed') as closed_tickets,
  COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_tickets,
  COUNT(*) FILTER (WHERE priority = 'high') as high_priority_tickets,
  AVG(resolution_time_minutes) FILTER (WHERE resolution_time_minutes IS NOT NULL) as avg_resolution_time_minutes,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as tickets_last_7_days,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as tickets_last_30_days
FROM tickets;

-- Vue des statistiques par catégorie
CREATE OR REPLACE VIEW tickets_stats_by_category AS
SELECT 
  category,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'open') as open_count,
  COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_count,
  COUNT(*) FILTER (WHERE status = 'resolved') as resolved_count,
  COUNT(*) FILTER (WHERE status = 'closed') as closed_count,
  AVG(resolution_time_minutes) FILTER (WHERE resolution_time_minutes IS NOT NULL) as avg_resolution_time
FROM tickets
GROUP BY category;

-- Vue des statistiques par priorité
CREATE OR REPLACE VIEW tickets_stats_by_priority AS
SELECT 
  priority,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status IN ('open', 'in_progress')) as active_count,
  AVG(resolution_time_minutes) FILTER (WHERE resolution_time_minutes IS NOT NULL) as avg_resolution_time
FROM tickets
GROUP BY priority;

-- Vue des statistiques par utilisateur
CREATE OR REPLACE VIEW tickets_stats_by_user AS
SELECT 
  u.id as user_id,
  CONCAT(u.first_name, ' ', u.last_name) as full_name,
  COUNT(DISTINCT t_created.id) as tickets_created,
  COUNT(DISTINCT t_assigned.id) as tickets_assigned,
  COUNT(DISTINCT t_assigned.id) FILTER (WHERE t_assigned.status IN ('open', 'in_progress')) as active_assigned,
  AVG(t_assigned.resolution_time_minutes) FILTER (WHERE t_assigned.resolution_time_minutes IS NOT NULL) as avg_resolution_time
FROM users u
LEFT JOIN tickets t_created ON u.id = t_created.created_by
LEFT JOIN tickets t_assigned ON u.id = t_assigned.assigned_to
GROUP BY u.id;

-- =====================================================
-- 5. FONCTIONS
-- =====================================================

-- Fonction pour générer un numéro de ticket unique
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  -- Format: TICKET-YYYYMMDD-XXXX
  SELECT COUNT(*) + 1 INTO counter
  FROM tickets
  WHERE DATE(created_at) = CURRENT_DATE;
  
  new_number := 'TICKET-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer le temps de résolution
CREATE OR REPLACE FUNCTION calculate_resolution_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    NEW.resolved_at = NOW();
    NEW.resolution_time_minutes = EXTRACT(EPOCH FROM (NOW() - NEW.created_at)) / 60;
  END IF;
  
  IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
    NEW.closed_at = NOW();
    IF NEW.resolved_at IS NULL THEN
      NEW.resolved_at = NOW();
      NEW.resolution_time_minutes = EXTRACT(EPOCH FROM (NOW() - NEW.created_at)) / 60;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour enregistrer les changements de statut
CREATE OR REPLACE FUNCTION log_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    INSERT INTO ticket_status_history (ticket_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour enregistrer les assignations
CREATE OR REPLACE FUNCTION log_assignment_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Marquer l'ancienne assignation comme terminée
  IF OLD.assigned_to IS NOT NULL AND NEW.assigned_to != OLD.assigned_to THEN
    UPDATE ticket_assignments
    SET unassigned_at = NOW()
    WHERE ticket_id = NEW.id
      AND assigned_to = OLD.assigned_to
      AND unassigned_at IS NULL;
  END IF;
  
  -- Créer une nouvelle assignation
  IF NEW.assigned_to IS NOT NULL AND (OLD.assigned_to IS NULL OR NEW.assigned_to != OLD.assigned_to) THEN
    INSERT INTO ticket_assignments (ticket_id, assigned_to, assigned_by)
    VALUES (NEW.id, NEW.assigned_to, auth.uid());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour ajouter automatiquement le créateur comme watcher
CREATE OR REPLACE FUNCTION add_creator_as_watcher()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO ticket_watchers (ticket_id, user_id)
  VALUES (NEW.id, NEW.created_by)
  ON CONFLICT (ticket_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour notifier les watchers (à implémenter avec système de notifications)
CREATE OR REPLACE FUNCTION notify_ticket_watchers()
RETURNS TRIGGER AS $$
BEGIN
  -- TODO: Implémenter la logique de notification
  -- Cette fonction sera appelée lors de changements importants
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. TRIGGERS
-- =====================================================

-- Fonction pour définir le numéro de ticket
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number = generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour générer le numéro de ticket
DROP TRIGGER IF EXISTS trigger_generate_ticket_number ON tickets;
CREATE TRIGGER trigger_generate_ticket_number
  BEFORE INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_number();

-- Trigger updated_at sur tickets
DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_updated_at();

-- Trigger updated_at sur commentaires
DROP TRIGGER IF EXISTS update_comments_updated_at ON ticket_comments;
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON ticket_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_updated_at();

-- Trigger pour calculer le temps de résolution
DROP TRIGGER IF EXISTS trigger_calculate_resolution ON tickets;
CREATE TRIGGER trigger_calculate_resolution
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION calculate_resolution_time();

-- Trigger pour enregistrer les changements de statut
DROP TRIGGER IF EXISTS trigger_log_status ON tickets;
CREATE TRIGGER trigger_log_status
  AFTER UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION log_status_change();

-- Trigger pour enregistrer les assignations
DROP TRIGGER IF EXISTS trigger_log_assignment ON tickets;
CREATE TRIGGER trigger_log_assignment
  AFTER UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION log_assignment_change();

-- Trigger pour ajouter le créateur comme watcher
DROP TRIGGER IF EXISTS trigger_add_creator_watcher ON tickets;
CREATE TRIGGER trigger_add_creator_watcher
  AFTER INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION add_creator_as_watcher();

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_watchers ENABLE ROW LEVEL SECURITY;

-- Politiques pour tickets
CREATE POLICY "Super admins can view all tickets"
  ON tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Users can view tickets they created"
  ON tickets FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Users can view tickets assigned to them"
  ON tickets FOR SELECT
  USING (assigned_to = auth.uid());

CREATE POLICY "Users can view tickets they watch"
  ON tickets FOR SELECT
  USING (
    id IN (
      SELECT ticket_id FROM ticket_watchers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tickets"
  ON tickets FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Ticket creators can update their tickets"
  ON tickets FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Assigned users can update tickets"
  ON tickets FOR UPDATE
  USING (assigned_to = auth.uid());

-- Politiques pour commentaires
CREATE POLICY "Users can view comments on tickets they can see"
  ON ticket_comments FOR SELECT
  USING (
    ticket_id IN (
      SELECT id FROM tickets
      WHERE created_by = auth.uid()
        OR assigned_to = auth.uid()
        OR id IN (SELECT ticket_id FROM ticket_watchers WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can add comments to tickets they can see"
  ON ticket_comments FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND ticket_id IN (
      SELECT id FROM tickets
      WHERE created_by = auth.uid()
        OR assigned_to = auth.uid()
        OR id IN (SELECT ticket_id FROM ticket_watchers WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own comments"
  ON ticket_comments FOR UPDATE
  USING (user_id = auth.uid());

-- Politiques pour pièces jointes
CREATE POLICY "Users can view attachments on tickets they can see"
  ON ticket_attachments FOR SELECT
  USING (
    ticket_id IN (
      SELECT id FROM tickets
      WHERE created_by = auth.uid()
        OR assigned_to = auth.uid()
        OR id IN (SELECT ticket_id FROM ticket_watchers WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can upload attachments to tickets they can see"
  ON ticket_attachments FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND ticket_id IN (
      SELECT id FROM tickets
      WHERE created_by = auth.uid()
        OR assigned_to = auth.uid()
        OR id IN (SELECT ticket_id FROM ticket_watchers WHERE user_id = auth.uid())
    )
  );

-- Politiques pour historique statut
CREATE POLICY "Users can view status history of tickets they can see"
  ON ticket_status_history FOR SELECT
  USING (
    ticket_id IN (
      SELECT id FROM tickets
      WHERE created_by = auth.uid()
        OR assigned_to = auth.uid()
        OR id IN (SELECT ticket_id FROM ticket_watchers WHERE user_id = auth.uid())
    )
  );

-- Politiques pour assignations
CREATE POLICY "Users can view assignments of tickets they can see"
  ON ticket_assignments FOR SELECT
  USING (
    ticket_id IN (
      SELECT id FROM tickets
      WHERE created_by = auth.uid()
        OR assigned_to = auth.uid()
        OR id IN (SELECT ticket_id FROM ticket_watchers WHERE user_id = auth.uid())
    )
  );

-- Politiques pour watchers
CREATE POLICY "Users can view watchers of tickets they can see"
  ON ticket_watchers FOR SELECT
  USING (
    ticket_id IN (
      SELECT id FROM tickets
      WHERE created_by = auth.uid()
        OR assigned_to = auth.uid()
        OR id IN (SELECT ticket_id FROM ticket_watchers WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can add themselves as watchers"
  ON ticket_watchers FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove themselves as watchers"
  ON ticket_watchers FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- 8. COMMENTAIRES
-- =====================================================

COMMENT ON TABLE tickets IS 'Table des tickets de support';
COMMENT ON TABLE ticket_comments IS 'Table des commentaires sur les tickets';
COMMENT ON TABLE ticket_attachments IS 'Table des pièces jointes des tickets';
COMMENT ON TABLE ticket_status_history IS 'Historique des changements de statut';
COMMENT ON TABLE ticket_assignments IS 'Historique des assignations de tickets';
COMMENT ON TABLE ticket_watchers IS 'Table des observateurs de tickets';

-- =====================================================
-- FIN DU SCHÉMA TICKETS
-- =====================================================

-- =====================================================
-- TABLE: resource_requests
-- Description: Demandes de ressources des écoles
-- =====================================================

CREATE TABLE IF NOT EXISTS resource_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  school_group_id UUID NOT NULL REFERENCES school_groups(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Statut de la demande
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'in_progress', 'completed')),
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Informations générales
  title VARCHAR(255) NOT NULL,
  description TEXT,
  notes TEXT,
  
  -- Montant total estimé
  total_estimated_amount DECIMAL(15, 2) DEFAULT 0,
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES users(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Contraintes
  CONSTRAINT fk_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  CONSTRAINT fk_school_group FOREIGN KEY (school_group_id) REFERENCES school_groups(id) ON DELETE CASCADE,
  CONSTRAINT fk_requested_by FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLE: resource_request_items
-- Description: Items individuels d'une demande
-- =====================================================

CREATE TABLE IF NOT EXISTS resource_request_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES resource_requests(id) ON DELETE CASCADE,
  
  -- Informations de la ressource
  resource_name VARCHAR(255) NOT NULL,
  resource_category VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit VARCHAR(50) NOT NULL,
  
  -- Prix
  unit_price DECIMAL(15, 2) NOT NULL CHECK (unit_price >= 0),
  total_price DECIMAL(15, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  
  -- Justification
  justification TEXT,
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contraintes
  CONSTRAINT fk_request FOREIGN KEY (request_id) REFERENCES resource_requests(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLE: resource_request_attachments
-- Description: Fichiers joints aux demandes
-- =====================================================

CREATE TABLE IF NOT EXISTS resource_request_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES resource_requests(id) ON DELETE CASCADE,
  
  -- Informations du fichier
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  file_type VARCHAR(100),
  
  -- Métadonnées
  uploaded_by UUID NOT NULL REFERENCES users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contraintes
  CONSTRAINT fk_request_attachment FOREIGN KEY (request_id) REFERENCES resource_requests(id) ON DELETE CASCADE,
  CONSTRAINT fk_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- =====================================================
-- INDEXES pour optimiser les performances
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_resource_requests_school ON resource_requests(school_id);
CREATE INDEX IF NOT EXISTS idx_resource_requests_group ON resource_requests(school_group_id);
CREATE INDEX IF NOT EXISTS idx_resource_requests_status ON resource_requests(status);
CREATE INDEX IF NOT EXISTS idx_resource_requests_created ON resource_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resource_request_items_request ON resource_request_items(request_id);
CREATE INDEX IF NOT EXISTS idx_resource_request_attachments_request ON resource_request_attachments(request_id);

-- =====================================================
-- TRIGGER pour mettre à jour updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_resource_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_resource_request_updated_at
  BEFORE UPDATE ON resource_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_resource_request_updated_at();

-- =====================================================
-- TRIGGER pour calculer le total de la demande
-- =====================================================

CREATE OR REPLACE FUNCTION update_resource_request_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE resource_requests
  SET total_estimated_amount = (
    SELECT COALESCE(SUM(total_price), 0)
    FROM resource_request_items
    WHERE request_id = COALESCE(NEW.request_id, OLD.request_id)
  )
  WHERE id = COALESCE(NEW.request_id, OLD.request_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_total_on_item_insert
  AFTER INSERT ON resource_request_items
  FOR EACH ROW
  EXECUTE FUNCTION update_resource_request_total();

CREATE TRIGGER trigger_update_total_on_item_update
  AFTER UPDATE ON resource_request_items
  FOR EACH ROW
  EXECUTE FUNCTION update_resource_request_total();

CREATE TRIGGER trigger_update_total_on_item_delete
  AFTER DELETE ON resource_request_items
  FOR EACH ROW
  EXECUTE FUNCTION update_resource_request_total();

-- =====================================================
-- RLS (Row Level Security) Policies
-- =====================================================

ALTER TABLE resource_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_request_attachments ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir les demandes de leur école
CREATE POLICY "Users can view their school requests"
  ON resource_requests
  FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM users WHERE id = auth.uid()
    )
    OR
    school_group_id IN (
      SELECT school_group_id FROM users WHERE id = auth.uid()
    )
  );

-- Policy: Les proviseurs/directeurs peuvent créer des demandes
CREATE POLICY "Directors can create requests"
  ON resource_requests
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE school_id = resource_requests.school_id
      AND role IN ('proviseur', 'directeur', 'directeur_etudes')
    )
  );

-- Policy: Les créateurs peuvent modifier leurs demandes (si pending)
CREATE POLICY "Creators can update pending requests"
  ON resource_requests
  FOR UPDATE
  USING (
    requested_by = auth.uid() 
    AND status = 'pending'
  );

-- Policy: Les admins de groupe peuvent approuver/rejeter
CREATE POLICY "Group admins can manage requests"
  ON resource_requests
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE school_group_id = resource_requests.school_group_id
      AND role = 'admin_groupe'
    )
  );

-- Policy: Items - Lecture
CREATE POLICY "Users can view request items"
  ON resource_request_items
  FOR SELECT
  USING (
    request_id IN (
      SELECT id FROM resource_requests
      WHERE school_id IN (
        SELECT school_id FROM users WHERE id = auth.uid()
      )
      OR school_group_id IN (
        SELECT school_group_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Policy: Items - Création
CREATE POLICY "Users can create request items"
  ON resource_request_items
  FOR INSERT
  WITH CHECK (
    request_id IN (
      SELECT id FROM resource_requests
      WHERE requested_by = auth.uid()
    )
  );

-- Policy: Attachments - Lecture
CREATE POLICY "Users can view attachments"
  ON resource_request_attachments
  FOR SELECT
  USING (
    request_id IN (
      SELECT id FROM resource_requests
      WHERE school_id IN (
        SELECT school_id FROM users WHERE id = auth.uid()
      )
      OR school_group_id IN (
        SELECT school_group_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Policy: Attachments - Création
CREATE POLICY "Users can upload attachments"
  ON resource_request_attachments
  FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND request_id IN (
      SELECT id FROM resource_requests
      WHERE requested_by = auth.uid()
    )
  );

-- =====================================================
-- COMMENTAIRES
-- =====================================================

COMMENT ON TABLE resource_requests IS 'Demandes de ressources des écoles vers les admins de groupe';
COMMENT ON TABLE resource_request_items IS 'Items individuels d''une demande de ressources';
COMMENT ON TABLE resource_request_attachments IS 'Fichiers joints aux demandes de ressources';

COMMENT ON COLUMN resource_requests.status IS 'Statut: pending, approved, rejected, in_progress, completed';
COMMENT ON COLUMN resource_requests.priority IS 'Priorité: low, normal, high, urgent';
COMMENT ON COLUMN resource_request_items.total_price IS 'Prix total calculé automatiquement (quantity * unit_price)';

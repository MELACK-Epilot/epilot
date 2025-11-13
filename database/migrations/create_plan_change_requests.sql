-- Migration : Système de demande de changement de plan
-- Permet aux Admin Groupe de demander un upgrade au Super Admin
-- Date : 2025-11-05

-- Table des demandes de changement de plan
CREATE TABLE IF NOT EXISTS plan_change_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Informations du groupe
  school_group_id UUID NOT NULL REFERENCES school_groups(id) ON DELETE CASCADE,
  
  -- Demandeur
  requested_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  
  -- Plans
  current_plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
  requested_plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  
  -- Détails de la demande
  reason TEXT,
  desired_date DATE,
  estimated_cost DECIMAL(10, 2),
  
  -- Statut
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  
  -- Révision par Super Admin
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_plan_change_requests_school_group ON plan_change_requests(school_group_id);
CREATE INDEX idx_plan_change_requests_status ON plan_change_requests(status);
CREATE INDEX idx_plan_change_requests_requested_by ON plan_change_requests(requested_by);
CREATE INDEX idx_plan_change_requests_created_at ON plan_change_requests(created_at DESC);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_plan_change_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_plan_change_requests_updated_at
  BEFORE UPDATE ON plan_change_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_plan_change_requests_updated_at();

-- Fonction pour créer une demande de changement de plan
CREATE OR REPLACE FUNCTION create_plan_change_request(
  p_school_group_id UUID,
  p_requested_by UUID,
  p_requested_plan_id UUID,
  p_reason TEXT DEFAULT NULL,
  p_desired_date DATE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_request_id UUID;
  v_current_plan_id UUID;
  v_requested_plan_price DECIMAL(10, 2);
BEGIN
  -- Récupérer le plan actuel du groupe (convertir le slug en UUID)
  SELECT p.id INTO v_current_plan_id
  FROM school_groups sg
  JOIN plans p ON p.slug = sg.plan
  WHERE sg.id = p_school_group_id;
  
  -- Récupérer le prix du plan demandé
  SELECT price INTO v_requested_plan_price
  FROM plans
  WHERE id = p_requested_plan_id;
  
  -- Créer la demande
  INSERT INTO plan_change_requests (
    school_group_id,
    requested_by,
    current_plan_id,
    requested_plan_id,
    reason,
    desired_date,
    estimated_cost,
    status
  ) VALUES (
    p_school_group_id,
    p_requested_by,
    v_current_plan_id,
    p_requested_plan_id,
    p_reason,
    p_desired_date,
    v_requested_plan_price,
    'pending'
  )
  RETURNING id INTO v_request_id;
  
  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour approuver une demande
CREATE OR REPLACE FUNCTION approve_plan_change_request(
  p_request_id UUID,
  p_reviewed_by UUID,
  p_review_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_school_group_id UUID;
  v_requested_plan_id UUID;
BEGIN
  -- Récupérer les infos de la demande
  SELECT school_group_id, requested_plan_id
  INTO v_school_group_id, v_requested_plan_id
  FROM plan_change_requests
  WHERE id = p_request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Demande non trouvée ou déjà traitée';
  END IF;
  
  -- Mettre à jour le statut de la demande
  UPDATE plan_change_requests
  SET 
    status = 'approved',
    reviewed_by = p_reviewed_by,
    reviewed_at = NOW(),
    review_notes = p_review_notes
  WHERE id = p_request_id;
  
  -- Mettre à jour le plan du groupe scolaire
  UPDATE school_groups
  SET 
    plan = (SELECT slug FROM plans WHERE id = v_requested_plan_id),
    updated_at = NOW()
  WHERE id = v_school_group_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour refuser une demande
CREATE OR REPLACE FUNCTION reject_plan_change_request(
  p_request_id UUID,
  p_reviewed_by UUID,
  p_review_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE plan_change_requests
  SET 
    status = 'rejected',
    reviewed_by = p_reviewed_by,
    reviewed_at = NOW(),
    review_notes = p_review_notes
  WHERE id = p_request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Demande non trouvée ou déjà traitée';
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour annuler une demande (par le demandeur)
CREATE OR REPLACE FUNCTION cancel_plan_change_request(
  p_request_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE plan_change_requests
  SET status = 'cancelled'
  WHERE id = p_request_id 
    AND requested_by = p_user_id 
    AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Demande non trouvée, déjà traitée ou non autorisée';
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vue pour faciliter les requêtes
CREATE OR REPLACE VIEW plan_change_requests_detailed AS
SELECT 
  pcr.id,
  pcr.school_group_id,
  sg.name AS school_group_name,
  sg.code AS school_group_code,
  pcr.requested_by,
  u_req.first_name || ' ' || u_req.last_name AS requested_by_name,
  u_req.email AS requested_by_email,
  pcr.current_plan_id,
  p_current.name AS current_plan_name,
  p_current.slug AS current_plan_slug,
  p_current.price AS current_plan_price,
  pcr.requested_plan_id,
  p_requested.name AS requested_plan_name,
  p_requested.slug AS requested_plan_slug,
  p_requested.price AS requested_plan_price,
  pcr.reason,
  pcr.desired_date,
  pcr.estimated_cost,
  pcr.status,
  pcr.reviewed_by,
  u_rev.first_name || ' ' || u_rev.last_name AS reviewed_by_name,
  pcr.reviewed_at,
  pcr.review_notes,
  pcr.created_at,
  pcr.updated_at
FROM plan_change_requests pcr
LEFT JOIN school_groups sg ON pcr.school_group_id = sg.id
LEFT JOIN users u_req ON pcr.requested_by = u_req.id
LEFT JOIN users u_rev ON pcr.reviewed_by = u_rev.id
LEFT JOIN plans p_current ON pcr.current_plan_id = p_current.id
LEFT JOIN plans p_requested ON pcr.requested_plan_id = p_requested.id;

-- Permissions RLS (Row Level Security)
ALTER TABLE plan_change_requests ENABLE ROW LEVEL SECURITY;

-- Policy : Super Admin peut tout voir
CREATE POLICY "Super Admin can view all requests"
  ON plan_change_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Policy : Admin Groupe peut voir ses propres demandes
CREATE POLICY "Admin Groupe can view own requests"
  ON plan_change_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.school_group_id = plan_change_requests.school_group_id
      AND users.role = 'admin_groupe'
    )
  );

-- Policy : Admin Groupe peut créer des demandes
CREATE POLICY "Admin Groupe can create requests"
  ON plan_change_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.school_group_id = plan_change_requests.school_group_id
      AND users.role = 'admin_groupe'
    )
  );

-- Policy : Admin Groupe peut annuler ses demandes
CREATE POLICY "Admin Groupe can cancel own requests"
  ON plan_change_requests FOR UPDATE
  USING (
    requested_by = auth.uid()
    AND status = 'pending'
  )
  WITH CHECK (
    status = 'cancelled'
  );

-- Policy : Super Admin peut approuver/refuser
CREATE POLICY "Super Admin can approve/reject requests"
  ON plan_change_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Commentaires
COMMENT ON TABLE plan_change_requests IS 'Demandes de changement de plan d''abonnement par les Admin Groupe';
COMMENT ON COLUMN plan_change_requests.status IS 'pending: en attente, approved: approuvée, rejected: refusée, cancelled: annulée';
COMMENT ON FUNCTION create_plan_change_request IS 'Créer une nouvelle demande de changement de plan';
COMMENT ON FUNCTION approve_plan_change_request IS 'Approuver une demande et mettre à jour le plan du groupe';
COMMENT ON FUNCTION reject_plan_change_request IS 'Refuser une demande de changement de plan';
COMMENT ON FUNCTION cancel_plan_change_request IS 'Annuler une demande (par le demandeur)';

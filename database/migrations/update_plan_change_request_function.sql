-- Mise à jour uniquement de la fonction create_plan_change_request
-- Pour corriger le problème de conversion slug → UUID

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

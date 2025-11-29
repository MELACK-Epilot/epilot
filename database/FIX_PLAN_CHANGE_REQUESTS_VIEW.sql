-- =====================================================
-- FIX: Vue plan_change_requests_detailed
-- Correction pour utiliser subscription_plans au lieu de plans
-- Date: 2025-11-27
-- =====================================================

-- Supprimer l'ancienne vue si elle existe
DROP VIEW IF EXISTS plan_change_requests_detailed CASCADE;

-- Recréer la vue avec subscription_plans
CREATE OR REPLACE VIEW plan_change_requests_detailed AS
SELECT 
  pcr.id,
  pcr.school_group_id,
  sg.name AS school_group_name,
  COALESCE(sg.code, 'N/A') AS school_group_code,
  pcr.requested_by,
  COALESCE(p_req.first_name || ' ' || p_req.last_name, 'Utilisateur inconnu') AS requested_by_name,
  COALESCE(p_req.email, '') AS requested_by_email,
  pcr.current_plan_id,
  COALESCE(sp_current.name, 'Aucun plan') AS current_plan_name,
  COALESCE(sp_current.slug, 'gratuit') AS current_plan_slug,
  COALESCE(sp_current.price, 0) AS current_plan_price,
  pcr.requested_plan_id,
  COALESCE(sp_requested.name, 'Plan inconnu') AS requested_plan_name,
  COALESCE(sp_requested.slug, '') AS requested_plan_slug,
  COALESCE(sp_requested.price, 0) AS requested_plan_price,
  pcr.reason,
  pcr.desired_date,
  COALESCE(pcr.estimated_cost, sp_requested.price, 0) AS estimated_cost,
  pcr.status,
  pcr.reviewed_by,
  CASE 
    WHEN pcr.reviewed_by IS NOT NULL THEN COALESCE(p_rev.first_name || ' ' || p_rev.last_name, 'Admin')
    ELSE NULL
  END AS reviewed_by_name,
  pcr.reviewed_at,
  pcr.review_notes,
  pcr.created_at,
  pcr.updated_at
FROM plan_change_requests pcr
LEFT JOIN school_groups sg ON pcr.school_group_id = sg.id
LEFT JOIN profiles p_req ON pcr.requested_by = p_req.id
LEFT JOIN profiles p_rev ON pcr.reviewed_by = p_rev.id
LEFT JOIN subscription_plans sp_current ON pcr.current_plan_id = sp_current.id
LEFT JOIN subscription_plans sp_requested ON pcr.requested_plan_id = sp_requested.id;

-- Accorder les permissions sur la vue
GRANT SELECT ON plan_change_requests_detailed TO authenticated;

-- =====================================================
-- Vérifier si la table plan_change_requests existe
-- Si non, la créer avec les bonnes références
-- =====================================================

-- Vérifier et corriger les références de clés étrangères
DO $$
BEGIN
  -- Vérifier si la table existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'plan_change_requests') THEN
    -- Créer la table avec les bonnes références
    CREATE TABLE plan_change_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_group_id UUID NOT NULL REFERENCES school_groups(id) ON DELETE CASCADE,
      requested_by UUID NOT NULL,
      current_plan_id UUID,
      requested_plan_id UUID NOT NULL,
      reason TEXT,
      desired_date DATE,
      estimated_cost DECIMAL(10, 2),
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
      reviewed_by UUID,
      reviewed_at TIMESTAMP WITH TIME ZONE,
      review_notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Créer les index
    CREATE INDEX IF NOT EXISTS idx_pcr_school_group ON plan_change_requests(school_group_id);
    CREATE INDEX IF NOT EXISTS idx_pcr_status ON plan_change_requests(status);
    CREATE INDEX IF NOT EXISTS idx_pcr_created_at ON plan_change_requests(created_at DESC);

    -- Activer RLS
    ALTER TABLE plan_change_requests ENABLE ROW LEVEL SECURITY;

    -- Policies
    CREATE POLICY "super_admin_view_all" ON plan_change_requests FOR SELECT
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

    CREATE POLICY "admin_groupe_view_own" ON plan_change_requests FOR SELECT
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND school_group_id = plan_change_requests.school_group_id));

    CREATE POLICY "admin_groupe_insert" ON plan_change_requests FOR INSERT
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin_groupe'));

    CREATE POLICY "super_admin_update" ON plan_change_requests FOR UPDATE
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));
  END IF;
END $$;

-- =====================================================
-- Fonctions RPC corrigées
-- =====================================================

-- Fonction pour créer une demande
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
  -- Récupérer le plan actuel du groupe via subscription
  SELECT s.plan_id INTO v_current_plan_id
  FROM subscriptions s
  WHERE s.school_group_id = p_school_group_id
    AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;
  
  -- Si pas de subscription, essayer via le champ plan du school_group
  IF v_current_plan_id IS NULL THEN
    SELECT sp.id INTO v_current_plan_id
    FROM school_groups sg
    JOIN subscription_plans sp ON sp.slug = sg.plan
    WHERE sg.id = p_school_group_id;
  END IF;
  
  -- Récupérer le prix du plan demandé
  SELECT price INTO v_requested_plan_price
  FROM subscription_plans
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
  v_plan_slug TEXT;
BEGIN
  -- Récupérer les infos de la demande
  SELECT school_group_id, requested_plan_id
  INTO v_school_group_id, v_requested_plan_id
  FROM plan_change_requests
  WHERE id = p_request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Demande non trouvée ou déjà traitée';
  END IF;
  
  -- Récupérer le slug du plan
  SELECT slug INTO v_plan_slug
  FROM subscription_plans
  WHERE id = v_requested_plan_id;
  
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
    plan = v_plan_slug,
    updated_at = NOW()
  WHERE id = v_school_group_id;
  
  -- Mettre à jour ou créer la subscription
  INSERT INTO subscriptions (school_group_id, plan_id, status, start_date)
  VALUES (v_school_group_id, v_requested_plan_id, 'active', NOW())
  ON CONFLICT (school_group_id) 
  DO UPDATE SET 
    plan_id = v_requested_plan_id,
    status = 'active',
    updated_at = NOW();
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
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

-- Fonction pour annuler une demande
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

-- =====================================================
-- Données de test (optionnel - décommenter si besoin)
-- =====================================================
/*
-- Insérer quelques demandes de test
INSERT INTO plan_change_requests (school_group_id, requested_by, current_plan_id, requested_plan_id, reason, status, created_at)
SELECT 
  sg.id,
  (SELECT id FROM profiles WHERE role = 'admin_groupe' LIMIT 1),
  (SELECT id FROM subscription_plans WHERE slug = 'gratuit'),
  (SELECT id FROM subscription_plans WHERE slug = 'premium'),
  'Nous avons besoin de plus de fonctionnalités pour gérer nos 5 écoles',
  'pending',
  NOW() - INTERVAL '2 days'
FROM school_groups sg
LIMIT 1;
*/

SELECT 'Vue plan_change_requests_detailed corrigée avec succès!' AS result;

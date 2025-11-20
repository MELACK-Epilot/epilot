-- Migration: Système de suivi des recommandations appliquées
-- Date: 2025-11-20
-- Description: Table pour tracker l'application et l'impact des recommandations

-- =====================================================
-- 1. CRÉATION DE LA TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS applied_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Informations de la recommandation
  recommendation_id VARCHAR(255) NOT NULL,
  recommendation_type VARCHAR(50) NOT NULL CHECK (recommendation_type IN ('pricing', 'features', 'marketing', 'retention')),
  recommendation_title TEXT NOT NULL,
  recommendation_description TEXT,
  
  -- Plan concerné (optionnel)
  plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL,
  plan_name VARCHAR(255),
  
  -- Impact estimé
  estimated_mrr_impact DECIMAL(12,2),
  estimated_new_clients INTEGER,
  estimated_churn_reduction DECIMAL(5,2),
  
  -- Configuration appliquée
  configuration JSONB,
  
  -- Dates
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  effective_date DATE,
  
  -- Statut
  status VARCHAR(50) DEFAULT 'applied' CHECK (status IN ('applied', 'testing', 'active', 'completed', 'failed', 'cancelled')),
  
  -- Impact réel (mesuré après application)
  actual_mrr_impact DECIMAL(12,2),
  actual_new_clients INTEGER,
  actual_churn_reduction DECIMAL(5,2),
  
  -- Métadonnées
  applied_by UUID REFERENCES auth.users(id),
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. INDEXES POUR PERFORMANCE
-- =====================================================

CREATE INDEX idx_applied_recommendations_plan_id ON applied_recommendations(plan_id);
CREATE INDEX idx_applied_recommendations_type ON applied_recommendations(recommendation_type);
CREATE INDEX idx_applied_recommendations_status ON applied_recommendations(status);
CREATE INDEX idx_applied_recommendations_applied_at ON applied_recommendations(applied_at DESC);
CREATE INDEX idx_applied_recommendations_applied_by ON applied_recommendations(applied_by);

-- Index composite pour requêtes fréquentes
CREATE INDEX idx_applied_recommendations_plan_status ON applied_recommendations(plan_id, status);
CREATE INDEX idx_applied_recommendations_type_status ON applied_recommendations(recommendation_type, status);

-- =====================================================
-- 3. TRIGGER POUR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_applied_recommendations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_applied_recommendations_updated_at
  BEFORE UPDATE ON applied_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_applied_recommendations_updated_at();

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE applied_recommendations ENABLE ROW LEVEL SECURITY;

-- Policy: Super Admin peut tout voir
CREATE POLICY "Super admins can view all applied recommendations"
  ON applied_recommendations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role = 'super_admin'
    )
  );

-- Policy: Admin Groupe peut voir ses recommandations
CREATE POLICY "Admin groupe can view their applied recommendations"
  ON applied_recommendations FOR SELECT
  USING (
    applied_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role = 'admin_groupe'
    )
  );

-- Policy: Admin Groupe peut créer des recommandations
CREATE POLICY "Admin groupe can create applied recommendations"
  ON applied_recommendations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role IN ('super_admin', 'admin_groupe')
    )
  );

-- Policy: Admin Groupe peut mettre à jour ses recommandations
CREATE POLICY "Admin groupe can update their applied recommendations"
  ON applied_recommendations FOR UPDATE
  USING (
    applied_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role = 'super_admin'
    )
  );

-- =====================================================
-- 5. VUE POUR STATISTIQUES
-- =====================================================

CREATE OR REPLACE VIEW applied_recommendations_stats AS
SELECT
  recommendation_type,
  status,
  COUNT(*) as count,
  SUM(estimated_mrr_impact) as total_estimated_mrr_impact,
  SUM(actual_mrr_impact) as total_actual_mrr_impact,
  SUM(estimated_new_clients) as total_estimated_new_clients,
  SUM(actual_new_clients) as total_actual_new_clients,
  AVG(estimated_churn_reduction) as avg_estimated_churn_reduction,
  AVG(actual_churn_reduction) as avg_actual_churn_reduction,
  MIN(applied_at) as first_applied,
  MAX(applied_at) as last_applied
FROM applied_recommendations
GROUP BY recommendation_type, status;

-- =====================================================
-- 6. FONCTION POUR CALCULER L'IMPACT RÉEL
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_actual_impact(
  p_recommendation_id UUID,
  p_days_after INTEGER DEFAULT 30
)
RETURNS JSONB AS $$
DECLARE
  v_recommendation RECORD;
  v_actual_impact JSONB;
  v_mrr_before DECIMAL;
  v_mrr_after DECIMAL;
  v_clients_before INTEGER;
  v_clients_after INTEGER;
BEGIN
  -- Récupérer la recommandation
  SELECT * INTO v_recommendation
  FROM applied_recommendations
  WHERE id = p_recommendation_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Recommendation not found');
  END IF;

  -- Calculer l'impact selon le type
  CASE v_recommendation.recommendation_type
    WHEN 'pricing' THEN
      -- Calculer MRR avant/après
      SELECT 
        COALESCE(SUM(price), 0) INTO v_mrr_before
      FROM school_group_subscriptions
      WHERE plan_id = v_recommendation.plan_id
        AND created_at < v_recommendation.applied_at
        AND status = 'active';

      SELECT 
        COALESCE(SUM(price), 0) INTO v_mrr_after
      FROM school_group_subscriptions
      WHERE plan_id = v_recommendation.plan_id
        AND created_at >= v_recommendation.applied_at
        AND created_at <= v_recommendation.applied_at + (p_days_after || ' days')::INTERVAL
        AND status = 'active';

      v_actual_impact = jsonb_build_object(
        'actual_mrr_impact', v_mrr_after - v_mrr_before,
        'mrr_before', v_mrr_before,
        'mrr_after', v_mrr_after
      );

    WHEN 'marketing' THEN
      -- Calculer nouveaux clients
      SELECT COUNT(*) INTO v_clients_after
      FROM school_group_subscriptions
      WHERE plan_id = v_recommendation.plan_id
        AND created_at >= v_recommendation.applied_at
        AND created_at <= v_recommendation.applied_at + (p_days_after || ' days')::INTERVAL
        AND status = 'active';

      v_actual_impact = jsonb_build_object(
        'actual_new_clients', v_clients_after
      );

    ELSE
      v_actual_impact = jsonb_build_object('message', 'Impact calculation not implemented for this type');
  END CASE;

  -- Mettre à jour la recommandation
  UPDATE applied_recommendations
  SET 
    actual_mrr_impact = (v_actual_impact->>'actual_mrr_impact')::DECIMAL,
    actual_new_clients = (v_actual_impact->>'actual_new_clients')::INTEGER,
    updated_at = NOW()
  WHERE id = p_recommendation_id;

  RETURN v_actual_impact;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. COMMENTAIRES
-- =====================================================

COMMENT ON TABLE applied_recommendations IS 'Suivi des recommandations d''optimisation appliquées';
COMMENT ON COLUMN applied_recommendations.recommendation_id IS 'ID unique de la recommandation (ex: churn-plan-123)';
COMMENT ON COLUMN applied_recommendations.configuration IS 'Configuration JSON utilisée lors de l''application';
COMMENT ON COLUMN applied_recommendations.status IS 'Statut: applied, testing, active, completed, failed, cancelled';
COMMENT ON FUNCTION calculate_actual_impact IS 'Calcule l''impact réel d''une recommandation après N jours';

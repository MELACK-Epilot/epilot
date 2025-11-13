-- =====================================================
-- PARTIE 2/4 : RLS ET FONCTIONS DE BASE
-- =====================================================

-- 1. RLS (Row Level Security)
-- =====================================================

ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

-- Super Admin voit tout
CREATE POLICY "Super Admin can view all alerts"
  ON public.system_alerts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Admin Groupe voit les alertes de son groupe
CREATE POLICY "Admin Groupe can view group alerts"
  ON public.system_alerts FOR SELECT
  TO authenticated
  USING (
    school_group_id IN (
      SELECT school_group_id FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin_groupe'
    )
  );

-- Directeur voit les alertes de son école
CREATE POLICY "Directeur can view school alerts"
  ON public.system_alerts FOR SELECT
  TO authenticated
  USING (
    school_id IN (
      SELECT school_id FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'directeur'
    )
  );

-- Tous peuvent marquer comme lu/résolu
CREATE POLICY "Users can update alerts"
  ON public.system_alerts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin_groupe', 'directeur')
    )
  );

-- 2. FONCTION: Créer une alerte
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_system_alert(
  p_alert_type VARCHAR,
  p_severity VARCHAR,
  p_title TEXT,
  p_message TEXT,
  p_entity_type VARCHAR DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_entity_name TEXT DEFAULT NULL,
  p_action_required BOOLEAN DEFAULT false,
  p_action_url TEXT DEFAULT NULL,
  p_action_label VARCHAR DEFAULT 'Voir détails',
  p_school_group_id UUID DEFAULT NULL,
  p_school_id UUID DEFAULT NULL,
  p_category VARCHAR DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_alert_id UUID;
BEGIN
  -- Vérifier si une alerte similaire existe déjà (éviter les doublons)
  SELECT id INTO v_alert_id
  FROM public.system_alerts
  WHERE alert_type = p_alert_type
    AND entity_type = p_entity_type
    AND entity_id = p_entity_id
    AND resolved_at IS NULL
    AND created_at > NOW() - INTERVAL '24 hours'
  LIMIT 1;
  
  -- Si l'alerte existe déjà, la retourner
  IF v_alert_id IS NOT NULL THEN
    RETURN v_alert_id;
  END IF;
  
  -- Créer la nouvelle alerte
  INSERT INTO public.system_alerts (
    alert_type,
    severity,
    title,
    message,
    entity_type,
    entity_id,
    entity_name,
    action_required,
    action_url,
    action_label,
    school_group_id,
    school_id,
    category,
    metadata
  ) VALUES (
    p_alert_type,
    p_severity,
    p_title,
    p_message,
    p_entity_type,
    p_entity_id,
    p_entity_name,
    p_action_required,
    p_action_url,
    p_action_label,
    p_school_group_id,
    p_school_id,
    p_category,
    p_metadata
  )
  RETURNING id INTO v_alert_id;
  
  RETURN v_alert_id;
END;
$$;

-- 3. FONCTION: Auto-résoudre les alertes obsolètes
-- =====================================================

CREATE OR REPLACE FUNCTION public.auto_resolve_alerts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Résoudre les alertes d'abonnement si l'abonnement est renouvelé
  UPDATE public.system_alerts
  SET resolved_at = NOW()
  WHERE alert_type = 'subscription'
    AND resolved_at IS NULL
    AND entity_id IN (
      SELECT id FROM public.subscriptions
      WHERE status = 'active'
        AND end_date > NOW() + INTERVAL '7 days'
    );
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN v_count;
END;
$$;

-- 4. FONCTION: Nettoyer les vieilles alertes
-- =====================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_alerts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  DELETE FROM public.system_alerts
  WHERE resolved_at IS NOT NULL
    AND resolved_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN v_count;
END;
$$;

SELECT '✅ PARTIE 2/4 : RLS et fonctions de base créées' as status;

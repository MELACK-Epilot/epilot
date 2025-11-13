-- =====================================================
-- PARTIE 1/4 : NETTOYAGE ET CRÉATION TABLE
-- =====================================================

-- 1. NETTOYAGE COMPLET
-- =====================================================

-- Supprimer les vues
DROP VIEW IF EXISTS public.unread_alerts CASCADE;
DROP VIEW IF EXISTS public.alert_stats_by_group CASCADE;
DROP VIEW IF EXISTS public.alert_summary CASCADE;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS public.create_system_alert CASCADE;
DROP FUNCTION IF EXISTS public.check_subscription_alerts CASCADE;
DROP FUNCTION IF EXISTS public.check_user_alerts CASCADE;
DROP FUNCTION IF EXISTS public.check_school_alerts CASCADE;
DROP FUNCTION IF EXISTS public.check_all_alerts CASCADE;
DROP FUNCTION IF EXISTS public.auto_resolve_alerts CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_old_alerts CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column CASCADE;

-- Supprimer la table
DROP TABLE IF EXISTS public.system_alerts CASCADE;

-- 2. CRÉATION TABLE SYSTEM_ALERTS
-- =====================================================

CREATE TABLE public.system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Classification
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('subscription', 'payment', 'user', 'school', 'system', 'security', 'performance')),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'error', 'warning', 'info')),
  category VARCHAR(50),
  
  -- Contenu
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Entité concernée
  entity_type VARCHAR(50),
  entity_id UUID,
  entity_name TEXT,
  
  -- Action
  action_required BOOLEAN DEFAULT false,
  action_url TEXT,
  action_label VARCHAR(100),
  
  -- Contexte
  school_group_id UUID REFERENCES public.school_groups(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  
  -- État
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  read_by UUID REFERENCES public.users(id),
  
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.users(id),
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX idx_alerts_school_group ON public.system_alerts(school_group_id) WHERE resolved_at IS NULL;
CREATE INDEX idx_alerts_school ON public.system_alerts(school_id) WHERE resolved_at IS NULL;
CREATE INDEX idx_alerts_severity ON public.system_alerts(severity) WHERE resolved_at IS NULL;
CREATE INDEX idx_alerts_type ON public.system_alerts(alert_type) WHERE resolved_at IS NULL;
CREATE INDEX idx_alerts_unread ON public.system_alerts(is_read) WHERE is_read = false AND resolved_at IS NULL;
CREATE INDEX idx_alerts_created_at ON public.system_alerts(created_at DESC);
CREATE INDEX idx_alerts_entity ON public.system_alerts(entity_type, entity_id) WHERE resolved_at IS NULL;

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_system_alerts_updated_at
  BEFORE UPDATE ON public.system_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

SELECT '✅ PARTIE 1/4 : Table créée avec succès' as status;

-- =====================================================
-- E-PILOT CONGO - MODULES PÉDAGOGIQUES
-- Structure de la table modules
-- =====================================================

-- 1. TABLE: modules
-- =====================================================
CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
  category_id UUID NOT NULL REFERENCES business_categories(id) ON DELETE RESTRICT,
  icon VARCHAR(50) NOT NULL,
  color VARCHAR(7),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  required_plan VARCHAR(30) NOT NULL DEFAULT 'gratuit',
  features JSONB DEFAULT '[]'::jsonb,
  dependencies JSONB DEFAULT '[]'::jsonb,
  is_core BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  rating DECIMAL(2, 1) DEFAULT 0,
  documentation_url TEXT,
  video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT modules_required_plan_check CHECK (required_plan IN ('gratuit', 'premium', 'pro', 'institutionnel')),
  CONSTRAINT modules_status_check CHECK (status IN ('active', 'inactive', 'beta', 'deprecated')),
  CONSTRAINT modules_rating_check CHECK (rating >= 0 AND rating <= 5)
);

-- 2. TABLE: group_module_configs
-- Configuration des modules par groupe scolaire
-- =====================================================
CREATE TABLE IF NOT EXISTS group_module_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_group_id UUID NOT NULL REFERENCES school_groups(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT true,
  enabled_at TIMESTAMPTZ,
  disabled_at TIMESTAMPTZ,
  enabled_by UUID REFERENCES users(id),
  settings JSONB DEFAULT '{}'::jsonb,
  usage_stats JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(school_group_id, module_id)
);

-- 3. INDEX
-- =====================================================
CREATE INDEX idx_modules_slug ON modules(slug);
CREATE INDEX idx_modules_category ON modules(category_id);
CREATE INDEX idx_modules_status ON modules(status);
CREATE INDEX idx_modules_required_plan ON modules(required_plan);
CREATE INDEX idx_modules_order ON modules(order_index);
CREATE INDEX idx_group_module_configs_school_group ON group_module_configs(school_group_id);
CREATE INDEX idx_group_module_configs_module ON group_module_configs(module_id);
CREATE INDEX idx_group_module_configs_enabled ON group_module_configs(is_enabled);

-- 4. TRIGGERS
-- =====================================================
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_module_configs_updated_at BEFORE UPDATE ON group_module_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour module_count dans business_categories
CREATE OR REPLACE FUNCTION update_category_module_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE business_categories 
    SET module_count = module_count + 1 
    WHERE id = NEW.category_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE business_categories 
    SET module_count = module_count - 1 
    WHERE id = OLD.category_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.category_id != NEW.category_id THEN
    UPDATE business_categories 
    SET module_count = module_count - 1 
    WHERE id = OLD.category_id;
    UPDATE business_categories 
    SET module_count = module_count + 1 
    WHERE id = NEW.category_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_category_module_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON modules
FOR EACH ROW EXECUTE FUNCTION update_category_module_count();

-- 5. ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_module_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super Admin full access on modules" ON modules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

CREATE POLICY "Authenticated users can view modules" ON modules
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Super Admin full access on group_module_configs" ON group_module_configs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- 6. COMMENTAIRES
-- =====================================================
COMMENT ON TABLE modules IS '50 modules pédagogiques organisés par catégories métiers';
COMMENT ON TABLE group_module_configs IS 'Configuration des modules activés par groupe scolaire';
COMMENT ON COLUMN modules.is_core IS 'Module essentiel au fonctionnement de base';
COMMENT ON COLUMN modules.is_premium IS 'Module réservé aux plans premium et supérieurs';
COMMENT ON COLUMN modules.dependencies IS 'IDs des modules requis (dépendances)';
COMMENT ON COLUMN modules.usage_count IS 'Nombre de groupes utilisant ce module';

-- TABLE: user_module_permissions
-- Gère les permissions des utilisateurs sur les modules

-- IMPORTANT: Supprimer la vue si elle existe
DROP VIEW IF EXISTS user_module_permissions CASCADE;

-- Créer la table
CREATE TABLE IF NOT EXISTS user_module_permissions (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL,
  module_slug TEXT NOT NULL,
  category_id UUID REFERENCES business_categories(id) ON DELETE SET NULL,
  category_name TEXT,
  assignment_type TEXT NOT NULL DEFAULT 'direct' CHECK (assignment_type IN ('direct', 'category')),
  can_read BOOLEAN NOT NULL DEFAULT true,
  can_write BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  can_export BOOLEAN NOT NULL DEFAULT false,
  assigned_by UUID NOT NULL REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, module_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_module_permissions_user_id ON user_module_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_module_permissions_module_id ON user_module_permissions(module_id);
CREATE INDEX IF NOT EXISTS idx_user_module_permissions_category_id ON user_module_permissions(category_id);

-- RLS
ALTER TABLE user_module_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own permissions
CREATE POLICY "Users can view own permissions" ON user_module_permissions FOR SELECT USING (auth.uid() = user_id);

-- Policy: Group admins can manage permissions
CREATE POLICY "Group admins manage permissions" ON user_module_permissions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users u1, users u2
    WHERE u1.id = auth.uid() AND u2.id = user_module_permissions.user_id
    AND u1.school_group_id = u2.school_group_id
    AND u1.role IN ('admin_groupe', 'super_admin')
  )
);

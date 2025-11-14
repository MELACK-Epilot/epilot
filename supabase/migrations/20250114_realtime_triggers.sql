-- ============================================
-- TRIGGERS POUR SYNCHRONISATION TEMPS RÉEL
-- Notifie automatiquement les clients des changements
-- ============================================

-- ============================================
-- 1. FONCTION DE NOTIFICATION POUR MODULES
-- ============================================
CREATE OR REPLACE FUNCTION notify_module_change()
RETURNS TRIGGER AS $$
DECLARE
  notification json;
BEGIN
  -- Construire la notification
  notification = json_build_object(
    'table', TG_TABLE_NAME,
    'action', TG_OP,
    'timestamp', NOW(),
    'module_id', COALESCE(NEW.id, OLD.id),
    'module_slug', COALESCE(NEW.slug, OLD.slug),
    'module_name', COALESCE(NEW.name, OLD.name),
    'module_status', COALESCE(NEW.status, OLD.status)
  );

  -- Envoyer la notification
  PERFORM pg_notify('module_changed', notification::text);

  -- Logger l'événement
  INSERT INTO audit_logs (
    table_name,
    action,
    record_id,
    old_data,
    new_data,
    user_id,
    created_at
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    auth.uid(),
    NOW()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. TRIGGER SUR LA TABLE MODULES
-- ============================================
DROP TRIGGER IF EXISTS module_change_trigger ON modules;

CREATE TRIGGER module_change_trigger
AFTER INSERT OR UPDATE OR DELETE ON modules
FOR EACH ROW
EXECUTE FUNCTION notify_module_change();

-- ============================================
-- 3. FONCTION DE NOTIFICATION POUR CATÉGORIES
-- ============================================
CREATE OR REPLACE FUNCTION notify_category_change()
RETURNS TRIGGER AS $$
DECLARE
  notification json;
BEGIN
  -- Construire la notification
  notification = json_build_object(
    'table', TG_TABLE_NAME,
    'action', TG_OP,
    'timestamp', NOW(),
    'category_id', COALESCE(NEW.id, OLD.id),
    'category_slug', COALESCE(NEW.slug, OLD.slug),
    'category_name', COALESCE(NEW.name, OLD.name),
    'category_status', COALESCE(NEW.status, OLD.status)
  );

  -- Envoyer la notification
  PERFORM pg_notify('category_changed', notification::text);

  -- Logger l'événement
  INSERT INTO audit_logs (
    table_name,
    action,
    record_id,
    old_data,
    new_data,
    user_id,
    created_at
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    auth.uid(),
    NOW()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. TRIGGER SUR LA TABLE BUSINESS_CATEGORIES
-- ============================================
DROP TRIGGER IF EXISTS category_change_trigger ON business_categories;

CREATE TRIGGER category_change_trigger
AFTER INSERT OR UPDATE OR DELETE ON business_categories
FOR EACH ROW
EXECUTE FUNCTION notify_category_change();

-- ============================================
-- 5. TABLE AUDIT_LOGS (si elle n'existe pas)
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  action text NOT NULL,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- RLS pour audit_logs (seul le super admin peut voir)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admin can view audit logs" ON audit_logs;
CREATE POLICY "Super admin can view audit logs"
ON audit_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

-- ============================================
-- 6. ACTIVER REALTIME SUR LES TABLES
-- ============================================
-- Activer Realtime pour modules
ALTER PUBLICATION supabase_realtime ADD TABLE modules;

-- Activer Realtime pour business_categories
ALTER PUBLICATION supabase_realtime ADD TABLE business_categories;

-- ============================================
-- 7. COMMENTAIRES
-- ============================================
COMMENT ON FUNCTION notify_module_change() IS 
'Fonction trigger qui notifie les changements sur la table modules via pg_notify et enregistre dans audit_logs';

COMMENT ON FUNCTION notify_category_change() IS 
'Fonction trigger qui notifie les changements sur la table business_categories via pg_notify et enregistre dans audit_logs';

COMMENT ON TABLE audit_logs IS 
'Table d''audit pour tracer tous les changements sur les modules et catégories';

-- ============================================
-- 8. VÉRIFICATION
-- ============================================
-- Vérifier que les triggers sont créés
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name IN ('module_change_trigger', 'category_change_trigger')
ORDER BY event_object_table, trigger_name;

-- Vérifier que Realtime est activé
SELECT 
  schemaname,
  tablename,
  pubname
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename IN ('modules', 'business_categories');

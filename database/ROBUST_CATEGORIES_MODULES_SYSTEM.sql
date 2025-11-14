-- ============================================================================
-- SYSTÈME ROBUSTE DE GESTION CATÉGORIES & MODULES - NIVEAU MONDIAL
-- Inspiré des meilleures pratiques : Salesforce, Microsoft Dynamics, SAP
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1: SYSTÈME DE VERSIONING ET AUDIT
-- ============================================================================

-- Table de versioning des catégories
CREATE TABLE IF NOT EXISTS business_categories_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES business_categories(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  name TEXT NOT NULL,
  description TEXT,
  changes_summary JSONB,
  changed_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT false
);

-- Table de versioning des modules
CREATE TABLE IF NOT EXISTS modules_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES business_categories(id),
  changes_summary JSONB,
  changed_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT false
);

-- ============================================================================
-- ÉTAPE 2: SYSTÈME DE VALIDATION ET CONTRAINTES
-- ============================================================================

-- Fonction de validation des noms de catégories (unicité intelligente)
CREATE OR REPLACE FUNCTION validate_category_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier l'unicité (insensible à la casse et aux espaces)
  IF EXISTS (
    SELECT 1 FROM business_categories 
    WHERE LOWER(TRIM(name)) = LOWER(TRIM(NEW.name))
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'Une catégorie avec ce nom existe déjà: %', NEW.name;
  END IF;
  
  -- Validation du format du nom
  IF LENGTH(TRIM(NEW.name)) < 3 THEN
    RAISE EXCEPTION 'Le nom de la catégorie doit contenir au moins 3 caractères';
  END IF;
  
  -- Normaliser le nom
  NEW.name = TRIM(NEW.name);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction de validation des modules
CREATE OR REPLACE FUNCTION validate_module_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier l'unicité du nom dans la même catégorie
  IF EXISTS (
    SELECT 1 FROM modules 
    WHERE LOWER(TRIM(name)) = LOWER(TRIM(NEW.name))
    AND category_id = NEW.category_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'Un module avec ce nom existe déjà dans cette catégorie: %', NEW.name;
  END IF;
  
  -- Vérifier l'unicité du slug globalement
  IF EXISTS (
    SELECT 1 FROM modules 
    WHERE LOWER(TRIM(slug)) = LOWER(TRIM(NEW.slug))
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'Un module avec ce slug existe déjà: %', NEW.slug;
  END IF;
  
  -- Auto-générer le slug si vide
  IF NEW.slug IS NULL OR TRIM(NEW.slug) = '' THEN
    NEW.slug = LOWER(REPLACE(REPLACE(TRIM(NEW.name), ' ', '-'), '&', 'et'));
  END IF;
  
  -- Normaliser
  NEW.name = TRIM(NEW.name);
  NEW.slug = LOWER(TRIM(NEW.slug));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer les triggers
DROP TRIGGER IF EXISTS validate_category_name_trigger ON business_categories;
CREATE TRIGGER validate_category_name_trigger
  BEFORE INSERT OR UPDATE ON business_categories
  FOR EACH ROW EXECUTE FUNCTION validate_category_name();

DROP TRIGGER IF EXISTS validate_module_name_trigger ON modules;
CREATE TRIGGER validate_module_name_trigger
  BEFORE INSERT OR UPDATE ON modules
  FOR EACH ROW EXECUTE FUNCTION validate_module_name();

-- ============================================================================
-- ÉTAPE 3: SYSTÈME DE LIMITES ET QUOTAS (Enterprise-Grade)
-- ============================================================================

-- Table de configuration des limites
CREATE TABLE IF NOT EXISTS system_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  limit_type TEXT NOT NULL, -- 'categories_max', 'modules_per_category_max', etc.
  limit_value INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insérer les limites par défaut
INSERT INTO system_limits (limit_type, limit_value, description) VALUES
('categories_max', 12, 'Nombre maximum de catégories métiers'),
('modules_per_category_max', 15, 'Nombre maximum de modules par catégorie'),
('modules_total_max', 100, 'Nombre maximum total de modules'),
('category_name_length_max', 50, 'Longueur maximum du nom de catégorie'),
('module_name_length_max', 100, 'Longueur maximum du nom de module')
ON CONFLICT DO NOTHING;

-- Fonction de vérification des limites
CREATE OR REPLACE FUNCTION check_system_limits()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_limit INTEGER;
BEGIN
  -- Vérifier les limites selon le type d'opération
  IF TG_TABLE_NAME = 'business_categories' AND TG_OP = 'INSERT' THEN
    -- Vérifier le nombre maximum de catégories
    SELECT COUNT(*) INTO current_count FROM business_categories;
    SELECT limit_value INTO max_limit FROM system_limits 
    WHERE limit_type = 'categories_max' AND is_active = true;
    
    IF current_count >= max_limit THEN
      RAISE EXCEPTION 'Limite atteinte: Maximum % catégories autorisées', max_limit;
    END IF;
    
  ELSIF TG_TABLE_NAME = 'modules' AND TG_OP = 'INSERT' THEN
    -- Vérifier le nombre maximum de modules par catégorie
    SELECT COUNT(*) INTO current_count FROM modules WHERE category_id = NEW.category_id;
    SELECT limit_value INTO max_limit FROM system_limits 
    WHERE limit_type = 'modules_per_category_max' AND is_active = true;
    
    IF current_count >= max_limit THEN
      RAISE EXCEPTION 'Limite atteinte: Maximum % modules par catégorie', max_limit;
    END IF;
    
    -- Vérifier le nombre maximum total de modules
    SELECT COUNT(*) INTO current_count FROM modules;
    SELECT limit_value INTO max_limit FROM system_limits 
    WHERE limit_type = 'modules_total_max' AND is_active = true;
    
    IF current_count >= max_limit THEN
      RAISE EXCEPTION 'Limite atteinte: Maximum % modules au total', max_limit;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer les triggers de limites
DROP TRIGGER IF EXISTS check_limits_categories ON business_categories;
CREATE TRIGGER check_limits_categories
  BEFORE INSERT ON business_categories
  FOR EACH ROW EXECUTE FUNCTION check_system_limits();

DROP TRIGGER IF EXISTS check_limits_modules ON modules;
CREATE TRIGGER check_limits_modules
  BEFORE INSERT ON modules
  FOR EACH ROW EXECUTE FUNCTION check_system_limits();

-- ============================================================================
-- ÉTAPE 4: SYSTÈME D'AUDIT COMPLET (SOX Compliance)
-- ============================================================================

-- Table d'audit unifiée
CREATE TABLE IF NOT EXISTS categories_modules_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],
  user_id UUID REFERENCES users(id),
  user_role TEXT,
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Index pour performance
  CONSTRAINT valid_operation CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE'))
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_audit_table_record ON categories_modules_audit(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON categories_modules_audit(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON categories_modules_audit(user_id);

-- Fonction d'audit universelle
CREATE OR REPLACE FUNCTION audit_categories_modules()
RETURNS TRIGGER AS $$
DECLARE
  changed_fields TEXT[] := '{}';
  old_record JSONB := '{}'::jsonb;
  new_record JSONB := '{}'::jsonb;
BEGIN
  -- Construire les enregistrements JSON
  IF TG_OP = 'DELETE' THEN
    old_record := row_to_json(OLD)::jsonb;
  ELSIF TG_OP = 'UPDATE' THEN
    old_record := row_to_json(OLD)::jsonb;
    new_record := row_to_json(NEW)::jsonb;
    
    -- Identifier les champs modifiés
    SELECT array_agg(key) INTO changed_fields
    FROM jsonb_each_text(old_record) o
    JOIN jsonb_each_text(new_record) n ON o.key = n.key
    WHERE o.value IS DISTINCT FROM n.value;
    
  ELSIF TG_OP = 'INSERT' THEN
    new_record := row_to_json(NEW)::jsonb;
  END IF;
  
  -- Insérer dans l'audit
  INSERT INTO categories_modules_audit (
    table_name,
    record_id,
    operation,
    old_values,
    new_values,
    changed_fields,
    user_id,
    user_role,
    ip_address,
    session_id
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN old_record = '{}'::jsonb THEN NULL ELSE old_record END,
    CASE WHEN new_record = '{}'::jsonb THEN NULL ELSE new_record END,
    changed_fields,
    COALESCE(current_setting('app.current_user_id', true)::uuid, NULL),
    current_setting('app.current_user_role', true),
    current_setting('app.client_ip', true)::inet,
    current_setting('app.session_id', true)
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Appliquer les triggers d'audit
DROP TRIGGER IF EXISTS audit_categories ON business_categories;
CREATE TRIGGER audit_categories
  AFTER INSERT OR UPDATE OR DELETE ON business_categories
  FOR EACH ROW EXECUTE FUNCTION audit_categories_modules();

DROP TRIGGER IF EXISTS audit_modules ON modules;
CREATE TRIGGER audit_modules
  AFTER INSERT OR UPDATE OR DELETE ON modules
  FOR EACH ROW EXECUTE FUNCTION audit_categories_modules();

-- ============================================================================
-- ÉTAPE 5: SYSTÈME DE SAUVEGARDE ET RESTAURATION
-- ============================================================================

-- Table de snapshots
CREATE TABLE IF NOT EXISTS categories_modules_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_name TEXT NOT NULL,
  categories_data JSONB NOT NULL,
  modules_data JSONB NOT NULL,
  total_categories INTEGER,
  total_modules INTEGER,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  description TEXT
);

-- Fonction de création de snapshot
CREATE OR REPLACE FUNCTION create_categories_modules_snapshot(
  p_snapshot_name TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  snapshot_id UUID;
  categories_json JSONB;
  modules_json JSONB;
  cat_count INTEGER;
  mod_count INTEGER;
BEGIN
  -- Capturer les données
  SELECT jsonb_agg(to_jsonb(bc.*)) INTO categories_json
  FROM business_categories bc;
  
  SELECT jsonb_agg(to_jsonb(m.*)) INTO modules_json
  FROM modules m;
  
  SELECT COUNT(*) INTO cat_count FROM business_categories;
  SELECT COUNT(*) INTO mod_count FROM modules;
  
  -- Créer le snapshot
  INSERT INTO categories_modules_snapshots (
    snapshot_name,
    categories_data,
    modules_data,
    total_categories,
    total_modules,
    created_by,
    description
  ) VALUES (
    p_snapshot_name,
    categories_json,
    modules_json,
    cat_count,
    mod_count,
    COALESCE(current_setting('app.current_user_id', true)::uuid, NULL),
    p_description
  ) RETURNING id INTO snapshot_id;
  
  RETURN snapshot_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ÉTAPE 6: VUES MÉTIERS OPTIMISÉES
-- ============================================================================

-- Vue complète des catégories avec statistiques
CREATE OR REPLACE VIEW v_categories_complete AS
SELECT 
  bc.id,
  bc.name,
  bc.description,
  bc.slug,
  bc.created_at,
  bc.updated_at,
  COUNT(m.id) as modules_count,
  COUNT(CASE WHEN gbc.is_enabled = true THEN 1 END) as active_groups_count,
  COALESCE(
    jsonb_agg(
      DISTINCT jsonb_build_object(
        'id', m.id,
        'name', m.name,
        'slug', m.slug
      )
    ) FILTER (WHERE m.id IS NOT NULL),
    '[]'::jsonb
  ) as modules,
  -- Statistiques d'utilisation
  (
    SELECT COUNT(DISTINCT uac.user_id)
    FROM user_assigned_categories uac
    WHERE uac.category_id = bc.id
  ) as assigned_users_count
FROM business_categories bc
LEFT JOIN modules m ON bc.id = m.category_id
LEFT JOIN group_business_categories gbc ON bc.id = gbc.category_id
GROUP BY bc.id, bc.name, bc.description, bc.slug, bc.created_at, bc.updated_at;

-- Vue complète des modules avec métadonnées
CREATE OR REPLACE VIEW v_modules_complete AS
SELECT 
  m.id,
  m.name,
  m.slug,
  m.description,
  m.category_id,
  bc.name as category_name,
  bc.slug as category_slug,
  m.created_at,
  m.updated_at,
  -- Statistiques d'assignation
  COUNT(DISTINCT uam.user_id) as assigned_users_count,
  COUNT(DISTINCT gmc.school_group_id) as enabled_groups_count,
  -- Permissions moyennes
  AVG(CASE WHEN ump.can_read THEN 1 ELSE 0 END) as avg_read_permission,
  AVG(CASE WHEN ump.can_write THEN 1 ELSE 0 END) as avg_write_permission,
  AVG(CASE WHEN ump.can_delete THEN 1 ELSE 0 END) as avg_delete_permission
FROM modules m
JOIN business_categories bc ON m.category_id = bc.id
LEFT JOIN user_assigned_modules uam ON m.id = uam.module_id
LEFT JOIN group_module_configs gmc ON m.id = gmc.module_id
LEFT JOIN user_module_permissions ump ON m.id = ump.module_id
GROUP BY m.id, m.name, m.slug, m.description, m.category_id, bc.name, bc.slug, m.created_at, m.updated_at;

-- ============================================================================
-- ÉTAPE 7: FONCTIONS D'ADMINISTRATION AVANCÉES
-- ============================================================================

-- Fonction de nettoyage intelligent
CREATE OR REPLACE FUNCTION cleanup_orphaned_data()
RETURNS TABLE(action TEXT, count INTEGER) AS $$
BEGIN
  -- Nettoyer les assignations orphelines
  DELETE FROM user_assigned_modules WHERE module_id NOT IN (SELECT id FROM modules);
  GET DIAGNOSTICS count = ROW_COUNT;
  RETURN QUERY SELECT 'Assignations modules orphelines supprimées'::TEXT, count;
  
  DELETE FROM user_assigned_categories WHERE category_id NOT IN (SELECT id FROM business_categories);
  GET DIAGNOSTICS count = ROW_COUNT;
  RETURN QUERY SELECT 'Assignations catégories orphelines supprimées'::TEXT, count;
  
  -- Nettoyer les configurations orphelines
  DELETE FROM group_module_configs WHERE module_id NOT IN (SELECT id FROM modules);
  GET DIAGNOSTICS count = ROW_COUNT;
  RETURN QUERY SELECT 'Configurations modules orphelines supprimées'::TEXT, count;
  
  DELETE FROM group_business_categories WHERE category_id NOT IN (SELECT id FROM business_categories);
  GET DIAGNOSTICS count = ROW_COUNT;
  RETURN QUERY SELECT 'Configurations catégories orphelines supprimées'::TEXT, count;
END;
$$ LANGUAGE plpgsql;

-- Fonction de validation de l'intégrité
CREATE OR REPLACE FUNCTION validate_data_integrity()
RETURNS TABLE(check_name TEXT, status TEXT, details TEXT) AS $$
BEGIN
  -- Vérifier les modules sans catégorie
  RETURN QUERY
  SELECT 
    'Modules sans catégorie'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'ERREUR' END::TEXT,
    COUNT(*)::TEXT || ' modules orphelins'::TEXT
  FROM modules m
  LEFT JOIN business_categories bc ON m.category_id = bc.id
  WHERE bc.id IS NULL;
  
  -- Vérifier les doublons de noms
  RETURN QUERY
  SELECT 
    'Doublons catégories'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'ATTENTION' END::TEXT,
    COUNT(*)::TEXT || ' doublons détectés'::TEXT
  FROM (
    SELECT name, COUNT(*) as cnt
    FROM business_categories
    GROUP BY LOWER(TRIM(name))
    HAVING COUNT(*) > 1
  ) duplicates;
  
  -- Vérifier les limites
  RETURN QUERY
  SELECT 
    'Limites système'::TEXT,
    CASE 
      WHEN cat_count <= cat_limit AND mod_count <= mod_limit THEN 'OK'
      ELSE 'ATTENTION'
    END::TEXT,
    format('Catégories: %s/%s, Modules: %s/%s', cat_count, cat_limit, mod_count, mod_limit)::TEXT
  FROM (
    SELECT 
      (SELECT COUNT(*) FROM business_categories) as cat_count,
      (SELECT limit_value FROM system_limits WHERE limit_type = 'categories_max') as cat_limit,
      (SELECT COUNT(*) FROM modules) as mod_count,
      (SELECT limit_value FROM system_limits WHERE limit_type = 'modules_total_max') as mod_limit
  ) limits;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FINALISATION
-- ============================================================================

-- Créer un snapshot initial après nettoyage
SELECT create_categories_modules_snapshot(
  'Initial Clean State',
  'État initial après nettoyage et implémentation du système robuste'
);

-- Rapport final
SELECT 
  'SYSTÈME ROBUSTE IMPLÉMENTÉ' as status,
  (SELECT COUNT(*) FROM business_categories) as categories_count,
  (SELECT COUNT(*) FROM modules) as modules_count,
  NOW() as implemented_at;

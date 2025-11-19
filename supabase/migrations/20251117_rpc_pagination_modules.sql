-- =====================================================
-- FONCTION RPC: PAGINATION MODULES
-- Date: 17 Novembre 2025
-- Objectif: Pagination côté serveur pour 2000+ users
-- =====================================================

-- =====================================================
-- 1. FONCTION PAGINATION MODULES
-- =====================================================

CREATE OR REPLACE FUNCTION get_school_group_modules_paginated(
  p_school_group_id UUID,
  p_page INT DEFAULT 1,
  p_page_size INT DEFAULT 50,
  p_search TEXT DEFAULT NULL,
  p_category_id UUID DEFAULT NULL
)
RETURNS TABLE (
  modules JSONB,
  total_count INT,
  page INT,
  page_size INT,
  total_pages INT,
  has_next_page BOOLEAN,
  has_prev_page BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_offset INT;
  v_total INT;
  v_total_pages INT;
BEGIN
  -- Calculer offset
  v_offset := (p_page - 1) * p_page_size;
  
  -- Compter total (avec filtres)
  SELECT COUNT(*) INTO v_total
  FROM modules m
  WHERE m.school_group_id = p_school_group_id
    AND m.deleted_at IS NULL
    AND (p_search IS NULL OR m.name ILIKE '%' || p_search || '%')
    AND (p_category_id IS NULL OR m.category_id = p_category_id);
  
  -- Calculer total pages
  v_total_pages := CEIL(v_total::FLOAT / p_page_size)::INT;
  IF v_total_pages = 0 THEN
    v_total_pages := 1;
  END IF;
  
  -- Retourner résultats paginés
  RETURN QUERY
  SELECT 
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', m.id,
          'name', m.name,
          'description', m.description,
          'icon', m.icon,
          'color', m.color,
          'category_id', m.category_id,
          'category_name', mc.name,
          'category_icon', mc.icon,
          'category_color', mc.color,
          'created_at', m.created_at
        )
        ORDER BY m.name
      ),
      '[]'::jsonb
    ) as modules,
    v_total as total_count,
    p_page as page,
    p_page_size as page_size,
    v_total_pages as total_pages,
    (p_page < v_total_pages) as has_next_page,
    (p_page > 1) as has_prev_page
  FROM (
    SELECT m.*, mc.name as cat_name, mc.icon as cat_icon, mc.color as cat_color
    FROM modules m
    LEFT JOIN module_categories mc ON mc.id = m.category_id
    WHERE m.school_group_id = p_school_group_id
      AND m.deleted_at IS NULL
      AND (p_search IS NULL OR m.name ILIKE '%' || p_search || '%')
      AND (p_category_id IS NULL OR m.category_id = p_category_id)
    ORDER BY m.name
    LIMIT p_page_size
    OFFSET v_offset
  ) m
  LEFT JOIN module_categories mc ON mc.id = m.category_id;
END;
$$;

-- =====================================================
-- 2. FONCTION PAGINATION UTILISATEURS
-- =====================================================

CREATE OR REPLACE FUNCTION get_school_group_users_paginated(
  p_school_group_id UUID,
  p_page INT DEFAULT 1,
  p_page_size INT DEFAULT 50,
  p_search TEXT DEFAULT NULL,
  p_role TEXT DEFAULT NULL,
  p_school_id UUID DEFAULT NULL
)
RETURNS TABLE (
  users JSONB,
  total_count INT,
  page INT,
  page_size INT,
  total_pages INT,
  has_next_page BOOLEAN,
  has_prev_page BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_offset INT;
  v_total INT;
  v_total_pages INT;
BEGIN
  v_offset := (p_page - 1) * p_page_size;
  
  -- Compter total
  SELECT COUNT(*) INTO v_total
  FROM users u
  WHERE u.school_group_id = p_school_group_id
    AND u.deleted_at IS NULL
    AND (p_search IS NULL OR 
         u.first_name ILIKE '%' || p_search || '%' OR
         u.last_name ILIKE '%' || p_search || '%' OR
         u.email ILIKE '%' || p_search || '%')
    AND (p_role IS NULL OR u.role = p_role)
    AND (p_school_id IS NULL OR u.school_id = p_school_id);
  
  v_total_pages := CEIL(v_total::FLOAT / p_page_size)::INT;
  IF v_total_pages = 0 THEN
    v_total_pages := 1;
  END IF;
  
  -- Retourner résultats
  RETURN QUERY
  SELECT 
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', u.id,
          'first_name', u.first_name,
          'last_name', u.last_name,
          'email', u.email,
          'role', u.role,
          'status', u.status,
          'avatar', u.avatar,
          'school_id', u.school_id,
          'school_name', s.name,
          'access_profile_code', u.access_profile_code,
          'assigned_modules_count', (
            SELECT COUNT(*) 
            FROM user_module_permissions ump 
            WHERE ump.user_id = u.id 
            AND ump.deleted_at IS NULL
          ),
          'created_at', u.created_at
        )
        ORDER BY u.last_name, u.first_name
      ),
      '[]'::jsonb
    ) as users,
    v_total as total_count,
    p_page as page,
    p_page_size as page_size,
    v_total_pages as total_pages,
    (p_page < v_total_pages) as has_next_page,
    (p_page > 1) as has_prev_page
  FROM (
    SELECT u.*
    FROM users u
    WHERE u.school_group_id = p_school_group_id
      AND u.deleted_at IS NULL
      AND (p_search IS NULL OR 
           u.first_name ILIKE '%' || p_search || '%' OR
           u.last_name ILIKE '%' || p_search || '%' OR
           u.email ILIKE '%' || p_search || '%')
      AND (p_role IS NULL OR u.role = p_role)
      AND (p_school_id IS NULL OR u.school_id = p_school_id)
    ORDER BY u.last_name, u.first_name
    LIMIT p_page_size
    OFFSET v_offset
  ) u
  LEFT JOIN schools s ON s.id = u.school_id;
END;
$$;

-- =====================================================
-- 3. FONCTION STATS MODULES (optimisée)
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_module_stats_optimized(
  p_user_id UUID
)
RETURNS TABLE (
  total_modules INT,
  assigned_modules INT,
  available_modules INT,
  progress_percentage INT,
  categories_stats JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_school_group_id UUID;
  v_total INT;
  v_assigned INT;
BEGIN
  -- Récupérer school_group_id
  SELECT school_group_id INTO v_school_group_id
  FROM users
  WHERE id = p_user_id;
  
  -- Compter total modules
  SELECT COUNT(*) INTO v_total
  FROM modules m
  WHERE m.school_group_id = v_school_group_id
    AND m.deleted_at IS NULL;
  
  -- Compter assignés
  SELECT COUNT(*) INTO v_assigned
  FROM user_module_permissions ump
  WHERE ump.user_id = p_user_id
    AND ump.deleted_at IS NULL;
  
  -- Retourner stats
  RETURN QUERY
  SELECT 
    v_total as total_modules,
    v_assigned as assigned_modules,
    (v_total - v_assigned) as available_modules,
    CASE 
      WHEN v_total > 0 THEN ROUND((v_assigned::FLOAT / v_total * 100))::INT
      ELSE 0
    END as progress_percentage,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'category_id', mc.id,
            'category_name', mc.name,
            'category_icon', mc.icon,
            'category_color', mc.color,
            'total', cat_stats.total,
            'assigned', cat_stats.assigned
          )
        )
        FROM (
          SELECT 
            m.category_id,
            COUNT(*) as total,
            COUNT(ump.id) as assigned
          FROM modules m
          LEFT JOIN user_module_permissions ump 
            ON ump.module_id = m.id 
            AND ump.user_id = p_user_id
            AND ump.deleted_at IS NULL
          WHERE m.school_group_id = v_school_group_id
            AND m.deleted_at IS NULL
          GROUP BY m.category_id
        ) cat_stats
        JOIN module_categories mc ON mc.id = cat_stats.category_id
      ),
      '[]'::jsonb
    ) as categories_stats;
END;
$$;

-- =====================================================
-- PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION get_school_group_modules_paginated TO authenticated;
GRANT EXECUTE ON FUNCTION get_school_group_users_paginated TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_module_stats_optimized TO authenticated;

-- =====================================================
-- COMMENTAIRES
-- =====================================================

COMMENT ON FUNCTION get_school_group_modules_paginated IS 
'Récupère modules avec pagination côté serveur. Optimisé pour 2000+ users.';

COMMENT ON FUNCTION get_school_group_users_paginated IS 
'Récupère utilisateurs avec pagination côté serveur. Optimisé pour 2000+ users.';

COMMENT ON FUNCTION get_user_module_stats_optimized IS 
'Stats modules utilisateur optimisées avec une seule query.';

-- =====================================================
-- FIN MIGRATION
-- =====================================================

-- Fonction pour récupérer l'utilisation d'un module par école pour un groupe donné
CREATE OR REPLACE FUNCTION get_module_usage_by_school(
  p_school_group_id UUID,
  p_module_id UUID
)
RETURNS TABLE (
  school_id UUID,
  school_name VARCHAR,
  city VARCHAR,
  student_count INTEGER,
  active_users_count BIGINT,
  last_active_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as school_id,
    s.name as school_name,
    s.city,
    s.student_count,
    COUNT(ump.user_id)::bigint as active_users_count,
    MAX(u.last_login) as last_active_at
  FROM schools s
  LEFT JOIN users u ON u.school_id = s.id
  LEFT JOIN user_module_permissions ump ON ump.user_id = u.id AND ump.module_id = p_module_id
  WHERE s.school_group_id = p_school_group_id
  AND s.status = 'active'
  GROUP BY s.id, s.name, s.city, s.student_count
  ORDER BY active_users_count DESC, s.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

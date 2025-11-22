-- Fonction pour récupérer l'évolution des utilisateurs sur les 12 derniers mois
CREATE OR REPLACE FUNCTION get_user_evolution_stats(p_school_group_id UUID DEFAULT NULL)
RETURNS TABLE (
  month_label text,
  user_count bigint
) AS $$
BEGIN
  RETURN QUERY
  WITH months AS (
    SELECT generate_series(
      date_trunc('month', CURRENT_DATE) - INTERVAL '11 months',
      date_trunc('month', CURRENT_DATE),
      '1 month'::interval
    ) as month_start
  )
  SELECT 
    to_char(m.month_start, 'Mon') as month_label,
    COUNT(u.id)::bigint as user_count
  FROM months m
  LEFT JOIN users u ON date_trunc('month', u.created_at) <= m.month_start
  WHERE 
    (p_school_group_id IS NULL OR u.school_group_id = p_school_group_id)
    AND (u.role != 'super_admin') -- Exclure super admin des stats
  GROUP BY m.month_start
  ORDER BY m.month_start;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour récupérer la répartition des utilisateurs
CREATE OR REPLACE FUNCTION get_user_distribution_stats(p_school_group_id UUID DEFAULT NULL)
RETURNS TABLE (
  name text,
  value bigint
) AS $$
BEGIN
  IF p_school_group_id IS NOT NULL THEN
    -- Répartition par école pour un groupe donné
    RETURN QUERY
    SELECT 
      COALESCE(s.name, 'Sans école') as name,
      COUNT(u.id)::bigint as value
    FROM users u
    LEFT JOIN schools s ON u.school_id = s.id
    WHERE u.school_group_id = p_school_group_id
    AND u.role != 'super_admin'
    GROUP BY s.name
    ORDER BY value DESC
    LIMIT 5;
  ELSE
    -- Répartition par groupe scolaire (pour Super Admin)
    RETURN QUERY
    SELECT 
      COALESCE(sg.name, 'Sans groupe') as name,
      COUNT(u.id)::bigint as value
    FROM users u
    LEFT JOIN school_groups sg ON u.school_group_id = sg.id
    WHERE u.role != 'super_admin'
    GROUP BY sg.name
    ORDER BY value DESC
    LIMIT 5;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

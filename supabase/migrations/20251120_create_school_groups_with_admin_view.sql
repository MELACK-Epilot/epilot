/**
 * Migration: Vue school_groups_with_admin
 * Créé le: 2025-11-20
 * Description: Vue pour récupérer les groupes scolaires avec leurs administrateurs
 * IMPORTANT: Utilise LEFT JOIN pour inclure TOUS les groupes, même sans admin
 */

-- Supprimer la vue si elle existe
DROP VIEW IF EXISTS school_groups_with_admin;

-- Créer la vue avec LEFT JOIN
CREATE OR REPLACE VIEW school_groups_with_admin AS
SELECT 
  -- Colonnes du groupe scolaire
  sg.id,
  sg.name,
  sg.code,
  sg.region,
  sg.city,
  sg.address,
  sg.phone,
  sg.website,
  sg.founded_year,
  sg.description,
  sg.logo,
  sg.plan,
  sg.status,
  sg.school_count,
  sg.student_count,
  sg.staff_count,
  sg.created_at,
  sg.updated_at,
  
  -- Colonnes de l'administrateur (NULL si pas d'admin)
  u.id AS admin_id,
  CONCAT(u.first_name, ' ', u.last_name) AS admin_name,
  u.email AS admin_email,
  u.phone AS admin_phone,
  u.avatar AS admin_avatar,
  u.status AS admin_status,
  u.last_login AS admin_last_login

FROM school_groups sg
-- LEFT JOIN pour inclure les groupes SANS admin
LEFT JOIN users u ON (
  u.school_group_id = sg.id 
  AND u.role = 'admin_groupe'
)

-- Ordonner par date de création (plus récents en premier)
ORDER BY sg.created_at DESC;

-- Commentaire
COMMENT ON VIEW school_groups_with_admin IS 'Vue des groupes scolaires avec leurs administrateurs (LEFT JOIN pour inclure tous les groupes)';

-- Grant permissions
GRANT SELECT ON school_groups_with_admin TO authenticated;
GRANT SELECT ON school_groups_with_admin TO anon;

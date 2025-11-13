-- ============================================
-- CRÉER LA VUE school_groups_with_admin
-- ============================================

-- Supprimer la vue si elle existe
DROP VIEW IF EXISTS school_groups_with_admin;

-- Créer la vue avec LEFT JOIN sur users
CREATE VIEW school_groups_with_admin AS
SELECT 
  sg.*,
  u.id AS admin_id,
  CONCAT(u.first_name, ' ', u.last_name) AS admin_name,
  u.email AS admin_email,
  u.phone AS admin_phone,
  u.avatar AS admin_avatar,
  u.status AS admin_status,
  u.last_login AS admin_last_login
FROM school_groups sg
LEFT JOIN users u ON u.school_group_id = sg.id AND u.role = 'admin_groupe'
ORDER BY sg.created_at DESC;

-- ============================================
-- FIN
-- ============================================

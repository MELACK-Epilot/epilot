-- ============================================
-- E-PILOT CONGO - FIX ACTIVITY_LOGS
-- Ajouter school_group_id pour filtrage Admin Groupe
-- ============================================

-- Ajouter colonne school_group_id
ALTER TABLE activity_logs 
ADD COLUMN IF NOT EXISTS school_group_id UUID REFERENCES school_groups(id) ON DELETE CASCADE;

-- Créer index
CREATE INDEX IF NOT EXISTS idx_activity_logs_school_group_id ON activity_logs(school_group_id);

-- Mettre à jour les logs existants avec school_group_id depuis users
UPDATE activity_logs
SET school_group_id = users.school_group_id
FROM users
WHERE activity_logs.user_id = users.id
AND activity_logs.school_group_id IS NULL;

-- Commentaire
COMMENT ON COLUMN activity_logs.school_group_id IS 'Groupe scolaire associé pour filtrage Admin Groupe';

-- ============================================
-- FIN DU SCRIPT
-- ============================================

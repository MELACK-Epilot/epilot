-- ============================================
-- AJOUTER LA COLONNE resolved_at À system_alerts
-- ============================================

-- Ajouter la colonne resolved_at
ALTER TABLE system_alerts 
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE;

-- Ajouter la colonne resolved_by
ALTER TABLE system_alerts 
ADD COLUMN IF NOT EXISTS resolved_by UUID;

-- Créer un index pour les performances
CREATE INDEX IF NOT EXISTS idx_system_alerts_resolved_at ON system_alerts(resolved_at);

-- ============================================
-- FIN
-- ============================================

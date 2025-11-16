-- Migration: Création de la table activity_logs pour le journal d'activité
-- Date: 2025-11-16
-- Description: Table pour tracer toutes les actions des utilisateurs

-- Créer la table activity_logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  details TEXT,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent voir les logs de leur école
CREATE POLICY "Users can view activity logs from their school"
  ON activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u1, users u2
      WHERE u1.id = auth.uid()
      AND u2.id = activity_logs.user_id
      AND u1.school_id = u2.school_id
      AND u1.role IN ('proviseur', 'directeur', 'directeur_etudes', 'admin_groupe', 'super_admin')
    )
  );

-- Politique: Le système peut insérer des logs (via service_role)
CREATE POLICY "System can insert activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (true);

-- Politique: Admins peuvent voir tous les logs
CREATE POLICY "Admins can view all activity logs"
  ON activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin_groupe', 'super_admin')
    )
  );

-- Fonction pour nettoyer les vieux logs (> 6 mois)
CREATE OR REPLACE FUNCTION cleanup_old_activity_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM activity_logs
  WHERE created_at < NOW() - INTERVAL '6 months';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires
COMMENT ON TABLE activity_logs IS 'Journal d''activité - Traçabilité de toutes les actions utilisateurs';
COMMENT ON COLUMN activity_logs.user_id IS 'ID de l''utilisateur qui a effectué l''action';
COMMENT ON COLUMN activity_logs.action IS 'Type d''action (create, update, delete, view, export, etc.)';
COMMENT ON COLUMN activity_logs.entity IS 'Type d''entité concernée (user, student, class, grade, payment, etc.)';
COMMENT ON COLUMN activity_logs.entity_id IS 'ID de l''entité concernée';
COMMENT ON COLUMN activity_logs.details IS 'Détails de l''action';
COMMENT ON COLUMN activity_logs.ip_address IS 'Adresse IP de l''utilisateur';
COMMENT ON COLUMN activity_logs.user_agent IS 'User agent du navigateur';
COMMENT ON COLUMN activity_logs.timestamp IS 'Date et heure de l''action';

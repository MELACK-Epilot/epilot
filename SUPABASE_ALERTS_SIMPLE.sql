-- ============================================
-- SCHEMA SQL SIMPLIFIÉ - ALERTES SYSTÈME
-- Sans dépendances à la table users
-- ============================================

-- 1. CRÉER LA TABLE system_alerts
CREATE TABLE IF NOT EXISTS system_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Type et sévérité
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  
  -- Contenu de l'alerte
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Entité concernée (optionnel)
  entity_type TEXT,
  entity_id UUID,
  entity_name TEXT,
  
  -- Action requise
  action_required BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  action_label TEXT,
  
  -- État de lecture
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  -- Résolution
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}',
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CRÉER LES INDEX
CREATE INDEX IF NOT EXISTS idx_alerts_is_read ON system_alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON system_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON system_alerts(type);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON system_alerts(created_at DESC);

-- 3. CRÉER LA VUE unread_alerts
CREATE OR REPLACE VIEW unread_alerts AS
SELECT 
  id,
  type,
  severity,
  title,
  message,
  entity_type,
  entity_id,
  entity_name,
  action_required,
  action_url,
  action_label,
  created_at,
  metadata
FROM system_alerts
WHERE is_read = FALSE
  AND resolved_at IS NULL
ORDER BY 
  CASE severity
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END,
  created_at DESC
LIMIT 50;

-- 4. INSÉRER DES DONNÉES DE TEST
INSERT INTO system_alerts (
  type,
  severity,
  title,
  message,
  action_required,
  action_url,
  action_label
) VALUES
  (
    'subscription',
    'high',
    'Nouveaux abonnements en attente',
    '3 abonnements nécessitent votre validation.',
    TRUE,
    '/dashboard/finances?tab=subscriptions&status=pending',
    'Voir les abonnements'
  ),
  (
    'system',
    'medium',
    'Mise à jour disponible',
    'Une nouvelle version de la plateforme est disponible.',
    FALSE,
    NULL,
    NULL
  ),
  (
    'payment',
    'critical',
    'Paiement échoué',
    'Le paiement INV-2025-003 a échoué. Action requise.',
    TRUE,
    '/dashboard/finances?tab=payments',
    'Voir le paiement'
  ),
  (
    'system',
    'low',
    'Sauvegarde réussie',
    'La sauvegarde quotidienne a été effectuée avec succès.',
    FALSE,
    NULL,
    NULL
  ),
  (
    'security',
    'critical',
    'Tentative de connexion suspecte',
    'Plusieurs tentatives de connexion échouées détectées.',
    TRUE,
    '/dashboard/activity-logs',
    'Voir les logs'
  );

-- 5. VÉRIFICATIONS
SELECT 'Table system_alerts créée' as status, COUNT(*) as count FROM system_alerts;
SELECT 'Vue unread_alerts créée' as status, COUNT(*) as count FROM unread_alerts;

-- 6. AFFICHER LES ALERTES
SELECT 
  id,
  severity,
  title,
  message,
  action_required,
  created_at
FROM unread_alerts
ORDER BY 
  CASE severity
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END;

-- ============================================
-- SCHEMA SQL - PAIEMENTS & ALERTES SYSTÈME
-- E-Pilot Congo - Dashboard Super Admin
-- Date: 29 octobre 2025
-- ============================================
--
-- ⚠️ IMPORTANT : Ce script a été modifié pour fonctionner SANS dépendances
-- Les contraintes FOREIGN KEY vers users() et subscriptions() ont été retirées
-- Elles pourront être ajoutées plus tard avec ALTER TABLE si nécessaire
--
-- ============================================

-- ============================================
-- 1. TABLE PAYMENTS (Paiements)
-- ============================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID,
  
  -- Informations de facturation
  invoice_number TEXT UNIQUE NOT NULL,
  transaction_id TEXT UNIQUE,
  
  -- Montant et devise
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  currency TEXT DEFAULT 'FCFA',
  
  -- Méthode de paiement
  payment_method TEXT NOT NULL CHECK (payment_method IN (
    'carte_bancaire',
    'mobile_money',
    'virement',
    'especes',
    'cheque',
    'autre'
  )),
  
  -- Statut du paiement
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'completed',
    'failed',
    'refunded'
  )),
  
  -- Dates importantes
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  
  -- Notes et métadonnées
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_payments_subscription ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payments(paid_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_number);
CREATE INDEX IF NOT EXISTS idx_payments_transaction ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_updated_at();

-- Commentaires
COMMENT ON TABLE payments IS 'Historique complet des paiements des abonnements';
COMMENT ON COLUMN payments.invoice_number IS 'Numéro de facture unique';
COMMENT ON COLUMN payments.transaction_id IS 'ID de transaction du processeur de paiement';
COMMENT ON COLUMN payments.payment_method IS 'Méthode de paiement utilisée';
COMMENT ON COLUMN payments.status IS 'Statut actuel du paiement';

-- ============================================
-- 2. TABLE SYSTEM_ALERTS (Alertes Système)
-- ============================================

CREATE TABLE IF NOT EXISTS system_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Type et sévérité
  type TEXT NOT NULL CHECK (type IN (
    'subscription',
    'payment',
    'system',
    'security',
    'performance',
    'maintenance',
    'user_action',
    'other'
  )),
  
  severity TEXT NOT NULL CHECK (severity IN (
    'low',
    'medium',
    'high',
    'critical'
  )),
  
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
  read_by UUID,
  
  -- Résolution
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  resolution_notes TEXT,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}',
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_alerts_is_read ON system_alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON system_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON system_alerts(type);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON system_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON system_alerts(resolved_at);
CREATE INDEX IF NOT EXISTS idx_alerts_entity ON system_alerts(entity_type, entity_id);

-- Index composite pour requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_alerts_unread_severity 
  ON system_alerts(is_read, severity, created_at DESC)
  WHERE is_read = FALSE AND resolved_at IS NULL;

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER alerts_updated_at
  BEFORE UPDATE ON system_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_alerts_updated_at();

-- Commentaires
COMMENT ON TABLE system_alerts IS 'Système d''alertes et notifications pour le Super Admin';
COMMENT ON COLUMN system_alerts.type IS 'Type d''alerte (subscription, payment, system, etc.)';
COMMENT ON COLUMN system_alerts.severity IS 'Niveau de sévérité (low, medium, high, critical)';
COMMENT ON COLUMN system_alerts.action_required IS 'Indique si une action est requise';
COMMENT ON COLUMN system_alerts.is_read IS 'Indique si l''alerte a été lue';

-- ============================================
-- 3. VUE UNREAD_ALERTS (Alertes Non Lues)
-- ============================================

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

COMMENT ON VIEW unread_alerts IS 'Vue des alertes non lues, triées par sévérité et date';

-- ============================================
-- 4. VUE PAYMENT_STATS (Statistiques Paiements)
-- ============================================

CREATE OR REPLACE VIEW payment_stats AS
SELECT
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
  COUNT(*) FILTER (WHERE status = 'refunded') as refunded_count,
  COUNT(*) as total_count,
  COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as completed_amount,
  COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) as pending_amount,
  COALESCE(SUM(amount), 0) as total_amount,
  COALESCE(AVG(amount) FILTER (WHERE status = 'completed'), 0) as avg_payment_amount
FROM payments;

COMMENT ON VIEW payment_stats IS 'Statistiques globales des paiements';

-- ============================================
-- 5. FONCTION - Créer Alerte Automatique
-- ============================================

CREATE OR REPLACE FUNCTION create_system_alert(
  p_type TEXT,
  p_severity TEXT,
  p_title TEXT,
  p_message TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_entity_name TEXT DEFAULT NULL,
  p_action_required BOOLEAN DEFAULT FALSE,
  p_action_url TEXT DEFAULT NULL,
  p_action_label TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_alert_id UUID;
BEGIN
  INSERT INTO system_alerts (
    type,
    severity,
    title,
    message,
    entity_type,
    entity_id,
    entity_name,
    action_required,
    action_url,
    action_label
  ) VALUES (
    p_type,
    p_severity,
    p_title,
    p_message,
    p_entity_type,
    p_entity_id,
    p_entity_name,
    p_action_required,
    p_action_url,
    p_action_label
  )
  RETURNING id INTO v_alert_id;
  
  RETURN v_alert_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_system_alert IS 'Fonction helper pour créer des alertes système';

-- ============================================
-- 6. TRIGGER - Alerte Paiement Échoué
-- ============================================

CREATE OR REPLACE FUNCTION trigger_payment_failed_alert()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le paiement passe à "failed", créer une alerte
  IF NEW.status = 'failed' AND (OLD.status IS NULL OR OLD.status != 'failed') THEN
    PERFORM create_system_alert(
      'payment',
      'high',
      'Paiement échoué',
      format('Le paiement %s d''un montant de %s %s a échoué.', 
        NEW.invoice_number, 
        NEW.amount, 
        NEW.currency
      ),
      'payment',
      NEW.id,
      NEW.invoice_number,
      TRUE,
      format('/dashboard/finances?tab=payments&payment=%s', NEW.id),
      'Voir le paiement'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_failed_alert
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_payment_failed_alert();

-- ============================================
-- 7. TRIGGER - Alerte Abonnement Expirant
-- ============================================

CREATE OR REPLACE FUNCTION trigger_subscription_expiring_alert()
RETURNS TRIGGER AS $$
BEGIN
  -- Si l'abonnement expire dans moins de 7 jours
  IF NEW.end_date IS NOT NULL 
     AND NEW.end_date <= NOW() + INTERVAL '7 days'
     AND NEW.status = 'active'
     AND (OLD.end_date IS NULL OR OLD.end_date != NEW.end_date) THEN
    
    PERFORM create_system_alert(
      'subscription',
      'medium',
      'Abonnement expirant bientôt',
      format('L''abonnement du groupe "%s" expire le %s.', 
        NEW.school_group_name,
        TO_CHAR(NEW.end_date, 'DD/MM/YYYY')
      ),
      'subscription',
      NEW.id,
      NEW.school_group_name,
      TRUE,
      format('/dashboard/finances?tab=subscriptions&subscription=%s', NEW.id),
      'Voir l''abonnement'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscription_expiring_alert
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_subscription_expiring_alert();

-- ============================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

-- Politique pour Super Admin (accès total)
CREATE POLICY "Super Admin full access on payments"
  ON payments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

CREATE POLICY "Super Admin full access on alerts"
  ON system_alerts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- ============================================
-- 9. DONNÉES DE TEST (Optionnel)
-- ============================================

-- Insérer quelques paiements de test
INSERT INTO payments (
  subscription_id,
  invoice_number,
  transaction_id,
  amount,
  currency,
  payment_method,
  status,
  paid_at
) VALUES
  (
    (SELECT id FROM subscriptions LIMIT 1),
    'INV-2025-001',
    'TXN-ABC123',
    50000,
    'FCFA',
    'mobile_money',
    'completed',
    NOW() - INTERVAL '2 days'
  ),
  (
    (SELECT id FROM subscriptions LIMIT 1 OFFSET 1),
    'INV-2025-002',
    'TXN-DEF456',
    75000,
    'FCFA',
    'carte_bancaire',
    'pending',
    NULL
  ),
  (
    (SELECT id FROM subscriptions LIMIT 1 OFFSET 2),
    'INV-2025-003',
    'TXN-GHI789',
    100000,
    'FCFA',
    'virement',
    'failed',
    NULL
  );

-- Insérer quelques alertes de test
INSERT INTO system_alerts (
  type,
  severity,
  title,
  message,
  action_required,
  action_url
) VALUES
  (
    'subscription',
    'high',
    'Nouveaux abonnements en attente',
    '3 abonnements nécessitent votre validation.',
    TRUE,
    '/dashboard/finances?tab=subscriptions&status=pending'
  ),
  (
    'system',
    'medium',
    'Mise à jour disponible',
    'Une nouvelle version de la plateforme est disponible.',
    FALSE,
    NULL
  ),
  (
    'payment',
    'critical',
    'Paiement échoué',
    'Le paiement INV-2025-003 a échoué. Action requise.',
    TRUE,
    '/dashboard/finances?tab=payments'
  );

-- ============================================
-- 10. VÉRIFICATIONS FINALES
-- ============================================

-- Vérifier les tables créées
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('payments', 'system_alerts')
ORDER BY table_name;

-- Vérifier les vues créées
SELECT 
  table_name as view_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN ('unread_alerts', 'payment_stats')
ORDER BY table_name;

-- Vérifier les index créés
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('payments', 'system_alerts')
ORDER BY tablename, indexname;

-- ============================================
-- FIN DU SCRIPT
-- ============================================

-- Message de succès
DO $$
BEGIN
  RAISE NOTICE '✅ Schema créé avec succès !';
  RAISE NOTICE '📊 Tables: payments, system_alerts';
  RAISE NOTICE '👁️ Vues: unread_alerts, payment_stats';
  RAISE NOTICE '⚡ Triggers: alertes automatiques configurés';
  RAISE NOTICE '🔒 RLS: politiques activées';
END $$;

-- Migration COMPLÈTE: Configuration Alertes Système
-- Date: 2025-11-20
-- Objectif: Tout configurer en une seule fois

-- ============================================
-- 1. NETTOYER LES ANCIENNES DONNÉES
-- ============================================

-- Supprimer toutes les alertes existantes
DELETE FROM system_alerts;

-- Supprimer les mauvais triggers
DROP TRIGGER IF EXISTS school_without_director_alert ON schools;
DROP FUNCTION IF EXISTS check_school_without_director();
DROP TRIGGER IF EXISTS user_locked_alert ON users;
DROP FUNCTION IF EXISTS check_user_locked();

DO $$
BEGIN
  RAISE NOTICE '✅ Nettoyage terminé';
END $$;

-- ============================================
-- 2. VÉRIFIER/AJOUTER LES COLONNES MANQUANTES
-- ============================================

DO $$
BEGIN
  -- action_label
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'system_alerts' AND column_name = 'action_label'
  ) THEN
    ALTER TABLE system_alerts ADD COLUMN action_label TEXT;
  END IF;

  -- action_url
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'system_alerts' AND column_name = 'action_url'
  ) THEN
    ALTER TABLE system_alerts ADD COLUMN action_url TEXT;
  END IF;

  -- action_required
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'system_alerts' AND column_name = 'action_required'
  ) THEN
    ALTER TABLE system_alerts ADD COLUMN action_required BOOLEAN DEFAULT false;
  END IF;

  -- category
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'system_alerts' AND column_name = 'category'
  ) THEN
    ALTER TABLE system_alerts ADD COLUMN category TEXT;
  END IF;

  RAISE NOTICE '✅ Colonnes vérifiées/ajoutées';
END $$;

-- ============================================
-- 3. CONFIGURER RLS (Row Level Security)
-- ============================================

-- Activer RLS
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

-- Supprimer anciennes policies
DROP POLICY IF EXISTS "Super Admin full access" ON system_alerts;
DROP POLICY IF EXISTS "Admins can view alerts" ON system_alerts;
DROP POLICY IF EXISTS "Admins can update alerts" ON system_alerts;

-- Créer policy pour Super Admin (accès complet)
CREATE POLICY "Super Admin full access"
ON system_alerts
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

DO $$
BEGIN
  RAISE NOTICE '✅ RLS configuré';
END $$;

-- ============================================
-- 4. INSÉRER LES ALERTES DE TEST
-- ============================================

-- CRITICAL: Abonnements expirés
INSERT INTO system_alerts (
  alert_type, severity, category, title, message,
  entity_type, action_required, action_url, action_label
)
VALUES
  (
    'subscription', 'critical', 'expired',
    'Abonnement expiré',
    'Le groupe scolaire LAMARELLE a un abonnement expiré depuis 5 jours. Accès suspendu.',
    'school_group', true,
    '/dashboard/subscriptions',
    'Renouveler maintenant'
  ),
  (
    'subscription', 'critical', 'expired',
    'Abonnement expiré',
    'Le groupe scolaire EXCELLENCE a un abonnement expiré depuis 12 jours. Accès suspendu.',
    'school_group', true,
    '/dashboard/subscriptions',
    'Renouveler maintenant'
  );

-- ERROR: Paiements échoués
INSERT INTO system_alerts (
  alert_type, severity, category, title, message,
  entity_type, action_required, action_url, action_label
)
VALUES
  (
    'payment', 'error', 'payment_failed',
    'Paiement échoué',
    'Le paiement de 50,000 FCFA pour le groupe SAINT-JOSEPH a échoué. Tentative #3.',
    'payment', true,
    '/dashboard/payments',
    'Réessayer le paiement'
  ),
  (
    'payment', 'error', 'payment_failed',
    'Paiement échoué',
    'Le paiement de 75,000 FCFA pour le groupe NOTRE-DAME a été rejeté par la banque.',
    'payment', true,
    '/dashboard/payments',
    'Voir détails'
  );

-- WARNING: Expire bientôt
INSERT INTO system_alerts (
  alert_type, severity, category, title, message,
  entity_type, action_required, action_url, action_label
)
VALUES
  (
    'subscription', 'warning', 'expiring_soon',
    'Abonnement expire bientôt',
    'Le groupe scolaire SAINT-JOSEPH a un abonnement qui expire dans 5 jours.',
    'school_group', true,
    '/dashboard/subscriptions',
    'Renouveler'
  ),
  (
    'subscription', 'warning', 'expiring_soon',
    'Abonnement expire bientôt',
    'Le groupe scolaire MARIE-CLAIRE a un abonnement qui expire dans 3 jours.',
    'school_group', true,
    '/dashboard/subscriptions',
    'Renouveler'
  );

-- INFO: Système
INSERT INTO system_alerts (
  alert_type, severity, category, title, message,
  entity_type, action_required
)
VALUES
  (
    'system', 'info', 'maintenance',
    'Maintenance planifiée',
    'Une maintenance système est prévue le 25 novembre de 2h à 4h du matin.',
    'system', false
  );

DO $$
BEGIN
  RAISE NOTICE '✅ 7 alertes insérées';
END $$;

-- ============================================
-- 5. VÉRIFICATION FINALE
-- ============================================

DO $$
DECLARE
  v_total INTEGER;
  v_critical INTEGER;
  v_error INTEGER;
  v_warning INTEGER;
  v_info INTEGER;
  v_with_action INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total FROM system_alerts WHERE resolved_at IS NULL;
  SELECT COUNT(*) INTO v_critical FROM system_alerts WHERE severity = 'critical' AND resolved_at IS NULL;
  SELECT COUNT(*) INTO v_error FROM system_alerts WHERE severity = 'error' AND resolved_at IS NULL;
  SELECT COUNT(*) INTO v_warning FROM system_alerts WHERE severity = 'warning' AND resolved_at IS NULL;
  SELECT COUNT(*) INTO v_info FROM system_alerts WHERE severity = 'info' AND resolved_at IS NULL;
  SELECT COUNT(*) INTO v_with_action FROM system_alerts WHERE action_required = true AND resolved_at IS NULL;

  RAISE NOTICE '===========================================';
  RAISE NOTICE 'CONFIGURATION TERMINÉE !';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Total alertes: %', v_total;
  RAISE NOTICE 'Critiques: %', v_critical;
  RAISE NOTICE 'Erreurs: %', v_error;
  RAISE NOTICE 'Avertissements: %', v_warning;
  RAISE NOTICE 'Informations: %', v_info;
  RAISE NOTICE 'Avec action: %', v_with_action;
  RAISE NOTICE '===========================================';
  
  IF v_total = 7 AND v_with_action = 6 THEN
    RAISE NOTICE '✅ TOUT EST CORRECT !';
  ELSE
    RAISE WARNING '⚠️ Vérifier les données';
  END IF;
END $$;

-- ============================================
-- 6. AFFICHER LES ALERTES
-- ============================================

SELECT 
  severity,
  category,
  title,
  action_required,
  action_url,
  action_label,
  is_read,
  created_at
FROM system_alerts
WHERE resolved_at IS NULL
ORDER BY 
  CASE severity
    WHEN 'critical' THEN 1
    WHEN 'error' THEN 2
    WHEN 'warning' THEN 3
    WHEN 'info' THEN 4
  END,
  created_at DESC;

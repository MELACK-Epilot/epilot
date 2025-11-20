-- Migration: Insérer données de test pour system_alerts
-- Date: 2025-11-20
-- Description: Créer des alertes de test pour vérifier le widget

-- ============================================
-- 1. VÉRIFIER SI DES ALERTES EXISTENT DÉJÀ
-- ============================================

DO $$
DECLARE
  alert_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO alert_count FROM system_alerts WHERE resolved_at IS NULL;
  RAISE NOTICE 'Nombre d''alertes actives existantes: %', alert_count;
END $$;

-- ============================================
-- 2. INSÉRER ALERTES DE TEST
-- ============================================

-- Alerte CRITIQUE: Abonnement expiré
INSERT INTO system_alerts (
  alert_type,
  severity,
  category,
  title,
  message,
  entity_type,
  action_required,
  action_url,
  action_label
)
VALUES
  (
    'subscription',
    'critical',
    'expired',
    'Abonnement expiré',
    'Le groupe scolaire LAMARELLE a un abonnement expiré depuis 5 jours. Action urgente requise.',
    'school_group',
    true,
    '/dashboard/subscriptions',
    'Renouveler maintenant'
  ),
  (
    'subscription',
    'critical',
    'expired',
    'Abonnement expiré',
    'Le groupe scolaire EXCELLENCE a un abonnement expiré depuis 12 jours. Accès suspendu.',
    'school_group',
    true,
    '/dashboard/subscriptions',
    'Renouveler'
  )
ON CONFLICT DO NOTHING;

-- Alertes ERREUR: Paiements échoués
INSERT INTO system_alerts (
  alert_type,
  severity,
  category,
  title,
  message,
  entity_type,
  action_required,
  action_url,
  action_label
)
VALUES
  (
    'payment',
    'error',
    'payment_failed',
    'Paiement échoué',
    'Le paiement de 50,000 FCFA pour l''école Primaire Les Cocotiers a échoué. Tentative #3.',
    'payment',
    true,
    '/dashboard/payments',
    'Voir détails'
  ),
  (
    'payment',
    'error',
    'payment_failed',
    'Paiement échoué',
    'Le paiement de 75,000 FCFA pour le Lycée Victor Hugo a été rejeté par la banque.',
    'payment',
    true,
    '/dashboard/payments',
    'Réessayer'
  ),
  (
    'user',
    'error',
    'account_locked',
    'Compte bloqué',
    'Le compte de Jean MBEMBA a été bloqué après 5 tentatives de connexion échouées.',
    'user',
    true,
    '/dashboard/users',
    'Débloquer'
  )
ON CONFLICT DO NOTHING;

-- Alertes WARNING: Avertissements
INSERT INTO system_alerts (
  alert_type,
  severity,
  category,
  title,
  message,
  entity_type,
  action_required,
  action_url,
  action_label
)
VALUES
  (
    'subscription',
    'warning',
    'expiring_soon',
    'Abonnement expire bientôt',
    'Le groupe scolaire SAINT-JOSEPH a un abonnement qui expire dans 5 jours.',
    'school_group',
    true,
    '/dashboard/subscriptions',
    'Renouveler'
  ),
  (
    'subscription',
    'warning',
    'expiring_soon',
    'Abonnement expire bientôt',
    'Le groupe scolaire MARIE-CLAIRE a un abonnement qui expire dans 3 jours.',
    'school_group',
    true,
    '/dashboard/subscriptions',
    'Renouveler'
  ),
  (
    'system',
    'warning',
    'performance',
    'Performance dégradée',
    'Le temps de réponse moyen du système a augmenté de 40% dans les dernières 24h.',
    'system',
    false,
    '/dashboard/system',
    'Voir détails'
  )
ON CONFLICT DO NOTHING;

-- Alertes INFO: Informations
INSERT INTO system_alerts (
  alert_type,
  severity,
  category,
  title,
  message,
  entity_type,
  action_required,
  action_url,
  action_label
)
VALUES
  (
    'system',
    'info',
    'maintenance',
    'Maintenance planifiée',
    'Une maintenance système est prévue le 25 novembre de 2h à 4h du matin (heure locale).',
    'system',
    false,
    NULL,
    NULL
  ),
  (
    'user',
    'info',
    'new_users',
    'Nouveaux utilisateurs',
    '15 nouveaux utilisateurs ont été créés aujourd''hui.',
    'user',
    false,
    '/dashboard/users',
    'Voir la liste'
  ),
  (
    'subscription',
    'info',
    'renewal',
    'Abonnement renouvelé',
    'Le groupe scolaire NOTRE-DAME a renouvelé son abonnement pour 12 mois.',
    'school_group',
    false,
    '/dashboard/subscriptions',
    'Voir détails'
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. VÉRIFIER LES INSERTIONS
-- ============================================

DO $$
DECLARE
  critical_count INTEGER;
  error_count INTEGER;
  warning_count INTEGER;
  info_count INTEGER;
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO critical_count FROM system_alerts WHERE severity = 'critical' AND resolved_at IS NULL;
  SELECT COUNT(*) INTO error_count FROM system_alerts WHERE severity = 'error' AND resolved_at IS NULL;
  SELECT COUNT(*) INTO warning_count FROM system_alerts WHERE severity = 'warning' AND resolved_at IS NULL;
  SELECT COUNT(*) INTO info_count FROM system_alerts WHERE severity = 'info' AND resolved_at IS NULL;
  SELECT COUNT(*) INTO total_count FROM system_alerts WHERE resolved_at IS NULL;
  
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'ALERTES ACTIVES PAR SÉVÉRITÉ:';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Critiques: %', critical_count;
  RAISE NOTICE 'Erreurs: %', error_count;
  RAISE NOTICE 'Avertissements: %', warning_count;
  RAISE NOTICE 'Informations: %', info_count;
  RAISE NOTICE '-------------------------------------------';
  RAISE NOTICE 'TOTAL: %', total_count;
  RAISE NOTICE '===========================================';
END $$;

-- ============================================
-- 4. AFFICHER UN ÉCHANTILLON
-- ============================================

SELECT 
  severity,
  alert_type,
  title,
  LEFT(message, 50) || '...' as message_preview,
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
  created_at DESC
LIMIT 10;

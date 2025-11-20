-- Migration: Insérer alertes CORRECTES pour Super Admin
-- Date: 2025-11-20
-- Contexte: SUPER ADMIN (Groupes, Abonnements, Paiements UNIQUEMENT)

-- ============================================
-- 1. NETTOYER D'ABORD
-- ============================================

-- Supprimer toutes les alertes de test existantes
DELETE FROM system_alerts WHERE resolved_at IS NULL;

-- ============================================
-- 2. ALERTES CRITIQUES: Abonnements Expirés
-- ============================================

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
    'Le groupe scolaire LAMARELLE a un abonnement expiré depuis 5 jours. Accès suspendu.',
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
    'Renouveler maintenant'
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. ALERTES ERREUR: Paiements Échoués
-- ============================================

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
    'Le paiement de 50,000 FCFA pour le groupe SAINT-JOSEPH a échoué. Tentative #3.',
    'payment',
    true,
    '/dashboard/payments',
    'Réessayer le paiement'
  ),
  (
    'payment',
    'error',
    'payment_failed',
    'Paiement échoué',
    'Le paiement de 75,000 FCFA pour le groupe NOTRE-DAME a été rejeté par la banque.',
    'payment',
    true,
    '/dashboard/payments',
    'Voir détails'
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. ALERTES WARNING: Abonnements Expirant Bientôt
-- ============================================

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
    'subscription',
    'warning',
    'no_active_subscription',
    'Groupe sans abonnement',
    'Le groupe scolaire LES PIONEERS n''a pas d''abonnement actif.',
    'school_group',
    true,
    '/dashboard/subscriptions',
    'Créer un abonnement'
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. ALERTES INFO: Système
-- ============================================

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
-- 6. VÉRIFICATION
-- ============================================

DO $$
DECLARE
  critical_count INTEGER;
  error_count INTEGER;
  warning_count INTEGER;
  info_count INTEGER;
  total_count INTEGER;
  school_alerts INTEGER;
  user_alerts INTEGER;
BEGIN
  SELECT COUNT(*) INTO critical_count FROM system_alerts WHERE severity = 'critical' AND resolved_at IS NULL;
  SELECT COUNT(*) INTO error_count FROM system_alerts WHERE severity = 'error' AND resolved_at IS NULL;
  SELECT COUNT(*) INTO warning_count FROM system_alerts WHERE severity = 'warning' AND resolved_at IS NULL;
  SELECT COUNT(*) INTO info_count FROM system_alerts WHERE severity = 'info' AND resolved_at IS NULL;
  SELECT COUNT(*) INTO total_count FROM system_alerts WHERE resolved_at IS NULL;
  
  -- Vérifier qu'il n'y a PAS d'alertes écoles/users
  SELECT COUNT(*) INTO school_alerts FROM system_alerts WHERE entity_type = 'school' AND resolved_at IS NULL;
  SELECT COUNT(*) INTO user_alerts FROM system_alerts WHERE entity_type = 'user' AND resolved_at IS NULL;
  
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'ALERTES SUPER ADMIN - CRÉÉES:';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Critiques (abonnements expirés): %', critical_count;
  RAISE NOTICE 'Erreurs (paiements échoués): %', error_count;
  RAISE NOTICE 'Avertissements (expire bientôt): %', warning_count;
  RAISE NOTICE 'Informations: %', info_count;
  RAISE NOTICE '-------------------------------------------';
  RAISE NOTICE 'TOTAL: %', total_count;
  RAISE NOTICE '===========================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ VÉRIFICATION CONTEXTE:';
  RAISE NOTICE '-------------------------------------------';
  RAISE NOTICE 'Alertes écoles (devrait être 0): %', school_alerts;
  RAISE NOTICE 'Alertes users (devrait être 0): %', user_alerts;
  RAISE NOTICE '===========================================';
  
  IF school_alerts > 0 OR user_alerts > 0 THEN
    RAISE WARNING '❌ ERREUR: Des alertes écoles/users existent!';
  ELSE
    RAISE NOTICE '✅ Toutes les alertes sont conformes au contexte Super Admin';
  END IF;
END $$;

-- ============================================
-- 7. AFFICHER UN ÉCHANTILLON
-- ============================================

SELECT 
  severity,
  alert_type,
  category,
  title,
  LEFT(message, 60) || '...' as message_preview,
  entity_type,
  action_label,
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

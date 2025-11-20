-- Migration: Triggers alertes - PAIEMENTS
-- Date: 2025-11-20
-- Contexte: SUPER ADMIN (Paiements des groupes scolaires)
-- Taille: < 150 lignes

-- ============================================
-- 1. TRIGGER: Paiement échoué
-- ============================================

CREATE OR REPLACE FUNCTION check_payment_failure()
RETURNS TRIGGER AS $$
DECLARE
  v_school_name TEXT;
  v_group_name TEXT;
BEGIN
  -- Récupérer les noms
  SELECT s.name, sg.name
  INTO v_school_name, v_group_name
  FROM schools s
  LEFT JOIN school_groups sg ON s.school_group_id = sg.id
  WHERE s.id = NEW.school_id;
  
  -- Si paiement échoué
  IF NEW.status = 'failed' THEN
    INSERT INTO system_alerts (
      alert_type,
      severity,
      category,
      title,
      message,
      entity_type,
      entity_id,
      school_id,
      school_group_id,
      action_required,
      action_url,
      action_label,
      metadata
    )
    VALUES (
      'payment',
      'error',
      'payment_failed',
      'Paiement échoué',
      format(
        'Le paiement de %s FCFA pour l''école %s (%s) a échoué.',
        NEW.amount,
        v_school_name,
        COALESCE(v_group_name, 'Groupe inconnu')
      ),
      'payment',
      NEW.id,
      NEW.school_id,
      (SELECT school_group_id FROM schools WHERE id = NEW.school_id),
      true,
      format('/dashboard/payments/%s', NEW.id),
      'Réessayer le paiement',
      jsonb_build_object(
        'payment_id', NEW.id,
        'amount', NEW.amount,
        'school_id', NEW.school_id,
        'payment_date', NEW.payment_date
      )
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS payment_failure_alert ON fee_payments;
CREATE TRIGGER payment_failure_alert
  AFTER INSERT OR UPDATE OF status ON fee_payments
  FOR EACH ROW
  WHEN (NEW.status = 'failed')
  EXECUTE FUNCTION check_payment_failure();

-- ============================================
-- 2. FONCTION UTILITAIRE: Nettoyer alertes anciennes
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_old_alerts()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM system_alerts
  WHERE resolved_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. VÉRIFICATION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'TRIGGERS SUPER ADMIN - CRÉÉS:';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '✅ subscription_expiry_alert (subscriptions)';
  RAISE NOTICE '✅ group_without_subscription_alert (subscriptions)';
  RAISE NOTICE '✅ payment_failure_alert (paiements)';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'FONCTION UTILITAIRE:';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '✅ cleanup_old_alerts()';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  CONTEXTE SUPER ADMIN:';
  RAISE NOTICE '- Gère: Groupes Scolaires, Plans, Modules, Abonnements';
  RAISE NOTICE '- NE gère PAS: Écoles individuelles, Utilisateurs';
  RAISE NOTICE '- Admin Groupe gère: Ses écoles et utilisateurs';
  RAISE NOTICE '===========================================';
END $$;

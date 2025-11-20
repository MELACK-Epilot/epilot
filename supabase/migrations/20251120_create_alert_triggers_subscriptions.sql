-- Migration: Triggers alertes - ABONNEMENTS
-- Date: 2025-11-20
-- Contexte: SUPER ADMIN (Groupes Scolaires, Plans, Abonnements)
-- Taille: < 200 lignes

-- ============================================
-- 1. TRIGGER: Abonnement expiré ou expire bientôt
-- ============================================

CREATE OR REPLACE FUNCTION check_subscription_expiry()
RETURNS TRIGGER AS $$
DECLARE
  v_group_name TEXT;
  v_days_until_expiry INTEGER;
  v_days_since_expiry INTEGER;
BEGIN
  -- Récupérer le nom du groupe
  SELECT name INTO v_group_name
  FROM school_groups
  WHERE id = NEW.school_group_id;
  
  -- Calculer les jours
  v_days_until_expiry := EXTRACT(DAY FROM NEW.end_date - CURRENT_DATE)::INTEGER;
  v_days_since_expiry := EXTRACT(DAY FROM CURRENT_DATE - NEW.end_date)::INTEGER;
  
  -- CAS 1: Abonnement EXPIRÉ (critique)
  IF NEW.end_date < CURRENT_DATE AND NEW.status = 'expired' THEN
    INSERT INTO system_alerts (
      alert_type,
      severity,
      category,
      title,
      message,
      entity_type,
      entity_id,
      school_group_id,
      action_required,
      action_url,
      action_label,
      metadata
    )
    VALUES (
      'subscription',
      'critical',
      'expired',
      'Abonnement expiré',
      format(
        'Le groupe scolaire %s a un abonnement expiré depuis %s jours. Accès suspendu.',
        v_group_name,
        v_days_since_expiry
      ),
      'subscription',
      NEW.id,
      NEW.school_group_id,
      true,
      format('/dashboard/subscriptions?group=%s', NEW.school_group_id),
      'Renouveler maintenant',
      jsonb_build_object(
        'subscription_id', NEW.id,
        'end_date', NEW.end_date,
        'days_since_expiry', v_days_since_expiry
      )
    )
    ON CONFLICT DO NOTHING;
    
  -- CAS 2: Expire dans 1-3 jours (erreur)
  ELSIF v_days_until_expiry BETWEEN 1 AND 3 AND NEW.status = 'active' THEN
    INSERT INTO system_alerts (
      alert_type,
      severity,
      category,
      title,
      message,
      entity_type,
      entity_id,
      school_group_id,
      action_required,
      action_url,
      action_label,
      metadata
    )
    VALUES (
      'subscription',
      'error',
      'expiring_soon',
      'Abonnement expire très bientôt',
      format(
        'Le groupe scolaire %s a un abonnement qui expire dans %s jours. Action urgente requise.',
        v_group_name,
        v_days_until_expiry
      ),
      'subscription',
      NEW.id,
      NEW.school_group_id,
      true,
      format('/dashboard/subscriptions?group=%s', NEW.school_group_id),
      'Renouveler',
      jsonb_build_object(
        'subscription_id', NEW.id,
        'end_date', NEW.end_date,
        'days_until_expiry', v_days_until_expiry
      )
    )
    ON CONFLICT DO NOTHING;
    
  -- CAS 3: Expire dans 4-7 jours (warning)
  ELSIF v_days_until_expiry BETWEEN 4 AND 7 AND NEW.status = 'active' THEN
    INSERT INTO system_alerts (
      alert_type,
      severity,
      category,
      title,
      message,
      entity_type,
      entity_id,
      school_group_id,
      action_required,
      action_url,
      action_label,
      metadata
    )
    VALUES (
      'subscription',
      'warning',
      'expiring_soon',
      'Abonnement expire bientôt',
      format(
        'Le groupe scolaire %s a un abonnement qui expire dans %s jours.',
        v_group_name,
        v_days_until_expiry
      ),
      'subscription',
      NEW.id,
      NEW.school_group_id,
      true,
      format('/dashboard/subscriptions?group=%s', NEW.school_group_id),
      'Renouveler',
      jsonb_build_object(
        'subscription_id', NEW.id,
        'end_date', NEW.end_date,
        'days_until_expiry', v_days_until_expiry
      )
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS subscription_expiry_alert ON subscriptions;
CREATE TRIGGER subscription_expiry_alert
  AFTER INSERT OR UPDATE OF end_date, status ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION check_subscription_expiry();

-- ============================================
-- 2. TRIGGER: Groupe sans abonnement actif
-- ============================================

CREATE OR REPLACE FUNCTION check_group_without_subscription()
RETURNS TRIGGER AS $$
DECLARE
  v_has_active_subscription BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM subscriptions
    WHERE school_group_id = NEW.id
    AND status = 'active'
    AND end_date > CURRENT_DATE
  ) INTO v_has_active_subscription;
  
  IF NOT v_has_active_subscription THEN
    INSERT INTO system_alerts (
      alert_type,
      severity,
      category,
      title,
      message,
      entity_type,
      entity_id,
      school_group_id,
      action_required,
      action_url,
      action_label,
      metadata
    )
    VALUES (
      'subscription',
      'critical',
      'no_active_subscription',
      'Groupe sans abonnement actif',
      format('Le groupe scolaire %s n''a pas d''abonnement actif.', NEW.name),
      'school_group',
      NEW.id,
      NEW.id,
      true,
      format('/dashboard/subscriptions?group=%s', NEW.id),
      'Créer un abonnement',
      jsonb_build_object('school_group_id', NEW.id, 'school_group_name', NEW.name)
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS group_without_subscription_alert ON school_groups;
CREATE TRIGGER group_without_subscription_alert
  AFTER INSERT OR UPDATE ON school_groups
  FOR EACH ROW
  EXECUTE FUNCTION check_group_without_subscription();

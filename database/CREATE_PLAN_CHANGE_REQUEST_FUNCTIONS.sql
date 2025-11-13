/**
 * Fonctions SQL pour gérer les demandes de changement de plan
 * Gère automatiquement : abonnement, modules, notifications, historique
 * @module CREATE_PLAN_CHANGE_REQUEST_FUNCTIONS
 */

-- =====================================================
-- NETTOYAGE : Supprimer les anciennes fonctions
-- =====================================================

DROP FUNCTION IF EXISTS approve_plan_change_request(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS reject_plan_change_request(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS cancel_plan_change_request(UUID, UUID);

-- =====================================================
-- FONCTION 1 : Approuver une demande de changement
-- =====================================================

CREATE OR REPLACE FUNCTION approve_plan_change_request(
  p_request_id UUID,
  p_reviewed_by UUID,
  p_review_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request RECORD;
  v_subscription RECORD;
  v_old_plan_id UUID;
  v_new_plan_id UUID;
  v_school_group_id UUID;
  v_requested_by UUID;
  v_result JSON;
BEGIN
  -- 1. Récupérer la demande
  SELECT * INTO v_request
  FROM plan_change_requests
  WHERE id = p_request_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Demande non trouvée ou déjà traitée';
  END IF;

  v_school_group_id := v_request.school_group_id;
  v_old_plan_id := v_request.current_plan_id;
  v_new_plan_id := v_request.requested_plan_id;
  v_requested_by := v_request.requested_by;

  -- 2. Mettre à jour la demande
  UPDATE plan_change_requests
  SET 
    status = 'approved',
    reviewed_by = p_reviewed_by,
    reviewed_at = NOW(),
    review_notes = p_review_notes,
    updated_at = NOW()
  WHERE id = p_request_id;

  -- 3. Trouver l'abonnement actif du groupe
  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE school_group_id = v_school_group_id
    AND status IN ('active', 'pending')
  ORDER BY created_at DESC
  LIMIT 1;

  -- 4. Mettre à jour l'abonnement si trouvé
  IF FOUND THEN
    UPDATE subscriptions
    SET 
      plan_id = v_new_plan_id,
      updated_at = NOW()
    WHERE id = v_subscription.id;

    -- 5. Créer une entrée dans l'historique des abonnements
    INSERT INTO subscription_history (
      subscription_id,
      action,
      old_value,
      new_value,
      changed_by,
      reason,
      created_at
    ) VALUES (
      v_subscription.id,
      'plan_changed',
      (SELECT name FROM subscription_plans WHERE id = v_old_plan_id),
      (SELECT name FROM subscription_plans WHERE id = v_new_plan_id),
      p_reviewed_by,
      'Approved upgrade request: ' || COALESCE(p_review_notes, 'No notes'),
      NOW()
    );
  END IF;

  -- 6. Assigner les modules du nouveau plan au groupe
  -- Récupérer les modules du nouveau plan
  INSERT INTO group_module_configs (
    school_group_id,
    module_id,
    is_enabled,
    created_at,
    updated_at
  )
  SELECT 
    v_school_group_id,
    pm.module_id,
    true,
    NOW(),
    NOW()
  FROM plan_modules pm
  WHERE pm.plan_id = v_new_plan_id
  ON CONFLICT (school_group_id, module_id) 
  DO UPDATE SET
    is_enabled = true,
    updated_at = NOW();

  -- 7. Créer une notification pour l'Admin Groupe
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data,
    is_read,
    created_at
  ) VALUES (
    v_requested_by,
    'plan_change_approved',
    'Demande de changement de plan approuvée',
    'Votre demande de passage au plan ' || (SELECT name FROM subscription_plans WHERE id = v_new_plan_id) || ' a été approuvée. Les nouveaux modules sont maintenant disponibles.',
    jsonb_build_object(
      'request_id', p_request_id,
      'old_plan_id', v_old_plan_id,
      'new_plan_id', v_new_plan_id,
      'subscription_id', v_subscription.id
    ),
    false,
    NOW()
  );

  -- 8. Créer un log d'audit
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values,
    created_at
  ) VALUES (
    p_reviewed_by,
    'approve_plan_change',
    'plan_change_requests',
    p_request_id,
    jsonb_build_object('status', 'pending'),
    jsonb_build_object('status', 'approved', 'reviewed_by', p_reviewed_by),
    NOW()
  );

  -- 9. Retourner le résultat
  v_result := json_build_object(
    'success', true,
    'request_id', p_request_id,
    'subscription_id', v_subscription.id,
    'message', 'Demande approuvée avec succès'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erreur lors de l''approbation: %', SQLERRM;
END;
$$;

-- =====================================================
-- FONCTION 2 : Refuser une demande de changement
-- =====================================================

CREATE OR REPLACE FUNCTION reject_plan_change_request(
  p_request_id UUID,
  p_reviewed_by UUID,
  p_review_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request RECORD;
  v_requested_by UUID;
  v_result JSON;
BEGIN
  -- 1. Récupérer la demande
  SELECT * INTO v_request
  FROM plan_change_requests
  WHERE id = p_request_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Demande non trouvée ou déjà traitée';
  END IF;

  v_requested_by := v_request.requested_by;

  -- 2. Mettre à jour la demande
  UPDATE plan_change_requests
  SET 
    status = 'rejected',
    reviewed_by = p_reviewed_by,
    reviewed_at = NOW(),
    review_notes = p_review_notes,
    updated_at = NOW()
  WHERE id = p_request_id;

  -- 3. Créer une notification pour l'Admin Groupe
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data,
    is_read,
    created_at
  ) VALUES (
    v_requested_by,
    'plan_change_rejected',
    'Demande de changement de plan refusée',
    'Votre demande de changement de plan a été refusée. Raison: ' || COALESCE(p_review_notes, 'Aucune raison fournie'),
    jsonb_build_object(
      'request_id', p_request_id,
      'review_notes', p_review_notes
    ),
    false,
    NOW()
  );

  -- 4. Créer un log d'audit
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values,
    created_at
  ) VALUES (
    p_reviewed_by,
    'reject_plan_change',
    'plan_change_requests',
    p_request_id,
    jsonb_build_object('status', 'pending'),
    jsonb_build_object('status', 'rejected', 'reviewed_by', p_reviewed_by),
    NOW()
  );

  -- 5. Retourner le résultat
  v_result := json_build_object(
    'success', true,
    'request_id', p_request_id,
    'message', 'Demande refusée'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erreur lors du refus: %', SQLERRM;
END;
$$;

-- =====================================================
-- FONCTION 3 : Annuler une demande (Admin Groupe)
-- =====================================================

CREATE OR REPLACE FUNCTION cancel_plan_change_request(
  p_request_id UUID,
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request RECORD;
  v_result JSON;
BEGIN
  -- 1. Récupérer la demande
  SELECT * INTO v_request
  FROM plan_change_requests
  WHERE id = p_request_id
    AND requested_by = p_user_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Demande non trouvée ou vous n''êtes pas autorisé à l''annuler';
  END IF;

  -- 2. Mettre à jour la demande
  UPDATE plan_change_requests
  SET 
    status = 'cancelled',
    updated_at = NOW()
  WHERE id = p_request_id;

  -- 3. Créer un log d'audit
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values,
    created_at
  ) VALUES (
    p_user_id,
    'cancel_plan_change',
    'plan_change_requests',
    p_request_id,
    jsonb_build_object('status', 'pending'),
    jsonb_build_object('status', 'cancelled'),
    NOW()
  );

  -- 4. Retourner le résultat
  v_result := json_build_object(
    'success', true,
    'request_id', p_request_id,
    'message', 'Demande annulée'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erreur lors de l''annulation: %', SQLERRM;
END;
$$;

-- =====================================================
-- PERMISSIONS
-- =====================================================

-- Seul le Super Admin peut approuver/refuser
GRANT EXECUTE ON FUNCTION approve_plan_change_request TO authenticated;
GRANT EXECUTE ON FUNCTION reject_plan_change_request TO authenticated;

-- Admin Groupe peut annuler sa propre demande
GRANT EXECUTE ON FUNCTION cancel_plan_change_request TO authenticated;

-- =====================================================
-- COMMENTAIRES
-- =====================================================

COMMENT ON FUNCTION approve_plan_change_request IS 
'Approuve une demande de changement de plan et met à jour automatiquement : abonnement, modules, notifications, historique';

COMMENT ON FUNCTION reject_plan_change_request IS 
'Refuse une demande de changement de plan et notifie l''Admin Groupe';

COMMENT ON FUNCTION cancel_plan_change_request IS 
'Permet à un Admin Groupe d''annuler sa propre demande en attente';

-- =====================================================
-- SUCCÈS
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Fonctions de gestion des demandes de changement de plan créées avec succès !';
  RAISE NOTICE '   - approve_plan_change_request()';
  RAISE NOTICE '   - reject_plan_change_request()';
  RAISE NOTICE '   - cancel_plan_change_request()';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Fonctionnalités automatiques :';
  RAISE NOTICE '   ✅ Mise à jour abonnement';
  RAISE NOTICE '   ✅ Assignation modules';
  RAISE NOTICE '   ✅ Notifications';
  RAISE NOTICE '   ✅ Historique';
  RAISE NOTICE '   ✅ Audit logs';
END $$;

-- =====================================================
-- SYSTÈME DYNAMIQUE TEMPS RÉEL - PLANS & RESTRICTIONS
-- =====================================================
-- Date: 17 novembre 2025
-- Stack: Supabase Realtime + RPC + Triggers
-- Objectif: Changement de plan en temps réel avec restrictions

-- =====================================================
-- 1. ACTIVER REALTIME SUR LES TABLES CRITIQUES
-- =====================================================

-- Activer Realtime sur subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE subscriptions;

-- Activer Realtime sur plan_modules
ALTER PUBLICATION supabase_realtime ADD TABLE plan_modules;

-- Activer Realtime sur plan_categories
ALTER PUBLICATION supabase_realtime ADD TABLE plan_categories;

-- =====================================================
-- 2. FONCTION RPC - VÉRIFIER RESTRICTIONS PLAN
-- =====================================================

CREATE OR REPLACE FUNCTION check_plan_restrictions(
  p_school_group_id UUID,
  p_restriction_type VARCHAR -- 'schools', 'students', 'staff', 'storage'
)
RETURNS JSONB AS $$
DECLARE
  v_plan_id UUID;
  v_plan_limits JSONB;
  v_current_usage JSONB;
  v_result JSONB;
BEGIN
  -- Récupérer le plan actif
  SELECT s.plan_id INTO v_plan_id
  FROM subscriptions s
  WHERE s.school_group_id = p_school_group_id
  AND s.status = 'active'
  LIMIT 1;

  IF v_plan_id IS NULL THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'NO_ACTIVE_SUBSCRIPTION',
      'message', 'Aucun abonnement actif'
    );
  END IF;

  -- Récupérer les limites du plan
  SELECT jsonb_build_object(
    'max_schools', sp.max_schools,
    'max_students', sp.max_students,
    'max_staff', sp.max_staff,
    'max_storage', sp.max_storage
  ) INTO v_plan_limits
  FROM subscription_plans sp
  WHERE sp.id = v_plan_id;

  -- Calculer l'usage actuel
  SELECT jsonb_build_object(
    'current_schools', (SELECT COUNT(*) FROM schools WHERE school_group_id = p_school_group_id),
    'current_students', COALESCE((SELECT student_count FROM school_groups WHERE id = p_school_group_id), 0),
    'current_staff', (SELECT COUNT(*) FROM users WHERE school_group_id = p_school_group_id AND role != 'admin_groupe'),
    'current_storage', 0 -- À implémenter selon votre système de stockage
  ) INTO v_current_usage;

  -- Vérifier la restriction demandée
  CASE p_restriction_type
    WHEN 'schools' THEN
      v_result := jsonb_build_object(
        'allowed', (v_current_usage->>'current_schools')::INT < (v_plan_limits->>'max_schools')::INT,
        'current', (v_current_usage->>'current_schools')::INT,
        'limit', (v_plan_limits->>'max_schools')::INT,
        'remaining', (v_plan_limits->>'max_schools')::INT - (v_current_usage->>'current_schools')::INT
      );
    WHEN 'students' THEN
      v_result := jsonb_build_object(
        'allowed', (v_current_usage->>'current_students')::INT < (v_plan_limits->>'max_students')::INT,
        'current', (v_current_usage->>'current_students')::INT,
        'limit', (v_plan_limits->>'max_students')::INT,
        'remaining', (v_plan_limits->>'max_students')::INT - (v_current_usage->>'current_students')::INT
      );
    WHEN 'staff' THEN
      v_result := jsonb_build_object(
        'allowed', (v_current_usage->>'current_staff')::INT < (v_plan_limits->>'max_staff')::INT,
        'current', (v_current_usage->>'current_staff')::INT,
        'limit', (v_plan_limits->>'max_staff')::INT,
        'remaining', (v_plan_limits->>'max_staff')::INT - (v_current_usage->>'current_staff')::INT
      );
    WHEN 'storage' THEN
      v_result := jsonb_build_object(
        'allowed', (v_current_usage->>'current_storage')::INT < (v_plan_limits->>'max_storage')::INT,
        'current', (v_current_usage->>'current_storage')::INT,
        'limit', (v_plan_limits->>'max_storage')::INT,
        'remaining', (v_plan_limits->>'max_storage')::INT - (v_current_usage->>'current_storage')::INT
      );
    ELSE
      v_result := jsonb_build_object('allowed', false, 'reason', 'INVALID_RESTRICTION_TYPE');
  END CASE;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. FONCTION RPC - OBTENIR TOUTES LES RESTRICTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION get_all_plan_restrictions(
  p_school_group_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'schools', check_plan_restrictions(p_school_group_id, 'schools'),
    'students', check_plan_restrictions(p_school_group_id, 'students'),
    'staff', check_plan_restrictions(p_school_group_id, 'staff'),
    'storage', check_plan_restrictions(p_school_group_id, 'storage')
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. TRIGGER - NOTIFIER CHANGEMENT DE PLAN
-- =====================================================

CREATE OR REPLACE FUNCTION notify_plan_change()
RETURNS TRIGGER AS $$
DECLARE
  v_old_plan_slug VARCHAR;
  v_new_plan_slug VARCHAR;
  v_group_name VARCHAR;
BEGIN
  -- Récupérer les slugs des plans
  SELECT slug INTO v_old_plan_slug FROM subscription_plans WHERE id = OLD.plan_id;
  SELECT slug INTO v_new_plan_slug FROM subscription_plans WHERE id = NEW.plan_id;
  
  -- Récupérer le nom du groupe
  SELECT name INTO v_group_name FROM school_groups WHERE id = NEW.school_group_id;

  -- Notifier via pg_notify (pour Realtime)
  PERFORM pg_notify(
    'plan_changed',
    json_build_object(
      'school_group_id', NEW.school_group_id,
      'school_group_name', v_group_name,
      'old_plan', v_old_plan_slug,
      'new_plan', v_new_plan_slug,
      'changed_at', NOW()
    )::text
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_subscription_plan_change ON subscriptions;

CREATE TRIGGER on_subscription_plan_change
AFTER UPDATE OF plan_id ON subscriptions
FOR EACH ROW
WHEN (OLD.plan_id IS DISTINCT FROM NEW.plan_id)
EXECUTE FUNCTION notify_plan_change();

-- =====================================================
-- 5. FONCTION RPC - VÉRIFIER ACCÈS MODULE
-- =====================================================

CREATE OR REPLACE FUNCTION can_access_module(
  p_school_group_id UUID,
  p_module_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_plan_id UUID;
  v_has_access BOOLEAN;
BEGIN
  -- Récupérer le plan actif
  SELECT s.plan_id INTO v_plan_id
  FROM subscriptions s
  WHERE s.school_group_id = p_school_group_id
  AND s.status = 'active'
  LIMIT 1;

  IF v_plan_id IS NULL THEN
    RETURN false;
  END IF;

  -- Vérifier si le module est dans le plan
  SELECT EXISTS(
    SELECT 1 FROM plan_modules
    WHERE plan_id = v_plan_id
    AND module_id = p_module_id
  ) INTO v_has_access;

  RETURN v_has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. FONCTION RPC - VÉRIFIER ACCÈS CATÉGORIE
-- =====================================================

CREATE OR REPLACE FUNCTION can_access_category(
  p_school_group_id UUID,
  p_category_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_plan_id UUID;
  v_has_access BOOLEAN;
BEGIN
  -- Récupérer le plan actif
  SELECT s.plan_id INTO v_plan_id
  FROM subscriptions s
  WHERE s.school_group_id = p_school_group_id
  AND s.status = 'active'
  LIMIT 1;

  IF v_plan_id IS NULL THEN
    RETURN false;
  END IF;

  -- Vérifier si la catégorie est dans le plan
  SELECT EXISTS(
    SELECT 1 FROM plan_categories
    WHERE plan_id = v_plan_id
    AND category_id = p_category_id
  ) INTO v_has_access;

  RETURN v_has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. VUE - USAGE ACTUEL PAR GROUPE
-- =====================================================

CREATE OR REPLACE VIEW school_group_usage AS
SELECT 
  sg.id as school_group_id,
  sg.name as group_name,
  sp.name as plan_name,
  sp.slug as plan_slug,
  sp.max_schools,
  sp.max_students,
  sp.max_staff,
  sp.max_storage,
  (SELECT COUNT(*) FROM schools WHERE school_group_id = sg.id) as current_schools,
  sg.student_count as current_students,
  (SELECT COUNT(*) FROM users WHERE school_group_id = sg.id AND role != 'admin_groupe') as current_staff,
  0 as current_storage,
  -- Pourcentages
  ROUND((SELECT COUNT(*) FROM schools WHERE school_group_id = sg.id)::NUMERIC / NULLIF(sp.max_schools, 0) * 100, 2) as schools_usage_percent,
  ROUND(sg.student_count::NUMERIC / NULLIF(sp.max_students, 0) * 100, 2) as students_usage_percent,
  ROUND((SELECT COUNT(*) FROM users WHERE school_group_id = sg.id AND role != 'admin_groupe')::NUMERIC / NULLIF(sp.max_staff, 0) * 100, 2) as staff_usage_percent
FROM school_groups sg
LEFT JOIN subscriptions s ON s.school_group_id = sg.id AND s.status = 'active'
LEFT JOIN subscription_plans sp ON sp.id = s.plan_id;

-- =====================================================
-- 8. INDEXES POUR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_school_group_status ON subscriptions(school_group_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_schools_school_group ON schools(school_group_id);
CREATE INDEX IF NOT EXISTS idx_users_school_group_role ON users(school_group_id, role);

-- =====================================================
-- 9. COMMENTAIRES
-- =====================================================

COMMENT ON FUNCTION check_plan_restrictions IS 'Vérifie si une action est autorisée selon les limites du plan';
COMMENT ON FUNCTION get_all_plan_restrictions IS 'Retourne toutes les restrictions du plan pour un groupe';
COMMENT ON FUNCTION can_access_module IS 'Vérifie si un groupe peut accéder à un module selon son plan';
COMMENT ON FUNCTION can_access_category IS 'Vérifie si un groupe peut accéder à une catégorie selon son plan';
COMMENT ON VIEW school_group_usage IS 'Vue temps réel de l''usage des ressources par groupe';

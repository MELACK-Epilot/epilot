-- ============================================================================
-- FONCTION : Vérifier les Limites du Plan d'Abonnement (DYNAMIQUE)
-- ============================================================================
-- Cette fonction vérifie si un groupe scolaire peut créer une nouvelle ressource
-- selon les limites définies dans son plan d'abonnement (subscription_plans)
-- ============================================================================

CREATE OR REPLACE FUNCTION check_plan_limit(
  p_school_group_id UUID,
  p_resource_type TEXT -- 'schools', 'users', 'storage', 'modules'
)
RETURNS TABLE(
  allowed BOOLEAN,
  current_count INTEGER,
  max_limit INTEGER,
  remaining INTEGER,
  plan_name TEXT,
  message TEXT
) AS $$
DECLARE
  v_plan_id UUID;
  v_plan_name TEXT;
  v_max_schools INTEGER;
  v_max_users INTEGER;
  v_max_storage INTEGER;
  v_current_schools INTEGER;
  v_current_users INTEGER;
  v_current_storage INTEGER;
  v_max_limit INTEGER;
  v_current_count INTEGER;
  v_remaining INTEGER;
  v_allowed BOOLEAN;
  v_message TEXT;
BEGIN
  -- 1. Récupérer le plan actif du groupe scolaire
  SELECT 
    sgs.plan_id,
    sp.name,
    sp.max_schools,
    sp.max_staff + sp.max_students AS max_users, -- Total utilisateurs
    sp.max_storage
  INTO 
    v_plan_id,
    v_plan_name,
    v_max_schools,
    v_max_users,
    v_max_storage
  FROM school_group_subscriptions sgs
  JOIN subscription_plans sp ON sp.id = sgs.plan_id
  WHERE sgs.school_group_id = p_school_group_id
    AND sgs.status = 'active'
  LIMIT 1;

  -- Si aucun plan actif trouvé
  IF v_plan_id IS NULL THEN
    RETURN QUERY SELECT 
      FALSE,
      0,
      0,
      0,
      'Aucun plan'::TEXT,
      'Aucun plan d''abonnement actif trouvé pour ce groupe'::TEXT;
    RETURN;
  END IF;

  -- 2. Récupérer les compteurs actuels du groupe
  SELECT 
    sg.school_count,
    (sg.student_count + sg.staff_count) AS total_users,
    0 -- Storage à implémenter
  INTO 
    v_current_schools,
    v_current_users,
    v_current_storage
  FROM school_groups sg
  WHERE sg.id = p_school_group_id;

  -- 3. Déterminer la limite et le compteur selon le type de ressource
  CASE p_resource_type
    WHEN 'schools' THEN
      v_max_limit := v_max_schools;
      v_current_count := v_current_schools;
      
    WHEN 'users' THEN
      v_max_limit := v_max_users;
      v_current_count := v_current_users;
      
    WHEN 'storage' THEN
      v_max_limit := v_max_storage;
      v_current_count := v_current_storage;
      
    ELSE
      RETURN QUERY SELECT 
        FALSE,
        0,
        0,
        0,
        v_plan_name,
        'Type de ressource invalide'::TEXT;
      RETURN;
  END CASE;

  -- 4. Calculer le restant
  -- Si max_limit = -1, c'est illimité
  IF v_max_limit = -1 THEN
    v_remaining := -1; -- Illimité
    v_allowed := TRUE;
    v_message := 'Illimité';
  ELSE
    v_remaining := v_max_limit - v_current_count;
    v_allowed := v_remaining > 0;
    
    IF v_allowed THEN
      v_message := format('Vous pouvez créer %s %s supplémentaire(s)', 
                         v_remaining, 
                         p_resource_type);
    ELSE
      v_message := format('Limite de %s %s atteinte pour le plan %s. Veuillez mettre à niveau votre plan.', 
                         v_max_limit, 
                         p_resource_type,
                         v_plan_name);
    END IF;
  END IF;

  -- 5. Retourner le résultat
  RETURN QUERY SELECT 
    v_allowed,
    v_current_count,
    v_max_limit,
    v_remaining,
    v_plan_name,
    v_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FONCTION : Incrémenter le Compteur de Ressources
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_resource_count(
  p_school_group_id UUID,
  p_resource_type TEXT, -- 'schools', 'students', 'staff'
  p_increment INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  CASE p_resource_type
    WHEN 'schools' THEN
      UPDATE school_groups
      SET school_count = school_count + p_increment
      WHERE id = p_school_group_id;
      
    WHEN 'students' THEN
      UPDATE school_groups
      SET student_count = student_count + p_increment
      WHERE id = p_school_group_id;
      
    WHEN 'staff' THEN
      UPDATE school_groups
      SET staff_count = staff_count + p_increment
      WHERE id = p_school_group_id;
      
    ELSE
      RAISE EXCEPTION 'Type de ressource invalide: %', p_resource_type;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FONCTION : Décrémenter le Compteur de Ressources
-- ============================================================================

CREATE OR REPLACE FUNCTION decrement_resource_count(
  p_school_group_id UUID,
  p_resource_type TEXT, -- 'schools', 'students', 'staff'
  p_decrement INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  CASE p_resource_type
    WHEN 'schools' THEN
      UPDATE school_groups
      SET school_count = GREATEST(0, school_count - p_decrement)
      WHERE id = p_school_group_id;
      
    WHEN 'students' THEN
      UPDATE school_groups
      SET student_count = GREATEST(0, student_count - p_decrement)
      WHERE id = p_school_group_id;
      
    WHEN 'staff' THEN
      UPDATE school_groups
      SET staff_count = GREATEST(0, staff_count - p_decrement)
      WHERE id = p_school_group_id;
      
    ELSE
      RAISE EXCEPTION 'Type de ressource invalide: %', p_resource_type;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

-- Permettre aux utilisateurs authentifiés d'appeler ces fonctions
GRANT EXECUTE ON FUNCTION check_plan_limit(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_resource_count(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_resource_count(UUID, TEXT, INTEGER) TO authenticated;

-- ============================================================================
-- TESTS
-- ============================================================================

-- Test 1 : Vérifier la limite d'écoles
-- SELECT * FROM check_plan_limit('group-id', 'schools');

-- Test 2 : Vérifier la limite d'utilisateurs
-- SELECT * FROM check_plan_limit('group-id', 'users');

-- Test 3 : Incrémenter le compteur d'écoles
-- SELECT increment_resource_count('group-id', 'schools', 1);

-- Test 4 : Décrémenter le compteur d'utilisateurs
-- SELECT decrement_resource_count('group-id', 'students', 1);

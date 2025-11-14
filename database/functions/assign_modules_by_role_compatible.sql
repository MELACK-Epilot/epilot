-- Fonction compatible avec la structure existante user_modules
-- Assigne automatiquement des modules par défaut selon le rôle

CREATE OR REPLACE FUNCTION assign_modules_by_role_compatible(
  p_user_id UUID,
  p_user_role TEXT,
  p_school_group_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
  v_assigned_count INTEGER := 0;
  v_available_modules RECORD;
  v_current_user_id UUID;
BEGIN
  -- Récupérer l'utilisateur actuel pour assigned_by
  SELECT auth.uid() INTO v_current_user_id;
  
  -- Supprimer les anciennes assignations automatiques pour éviter les doublons
  DELETE FROM user_modules 
  WHERE user_id = p_user_id 
    AND assigned_by IS NULL; -- Marqueur pour assignations automatiques

  -- Assigner les modules selon le rôle
  FOR v_available_modules IN
    SELECT DISTINCT
      m.id as module_id,
      m.name as module_name,
      m.slug as module_slug
    FROM modules m
    LEFT JOIN group_module_configs gmc ON gmc.module_id = m.id AND gmc.school_group_id = p_school_group_id
    WHERE 
      m.status = 'active'
      AND (
        -- Super admin a accès à tous les modules
        p_user_role = 'SUPER_ADMIN'
        OR
        -- Admin groupe a accès aux modules de son groupe
        (p_user_role = 'admin_groupe' AND (gmc.is_enabled = true OR gmc.is_enabled IS NULL))
        OR
        -- Proviseur a accès aux modules éducatifs et administratifs de base
        (p_user_role = 'proviseur' AND m.slug IN (
          'dashboard', 'classes', 'eleves', 'personnel', 'rapports', 'communication',
          'emploi-temps', 'notes', 'absences', 'discipline'
        ))
        OR
        -- Directeur a accès aux modules éducatifs
        (p_user_role IN ('directeur', 'directeur_etudes') AND m.slug IN (
          'dashboard', 'classes', 'eleves', 'emploi-temps', 'notes', 'rapports',
          'communication', 'ressources'
        ))
        OR
        -- Enseignant a accès aux modules pédagogiques
        (p_user_role = 'enseignant' AND m.slug IN (
          'dashboard', 'mes-classes', 'notes', 'emploi-temps', 'ressources',
          'communication'
        ))
        OR
        -- CPE a accès aux modules de vie scolaire
        (p_user_role = 'cpe' AND m.slug IN (
          'dashboard', 'eleves', 'discipline', 'absences', 'communication',
          'rapports'
        ))
        OR
        -- Comptable a accès aux modules financiers
        (p_user_role IN ('comptable', 'agent_comptable') AND m.slug IN (
          'dashboard', 'finances', 'factures', 'paiements', 'rapports-financiers'
        ))
        OR
        -- Secrétaire a accès aux modules administratifs
        (p_user_role IN ('secretaire', 'secretaire_direction') AND m.slug IN (
          'dashboard', 'eleves', 'personnel', 'communication', 'documents'
        ))
        OR
        -- Autres rôles ont accès au dashboard minimum
        (p_user_role NOT IN ('SUPER_ADMIN', 'admin_groupe', 'proviseur', 'directeur', 'directeur_etudes', 
                            'enseignant', 'cpe', 'comptable', 'agent_comptable', 'secretaire', 'secretaire_direction') 
         AND m.slug = 'dashboard')
      )
  LOOP
    -- Insérer dans user_modules avec la structure existante
    INSERT INTO user_modules (
      user_id,
      module_id,
      is_enabled,
      assigned_at,
      assigned_by,
      settings
    ) VALUES (
      p_user_id,
      v_available_modules.module_id,
      true,
      NOW(),
      NULL, -- NULL indique une assignation automatique par rôle
      jsonb_build_object(
        'auto_assigned', true,
        'role', p_user_role,
        'assigned_at', NOW()
      )
    )
    ON CONFLICT (user_id, module_id) DO UPDATE SET
      is_enabled = true,
      assigned_at = NOW(),
      settings = EXCLUDED.settings;

    v_assigned_count := v_assigned_count + 1;
  END LOOP;

  -- Construire le résultat
  v_result := json_build_object(
    'success', true,
    'user_id', p_user_id,
    'role', p_user_role,
    'assigned_modules_count', v_assigned_count,
    'message', format('Assigné %s modules par défaut pour le rôle %s', v_assigned_count, p_user_role)
  );

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  -- En cas d'erreur, retourner les détails
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'user_id', p_user_id,
    'role', p_user_role
  );
END;
$$;

-- Fonction trigger compatible pour assigner automatiquement lors de la création/modification d'un utilisateur
CREATE OR REPLACE FUNCTION trigger_assign_modules_compatible()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Assigner les modules par défaut si c'est un nouvel utilisateur ou si le rôle a changé
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.role != NEW.role) THEN
    PERFORM assign_modules_by_role_compatible(NEW.id, NEW.role, NEW.school_group_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger sur la table users (ou profiles selon la structure)
DROP TRIGGER IF EXISTS trigger_assign_modules_on_user_change_compatible ON users;
CREATE TRIGGER trigger_assign_modules_on_user_change_compatible
  AFTER INSERT OR UPDATE OF role ON users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_assign_modules_compatible();

-- Si la table s'appelle profiles au lieu de users
DROP TRIGGER IF EXISTS trigger_assign_modules_on_profile_change_compatible ON profiles;
CREATE TRIGGER trigger_assign_modules_on_profile_change_compatible
  AFTER INSERT OR UPDATE OF role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_assign_modules_compatible();

-- Fonction pour réassigner manuellement les modules d'un utilisateur
CREATE OR REPLACE FUNCTION reassign_user_modules_compatible(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
  v_result JSON;
BEGIN
  -- Récupérer les infos utilisateur depuis users ou profiles
  SELECT id, role, school_group_id 
  INTO v_user
  FROM users 
  WHERE id = p_user_id;

  -- Si pas trouvé dans users, essayer profiles
  IF NOT FOUND THEN
    SELECT id, role, school_group_id 
    INTO v_user
    FROM profiles 
    WHERE id = p_user_id;
  END IF;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Utilisateur non trouvé'
    );
  END IF;

  -- Réassigner les modules
  SELECT assign_modules_by_role_compatible(v_user.id, v_user.role, v_user.school_group_id)
  INTO v_result;

  RETURN v_result;
END;
$$;

-- Fonction pour obtenir les modules disponibles par rôle (pour debug)
CREATE OR REPLACE FUNCTION get_available_modules_by_role(
  p_user_role TEXT,
  p_school_group_id UUID DEFAULT NULL
)
RETURNS TABLE(
  module_id UUID,
  module_name TEXT,
  module_slug TEXT,
  category_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    m.id as module_id,
    m.name as module_name,
    m.slug as module_slug,
    bc.name as category_name
  FROM modules m
  LEFT JOIN business_categories bc ON m.category_id = bc.id
  LEFT JOIN group_module_configs gmc ON gmc.module_id = m.id AND gmc.school_group_id = p_school_group_id
  WHERE 
    m.status = 'active'
    AND (
      -- Super admin a accès à tous les modules
      p_user_role = 'SUPER_ADMIN'
      OR
      -- Admin groupe a accès aux modules de son groupe
      (p_user_role = 'admin_groupe' AND (gmc.is_enabled = true OR gmc.is_enabled IS NULL))
      OR
      -- Proviseur a accès aux modules éducatifs et administratifs de base
      (p_user_role = 'proviseur' AND m.slug IN (
        'dashboard', 'classes', 'eleves', 'personnel', 'rapports', 'communication',
        'emploi-temps', 'notes', 'absences', 'discipline'
      ))
      OR
      -- Directeur a accès aux modules éducatifs
      (p_user_role IN ('directeur', 'directeur_etudes') AND m.slug IN (
        'dashboard', 'classes', 'eleves', 'emploi-temps', 'notes', 'rapports',
        'communication', 'ressources'
      ))
      OR
      -- Enseignant a accès aux modules pédagogiques
      (p_user_role = 'enseignant' AND m.slug IN (
        'dashboard', 'mes-classes', 'notes', 'emploi-temps', 'ressources',
        'communication'
      ))
      OR
      -- CPE a accès aux modules de vie scolaire
      (p_user_role = 'cpe' AND m.slug IN (
        'dashboard', 'eleves', 'discipline', 'absences', 'communication',
        'rapports'
      ))
      OR
      -- Comptable a accès aux modules financiers
      (p_user_role IN ('comptable', 'agent_comptable') AND m.slug IN (
        'dashboard', 'finances', 'factures', 'paiements', 'rapports-financiers'
      ))
      OR
      -- Secrétaire a accès aux modules administratifs
      (p_user_role IN ('secretaire', 'secretaire_direction') AND m.slug IN (
        'dashboard', 'eleves', 'personnel', 'communication', 'documents'
      ))
      OR
      -- Autres rôles ont accès au dashboard minimum
      (p_user_role NOT IN ('SUPER_ADMIN', 'admin_groupe', 'proviseur', 'directeur', 'directeur_etudes', 
                          'enseignant', 'cpe', 'comptable', 'agent_comptable', 'secretaire', 'secretaire_direction') 
       AND m.slug = 'dashboard')
    )
  ORDER BY bc.name, m.name;
END;
$$;

-- Commentaires pour la documentation
COMMENT ON FUNCTION assign_modules_by_role_compatible(UUID, TEXT, UUID) IS 
'Assigne automatiquement des modules par défaut selon le rôle utilisateur - Compatible avec user_modules';

COMMENT ON FUNCTION trigger_assign_modules_compatible() IS 
'Fonction trigger pour assigner automatiquement les modules lors de création/modification utilisateur - Compatible';

COMMENT ON FUNCTION reassign_user_modules_compatible(UUID) IS 
'Réassigne manuellement les modules d''un utilisateur selon son rôle actuel - Compatible';

COMMENT ON FUNCTION get_available_modules_by_role(TEXT, UUID) IS 
'Retourne la liste des modules disponibles pour un rôle donné - Utile pour debug';

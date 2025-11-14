-- Fonction pour assigner automatiquement des modules par défaut selon le rôle
-- Cette fonction sera appelée lors de la création d'un utilisateur ou changement de rôle

CREATE OR REPLACE FUNCTION assign_default_modules_by_role(
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
  v_default_permissions JSON;
BEGIN
  -- Définir les permissions par défaut selon le rôle
  CASE p_user_role
    WHEN 'super_admin' THEN
      v_default_permissions := '{"canRead": true, "canWrite": true, "canDelete": true, "canExport": true, "canManage": true}';
    WHEN 'admin_groupe' THEN
      v_default_permissions := '{"canRead": true, "canWrite": true, "canDelete": false, "canExport": true, "canManage": true}';
    WHEN 'proviseur' THEN
      v_default_permissions := '{"canRead": true, "canWrite": true, "canDelete": false, "canExport": true, "canManage": false}';
    WHEN 'directeur' THEN
      v_default_permissions := '{"canRead": true, "canWrite": true, "canDelete": false, "canExport": true, "canManage": false}';
    WHEN 'directeur_etudes' THEN
      v_default_permissions := '{"canRead": true, "canWrite": true, "canDelete": false, "canExport": true, "canManage": false}';
    WHEN 'enseignant' THEN
      v_default_permissions := '{"canRead": true, "canWrite": true, "canDelete": false, "canExport": false, "canManage": false}';
    WHEN 'cpe' THEN
      v_default_permissions := '{"canRead": true, "canWrite": true, "canDelete": false, "canExport": false, "canManage": false}';
    WHEN 'comptable' THEN
      v_default_permissions := '{"canRead": true, "canWrite": true, "canDelete": false, "canExport": true, "canManage": false}';
    ELSE
      v_default_permissions := '{"canRead": true, "canWrite": false, "canDelete": false, "canExport": false, "canManage": false}';
  END CASE;

  -- Supprimer les anciennes assignations pour éviter les doublons
  DELETE FROM user_module_permissions 
  WHERE user_id = p_user_id AND assignment_type = 'auto_role';

  -- Assigner les modules selon le rôle et le groupe scolaire
  FOR v_available_modules IN
    SELECT DISTINCT
      m.id as module_id,
      m.name as module_name,
      m.slug as module_slug,
      m.category_id,
      bc.name as category_name
    FROM modules m
    JOIN business_categories bc ON m.category_id = bc.id
    LEFT JOIN group_module_configs gmc ON gmc.module_id = m.id AND gmc.school_group_id = p_school_group_id
    WHERE 
      m.status = 'active'
      AND (
        -- Super admin a accès à tous les modules
        p_user_role = 'super_admin'
        OR
        -- Admin groupe a accès aux modules de son groupe
        (p_user_role = 'admin_groupe' AND gmc.is_enabled = true)
        OR
        -- Proviseur a accès aux modules éducatifs et administratifs de base
        (p_user_role = 'proviseur' AND m.slug IN (
          'dashboard', 'classes', 'eleves', 'personnel', 'rapports', 'communication'
        ))
        OR
        -- Directeur a accès aux modules éducatifs
        (p_user_role IN ('directeur', 'directeur_etudes') AND m.slug IN (
          'dashboard', 'classes', 'eleves', 'emploi-temps', 'notes', 'rapports'
        ))
        OR
        -- Enseignant a accès aux modules pédagogiques
        (p_user_role = 'enseignant' AND m.slug IN (
          'dashboard', 'mes-classes', 'notes', 'emploi-temps', 'ressources'
        ))
        OR
        -- CPE a accès aux modules de vie scolaire
        (p_user_role = 'cpe' AND m.slug IN (
          'dashboard', 'eleves', 'discipline', 'absences', 'communication'
        ))
        OR
        -- Comptable a accès aux modules financiers
        (p_user_role = 'comptable' AND m.slug IN (
          'dashboard', 'finances', 'factures', 'paiements', 'rapports-financiers'
        ))
      )
  LOOP
    -- Insérer la permission avec les droits par défaut du rôle
    INSERT INTO user_module_permissions (
      user_id,
      module_id,
      module_name,
      module_slug,
      category_id,
      category_name,
      assignment_type,
      can_read,
      can_write,
      can_delete,
      can_export,
      can_manage,
      assigned_by,
      assigned_at
    ) VALUES (
      p_user_id,
      v_available_modules.module_id,
      v_available_modules.module_name,
      v_available_modules.module_slug,
      v_available_modules.category_id,
      v_available_modules.category_name,
      'auto_role',
      (v_default_permissions->>'canRead')::boolean,
      (v_default_permissions->>'canWrite')::boolean,
      (v_default_permissions->>'canDelete')::boolean,
      (v_default_permissions->>'canExport')::boolean,
      (v_default_permissions->>'canManage')::boolean,
      '00000000-0000-0000-0000-000000000000', -- System user
      NOW()
    )
    ON CONFLICT (user_id, module_id) DO UPDATE SET
      assignment_type = 'auto_role',
      can_read = (v_default_permissions->>'canRead')::boolean,
      can_write = (v_default_permissions->>'canWrite')::boolean,
      can_delete = (v_default_permissions->>'canDelete')::boolean,
      can_export = (v_default_permissions->>'canExport')::boolean,
      can_manage = (v_default_permissions->>'canManage')::boolean,
      assigned_at = NOW();

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

-- Fonction trigger pour assigner automatiquement lors de la création/modification d'un utilisateur
CREATE OR REPLACE FUNCTION trigger_assign_default_modules()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Assigner les modules par défaut si c'est un nouvel utilisateur ou si le rôle a changé
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.role != NEW.role) THEN
    PERFORM assign_default_modules_by_role(NEW.id, NEW.role, NEW.school_group_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger sur la table users
DROP TRIGGER IF EXISTS trigger_assign_modules_on_user_change ON users;
CREATE TRIGGER trigger_assign_modules_on_user_change
  AFTER INSERT OR UPDATE OF role ON users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_assign_default_modules();

-- Fonction pour réassigner manuellement les modules d'un utilisateur
CREATE OR REPLACE FUNCTION reassign_user_modules(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
  v_result JSON;
BEGIN
  -- Récupérer les infos utilisateur
  SELECT id, role, school_group_id 
  INTO v_user
  FROM users 
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Utilisateur non trouvé'
    );
  END IF;

  -- Réassigner les modules
  SELECT assign_default_modules_by_role(v_user.id, v_user.role, v_user.school_group_id)
  INTO v_result;

  RETURN v_result;
END;
$$;

-- Commentaires pour la documentation
COMMENT ON FUNCTION assign_default_modules_by_role(UUID, TEXT, UUID) IS 
'Assigne automatiquement des modules par défaut selon le rôle utilisateur';

COMMENT ON FUNCTION trigger_assign_default_modules() IS 
'Fonction trigger pour assigner automatiquement les modules lors de création/modification utilisateur';

COMMENT ON FUNCTION reassign_user_modules(UUID) IS 
'Réassigne manuellement les modules d''un utilisateur selon son rôle actuel';

-- =====================================================
-- FONCTIONS RPC: OPÉRATIONS EN MASSE
-- Date: 17 Novembre 2025
-- Objectif: Assignation/Suppression bulk pour UX optimale
-- =====================================================

-- =====================================================
-- 1. ASSIGNATION MODULES EN MASSE
-- =====================================================

CREATE OR REPLACE FUNCTION assign_modules_bulk(
  p_user_id UUID,
  p_module_ids UUID[],
  p_permissions JSONB
)
RETURNS TABLE (
  assigned INT,
  failed INT,
  errors JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_module_id UUID;
  v_assigned INT := 0;
  v_failed INT := 0;
  v_errors JSONB := '[]'::jsonb;
  v_school_id UUID;
  v_school_group_id UUID;
  v_access_profile_code VARCHAR;
BEGIN
  -- Récupérer infos user
  SELECT school_id, school_group_id, access_profile_code
  INTO v_school_id, v_school_group_id, v_access_profile_code
  FROM users
  WHERE id = p_user_id;
  
  -- Assigner chaque module
  FOREACH v_module_id IN ARRAY p_module_ids
  LOOP
    BEGIN
      -- Vérifier si déjà assigné
      IF EXISTS (
        SELECT 1 FROM user_module_permissions
        WHERE user_id = p_user_id
        AND module_id = v_module_id
        AND deleted_at IS NULL
      ) THEN
        v_failed := v_failed + 1;
        v_errors := v_errors || jsonb_build_object(
          'module_id', v_module_id,
          'error', 'Already assigned'
        );
        CONTINUE;
      END IF;
      
      -- Insérer
      INSERT INTO user_module_permissions (
        user_id,
        module_id,
        school_id,
        school_group_id,
        access_profile_code,
        can_read,
        can_write,
        can_delete,
        can_export,
        created_at
      ) VALUES (
        p_user_id,
        v_module_id,
        v_school_id,
        v_school_group_id,
        v_access_profile_code,
        (p_permissions->>'canRead')::BOOLEAN,
        (p_permissions->>'canWrite')::BOOLEAN,
        (p_permissions->>'canDelete')::BOOLEAN,
        (p_permissions->>'canExport')::BOOLEAN,
        NOW()
      );
      
      v_assigned := v_assigned + 1;
      
    EXCEPTION WHEN OTHERS THEN
      v_failed := v_failed + 1;
      v_errors := v_errors || jsonb_build_object(
        'module_id', v_module_id,
        'error', SQLERRM
      );
    END;
  END LOOP;
  
  -- Retourner résultats
  RETURN QUERY
  SELECT v_assigned, v_failed, v_errors;
END;
$$;

-- =====================================================
-- 2. SUPPRESSION MODULES EN MASSE
-- =====================================================

CREATE OR REPLACE FUNCTION remove_modules_bulk(
  p_user_id UUID,
  p_module_ids UUID[]
)
RETURNS TABLE (
  removed INT,
  failed INT,
  errors JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_module_id UUID;
  v_removed INT := 0;
  v_failed INT := 0;
  v_errors JSONB := '[]'::jsonb;
BEGIN
  FOREACH v_module_id IN ARRAY p_module_ids
  LOOP
    BEGIN
      -- Soft delete
      UPDATE user_module_permissions
      SET deleted_at = NOW()
      WHERE user_id = p_user_id
      AND module_id = v_module_id
      AND deleted_at IS NULL;
      
      IF FOUND THEN
        v_removed := v_removed + 1;
      ELSE
        v_failed := v_failed + 1;
        v_errors := v_errors || jsonb_build_object(
          'module_id', v_module_id,
          'error', 'Not found or already deleted'
        );
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      v_failed := v_failed + 1;
      v_errors := v_errors || jsonb_build_object(
        'module_id', v_module_id,
        'error', SQLERRM
      );
    END;
  END LOOP;
  
  RETURN QUERY
  SELECT v_removed, v_failed, v_errors;
END;
$$;

-- =====================================================
-- 3. UPDATE PERMISSIONS EN MASSE
-- =====================================================

CREATE OR REPLACE FUNCTION update_permissions_bulk(
  p_user_id UUID,
  p_updates JSONB -- Array de {module_id, permissions}
)
RETURNS TABLE (
  updated INT,
  failed INT,
  errors JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_update JSONB;
  v_updated INT := 0;
  v_failed INT := 0;
  v_errors JSONB := '[]'::jsonb;
  v_module_id UUID;
  v_permissions JSONB;
BEGIN
  FOR v_update IN SELECT * FROM jsonb_array_elements(p_updates)
  LOOP
    BEGIN
      v_module_id := (v_update->>'module_id')::UUID;
      v_permissions := v_update->'permissions';
      
      UPDATE user_module_permissions
      SET 
        can_read = (v_permissions->>'canRead')::BOOLEAN,
        can_write = (v_permissions->>'canWrite')::BOOLEAN,
        can_delete = (v_permissions->>'canDelete')::BOOLEAN,
        can_export = (v_permissions->>'canExport')::BOOLEAN,
        updated_at = NOW()
      WHERE user_id = p_user_id
      AND module_id = v_module_id
      AND deleted_at IS NULL;
      
      IF FOUND THEN
        v_updated := v_updated + 1;
      ELSE
        v_failed := v_failed + 1;
        v_errors := v_errors || jsonb_build_object(
          'module_id', v_module_id,
          'error', 'Not found'
        );
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      v_failed := v_failed + 1;
      v_errors := v_errors || jsonb_build_object(
        'module_id', v_module_id,
        'error', SQLERRM
      );
    END;
  END LOOP;
  
  RETURN QUERY
  SELECT v_updated, v_failed, v_errors;
END;
$$;

-- =====================================================
-- 4. DUPLIQUER PERMISSIONS D'UN USER À UN AUTRE
-- =====================================================

CREATE OR REPLACE FUNCTION duplicate_user_permissions(
  p_source_user_id UUID,
  p_target_user_id UUID
)
RETURNS TABLE (
  copied INT,
  skipped INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_copied INT := 0;
  v_skipped INT := 0;
  v_target_school_id UUID;
  v_target_school_group_id UUID;
  v_target_access_profile_code VARCHAR;
BEGIN
  -- Récupérer infos target user
  SELECT school_id, school_group_id, access_profile_code
  INTO v_target_school_id, v_target_school_group_id, v_target_access_profile_code
  FROM users
  WHERE id = p_target_user_id;
  
  -- Copier permissions
  INSERT INTO user_module_permissions (
    user_id,
    module_id,
    school_id,
    school_group_id,
    access_profile_code,
    can_read,
    can_write,
    can_delete,
    can_export,
    created_at
  )
  SELECT
    p_target_user_id,
    source.module_id,
    v_target_school_id,
    v_target_school_group_id,
    v_target_access_profile_code,
    source.can_read,
    source.can_write,
    source.can_delete,
    source.can_export,
    NOW()
  FROM user_module_permissions source
  WHERE source.user_id = p_source_user_id
  AND source.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_module_permissions target
    WHERE target.user_id = p_target_user_id
    AND target.module_id = source.module_id
    AND target.deleted_at IS NULL
  );
  
  GET DIAGNOSTICS v_copied = ROW_COUNT;
  
  -- Compter skipped
  SELECT COUNT(*) INTO v_skipped
  FROM user_module_permissions source
  WHERE source.user_id = p_source_user_id
  AND source.deleted_at IS NULL
  AND EXISTS (
    SELECT 1 FROM user_module_permissions target
    WHERE target.user_id = p_target_user_id
    AND target.module_id = source.module_id
    AND target.deleted_at IS NULL
  );
  
  RETURN QUERY
  SELECT v_copied, v_skipped;
END;
$$;

-- =====================================================
-- PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION assign_modules_bulk TO authenticated;
GRANT EXECUTE ON FUNCTION remove_modules_bulk TO authenticated;
GRANT EXECUTE ON FUNCTION update_permissions_bulk TO authenticated;
GRANT EXECUTE ON FUNCTION duplicate_user_permissions TO authenticated;

-- =====================================================
-- COMMENTAIRES
-- =====================================================

COMMENT ON FUNCTION assign_modules_bulk IS 
'Assigne plusieurs modules à un utilisateur en une seule transaction. Retourne nombre assignés/échoués.';

COMMENT ON FUNCTION remove_modules_bulk IS 
'Retire plusieurs modules d\'un utilisateur en une seule transaction. Soft delete.';

COMMENT ON FUNCTION update_permissions_bulk IS 
'Met à jour les permissions de plusieurs modules en une seule transaction.';

COMMENT ON FUNCTION duplicate_user_permissions IS 
'Copie toutes les permissions d\'un utilisateur vers un autre. Utile pour onboarding.';

-- =====================================================
-- FIN MIGRATION
-- =====================================================

-- =====================================================
-- SECURITY DEFINER FUNCTIONS pour RLS
-- Description: Fonctions utilisées dans les politiques RLS
-- pour éviter les récursions infinies
-- Date: 2025-11-30
-- =====================================================

-- =====================================================
-- 1. FONCTION: get_current_user_role
-- Retourne le rôle de l'utilisateur connecté
-- =====================================================
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS VARCHAR AS $$
DECLARE
  v_role VARCHAR;
BEGIN
  SELECT role INTO v_role
  FROM users
  WHERE id = auth.uid();
  
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- 2. FONCTION: get_current_user_school_group_id
-- Retourne le school_group_id de l'utilisateur connecté
-- =====================================================
CREATE OR REPLACE FUNCTION get_current_user_school_group_id()
RETURNS UUID AS $$
DECLARE
  v_school_group_id UUID;
BEGIN
  SELECT school_group_id INTO v_school_group_id
  FROM users
  WHERE id = auth.uid();
  
  RETURN v_school_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- 3. FONCTION: get_current_user_school_id
-- Retourne le school_id de l'utilisateur connecté
-- =====================================================
CREATE OR REPLACE FUNCTION get_current_user_school_id()
RETURNS UUID AS $$
DECLARE
  v_school_id UUID;
BEGIN
  SELECT school_id INTO v_school_id
  FROM users
  WHERE id = auth.uid();
  
  RETURN v_school_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- 4. FONCTION: get_current_user_access_profile
-- Retourne le code du profil d'accès de l'utilisateur
-- =====================================================
CREATE OR REPLACE FUNCTION get_current_user_access_profile()
RETURNS VARCHAR AS $$
DECLARE
  v_profile_code VARCHAR;
BEGIN
  SELECT access_profile_code INTO v_profile_code
  FROM users
  WHERE id = auth.uid();
  
  RETURN v_profile_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- 5. FONCTION: is_current_user_admin
-- Vérifie si l'utilisateur est un admin (super_admin ou admin_groupe)
-- =====================================================
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_role VARCHAR;
BEGIN
  SELECT role INTO v_role
  FROM users
  WHERE id = auth.uid();
  
  RETURN v_role IN ('super_admin', 'admin_groupe');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- 6. FONCTION: is_current_user_super_admin
-- Vérifie si l'utilisateur est super_admin
-- =====================================================
CREATE OR REPLACE FUNCTION is_current_user_super_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_role VARCHAR;
BEGIN
  SELECT role INTO v_role
  FROM users
  WHERE id = auth.uid();
  
  RETURN v_role = 'super_admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- 7. FONCTION: can_user_access_school_group
-- Vérifie si l'utilisateur peut accéder à un groupe scolaire
-- =====================================================
CREATE OR REPLACE FUNCTION can_user_access_school_group(p_school_group_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_role VARCHAR;
  v_user_school_group_id UUID;
BEGIN
  SELECT role, school_group_id 
  INTO v_role, v_user_school_group_id
  FROM users
  WHERE id = auth.uid();
  
  -- Super admin accède à tout
  IF v_role = 'super_admin' THEN
    RETURN true;
  END IF;
  
  -- Admin groupe et utilisateurs accèdent à leur groupe
  RETURN v_user_school_group_id = p_school_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- 8. TRIGGER: sync_user_modules_from_profile
-- Synchronise les modules quand le profil d'accès change
-- =====================================================
CREATE OR REPLACE FUNCTION sync_user_modules_from_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le profil d'accès a changé
  IF OLD.access_profile_code IS DISTINCT FROM NEW.access_profile_code THEN
    -- Log le changement
    RAISE NOTICE 'Profil changé pour user %: % -> %', 
      NEW.id, OLD.access_profile_code, NEW.access_profile_code;
    
    -- Ici on pourrait synchroniser les modules automatiquement
    -- Pour l'instant, on laisse l'admin gérer manuellement
    -- TODO: Implémenter la synchronisation automatique si nécessaire
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger (si pas déjà existant)
DROP TRIGGER IF EXISTS trigger_sync_user_modules ON users;
CREATE TRIGGER trigger_sync_user_modules
  AFTER UPDATE OF access_profile_code ON users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_modules_from_profile();

-- =====================================================
-- 9. PERMISSIONS
-- =====================================================
GRANT EXECUTE ON FUNCTION get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_school_group_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_school_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_access_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION is_current_user_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_current_user_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION can_user_access_school_group(UUID) TO authenticated;

-- =====================================================
-- 10. COMMENTAIRES
-- =====================================================
COMMENT ON FUNCTION get_current_user_role IS 
'Retourne le rôle de l''utilisateur connecté. SECURITY DEFINER pour éviter récursion RLS.';

COMMENT ON FUNCTION get_current_user_school_group_id IS 
'Retourne le school_group_id de l''utilisateur connecté. SECURITY DEFINER pour éviter récursion RLS.';

COMMENT ON FUNCTION is_current_user_admin IS 
'Vérifie si l''utilisateur est admin (super_admin ou admin_groupe).';

COMMENT ON FUNCTION sync_user_modules_from_profile IS 
'Trigger qui se déclenche quand le profil d''accès d''un utilisateur change.';

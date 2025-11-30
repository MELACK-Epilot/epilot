-- =====================================================
-- RPC FUNCTION: get_user_login_data
-- Description: Récupère toutes les données utilisateur pour la connexion
-- Optimisée pour une seule requête DB
-- Date: 2025-11-30
-- =====================================================

-- =====================================================
-- 1. AJOUTER access_profile_code à users SI MANQUANT
-- =====================================================
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS access_profile_code VARCHAR(50);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_users_access_profile_code 
ON users(access_profile_code);

-- =====================================================
-- 2. FONCTION RPC: get_user_login_data
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_login_data(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user RECORD;
  v_school_group RECORD;
  v_access_profile RECORD;
  v_modules_count INTEGER;
  v_is_admin BOOLEAN;
  v_has_access_profile BOOLEAN;
  v_result JSONB;
BEGIN
  -- ============================================
  -- ÉTAPE 1: Récupérer l'utilisateur
  -- ============================================
  SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.role,
    u.avatar,
    u.gender,
    u.date_of_birth,
    u.phone,
    u.school_group_id,
    u.school_id,
    u.status,
    u.access_profile_code,
    u.created_at,
    u.last_login
  INTO v_user
  FROM users u
  WHERE u.id = p_user_id;

  -- Vérifier si l'utilisateur existe
  IF v_user IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'USER_NOT_FOUND',
      'message', 'Utilisateur introuvable'
    );
  END IF;

  -- Vérifier si le compte est actif
  IF v_user.status != 'active' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'ACCOUNT_INACTIVE',
      'message', 'Votre compte n''est pas actif'
    );
  END IF;

  -- ============================================
  -- ÉTAPE 2: Récupérer le groupe scolaire (si applicable)
  -- ============================================
  IF v_user.school_group_id IS NOT NULL THEN
    SELECT 
      sg.id,
      sg.name,
      sg.logo
    INTO v_school_group
    FROM school_groups sg
    WHERE sg.id = v_user.school_group_id;
  END IF;

  -- ============================================
  -- ÉTAPE 3: Récupérer le profil d'accès (si applicable)
  -- ============================================
  IF v_user.access_profile_code IS NOT NULL THEN
    SELECT 
      ap.code,
      ap.name_fr,
      ap.permissions
    INTO v_access_profile
    FROM access_profiles ap
    WHERE ap.code = v_user.access_profile_code
      AND ap.is_active = true;
  END IF;

  -- ============================================
  -- ÉTAPE 4: Compter les modules assignés
  -- ============================================
  SELECT COUNT(*)
  INTO v_modules_count
  FROM user_modules um
  WHERE um.user_id = p_user_id;

  -- ============================================
  -- ÉTAPE 5: Déterminer le type d'utilisateur
  -- ============================================
  v_is_admin := v_user.role IN ('super_admin', 'admin_groupe');
  v_has_access_profile := v_user.access_profile_code IS NOT NULL 
                          AND v_user.access_profile_code != '';

  -- ============================================
  -- ÉTAPE 6: Mettre à jour last_login
  -- ============================================
  UPDATE users 
  SET last_login = NOW()
  WHERE id = p_user_id;

  -- ============================================
  -- ÉTAPE 7: Construire la réponse
  -- ============================================
  v_result := jsonb_build_object(
    'success', true,
    'user', jsonb_build_object(
      'id', v_user.id,
      'email', v_user.email,
      'firstName', v_user.first_name,
      'lastName', v_user.last_name,
      'role', v_user.role,
      'avatar', v_user.avatar,
      'gender', v_user.gender,
      'dateOfBirth', v_user.date_of_birth,
      'phone', v_user.phone,
      'schoolGroupId', v_user.school_group_id,
      'schoolGroupName', COALESCE(v_school_group.name, NULL),
      'schoolGroupLogo', COALESCE(v_school_group.logo, NULL),
      'schoolId', v_user.school_id,
      'createdAt', v_user.created_at,
      'lastLogin', NOW(),
      'accessProfileCode', v_user.access_profile_code,
      'accessProfileName', COALESCE(v_access_profile.name_fr, NULL)
    ),
    'meta', jsonb_build_object(
      'modulesCount', v_modules_count,
      'hasAccessProfile', v_has_access_profile,
      'isAdmin', v_is_admin
    )
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. PERMISSIONS
-- =====================================================
GRANT EXECUTE ON FUNCTION get_user_login_data(UUID) TO authenticated;

-- =====================================================
-- 4. COMMENTAIRES
-- =====================================================
COMMENT ON FUNCTION get_user_login_data IS 
'Récupère toutes les données utilisateur nécessaires à la connexion en une seule requête.
Retourne: user (profil complet), meta (modulesCount, hasAccessProfile, isAdmin)
Utilisé par: useLogin.ts';

-- =====================================================
-- 5. TEST (à exécuter manuellement)
-- =====================================================
-- SELECT get_user_login_data('votre-user-id-ici');

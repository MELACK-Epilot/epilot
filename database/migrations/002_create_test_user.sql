-- ============================================
-- Migration: Créer utilisateur de test
-- Date: 2025-11-02
-- Description: Créer un compte super admin pour les tests
-- ============================================

-- Note: Ce script doit être exécuté APRÈS avoir créé l'utilisateur dans Supabase Auth Dashboard
-- ou via l'API Supabase

-- Créer l'utilisateur dans Supabase Auth (à faire manuellement ou via API)
-- Email: admin@epilot.cg
-- Password: admin123

-- Vérifier si l'utilisateur existe déjà dans auth.users
DO $$
DECLARE
  user_id UUID;
BEGIN
  -- Chercher l'utilisateur dans auth.users
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = 'admin@epilot.cg'
  LIMIT 1;

  -- Si l'utilisateur existe, créer/mettre à jour son profil
  IF user_id IS NOT NULL THEN
    INSERT INTO public.profiles (
      id,
      email,
      full_name,
      name,
      role,
      is_active,
      avatar_url
    ) VALUES (
      user_id,
      'admin@epilot.cg',
      'Super Admin E-Pilot',
      'Admin',
      'super_admin',
      true,
      'https://ui-avatars.com/api/?name=Admin+E-Pilot&background=1D3557&color=fff&size=200'
    )
    ON CONFLICT (id) DO UPDATE SET
      role = 'super_admin',
      is_active = true,
      updated_at = NOW();

    RAISE NOTICE 'Profil super admin créé/mis à jour pour: %', user_id;
  ELSE
    RAISE NOTICE 'Utilisateur admin@epilot.cg non trouvé dans auth.users';
    RAISE NOTICE 'Créez d''abord l''utilisateur via Supabase Auth Dashboard ou API';
  END IF;
END $$;

-- Instructions pour créer l'utilisateur manuellement:
-- 1. Aller dans Supabase Dashboard > Authentication > Users
-- 2. Cliquer sur "Add user" > "Create new user"
-- 3. Email: admin@epilot.cg
-- 4. Password: admin123
-- 5. Auto Confirm User: Coché
-- 6. Cliquer sur "Create user"
-- 7. Exécuter ce script SQL

-- Ou via l'API Supabase (JavaScript):
/*
const { data, error } = await supabase.auth.admin.createUser({
  email: 'admin@epilot.cg',
  password: 'admin123',
  email_confirm: true,
  user_metadata: {
    full_name: 'Super Admin E-Pilot',
    name: 'Admin',
  }
});
*/

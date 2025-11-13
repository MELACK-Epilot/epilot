-- ============================================
-- Migration: Créer table profiles pour Supabase Auth
-- Date: 2025-11-02
-- Description: Table profiles liée à auth.users pour stocker les données utilisateur
-- ============================================

-- Créer la table profiles (best practice Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  name TEXT, -- Prénom
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'enseignant',
  school_group_id UUID REFERENCES school_groups(id) ON DELETE SET NULL,
  school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_school_group_id ON profiles(school_group_id);
CREATE INDEX IF NOT EXISTS idx_profiles_school_id ON profiles(school_id);

-- Activer RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Politique: Super Admin peut tout voir
CREATE POLICY "Super Admin can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'super_admin'
  )
);

-- Politique: Admin Groupe peut voir les profils de son groupe
CREATE POLICY "Admin Groupe can view their group profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin_groupe'
    AND p.school_group_id = profiles.school_group_id
  )
);

-- Politique: Les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Trigger pour créer automatiquement un profil lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insérer un profil pour le super admin de test
INSERT INTO profiles (id, email, full_name, name, role, is_active)
SELECT 
  id,
  'admin@epilot.cg',
  'Super Admin E-Pilot',
  'Admin',
  'super_admin',
  true
FROM auth.users
WHERE email = 'admin@epilot.cg'
ON CONFLICT (id) DO NOTHING;

-- Commentaire
COMMENT ON TABLE profiles IS 'Profils utilisateurs liés à Supabase Auth';

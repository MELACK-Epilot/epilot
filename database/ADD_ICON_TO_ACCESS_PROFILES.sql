-- Migration pour ajouter la colonne icon à la table access_profiles
-- Cette colonne stocke l'emoji ou l'URL de l'avatar du profil

ALTER TABLE access_profiles 
ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT '👤';

-- Commentaire sur la colonne
COMMENT ON COLUMN access_profiles.icon IS 'Emoji ou URL de l''icône du profil';

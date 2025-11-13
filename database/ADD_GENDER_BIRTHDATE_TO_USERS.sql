-- =====================================================
-- AJOUTER GENRE ET DATE DE NAISSANCE À LA TABLE USERS
-- Date : 3 novembre 2025
-- =====================================================

-- =====================================================
-- 1. AJOUTER LES COLONNES
-- =====================================================

-- Ajouter la colonne genre
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS gender VARCHAR(1) CHECK (gender IN ('M', 'F'));

-- Ajouter la colonne date_of_birth
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Ajouter un commentaire pour documenter
COMMENT ON COLUMN public.users.gender IS 'Genre de l''utilisateur: M (Masculin) ou F (Féminin)';
COMMENT ON COLUMN public.users.date_of_birth IS 'Date de naissance de l''utilisateur';

DO $$ BEGIN RAISE NOTICE '✅ Colonnes gender et date_of_birth ajoutées à la table users'; END $$;

-- =====================================================
-- 2. VÉRIFIER LA STRUCTURE
-- =====================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name IN ('gender', 'date_of_birth')
ORDER BY ordinal_position;

-- =====================================================
-- 3. TESTER L'INSERTION
-- =====================================================

-- Test: Insérer un utilisateur avec genre et date de naissance
-- (NE PAS EXÉCUTER - Juste pour référence)
/*
INSERT INTO public.users (
  id,
  email,
  first_name,
  last_name,
  gender,
  date_of_birth,
  role,
  status,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'test@epilot.cg',
  'Test',
  'Utilisateur',
  'M',
  '1990-01-01',
  'admin_groupe',
  'active',
  NOW(),
  NOW()
);
*/

-- =====================================================
-- 4. METTRE À JOUR LES TYPES TYPESCRIPT (OPTIONNEL)
-- =====================================================

/*
Après avoir exécuté ce script, mettez à jour vos types TypeScript :

// src/types/database.types.ts
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  gender?: 'M' | 'F';  // ✅ Ajouté
  date_of_birth?: string;  // ✅ Ajouté (format: YYYY-MM-DD)
  phone?: string;
  role: 'super_admin' | 'admin_groupe' | 'admin_ecole';
  status: 'active' | 'inactive' | 'suspended';
  school_group_id?: string;
  school_id?: string;
  avatar?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
}
*/

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================

/*
✅ Colonnes ajoutées :
- gender VARCHAR(1) CHECK (gender IN ('M', 'F'))
- date_of_birth DATE

✅ Contraintes :
- gender peut être NULL, 'M' ou 'F'
- date_of_birth peut être NULL ou une date valide

✅ Formulaire utilisateur :
- Le champ "Genre" sera maintenant sauvegardé
- Le champ "Date de naissance" sera maintenant sauvegardé

✅ Affichage :
- Les données seront disponibles dans les profils utilisateurs
- Possibilité de filtrer par genre
- Possibilité de calculer l'âge
*/

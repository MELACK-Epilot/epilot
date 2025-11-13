-- =====================================================
-- VÉRIFIER LA STRUCTURE DE LA TABLE USERS
-- Date : 3 novembre 2025
-- =====================================================

-- =====================================================
-- 1. COLONNES DE LA TABLE USERS
-- =====================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
ORDER BY ordinal_position;

-- =====================================================
-- 2. VÉRIFIER SI GENRE ET DATE_NAISSANCE EXISTENT
-- =====================================================

SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name IN ('genre', 'gender', 'date_naissance', 'birth_date', 'date_of_birth');

-- =====================================================
-- 3. ÉCHANTILLON DE DONNÉES
-- =====================================================

SELECT 
  id,
  email,
  first_name,
  last_name,
  role,
  status,
  school_group_id,
  school_id,
  created_at
FROM public.users
LIMIT 5;

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================

/*
Si genre et date_naissance n'existent pas, il faut les ajouter :

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS genre VARCHAR(20),
ADD COLUMN IF NOT EXISTS date_naissance DATE;

Valeurs possibles pour genre :
- 'masculin' ou 'M'
- 'feminin' ou 'F'
- 'autre' ou 'O'
*/

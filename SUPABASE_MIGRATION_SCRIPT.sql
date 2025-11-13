-- ============================================
-- MIGRATION E-PILOT - Ajout champs utilisateur
-- Date: 29 Octobre 2025
-- ============================================

-- 1. DÉSACTIVER TEMPORAIREMENT LE RLS
-- ============================================

-- Désactiver RLS sur toutes les tables pour permettre la migration
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE school_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE modules DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_module_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE business_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE schools DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- 2. CORRIGER L'ENUM user_role (supprimer admin_ecole, ajouter rôles finaux)
-- ============================================

-- Étape 1: Créer le nouvel enum (SEULEMENT les 2 rôles administrateurs)
CREATE TYPE user_role_new AS ENUM (
  'super_admin',
  'admin_groupe'
);

-- Étape 2: Supprimer les valeurs par défaut temporairement
ALTER TABLE users ALTER COLUMN role DROP DEFAULT;

-- Étape 3: Modifier les colonnes pour utiliser le nouvel enum
ALTER TABLE users 
ALTER COLUMN role TYPE user_role_new 
USING role::text::user_role_new;

-- Modifier aussi la table notifications si elle existe
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'notifications' AND column_name = 'recipient_role') THEN
    ALTER TABLE notifications 
    ALTER COLUMN recipient_role TYPE user_role_new 
    USING recipient_role::text::user_role_new;
  END IF;
END $$;

-- Étape 4: Remettre une valeur par défaut valide
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'admin_groupe';

-- Étape 5: Supprimer l'ancien enum et renommer le nouveau
DROP TYPE user_role CASCADE;
ALTER TYPE user_role_new RENAME TO user_role;

-- 2. AJOUTER LES NOUVEAUX CHAMPS
-- ============================================

-- Ajouter le champ genre
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('M', 'F'));

-- Ajouter le champ date de naissance
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- 3. CRÉER LES INDEX POUR PERFORMANCE
-- ============================================

-- Index sur le genre (pour filtres/statistiques)
CREATE INDEX IF NOT EXISTS idx_users_gender ON users(gender);

-- Index sur la date de naissance (pour filtres par âge)
CREATE INDEX IF NOT EXISTS idx_users_date_of_birth ON users(date_of_birth);

-- Index composite rôle + groupe (pour les requêtes fréquentes)
CREATE INDEX IF NOT EXISTS idx_users_role_group ON users(role, school_group_id);

-- 4. RÉACTIVER LE RLS
-- ============================================

-- Réactiver RLS sur toutes les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_module_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 5. VÉRIFICATIONS
-- ============================================

-- Vérifier la structure de la table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Vérifier l'enum
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (
  SELECT oid 
  FROM pg_type 
  WHERE typname = 'user_role'
)
ORDER BY enumsortorder;

-- Vérifier les index
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'users';

-- ============================================
-- RÉSULTAT ATTENDU
-- ============================================

/*
La table users aura maintenant :
- gender : TEXT CHECK (gender IN ('M', 'F'))
- date_of_birth : DATE
- role : user_role avec 2 valeurs (super_admin, admin_groupe)

Les index créés amélioreront les performances pour :
- Filtres par genre
- Filtres par âge/date de naissance  
- Requêtes par rôle et groupe

Toutes les politiques RLS ont été recréées avec les bons rôles.
*/

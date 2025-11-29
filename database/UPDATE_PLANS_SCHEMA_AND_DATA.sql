-- ============================================================================
-- MIGRATION: HARMONISATION DU SCHÉMA SUBSCRIPTION_PLANS
-- ============================================================================
-- Objectif: Aligner la base de données avec le Frontend (PlansUltimate.tsx)
-- Date: 24 Novembre 2025
-- ============================================================================

BEGIN;

-- 1. AJOUT DES COLONNES MANQUANTES
-- ============================================================================

-- max_storage (Stockage en GB)
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS max_storage INTEGER DEFAULT 0;

-- support_level (Niveau de support)
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS support_level VARCHAR(50) DEFAULT 'email';

-- custom_branding (Personnalisation)
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS custom_branding BOOLEAN DEFAULT false;

-- api_access (Accès API)
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS api_access BOOLEAN DEFAULT false;

-- is_active (Booléen pour simplifier le frontend, synchronisé avec status)
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- discount (Remise en %)
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS discount INTEGER DEFAULT 0;

-- trial_days (Jours d'essai)
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 0;

-- 2. MISE À JOUR DES DONNÉES (Basé sur la hiérarchie des 4 plans)
-- ============================================================================

-- PLAN GRATUIT
UPDATE subscription_plans 
SET 
  max_storage = 1,            -- 1 GB
  support_level = 'community',
  custom_branding = false,
  api_access = false,
  is_active = true,
  max_schools = 3,
  max_students = 1000,
  max_staff = 50,
  trial_days = 0,
  description = 'Pour découvrir la plateforme et gérer une petite école.'
WHERE slug = 'gratuit';

-- PLAN PREMIUM (Standard)
UPDATE subscription_plans 
SET 
  max_storage = 5,            -- 5 GB
  support_level = 'email',
  custom_branding = false,
  api_access = false,
  is_active = true,
  max_schools = 10,
  max_students = 5000,
  max_staff = 500,
  trial_days = 14,
  is_popular = true,
  description = 'Idéal pour les groupes scolaires en croissance.'
WHERE slug = 'premium';

-- PLAN PRO (Avancé)
UPDATE subscription_plans 
SET 
  max_storage = 20,           -- 20 GB
  support_level = 'priority',
  custom_branding = true,
  api_access = true,
  is_active = true,
  max_schools = 50,
  max_students = 20000,
  max_staff = 2000,
  trial_days = 30,
  description = 'Pour les grands réseaux nécessitant des fonctionnalités avancées.'
WHERE slug = 'pro';

-- PLAN INSTITUTIONNEL (Enterprise)
UPDATE subscription_plans 
SET 
  max_storage = 100,          -- 100 GB (ou plus)
  support_level = 'dedicated',
  custom_branding = true,
  api_access = true,
  is_active = true,
  max_schools = -1,           -- Illimité
  max_students = -1,          -- Illimité
  max_staff = -1,             -- Illimité
  trial_days = 0,
  description = 'Solution sur mesure pour les gouvernements et très grands réseaux.'
WHERE slug = 'institutionnel';

-- 3. SYNCHRONISATION STATUS <-> IS_ACTIVE
-- ============================================================================
UPDATE subscription_plans SET is_active = (status = 'active');

-- 4. VÉRIFICATION FINALE
-- ============================================================================
SELECT 
  name, 
  slug, 
  price, 
  max_storage, 
  support_level, 
  api_access, 
  custom_branding
FROM subscription_plans
ORDER BY price ASC;

COMMIT;

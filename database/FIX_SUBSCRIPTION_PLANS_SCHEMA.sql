-- =====================================================
-- CORRECTION SCHÉMA TABLE SUBSCRIPTION_PLANS
-- =====================================================
-- Date : 6 novembre 2025
-- Objectif : Ajouter/corriger les colonnes manquantes
-- =====================================================

-- 1. Vérifier les colonnes existantes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'subscription_plans'
ORDER BY ordinal_position;

-- 2. Ajouter la colonne billing_period si elle n'existe pas
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS billing_period VARCHAR(20) DEFAULT 'monthly';

-- 3. Ajouter la colonne plan_type si elle n'existe pas (déjà fait normalement)
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS plan_type VARCHAR(50);

-- 4. Ajouter la colonne max_staff si elle n'existe pas
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS max_staff INTEGER DEFAULT 10;

-- 5. Ajouter la colonne max_storage si elle n'existe pas
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS max_storage INTEGER DEFAULT 5;

-- 6. Migrer les données si les anciennes colonnes existent
-- Si billing_cycle existe, copier vers billing_period
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscription_plans' AND column_name = 'billing_cycle'
  ) THEN
    UPDATE subscription_plans 
    SET billing_period = billing_cycle 
    WHERE billing_period IS NULL;
  END IF;
END $$;

-- Si max_personnel existe, copier vers max_staff
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscription_plans' AND column_name = 'max_personnel'
  ) THEN
    UPDATE subscription_plans 
    SET max_staff = max_personnel 
    WHERE max_staff IS NULL;
  END IF;
END $$;

-- Si storage_limit existe (string), convertir vers max_storage (integer)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscription_plans' AND column_name = 'storage_limit'
  ) THEN
    UPDATE subscription_plans 
    SET max_storage = CAST(REGEXP_REPLACE(storage_limit, '[^0-9]', '', 'g') AS INTEGER)
    WHERE max_storage IS NULL AND storage_limit IS NOT NULL;
  END IF;
END $$;

-- 7. Mettre à jour les plans existants avec plan_type si nécessaire
UPDATE subscription_plans 
SET plan_type = slug 
WHERE slug IN ('gratuit', 'premium', 'pro', 'institutionnel')
AND plan_type IS NULL;

-- 8. Vérifier les colonnes après modifications
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'subscription_plans'
AND column_name IN ('billing_period', 'plan_type', 'max_staff', 'max_storage', 'slug')
ORDER BY column_name;

-- 9. Vérifier les données
SELECT 
  id,
  name,
  slug,
  plan_type,
  billing_period,
  max_staff,
  max_storage
FROM subscription_plans
ORDER BY created_at DESC
LIMIT 5;

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================
-- ✅ Colonne billing_period ajoutée
-- ✅ Colonne plan_type ajoutée
-- ✅ Colonne max_staff ajoutée
-- ✅ Colonne max_storage ajoutée
-- ✅ Données migrées depuis anciennes colonnes
-- =====================================================

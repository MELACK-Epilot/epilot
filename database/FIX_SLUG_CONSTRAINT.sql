-- =====================================================
-- CORRECTION CONTRAINTE SLUG - PLANS
-- =====================================================
-- Date : 6 novembre 2025
-- Objectif : Permettre des slugs personnalisés au lieu de seulement 4 valeurs fixes
-- Problème : check constraint "check_slug_values" limite le slug à 'gratuit', 'premium', 'pro', 'institutionnel'
-- Solution : Supprimer la contrainte et ajouter un champ plan_type pour la catégorisation
-- =====================================================

-- 1. Supprimer la contrainte check sur le slug
ALTER TABLE subscription_plans 
DROP CONSTRAINT IF EXISTS check_slug_values;

-- 2. Ajouter une colonne plan_type pour garder la catégorisation
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS plan_type VARCHAR(50);

-- 3. Mettre à jour les plans existants avec le plan_type
UPDATE subscription_plans 
SET plan_type = slug 
WHERE slug IN ('gratuit', 'premium', 'pro', 'institutionnel')
AND plan_type IS NULL;

-- 4. Modifier les slugs existants pour éviter les conflits futurs (optionnel)
-- Décommentez si vous voulez renommer les slugs existants
/*
UPDATE subscription_plans 
SET slug = 'plan-gratuit-base' 
WHERE slug = 'gratuit';

UPDATE subscription_plans 
SET slug = 'plan-premium-standard' 
WHERE slug = 'premium';

UPDATE subscription_plans 
SET slug = 'plan-pro-avance' 
WHERE slug = 'pro';

UPDATE subscription_plans 
SET slug = 'plan-institutionnel-complet' 
WHERE slug = 'institutionnel';
*/

-- 5. Ajouter une contrainte pour s'assurer que le slug est en minuscules et sans espaces
ALTER TABLE subscription_plans 
ADD CONSTRAINT check_slug_format 
CHECK (slug ~ '^[a-z0-9-]+$');

-- 6. Ajouter une contrainte pour s'assurer que plan_type est valide (optionnel)
ALTER TABLE subscription_plans 
ADD CONSTRAINT check_plan_type_values 
CHECK (plan_type IN ('gratuit', 'premium', 'pro', 'institutionnel') OR plan_type IS NULL);

-- =====================================================
-- VÉRIFICATION
-- =====================================================

-- Vérifier les contraintes actuelles
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'subscription_plans'::regclass
ORDER BY conname;

-- Vérifier les plans existants
SELECT 
  id,
  name,
  slug,
  plan_type,
  created_at
FROM subscription_plans
ORDER BY created_at;

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================
-- ✅ Contrainte check_slug_values supprimée
-- ✅ Colonne plan_type ajoutée
-- ✅ Plans existants mis à jour avec plan_type
-- ✅ Nouvelle contrainte check_slug_format ajoutée (format valide)
-- ✅ Vous pouvez maintenant créer des plans avec des slugs personnalisés
-- =====================================================

-- EXEMPLES DE SLUGS VALIDES MAINTENANT :
-- ✅ 'plan-gratuit-base'
-- ✅ 'plan-premium-rentree-2025'
-- ✅ 'plan-pro-offre-speciale'
-- ✅ 'plan-institutionnel-lycee'
-- ✅ 'promo-novembre-2025'

-- EXEMPLES DE SLUGS INVALIDES :
-- ❌ 'Plan Premium' (majuscules et espaces)
-- ❌ 'plan_premium' (underscores non autorisés)
-- ❌ 'plan-premium!' (caractères spéciaux)
-- ❌ 'plan-été-2025' (accents)

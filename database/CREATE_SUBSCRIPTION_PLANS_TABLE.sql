-- =====================================================
-- CRÉATION TABLE : subscription_plans
-- =====================================================
-- Date: 10 Novembre 2025, 01:10
-- Objectif: Créer la table des plans d'abonnement
-- =====================================================

BEGIN;

-- =====================================================
-- ÉTAPE 1 : Supprimer la table si elle existe (optionnel)
-- =====================================================
-- DROP TABLE IF EXISTS subscription_plans CASCADE;

-- =====================================================
-- ÉTAPE 2 : Créer la table subscription_plans
-- =====================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informations de base
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  
  -- Tarification
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL DEFAULT 'FCFA',
  billing_period VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'yearly')),
  
  -- Limites et quotas
  max_schools INTEGER,  -- NULL = illimité
  max_students INTEGER,  -- NULL = illimité
  max_staff INTEGER,  -- NULL = illimité
  
  -- Fonctionnalités
  features JSONB DEFAULT '[]'::jsonb,
  
  -- Métadonnées
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  is_popular BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- ÉTAPE 3 : Créer les index
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_subscription_plans_slug ON subscription_plans(slug);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_status ON subscription_plans(status);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_price ON subscription_plans(price);

-- =====================================================
-- ÉTAPE 4 : Insérer les plans par défaut
-- =====================================================
INSERT INTO subscription_plans (
  name, 
  slug, 
  description, 
  price, 
  billing_period, 
  max_schools, 
  max_students, 
  max_staff,
  features,
  status,
  is_popular,
  display_order
) VALUES 
  (
    'Gratuit',
    'gratuit',
    'Plan gratuit pour découvrir E-PILOT',
    0,
    'yearly',
    3,
    1000,
    50,
    '["Gestion de base", "1 école gratuite", "Support communautaire"]'::jsonb,
    'active',
    false,
    1
  ),
  (
    'Premium',
    'premium',
    'Plan premium avec fonctionnalités avancées',
    25000,
    'monthly',
    10,
    5000,
    500,
    ["Gestion multi-écoles", "Tableau de bord avancé", "Rapports financiers", "Support prioritaire", "Modules premium"]'::jsonb,
    'active',
    true,
    2
  ),
  (
    'Pro',
    'pro',
    'Plan professionnel pour grandes institutions',
    50000,
    'monthly',
    50,
    20000,
    2000,
    '["Toutes fonctionnalités Premium", "API Access", "Intégrations avancées", "Support dédié 24/7", "Formation personnalisée"]'::jsonb,
    'active',
    false,
    3
  ),
  (
    'Institutionnel',
    'institutionnel',
    'Plan sur mesure pour institutions gouvernementales',
    100000,
    'yearly',
    NULL,  -- Illimité
    NULL,  -- Illimité
    NULL,  -- Illimité
    '["Tout inclus", "Personnalisation complète", "Infrastructure dédiée", "SLA garanti", "Conformité gouvernementale"]'::jsonb,
    'active',
    false,
    4
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  billing_period = EXCLUDED.billing_period,
  max_schools = EXCLUDED.max_schools,
  max_students = EXCLUDED.max_students,
  max_staff = EXCLUDED.max_staff,
  features = EXCLUDED.features,
  status = EXCLUDED.status,
  is_popular = EXCLUDED.is_popular,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- =====================================================
-- ÉTAPE 5 : Créer les tables de liaison (si pas déjà créées)
-- =====================================================

-- Table : plan_modules (modules inclus dans chaque plan)
CREATE TABLE IF NOT EXISTS plan_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  is_included BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(plan_id, module_id)
);

-- Table : plan_categories (catégories incluses dans chaque plan)
CREATE TABLE IF NOT EXISTS plan_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES business_categories(id) ON DELETE CASCADE,
  is_included BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(plan_id, category_id)
);

-- =====================================================
-- ÉTAPE 6 : Vérifier le résultat
-- =====================================================
SELECT 
  id,
  name,
  slug,
  price,
  billing_period,
  max_schools,
  max_students,
  max_staff,
  status
FROM subscription_plans
ORDER BY display_order;

COMMIT;

-- =====================================================
-- ✅ RÉSULTAT ATTENDU
-- =====================================================
-- 4 plans créés :
-- 1. Gratuit (0 FCFA/an, 3 écoles)
-- 2. Premium (25,000 FCFA/mois, 10 écoles) ⭐
-- 3. Pro (50,000 FCFA/mois, 50 écoles)
-- 4. Institutionnel (100,000 FCFA/an, illimité)
-- =====================================================

-- =====================================================
-- COMMENTAIRES
-- =====================================================
COMMENT ON TABLE subscription_plans IS 'Plans d''abonnement disponibles pour les groupes scolaires';
COMMENT ON COLUMN subscription_plans.slug IS 'Identifiant unique du plan (gratuit, premium, pro, institutionnel)';
COMMENT ON COLUMN subscription_plans.max_schools IS 'Nombre maximum d''écoles autorisées (NULL = illimité)';
COMMENT ON COLUMN subscription_plans.max_students IS 'Nombre maximum d''élèves autorisés (NULL = illimité)';
COMMENT ON COLUMN subscription_plans.max_staff IS 'Nombre maximum de personnel autorisé (NULL = illimité)';
COMMENT ON COLUMN subscription_plans.features IS 'Liste des fonctionnalités incluses (format JSON)';

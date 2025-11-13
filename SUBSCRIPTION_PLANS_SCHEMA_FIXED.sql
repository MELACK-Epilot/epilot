-- ============================================
-- SCHÉMA SQL : SYSTÈME D'ABONNEMENT E-PILOT (VERSION CORRIGÉE)
-- ============================================
-- Description : Gestion des plans d'abonnement et quotas
-- Auteur : E-Pilot Congo
-- Date : 2025-01-30
-- Version : 2.0 (Corrigée - Gestion des doublons)
-- ============================================

-- ============================================
-- 1. TABLE : subscription_plans
-- ============================================

CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informations de base
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  
  -- Tarification
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL DEFAULT 'FCFA' CHECK (currency IN ('FCFA', 'EUR', 'USD')),
  billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  duration INTEGER NOT NULL DEFAULT 1,
  discount DECIMAL(5, 2) DEFAULT 0,
  trial_days INTEGER DEFAULT 0,
  
  -- Limites (Quotas)
  max_schools INTEGER NOT NULL DEFAULT 1,
  max_students INTEGER NOT NULL DEFAULT 100,
  max_personnel INTEGER NOT NULL DEFAULT 10,
  storage_limit VARCHAR(20) NOT NULL DEFAULT '5GB',
  
  -- Fonctionnalités
  features JSONB DEFAULT '[]'::jsonb,
  category_ids UUID[] DEFAULT ARRAY[]::UUID[],
  module_ids UUID[] DEFAULT ARRAY[]::UUID[],
  
  -- Support et options
  support_level VARCHAR(20) NOT NULL DEFAULT 'email' CHECK (support_level IN ('email', 'priority', '24/7')),
  custom_branding BOOLEAN DEFAULT FALSE,
  api_access BOOLEAN DEFAULT FALSE,
  
  -- Statut
  is_active BOOLEAN DEFAULT TRUE,
  is_popular BOOLEAN DEFAULT FALSE,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- Contrainte CHECK sur le slug (avec vérification d'existence)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_slug_values' 
    AND conrelid = 'subscription_plans'::regclass
  ) THEN
    ALTER TABLE subscription_plans
    ADD CONSTRAINT check_slug_values CHECK (slug IN ('gratuit', 'premium', 'pro', 'institutionnel'));
  END IF;
END $$;

-- Index (avec vérification d'existence)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_subscription_plans_slug') THEN
    CREATE INDEX idx_subscription_plans_slug ON subscription_plans(slug);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_subscription_plans_is_active') THEN
    CREATE INDEX idx_subscription_plans_is_active ON subscription_plans(is_active);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_subscription_plans_created_at') THEN
    CREATE INDEX idx_subscription_plans_created_at ON subscription_plans(created_at DESC);
  END IF;
END $$;

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_subscription_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER trigger_update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_plans_updated_at();

-- ============================================
-- 2. INSERTION DES PLANS PAR DÉFAUT (avec gestion des doublons)
-- ============================================

INSERT INTO subscription_plans (
  name, slug, description, price, currency, billing_cycle, duration,
  max_schools, max_students, max_personnel, storage_limit,
  features, support_level, custom_branding, api_access, is_active, is_popular
) VALUES
-- Plan Gratuit
(
  'Gratuit',
  'gratuit',
  'Plan de base pour découvrir E-Pilot. Idéal pour les petites structures.',
  0,
  'FCFA',
  'monthly',
  12,
  1,
  50,
  5,
  '5GB',
  '["Gestion de base", "1 école", "50 élèves max", "5 personnel", "Support email"]'::jsonb,
  'email',
  FALSE,
  FALSE,
  TRUE,
  FALSE
),
-- Plan Premium
(
  'Premium ⭐',
  'premium',
  'Pour les établissements en croissance. Fonctionnalités avancées.',
  25000,
  'FCFA',
  'monthly',
  1,
  3,
  200,
  20,
  '20GB',
  '["Toutes fonctionnalités de base", "3 écoles", "200 élèves", "20 personnel", "Support prioritaire", "Rapports avancés"]'::jsonb,
  'priority',
  FALSE,
  FALSE,
  TRUE,
  TRUE
),
-- Plan Pro
(
  'Pro',
  'pro',
  'Solution complète pour les groupes scolaires. Gestion multi-établissements.',
  50000,
  'FCFA',
  'monthly',
  1,
  10,
  1000,
  100,
  '100GB',
  '["Toutes fonctionnalités Premium", "10 écoles", "1000 élèves", "100 personnel", "Support 24/7", "API Access", "Branding personnalisé"]'::jsonb,
  '24/7',
  TRUE,
  TRUE,
  TRUE,
  FALSE
),
-- Plan Institutionnel
(
  'Institutionnel',
  'institutionnel',
  'Pour les grandes institutions. Ressources illimitées et support dédié.',
  150000,
  'FCFA',
  'monthly',
  1,
  999999,
  999999,
  999999,
  'Illimité',
  '["Tout illimité", "Écoles illimitées", "Élèves illimités", "Personnel illimité", "Support dédié 24/7", "API complète", "Branding complet", "Formation sur site"]'::jsonb,
  '24/7',
  TRUE,
  TRUE,
  TRUE,
  FALSE
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  max_schools = EXCLUDED.max_schools,
  max_students = EXCLUDED.max_students,
  max_personnel = EXCLUDED.max_personnel,
  storage_limit = EXCLUDED.storage_limit,
  features = EXCLUDED.features,
  updated_at = NOW();

-- ============================================
-- 3. VUE : school_groups_with_quotas
-- ============================================

CREATE OR REPLACE VIEW school_groups_with_quotas AS
SELECT
  sg.id AS school_group_id,
  sg.name AS group_name,
  sg.plan_id,
  sp.name AS plan_name,
  sp.slug AS plan_slug,
  
  -- Limites du plan
  sp.max_schools,
  sp.max_students,
  sp.max_personnel,
  sp.storage_limit,
  
  -- Utilisation actuelle
  COALESCE(COUNT(DISTINCT s.id), 0) AS current_schools,
  COALESCE(SUM(s.student_count), 0) AS current_students,
  COALESCE(SUM(s.personnel_count), 0) AS current_personnel,
  COALESCE(SUM(s.storage_used), 0) AS current_storage,
  
  -- Pourcentages d'utilisation
  CASE 
    WHEN sp.max_schools = 999999 THEN 0
    ELSE ROUND((COALESCE(COUNT(DISTINCT s.id), 0)::DECIMAL / NULLIF(sp.max_schools, 0)) * 100, 2)
  END AS schools_usage_percent,
  
  CASE 
    WHEN sp.max_students = 999999 THEN 0
    ELSE ROUND((COALESCE(SUM(s.student_count), 0)::DECIMAL / NULLIF(sp.max_students, 0)) * 100, 2)
  END AS students_usage_percent,
  
  CASE 
    WHEN sp.max_personnel = 999999 THEN 0
    ELSE ROUND((COALESCE(SUM(s.personnel_count), 0)::DECIMAL / NULLIF(sp.max_personnel, 0)) * 100, 2)
  END AS personnel_usage_percent,
  
  CASE 
    WHEN sp.storage_limit = 'Illimité' THEN 0
    ELSE ROUND((COALESCE(SUM(s.storage_used), 0)::DECIMAL / NULLIF(
      CASE 
        WHEN sp.storage_limit LIKE '%GB' THEN CAST(REPLACE(sp.storage_limit, 'GB', '') AS INTEGER) * 1024
        WHEN sp.storage_limit LIKE '%MB' THEN CAST(REPLACE(sp.storage_limit, 'MB', '') AS INTEGER)
        ELSE 0
      END, 0)) * 100, 2)
  END AS storage_usage_percent

FROM school_groups sg
JOIN subscription_plans sp ON sg.plan_id = sp.id
LEFT JOIN schools s ON s.school_group_id = sg.id
GROUP BY sg.id, sg.name, sg.plan_id, sp.name, sp.slug, sp.max_schools, sp.max_students, sp.max_personnel, sp.storage_limit;

-- ============================================
-- 4. FONCTION : check_quota_before_creation
-- ============================================

CREATE OR REPLACE FUNCTION check_quota_before_creation(
  p_school_group_id UUID,
  p_resource_type VARCHAR,
  p_quantity INTEGER DEFAULT 1
)
RETURNS JSONB AS $$
DECLARE
  v_quota RECORD;
  v_can_create BOOLEAN := FALSE;
  v_message TEXT;
  v_current INTEGER;
  v_max INTEGER;
  v_remaining INTEGER;
BEGIN
  -- Récupérer les quotas
  SELECT * INTO v_quota
  FROM school_groups_with_quotas
  WHERE school_group_id = p_school_group_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'can_create', FALSE,
      'message', 'Groupe scolaire non trouvé',
      'current', 0,
      'max', 0,
      'remaining', 0
    );
  END IF;
  
  -- Vérifier selon le type de ressource
  CASE p_resource_type
    WHEN 'school' THEN
      v_current := v_quota.current_schools;
      v_max := v_quota.max_schools;
      v_can_create := (v_max = 999999) OR (v_current + p_quantity <= v_max);
      v_message := CASE 
        WHEN v_can_create THEN 'Quota disponible'
        ELSE format('Limite atteinte : %s/%s écoles. Passez au plan supérieur.', v_current, v_max)
      END;
      
    WHEN 'student' THEN
      v_current := v_quota.current_students;
      v_max := v_quota.max_students;
      v_can_create := (v_max = 999999) OR (v_current + p_quantity <= v_max);
      v_message := CASE 
        WHEN v_can_create THEN 'Quota disponible'
        ELSE format('Limite atteinte : %s/%s élèves. Passez au plan supérieur.', v_current, v_max)
      END;
      
    WHEN 'personnel' THEN
      v_current := v_quota.current_personnel;
      v_max := v_quota.max_personnel;
      v_can_create := (v_max = 999999) OR (v_current + p_quantity <= v_max);
      v_message := CASE 
        WHEN v_can_create THEN 'Quota disponible'
        ELSE format('Limite atteinte : %s/%s personnel. Passez au plan supérieur.', v_current, v_max)
      END;
      
    ELSE
      RETURN jsonb_build_object(
        'can_create', FALSE,
        'message', 'Type de ressource invalide',
        'current', 0,
        'max', 0,
        'remaining', 0
      );
  END CASE;
  
  v_remaining := GREATEST(0, v_max - v_current);
  
  RETURN jsonb_build_object(
    'can_create', v_can_create,
    'message', v_message,
    'current', v_current,
    'max', v_max,
    'remaining', v_remaining,
    'plan_name', v_quota.plan_name,
    'plan_slug', v_quota.plan_slug
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. POLITIQUES RLS
-- ============================================

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active plans" ON subscription_plans;
CREATE POLICY "Anyone can view active plans"
ON subscription_plans FOR SELECT
TO authenticated
USING (is_active = TRUE);

DROP POLICY IF EXISTS "Super Admin can manage plans" ON subscription_plans;
CREATE POLICY "Super Admin can manage plans"
ON subscription_plans FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

-- ============================================
-- FIN DU SCHÉMA (VERSION CORRIGÉE)
-- ============================================

SELECT 'Schéma subscription_plans créé avec succès!' AS status;

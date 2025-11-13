-- ============================================
-- SCHÉMA SQL : SYSTÈME D'ABONNEMENT E-PILOT
-- ============================================
-- Description : Gestion des plans d'abonnement et quotas
-- Auteur : E-Pilot Congo
-- Date : 2025-01-30
-- ============================================

-- ============================================
-- 1. TABLE : subscription_plans
-- ============================================
-- Description : Plans d'abonnement disponibles
-- Gestion : Super Admin uniquement
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
  duration INTEGER NOT NULL DEFAULT 1, -- Durée en mois
  discount DECIMAL(5, 2) DEFAULT 0, -- Pourcentage de réduction
  trial_days INTEGER DEFAULT 0,
  
  -- Limites (Quotas)
  max_schools INTEGER NOT NULL DEFAULT 1,
  max_students INTEGER NOT NULL DEFAULT 100,
  max_personnel INTEGER NOT NULL DEFAULT 10,
  storage_limit VARCHAR(20) NOT NULL DEFAULT '5GB', -- Ex: "10GB", "50GB", "Illimité"
  
  -- Fonctionnalités
  features JSONB DEFAULT '[]'::jsonb, -- Liste des fonctionnalités
  category_ids UUID[] DEFAULT ARRAY[]::UUID[], -- Catégories incluses
  module_ids UUID[] DEFAULT ARRAY[]::UUID[], -- Modules inclus
  
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

-- Contrainte CHECK sur le slug (ajoutée après la création de la table)
ALTER TABLE subscription_plans
ADD CONSTRAINT check_slug_values CHECK (slug IN ('gratuit', 'premium', 'pro', 'institutionnel'));

-- Index pour améliorer les performances
CREATE INDEX idx_subscription_plans_slug ON subscription_plans(slug);
CREATE INDEX idx_subscription_plans_is_active ON subscription_plans(is_active);
CREATE INDEX idx_subscription_plans_created_at ON subscription_plans(created_at DESC);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_subscription_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_plans_updated_at();

-- ============================================
-- 2. INSERTION DES PLANS PAR DÉFAUT
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
  12, -- 12 mois
  1, -- 1 école
  50, -- 50 élèves
  5, -- 5 personnel
  '5GB',
  '["Gestion des élèves", "Gestion du personnel", "Tableau de bord basique", "Support par email"]'::jsonb,
  'email',
  FALSE,
  FALSE,
  TRUE,
  FALSE
),
-- Plan Premium
(
  'Premium',
  'premium',
  'Plan intermédiaire pour les établissements en croissance.',
  25000,
  'FCFA',
  'monthly',
  12,
  3, -- 3 écoles
  200, -- 200 élèves
  20, -- 20 personnel
  '20GB',
  '["Gestion des élèves", "Gestion du personnel", "Gestion des notes", "Communication", "Rapports avancés", "Support prioritaire"]'::jsonb,
  'priority',
  FALSE,
  FALSE,
  TRUE,
  TRUE -- Plan populaire
),
-- Plan Pro
(
  'Pro',
  'pro',
  'Plan professionnel pour les groupes scolaires établis.',
  50000,
  'FCFA',
  'monthly',
  12,
  10, -- 10 écoles
  1000, -- 1000 élèves
  100, -- 100 personnel
  '100GB',
  '["Toutes les fonctionnalités Premium", "Gestion financière", "Gestion des modules", "Personnalisation", "API Access", "Support 24/7"]'::jsonb,
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
  'Plan sur mesure pour les grandes institutions et réseaux d''écoles.',
  150000,
  'FCFA',
  'monthly',
  12,
  999999, -- Illimité
  999999, -- Illimité
  999999, -- Illimité
  'Illimité',
  '["Toutes les fonctionnalités", "Multi-sites", "Personnalisation complète", "Formation dédiée", "Support dédié 24/7", "SLA garanti"]'::jsonb,
  '24/7',
  TRUE,
  TRUE,
  TRUE,
  FALSE
);

-- ============================================
-- 3. MODIFICATION DE LA TABLE school_groups
-- ============================================
-- Ajout de la colonne plan_id pour lier au plan d'abonnement

ALTER TABLE school_groups
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL;

-- Mettre à jour les groupes existants avec le plan gratuit par défaut
UPDATE school_groups
SET plan_id = (SELECT id FROM subscription_plans WHERE slug = 'gratuit' LIMIT 1)
WHERE plan_id IS NULL;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_school_groups_plan_id ON school_groups(plan_id);

-- ============================================
-- 4. VUE : school_groups_with_quotas
-- ============================================
-- Vue pour afficher les groupes avec leurs quotas d'utilisation

CREATE OR REPLACE VIEW school_groups_with_quotas AS
SELECT 
  sg.id AS school_group_id,
  sg.name AS school_group_name,
  sg.code AS school_group_code,
  sg.status AS school_group_status,
  
  -- Informations du plan
  sp.id AS plan_id,
  sp.name AS plan_name,
  sp.slug AS plan_slug,
  sp.max_schools,
  sp.max_students,
  sp.max_personnel,
  sp.storage_limit,
  
  -- Utilisation actuelle (à calculer depuis les tables écoles, élèves, personnel)
  sg.school_count AS current_schools,
  sg.student_count AS current_students,
  sg.staff_count AS current_personnel,
  '0GB' AS current_storage, -- À implémenter avec Supabase Storage
  
  -- Pourcentages d'utilisation
  CASE 
    WHEN sp.max_schools = 999999 THEN 0
    ELSE ROUND((sg.school_count::DECIMAL / sp.max_schools) * 100, 2)
  END AS schools_usage_percent,
  
  CASE 
    WHEN sp.max_students = 999999 THEN 0
    ELSE ROUND((sg.student_count::DECIMAL / sp.max_students) * 100, 2)
  END AS students_usage_percent,
  
  CASE 
    WHEN sp.max_personnel = 999999 THEN 0
    ELSE ROUND((sg.staff_count::DECIMAL / sp.max_personnel) * 100, 2)
  END AS personnel_usage_percent,
  
  0 AS storage_usage_percent, -- À implémenter
  
  -- Statut des limites
  (sg.school_count >= sp.max_schools AND sp.max_schools < 999999) AS is_schools_limit_reached,
  (sg.student_count >= sp.max_students AND sp.max_students < 999999) AS is_students_limit_reached,
  (sg.staff_count >= sp.max_personnel AND sp.max_personnel < 999999) AS is_personnel_limit_reached,
  FALSE AS is_storage_limit_reached -- À implémenter
  
FROM school_groups sg
LEFT JOIN subscription_plans sp ON sg.plan_id = sp.id;

-- ============================================
-- 5. FONCTION : check_quota_before_creation
-- ============================================
-- Fonction pour vérifier les quotas avant création

CREATE OR REPLACE FUNCTION check_quota_before_creation(
  p_school_group_id UUID,
  p_resource_type VARCHAR, -- 'school', 'student', 'personnel'
  p_increment INTEGER DEFAULT 1
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_current_count INTEGER;
  v_max_count INTEGER;
  v_plan_name VARCHAR;
BEGIN
  -- Récupérer les informations du quota
  SELECT 
    CASE 
      WHEN p_resource_type = 'school' THEN q.current_schools
      WHEN p_resource_type = 'student' THEN q.current_students
      WHEN p_resource_type = 'personnel' THEN q.current_personnel
    END,
    CASE 
      WHEN p_resource_type = 'school' THEN q.max_schools
      WHEN p_resource_type = 'student' THEN q.max_students
      WHEN p_resource_type = 'personnel' THEN q.max_personnel
    END,
    q.plan_name
  INTO v_current_count, v_max_count, v_plan_name
  FROM school_groups_with_quotas q
  WHERE q.school_group_id = p_school_group_id;
  
  -- Vérifier si la limite est atteinte
  IF v_current_count + p_increment > v_max_count AND v_max_count < 999999 THEN
    v_result := jsonb_build_object(
      'allowed', FALSE,
      'message', format('Limite atteinte : Vous avez atteint la limite de votre plan %s (%s/%s %s). Veuillez passer à un plan supérieur.',
        v_plan_name,
        v_current_count,
        v_max_count,
        CASE 
          WHEN p_resource_type = 'school' THEN 'écoles'
          WHEN p_resource_type = 'student' THEN 'élèves'
          WHEN p_resource_type = 'personnel' THEN 'personnel'
        END
      ),
      'current', v_current_count,
      'max', v_max_count,
      'plan_name', v_plan_name
    );
  ELSE
    v_result := jsonb_build_object(
      'allowed', TRUE,
      'message', 'Quota disponible',
      'current', v_current_count,
      'max', v_max_count,
      'plan_name', v_plan_name
    );
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. POLITIQUES RLS (Row Level Security)
-- ============================================

-- Activer RLS sur subscription_plans
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Politique : Super Admin peut tout faire
CREATE POLICY "Super Admin can manage subscription plans"
ON subscription_plans
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

-- Politique : Tous les utilisateurs authentifiés peuvent lire les plans actifs
CREATE POLICY "Authenticated users can view active plans"
ON subscription_plans
FOR SELECT
TO authenticated
USING (is_active = TRUE);

-- ============================================
-- 7. COMMENTAIRES
-- ============================================

COMMENT ON TABLE subscription_plans IS 'Plans d''abonnement disponibles pour les groupes scolaires';
COMMENT ON COLUMN subscription_plans.slug IS 'Identifiant unique du plan (gratuit, premium, pro, institutionnel)';
COMMENT ON COLUMN subscription_plans.max_schools IS 'Nombre maximum d''écoles autorisées';
COMMENT ON COLUMN subscription_plans.max_students IS 'Nombre maximum d''élèves autorisés';
COMMENT ON COLUMN subscription_plans.max_personnel IS 'Nombre maximum de personnel autorisé';
COMMENT ON COLUMN subscription_plans.storage_limit IS 'Limite de stockage (ex: "10GB", "Illimité")';
COMMENT ON VIEW school_groups_with_quotas IS 'Vue combinant les groupes scolaires et leurs quotas d''utilisation';
COMMENT ON FUNCTION check_quota_before_creation IS 'Vérifie si un quota est disponible avant création d''une ressource';

-- ============================================
-- FIN DU SCHÉMA
-- ============================================

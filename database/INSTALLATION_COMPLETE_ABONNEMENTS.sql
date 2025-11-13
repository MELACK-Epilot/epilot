-- =====================================================
-- INSTALLATION COMPLÈTE : Système Abonnements
-- =====================================================
-- Date: 10 Novembre 2025, 01:15
-- Objectif: Installer TOUT le système d'abonnements
-- Ordre d'exécution: 1, 2, 3, 4, 5
-- =====================================================

-- =====================================================
-- PARTIE 1 : Créer la table subscription_plans
-- =====================================================
BEGIN;

CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL DEFAULT 'FCFA',
  billing_period VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'yearly')),
  max_schools INTEGER,
  max_students INTEGER,
  max_staff INTEGER,
  features JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  is_popular BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_plans_slug ON subscription_plans(slug);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_status ON subscription_plans(status);

-- Insérer les plans
INSERT INTO subscription_plans (name, slug, description, price, billing_period, max_schools, max_students, max_staff, features, status, is_popular, display_order) 
VALUES 
  ('Gratuit', 'gratuit', 'Plan gratuit pour découvrir E-PILOT', 0, 'yearly', 3, 1000, 50, '["Gestion de base", "1 école gratuite", "Support communautaire"]'::jsonb, 'active', false, 1),
  ('Premium', 'premium', 'Plan premium avec fonctionnalités avancées', 25000, 'monthly', 10, 5000, 500, '["Gestion multi-écoles", "Tableau de bord avancé", "Rapports financiers", "Support prioritaire"]'::jsonb, 'active', true, 2),
  ('Pro', 'pro', 'Plan professionnel pour grandes institutions', 50000, 'monthly', 50, 20000, 2000, '["Toutes fonctionnalités Premium", "API Access", "Support dédié 24/7"]'::jsonb, 'active', false, 3),
  ('Institutionnel', 'institutionnel', 'Plan sur mesure pour institutions', 100000, 'yearly', NULL, NULL, NULL, '["Tout inclus", "Infrastructure dédiée", "SLA garanti"]'::jsonb, 'active', false, 4)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  updated_at = NOW();

COMMIT;

-- =====================================================
-- PARTIE 2 : Créer la table subscriptions
-- =====================================================
BEGIN;

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_group_id UUID NOT NULL REFERENCES school_groups(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'pending', 'suspended')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'FCFA',
  billing_period VARCHAR(20) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue', 'cancelled')),
  payment_method VARCHAR(50),
  auto_renew BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_school_group ON subscriptions(school_group_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_dates ON subscriptions(start_date, end_date);

COMMIT;

-- =====================================================
-- PARTIE 3 : Trigger auto-création abonnement
-- =====================================================
BEGIN;

CREATE OR REPLACE FUNCTION create_subscription_on_group_creation()
RETURNS TRIGGER AS $$
DECLARE
  v_plan_id UUID;
  v_plan_price DECIMAL(10,2);
  v_billing_period VARCHAR(20);
  v_end_date TIMESTAMPTZ;
BEGIN
  SELECT id, price, billing_period
  INTO v_plan_id, v_plan_price, v_billing_period
  FROM subscription_plans
  WHERE slug = NEW.plan;

  IF v_plan_id IS NULL THEN
    RAISE WARNING '⚠️ Plan "%" non trouvé', NEW.plan;
    RETURN NEW;
  END IF;

  IF v_billing_period = 'monthly' THEN
    v_end_date := NOW() + INTERVAL '1 month';
  ELSE
    v_end_date := NOW() + INTERVAL '1 year';
  END IF;

  INSERT INTO subscriptions (
    school_group_id, plan_id, status, start_date, end_date,
    amount, currency, billing_period, payment_status, payment_method, auto_renew
  ) VALUES (
    NEW.id, v_plan_id, 'active', NOW(), v_end_date,
    v_plan_price, 'FCFA', v_billing_period, 'pending', 'bank_transfer', true
  );

  RAISE NOTICE '✅ Abonnement créé pour groupe "%"', NEW.name;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_subscription_on_group ON school_groups;

CREATE TRIGGER trigger_create_subscription_on_group
  AFTER INSERT ON school_groups
  FOR EACH ROW
  EXECUTE FUNCTION create_subscription_on_group_creation();

COMMIT;

-- =====================================================
-- PARTIE 4 : Créer abonnements pour groupes existants
-- =====================================================
BEGIN;

INSERT INTO subscriptions (
  school_group_id, plan_id, status, start_date, end_date,
  amount, currency, billing_period, payment_status, payment_method, auto_renew
)
SELECT 
  sg.id, sp.id, 'active', NOW(),
  CASE WHEN sp.billing_period = 'monthly' THEN NOW() + INTERVAL '1 month' ELSE NOW() + INTERVAL '1 year' END,
  sp.price, 'FCFA', sp.billing_period, 'pending', 'bank_transfer', true
FROM school_groups sg
JOIN subscription_plans sp ON sp.slug = sg.plan
WHERE sg.id NOT IN (SELECT school_group_id FROM subscriptions WHERE school_group_id IS NOT NULL)
  AND sg.status = 'active'
  AND sp.status = 'active';

COMMIT;

-- =====================================================
-- PARTIE 5 : Vérification finale
-- =====================================================
SELECT 
  '✅ Plans créés' AS etape,
  COUNT(*) AS nombre
FROM subscription_plans
UNION ALL
SELECT 
  '✅ Abonnements créés' AS etape,
  COUNT(*) AS nombre
FROM subscriptions
UNION ALL
SELECT 
  '✅ Groupes avec abonnement' AS etape,
  COUNT(DISTINCT school_group_id) AS nombre
FROM subscriptions;

-- Afficher les abonnements
SELECT 
  sg.name AS groupe,
  sg.code,
  sp.name AS plan,
  s.amount,
  s.billing_period,
  s.status,
  s.start_date,
  s.end_date
FROM subscriptions s
JOIN school_groups sg ON sg.id = s.school_group_id
JOIN subscription_plans sp ON sp.id = s.plan_id
ORDER BY s.created_at DESC;

-- =====================================================
-- ✅ INSTALLATION TERMINÉE
-- =====================================================
-- Si tout fonctionne :
-- ✅ 4 plans créés
-- ✅ X abonnements créés (1 par groupe)
-- ✅ Trigger installé
-- ✅ Le tableau React devrait maintenant fonctionner
-- =====================================================

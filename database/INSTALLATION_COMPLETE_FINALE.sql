-- =====================================================
-- INSTALLATION COMPLÈTE FINALE : Système Abonnements
-- =====================================================
-- Date: 10 Novembre 2025, 01:25
-- Exécuter dans l'ordre : Ce fichier fait TOUT
-- =====================================================

BEGIN;

-- =====================================================
-- PARTIE 1 : Améliorer subscription_plans
-- =====================================================

-- Ajouter 'status' pour compatibilité React
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) 
GENERATED ALWAYS AS (
  CASE 
    WHEN is_active = true THEN 'active'
    ELSE 'inactive'
  END
) STORED;

CREATE INDEX IF NOT EXISTS idx_subscription_plans_status 
ON subscription_plans(status);

-- Insérer/Mettre à jour les plans
INSERT INTO subscription_plans (
  name, slug, description, price, currency, billing_cycle, billing_period,
  duration, max_schools, max_students, max_personnel, max_staff,
  storage_limit, max_storage, features, support_level, custom_branding,
  api_access, is_active, is_popular, plan_type
) VALUES 
  ('Gratuit', 'gratuit', 'Plan gratuit pour découvrir E-PILOT', 0, 'FCFA', 'yearly', 'yearly', 12, 3, 1000, 50, 50, '5GB', 5, 
   '["Gestion de base", "Support communautaire"]'::jsonb, 'email', false, false, true, false, 'gratuit'),
  ('Premium', 'premium', 'Plan premium avec fonctionnalités avancées', 25000, 'FCFA', 'monthly', 'monthly', 1, 10, 5000, 500, 500, '50GB', 50,
   '["Gestion multi-écoles", "Tableau de bord avancé", "Support prioritaire"]'::jsonb, 'priority', false, false, true, true, 'premium'),
  ('Pro', 'pro', 'Plan professionnel pour grandes institutions', 50000, 'FCFA', 'monthly', 'monthly', 1, 50, 20000, 2000, 2000, '200GB', 200,
   '["Toutes fonctionnalités Premium", "API Access", "Support 24/7"]'::jsonb, '24/7', true, true, true, false, 'pro'),
  ('Institutionnel', 'institutionnel', 'Plan sur mesure pour institutions', 100000, 'FCFA', 'yearly', 'yearly', 12, 999999, 999999, 999999, 999999, 'Illimité', 999999,
   '["Tout inclus", "Infrastructure dédiée", "SLA garanti"]'::jsonb, '24/7', true, true, true, false, 'institutionnel')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  billing_cycle = EXCLUDED.billing_cycle,
  billing_period = EXCLUDED.billing_period,
  updated_at = NOW();

-- =====================================================
-- PARTIE 2 : Créer/Améliorer table subscriptions
-- =====================================================

-- Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_group_id UUID NOT NULL REFERENCES school_groups(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL DEFAULT 'FCFA',
  billing_period VARCHAR(20) NOT NULL DEFAULT 'monthly',
  payment_status VARCHAR(20) DEFAULT 'pending',
  payment_method VARCHAR(50) DEFAULT 'bank_transfer',
  auto_renew BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ajouter colonnes manquantes si la table existe déjà
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS billing_period VARCHAR(20) DEFAULT 'monthly';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'bank_transfer';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT true;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'FCFA';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS notes TEXT;

-- Créer les index
CREATE INDEX IF NOT EXISTS idx_subscriptions_school_group ON subscriptions(school_group_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_dates ON subscriptions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_billing_period ON subscriptions(billing_period);

-- =====================================================
-- PARTIE 3 : Trigger auto-création abonnement
-- =====================================================

CREATE OR REPLACE FUNCTION create_subscription_on_group_creation()
RETURNS TRIGGER AS $$
DECLARE
  v_plan_id UUID;
  v_plan_price DECIMAL(10,2);
  v_billing_cycle VARCHAR(20);
  v_end_date DATE;
BEGIN
  SELECT id, price, billing_cycle
  INTO v_plan_id, v_plan_price, v_billing_cycle
  FROM subscription_plans
  WHERE slug = NEW.plan::TEXT AND is_active = true;

  IF v_plan_id IS NULL THEN
    RAISE WARNING '⚠️ Plan "%" non trouvé', NEW.plan;
    RETURN NEW;
  END IF;

  IF v_billing_cycle = 'monthly' THEN
    v_end_date := CURRENT_DATE + INTERVAL '1 month';
  ELSE
    v_end_date := CURRENT_DATE + INTERVAL '1 year';
  END IF;

  INSERT INTO subscriptions (
    school_group_id, plan_id, status, start_date, end_date,
    amount, currency, billing_period, payment_status, payment_method, auto_renew
  ) VALUES (
    NEW.id, v_plan_id, 'active', CURRENT_DATE, v_end_date,
    v_plan_price, 'FCFA', v_billing_cycle, 'pending', 'bank_transfer', true
  );

  RAISE NOTICE '✅ Abonnement créé pour groupe "%"', NEW.name;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '❌ Erreur: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_subscription_on_group ON school_groups;

CREATE TRIGGER trigger_create_subscription_on_group
  AFTER INSERT ON school_groups
  FOR EACH ROW
  EXECUTE FUNCTION create_subscription_on_group_creation();

-- =====================================================
-- PARTIE 4 : Créer abonnements pour groupes existants
-- =====================================================

INSERT INTO subscriptions (
  school_group_id, plan_id, status, start_date, end_date,
  amount, currency, billing_period, payment_status, payment_method, auto_renew
)
SELECT 
  sg.id, sp.id, 'active', CURRENT_DATE,
  CASE WHEN sp.billing_cycle = 'monthly' THEN CURRENT_DATE + INTERVAL '1 month' ELSE CURRENT_DATE + INTERVAL '1 year' END,
  sp.price, 'FCFA', sp.billing_cycle, 'pending', 'bank_transfer', true
FROM school_groups sg
JOIN subscription_plans sp ON sp.slug = sg.plan::TEXT
WHERE sg.id NOT IN (SELECT school_group_id FROM subscriptions WHERE school_group_id IS NOT NULL)
  AND sg.status::TEXT = 'active'
  AND sp.is_active = true
ON CONFLICT DO NOTHING;

COMMIT;

-- =====================================================
-- VÉRIFICATION FINALE
-- =====================================================
SELECT '✅ PLANS' AS type, COUNT(*) AS nombre FROM subscription_plans WHERE is_active = true
UNION ALL
SELECT '✅ ABONNEMENTS' AS type, COUNT(*) AS nombre FROM subscriptions
UNION ALL
SELECT '✅ GROUPES AVEC ABONNEMENT' AS type, COUNT(DISTINCT school_group_id) AS nombre FROM subscriptions;

-- Afficher les abonnements
SELECT 
  sg.name AS groupe,
  sg.code,
  sp.name AS plan,
  s.amount,
  s.billing_period,
  s.status,
  TO_CHAR(s.start_date, 'DD/MM/YYYY') AS debut,
  TO_CHAR(s.end_date, 'DD/MM/YYYY') AS fin
FROM subscriptions s
JOIN school_groups sg ON sg.id = s.school_group_id
JOIN subscription_plans sp ON sp.id = s.plan_id
ORDER BY s.created_at DESC
LIMIT 10;

-- =====================================================
-- ✅ INSTALLATION TERMINÉE
-- =====================================================

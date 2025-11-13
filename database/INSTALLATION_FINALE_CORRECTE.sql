-- =====================================================
-- INSTALLATION FINALE CORRECTE : Système Abonnements
-- =====================================================
-- Date: 10 Novembre 2025, 01:35
-- Utilise la table 'plans' (pas 'subscription_plans')
-- =====================================================

BEGIN;

-- =====================================================
-- PARTIE 1 : Vérifier/Améliorer la table plans
-- =====================================================

-- La table plans existe déjà, on vérifie juste qu'elle a les bonnes données
-- Mettre à jour les plans si nécessaire
INSERT INTO plans (name, slug, price, currency, billing_period, max_schools, max_students, max_staff, features, modules, status)
VALUES 
  ('Gratuit', 'gratuit'::subscription_plan, 0, 'FCFA', 'yearly', 3, 1000, 50, 
   '["Gestion de base", "Support communautaire"]'::jsonb, '[]'::jsonb, 'active'::status),
  ('Premium', 'premium'::subscription_plan, 25000, 'FCFA', 'monthly', 10, 5000, 500,
   '["Gestion multi-écoles", "Tableau de bord avancé", "Support prioritaire"]'::jsonb, '[]'::jsonb, 'active'::status),
  ('Pro', 'pro'::subscription_plan, 50000, 'FCFA', 'monthly', 50, 20000, 2000,
   '["Toutes fonctionnalités Premium", "API Access", "Support 24/7"]'::jsonb, '[]'::jsonb, 'active'::status),
  ('Institutionnel', 'institutionnel'::subscription_plan, 100000, 'FCFA', 'yearly', 999999, 999999, 999999,
   '["Tout inclus", "Infrastructure dédiée", "SLA garanti"]'::jsonb, '[]'::jsonb, 'active'::status)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  billing_period = EXCLUDED.billing_period,
  max_schools = EXCLUDED.max_schools,
  max_students = EXCLUDED.max_students,
  max_staff = EXCLUDED.max_staff,
  features = EXCLUDED.features,
  status = EXCLUDED.status;

-- =====================================================
-- PARTIE 2 : Créer/Améliorer table subscriptions
-- =====================================================

-- Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_group_id UUID NOT NULL REFERENCES school_groups(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,  -- ← Référence 'plans' !
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

-- =====================================================
-- PARTIE 3 : Trigger auto-création abonnement
-- =====================================================

CREATE OR REPLACE FUNCTION create_subscription_on_group_creation()
RETURNS TRIGGER AS $$
DECLARE
  v_plan_id UUID;
  v_plan_price DECIMAL(10,2);
  v_billing_period TEXT;
  v_end_date DATE;
BEGIN
  -- Récupérer les infos du plan depuis la table 'plans'
  SELECT id, price, billing_period
  INTO v_plan_id, v_plan_price, v_billing_period
  FROM plans
  WHERE slug = NEW.plan AND status = 'active'::status;

  IF v_plan_id IS NULL THEN
    RAISE WARNING '⚠️ Plan "%" non trouvé dans table plans', NEW.plan;
    RETURN NEW;
  END IF;

  -- Calculer la date de fin
  IF v_billing_period = 'monthly' THEN
    v_end_date := CURRENT_DATE + INTERVAL '1 month';
  ELSE
    v_end_date := CURRENT_DATE + INTERVAL '1 year';
  END IF;

  -- Créer l'abonnement
  INSERT INTO subscriptions (
    school_group_id, plan_id, status, start_date, end_date,
    amount, currency, billing_period, payment_status, payment_method, auto_renew
  ) VALUES (
    NEW.id, v_plan_id, 'active', CURRENT_DATE, v_end_date,
    v_plan_price, 'FCFA', v_billing_period, 'pending', 'bank_transfer', true
  );

  RAISE NOTICE '✅ Abonnement créé pour groupe "%" avec plan "%"', NEW.name, NEW.plan;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '❌ Erreur création abonnement: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trigger_create_subscription_on_group ON school_groups;

-- Créer le nouveau trigger
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
  sg.id, p.id, 'active', CURRENT_DATE,
  CASE WHEN p.billing_period = 'monthly' THEN CURRENT_DATE + INTERVAL '1 month' ELSE CURRENT_DATE + INTERVAL '1 year' END,
  p.price, 'FCFA', p.billing_period, 'pending', 'bank_transfer', true
FROM school_groups sg
JOIN plans p ON p.slug = sg.plan  -- ← Jointure avec 'plans' !
WHERE sg.id NOT IN (SELECT school_group_id FROM subscriptions WHERE school_group_id IS NOT NULL)
  AND sg.status::TEXT = 'active'
  AND p.status = 'active'::status
ON CONFLICT DO NOTHING;

COMMIT;

-- =====================================================
-- VÉRIFICATION FINALE
-- =====================================================

-- Compter
SELECT '✅ PLANS' AS type, COUNT(*) AS nombre FROM plans WHERE status = 'active'::status
UNION ALL
SELECT '✅ ABONNEMENTS' AS type, COUNT(*) AS nombre FROM subscriptions
UNION ALL
SELECT '✅ GROUPES AVEC ABONNEMENT' AS type, COUNT(DISTINCT school_group_id) AS nombre FROM subscriptions;

-- Afficher les abonnements
SELECT 
  sg.name AS groupe,
  sg.code,
  p.name AS plan,
  s.amount,
  s.billing_period,
  s.status,
  TO_CHAR(s.start_date, 'DD/MM/YYYY') AS debut,
  TO_CHAR(s.end_date, 'DD/MM/YYYY') AS fin,
  s.payment_status
FROM subscriptions s
JOIN school_groups sg ON sg.id = s.school_group_id
JOIN plans p ON p.id = s.plan_id
ORDER BY s.created_at DESC
LIMIT 10;

-- Vérifier les groupes sans abonnement
SELECT 
  sg.id,
  sg.name,
  sg.code,
  sg.plan::TEXT AS plan,
  'Pas d''abonnement' AS probleme
FROM school_groups sg
WHERE sg.id NOT IN (SELECT school_group_id FROM subscriptions WHERE school_group_id IS NOT NULL)
  AND sg.status::TEXT = 'active';

-- =====================================================
-- ✅ INSTALLATION TERMINÉE
-- =====================================================
-- Résultat attendu:
-- ✅ 4 plans dans 'plans'
-- ✅ X abonnements créés
-- ✅ Trigger installé
-- ✅ Tableau React fonctionnel
-- =====================================================

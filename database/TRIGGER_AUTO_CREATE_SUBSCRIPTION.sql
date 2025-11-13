-- =====================================================
-- TRIGGER : Auto-Création Abonnement à la Création du Groupe
-- =====================================================
-- Date: 10 Novembre 2025, 00:30
-- Objectif: Créer automatiquement un abonnement quand un groupe est créé
-- Cohérence: Utilise le plan du groupe (school_groups.plan)
-- =====================================================

BEGIN;

-- =====================================================
-- FONCTION : Créer abonnement automatiquement
-- =====================================================
CREATE OR REPLACE FUNCTION create_subscription_on_group_creation()
RETURNS TRIGGER AS $$
DECLARE
  v_plan_id UUID;
  v_plan_price DECIMAL(10,2);
  v_billing_period VARCHAR(20);
  v_end_date TIMESTAMPTZ;
BEGIN
  -- Récupérer les informations du plan depuis subscription_plans
  SELECT id, price, billing_period
  INTO v_plan_id, v_plan_price, v_billing_period
  FROM subscription_plans
  WHERE slug = NEW.plan;

  -- Vérifier que le plan existe
  IF v_plan_id IS NULL THEN
    RAISE WARNING '⚠️ Plan "%" non trouvé dans subscription_plans', NEW.plan;
    RETURN NEW;
  END IF;

  -- Calculer la date de fin selon la période
  IF v_billing_period = 'monthly' THEN
    v_end_date := NOW() + INTERVAL '1 month';
  ELSE
    v_end_date := NOW() + INTERVAL '1 year';
  END IF;

  -- Créer l'abonnement automatiquement
  INSERT INTO subscriptions (
    school_group_id,
    plan_id,
    status,
    start_date,
    end_date,
    amount,
    currency,
    billing_period,
    payment_status,
    payment_method,
    auto_renew,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,                    -- UUID du groupe créé
    v_plan_id,                 -- UUID du plan
    'active',                  -- Statut actif par défaut
    NOW(),                     -- Date de début = maintenant
    v_end_date,                -- Date de fin calculée
    v_plan_price,              -- Montant du plan
    'FCFA',                    -- Devise
    v_billing_period,          -- Période de facturation
    'pending',                 -- Paiement en attente
    'bank_transfer',           -- Méthode par défaut
    true,                      -- Renouvellement automatique
    NOW(),
    NOW()
  );

  RAISE NOTICE '✅ Abonnement créé automatiquement pour groupe "%" (plan: %, montant: % FCFA)', 
    NEW.name, NEW.plan, v_plan_price;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER : Sur INSERT dans school_groups
-- =====================================================
DROP TRIGGER IF EXISTS trigger_create_subscription_on_group ON school_groups;

CREATE TRIGGER trigger_create_subscription_on_group
  AFTER INSERT ON school_groups
  FOR EACH ROW
  EXECUTE FUNCTION create_subscription_on_group_creation();

COMMIT;

-- =====================================================
-- ✅ COMMENTAIRES
-- =====================================================
COMMENT ON FUNCTION create_subscription_on_group_creation() IS 
  'Crée automatiquement un abonnement quand un groupe scolaire est créé. Utilise le plan du groupe pour récupérer le montant et la période.';

COMMENT ON TRIGGER trigger_create_subscription_on_group ON school_groups IS 
  'Déclenche la création automatique d''un abonnement après l''insertion d''un groupe scolaire';

-- =====================================================
-- 🧪 TEST
-- =====================================================
-- Test 1: Créer un groupe avec plan Premium
-- INSERT INTO school_groups (name, code, plan, region, city, status)
-- VALUES ('Groupe Test', 'TEST-001', 'premium', 'Kinshasa', 'Kinshasa', 'active');
-- 
-- Vérifier l'abonnement créé:
-- SELECT 
--   s.*,
--   sg.name AS groupe_name,
--   sp.name AS plan_name
-- FROM subscriptions s
-- JOIN school_groups sg ON sg.id = s.school_group_id
-- JOIN subscription_plans sp ON sp.id = s.plan_id
-- WHERE sg.code = 'TEST-001';
-- 
-- Résultat attendu:
-- ✅ 1 abonnement créé
-- ✅ plan_id correspond au plan Premium
-- ✅ amount = 25,000 FCFA
-- ✅ billing_period = 'monthly'
-- ✅ end_date = start_date + 1 mois
-- =====================================================

-- =====================================================
-- 🔄 WORKFLOW COMPLET
-- =====================================================
-- 1. Super Admin crée groupe avec plan='premium'
--    ↓
-- 2. INSERT dans school_groups
--    ↓
-- 3. 🔥 TRIGGER create_subscription_on_group_creation
--    ↓
-- 4. SELECT plan depuis subscription_plans WHERE slug='premium'
--    ↓
-- 5. INSERT dans subscriptions avec:
--    - plan_id, amount, billing_period du plan
--    - start_date = NOW()
--    - end_date = NOW() + période
--    ↓
-- 6. 🔥 TRIGGER auto_assign_plan_to_group (existant)
--    ↓
-- 7. ✅ Modules + Catégories assignés
--    ↓
-- 8. ✅ Groupe prêt à l'emploi
-- =====================================================

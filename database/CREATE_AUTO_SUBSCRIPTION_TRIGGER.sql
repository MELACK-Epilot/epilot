/**
 * Trigger automatique de création d'abonnement
 * Crée un abonnement automatiquement lors de la création d'un groupe scolaire
 * @module CREATE_AUTO_SUBSCRIPTION_TRIGGER
 */

-- =====================================================
-- ÉTAPE 1 : FONCTION DE CRÉATION AUTOMATIQUE
-- =====================================================

CREATE OR REPLACE FUNCTION auto_create_subscription_for_group()
RETURNS TRIGGER AS $$
DECLARE
  plan_record RECORD;
BEGIN
  -- Récupérer les informations du plan
  SELECT id, price, billing_period
  INTO plan_record
  FROM subscription_plans
  WHERE slug = NEW.plan::TEXT
    AND status = 'active'
  LIMIT 1;
  
  -- Si le plan existe, créer l'abonnement
  IF plan_record.id IS NOT NULL THEN
    INSERT INTO subscriptions (
      school_group_id,
      plan_id,
      status,
      start_date,
      end_date,
      amount,
      currency,
      billing_period,
      payment_method,
      payment_status,
      auto_renew
    )
    VALUES (
      NEW.id,
      plan_record.id,
      'active',  -- Actif par défaut
      CURRENT_DATE,
      CASE 
        WHEN plan_record.billing_period = 'monthly' THEN CURRENT_DATE + INTERVAL '1 month'
        WHEN plan_record.billing_period = 'yearly' THEN CURRENT_DATE + INTERVAL '1 year'
        ELSE CURRENT_DATE + INTERVAL '1 year'
      END,
      plan_record.price,
      'FCFA',
      plan_record.billing_period,
      'bank_transfer',  -- Méthode par défaut
      CASE 
        WHEN plan_record.price = 0 THEN 'paid'  -- Gratuit = payé automatiquement
        ELSE 'pending'  -- Autres plans = en attente
      END,
      true  -- Renouvellement automatique activé
    );
    
    RAISE NOTICE '✅ Abonnement créé automatiquement pour le groupe % (plan: %)', NEW.name, NEW.plan;
  ELSE
    RAISE WARNING '⚠️ Plan "%" non trouvé pour le groupe %', NEW.plan, NEW.name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ÉTAPE 2 : CRÉER LE TRIGGER
-- =====================================================

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS trigger_auto_create_subscription ON school_groups;

-- Créer le trigger
CREATE TRIGGER trigger_auto_create_subscription
  AFTER INSERT ON school_groups
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_subscription_for_group();

-- =====================================================
-- ÉTAPE 3 : CRÉER LES ABONNEMENTS MANQUANTS
-- =====================================================

-- Pour les groupes existants sans abonnement
DO $$
DECLARE
  group_record RECORD;
  plan_record RECORD;
  created_count INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Création des abonnements manquants pour les groupes existants...';
  
  FOR group_record IN 
    SELECT sg.id, sg.name, sg.plan
    FROM school_groups sg
    LEFT JOIN subscriptions s ON s.school_group_id = sg.id
    WHERE s.id IS NULL
      AND sg.status = 'active'
  LOOP
    -- Récupérer le plan
    SELECT id, price, billing_period
    INTO plan_record
    FROM subscription_plans
    WHERE slug = group_record.plan::TEXT
      AND status = 'active'
    LIMIT 1;
    
    IF plan_record.id IS NOT NULL THEN
      INSERT INTO subscriptions (
        school_group_id,
        plan_id,
        status,
        start_date,
        end_date,
        amount,
        currency,
        billing_period,
        payment_method,
        payment_status,
        auto_renew
      )
      VALUES (
        group_record.id,
        plan_record.id,
        'active',
        CURRENT_DATE,
        CASE 
          WHEN plan_record.billing_period = 'monthly' THEN CURRENT_DATE + INTERVAL '1 month'
          WHEN plan_record.billing_period = 'yearly' THEN CURRENT_DATE + INTERVAL '1 year'
          ELSE CURRENT_DATE + INTERVAL '1 year'
        END,
        plan_record.price,
        'FCFA',
        plan_record.billing_period,
        'bank_transfer',
        CASE 
          WHEN plan_record.price = 0 THEN 'paid'
          ELSE 'pending'
        END,
        true
      );
      
      created_count := created_count + 1;
      RAISE NOTICE '   ✅ Abonnement créé pour: %', group_record.name;
    ELSE
      RAISE NOTICE '   ⚠️ Plan non trouvé pour: % (plan: %)', group_record.name, group_record.plan;
    END IF;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ % abonnement(s) créé(s)', created_count;
END $$;

-- =====================================================
-- ÉTAPE 4 : VÉRIFIER LE RÉSULTAT
-- =====================================================

-- Compter les groupes et abonnements
SELECT 
  (SELECT COUNT(*) FROM school_groups WHERE status = 'active') as groupes_actifs,
  (SELECT COUNT(*) FROM subscriptions) as total_abonnements,
  (SELECT COUNT(*) 
   FROM school_groups sg 
   LEFT JOIN subscriptions s ON s.school_group_id = sg.id 
   WHERE sg.status = 'active' AND s.id IS NULL) as groupes_sans_abonnement;

-- Lister tous les abonnements
SELECT 
  sg.name as groupe,
  sg.plan as plan_groupe,
  sp.name as plan_abonnement,
  s.status as statut,
  s.payment_status as paiement,
  s.start_date as debut,
  s.end_date as fin
FROM school_groups sg
LEFT JOIN subscriptions s ON s.school_group_id = sg.id
LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
WHERE sg.status = 'active'
ORDER BY sg.name;

-- =====================================================
-- MESSAGES DE CONFIRMATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 TRIGGER AUTOMATIQUE CRÉÉ !';
  RAISE NOTICE '';
  RAISE NOTICE '✅ FONCTIONNEMENT :';
  RAISE NOTICE '   1. Création groupe scolaire → Abonnement créé automatiquement';
  RAISE NOTICE '   2. Plan gratuit → payment_status = "paid"';
  RAISE NOTICE '   3. Plan payant → payment_status = "pending"';
  RAISE NOTICE '   4. Durée : 1 mois (monthly) ou 1 an (yearly)';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 RÉSULTAT :';
  RAISE NOTICE '   - Plus besoin de créer manuellement dans Hub Abonnements';
  RAISE NOTICE '   - Abonnements existants créés pour les groupes sans abonnement';
  RAISE NOTICE '   - Tous les futurs groupes auront un abonnement automatique';
END $$;

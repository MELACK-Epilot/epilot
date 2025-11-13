/**
 * Correction complète des relations subscriptions - VERSION 2
 * Gère les données corrompues existantes
 * @module FIX_SUBSCRIPTIONS_FINAL_V2
 */

-- =====================================================
-- ÉTAPE 1 : DIAGNOSTIC INITIAL
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '🔍 DIAGNOSTIC RELATIONS SUBSCRIPTIONS V2';
  RAISE NOTICE '=========================================';
END $$;

-- Compter les abonnements et identifier les orphelins
SELECT 
  COUNT(*) as total_subscriptions,
  COUNT(CASE WHEN sg.id IS NULL THEN 1 END) as orphan_groups,
  COUNT(CASE WHEN sp.id IS NULL THEN 1 END) as orphan_plans
FROM subscriptions s
LEFT JOIN school_groups sg ON sg.id = s.school_group_id
LEFT JOIN subscription_plans sp ON sp.id = s.plan_id;

-- =====================================================
-- ÉTAPE 2 : SUPPRIMER L'ANCIENNE CONTRAINTE FK
-- =====================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'subscriptions_plan_id_fkey'
  ) THEN
    ALTER TABLE subscriptions DROP CONSTRAINT subscriptions_plan_id_fkey;
    RAISE NOTICE '✅ Ancienne contrainte supprimée';
  ELSE
    RAISE NOTICE 'ℹ️  Contrainte n''existe pas';
  END IF;
END $$;

-- =====================================================
-- ÉTAPE 3 : NETTOYER LES ORPHELINS (SANS CONTRAINTE)
-- =====================================================

-- Maintenant on peut supprimer sans problème
DELETE FROM subscriptions
WHERE plan_id NOT IN (SELECT id FROM subscription_plans)
   OR school_group_id NOT IN (SELECT id FROM school_groups);

DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✅ % abonnement(s) orphelin(s) supprimé(s)', deleted_count;
END $$;

-- =====================================================
-- ÉTAPE 4 : AJOUTER LA COLONNE status SI MANQUANTE
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscription_plans' AND column_name = 'status'
  ) THEN
    ALTER TABLE subscription_plans 
    ADD COLUMN status TEXT DEFAULT 'active';
    
    RAISE NOTICE '✅ Colonne status ajoutée à subscription_plans';
  ELSE
    RAISE NOTICE '✅ Colonne status existe déjà';
  END IF;
END $$;

-- Ajouter contrainte sur status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'subscription_plans_status_check'
  ) THEN
    ALTER TABLE subscription_plans 
    ADD CONSTRAINT subscription_plans_status_check 
    CHECK (status IN ('active', 'inactive', 'archived'));
    
    RAISE NOTICE '✅ Contrainte status ajoutée';
  END IF;
END $$;

-- =====================================================
-- ÉTAPE 5 : VÉRIFIER/CRÉER LES PLANS DE BASE
-- =====================================================

DO $$
DECLARE
  plan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO plan_count FROM subscription_plans;
  
  IF plan_count = 0 THEN
    RAISE NOTICE '📦 Création des plans de base...';
    
    INSERT INTO subscription_plans (name, slug, price, billing_period, description, status)
    VALUES 
      ('Gratuit', 'gratuit', 0, 'monthly', 'Plan gratuit avec fonctionnalités de base', 'active'),
      ('Premium', 'premium', 50000, 'monthly', 'Plan premium avec fonctionnalités avancées', 'active'),
      ('Pro', 'pro', 150000, 'monthly', 'Plan professionnel pour grandes institutions', 'active'),
      ('Institutionnel', 'institutionnel', 500000, 'yearly', 'Plan sur mesure pour réseaux d''établissements', 'active')
    ON CONFLICT (slug) DO UPDATE SET
      status = 'active',
      updated_at = NOW();
    
    RAISE NOTICE '✅ Plans de base créés/mis à jour';
  ELSE
    RAISE NOTICE '✅ Plans existants: %', plan_count;
  END IF;
END $$;

-- =====================================================
-- ÉTAPE 6 : RECRÉER LA CONTRAINTE FK (PROPRE)
-- =====================================================

ALTER TABLE subscriptions
ADD CONSTRAINT subscriptions_plan_id_fkey
FOREIGN KEY (plan_id)
REFERENCES subscription_plans(id)
ON DELETE RESTRICT;

DO $$
BEGIN
  RAISE NOTICE '✅ Nouvelle contrainte FK créée (propre)';
END $$;

-- =====================================================
-- ÉTAPE 7 : CRÉER UN ABONNEMENT DE TEST
-- =====================================================

DO $$
DECLARE
  subscription_count INTEGER;
  test_group_id UUID;
  test_plan_id UUID;
  test_plan_price NUMERIC;
  test_plan_period TEXT;
  group_count INTEGER;
  plan_count INTEGER;
BEGIN
  -- Compter les abonnements existants
  SELECT COUNT(*) INTO subscription_count FROM subscriptions;
  
  -- Compter les groupes et plans disponibles
  SELECT COUNT(*) INTO group_count FROM school_groups WHERE status = 'active';
  SELECT COUNT(*) INTO plan_count FROM subscription_plans WHERE status = 'active';
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 État actuel:';
  RAISE NOTICE '   - Abonnements: %', subscription_count;
  RAISE NOTICE '   - Groupes actifs: %', group_count;
  RAISE NOTICE '   - Plans actifs: %', plan_count;
  
  IF subscription_count = 0 AND group_count > 0 AND plan_count > 0 THEN
    RAISE NOTICE '📊 Création d''un abonnement de test...';
    
    -- Récupérer un groupe actif
    SELECT id INTO test_group_id 
    FROM school_groups 
    WHERE status = 'active' 
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Récupérer le premier plan actif
    SELECT id, price, billing_period 
    INTO test_plan_id, test_plan_price, test_plan_period
    FROM subscription_plans 
    WHERE status = 'active'
    ORDER BY price ASC
    LIMIT 1;
    
    IF test_group_id IS NOT NULL AND test_plan_id IS NOT NULL THEN
      RAISE NOTICE '   - Groupe ID: %', test_group_id;
      RAISE NOTICE '   - Plan ID: %', test_plan_id;
      RAISE NOTICE '   - Prix: % FCFA', test_plan_price;
      
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
        test_group_id,
        test_plan_id,
        'active',
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '1 year',
        test_plan_price,
        'FCFA',
        test_plan_period,
        'bank_transfer',
        'paid',
        true
      );
      
      RAISE NOTICE '✅ Abonnement de test créé avec succès';
    ELSE
      RAISE NOTICE '⚠️ Impossible de créer un abonnement de test';
      RAISE NOTICE '   - Groupe trouvé: %', CASE WHEN test_group_id IS NOT NULL THEN 'Oui' ELSE 'Non' END;
      RAISE NOTICE '   - Plan trouvé: %', CASE WHEN test_plan_id IS NOT NULL THEN 'Oui' ELSE 'Non' END;
    END IF;
  ELSIF subscription_count > 0 THEN
    RAISE NOTICE '✅ Abonnements existants: % - Pas de création nécessaire', subscription_count;
  ELSIF group_count = 0 THEN
    RAISE NOTICE '⚠️ Aucun groupe actif - Créez d''abord un groupe scolaire';
  ELSIF plan_count = 0 THEN
    RAISE NOTICE '⚠️ Aucun plan actif - Les plans devraient avoir été créés à l''étape 5';
  END IF;
END $$;

-- =====================================================
-- ÉTAPE 8 : TESTER LA REQUÊTE DU HOOK
-- =====================================================

SELECT 
  s.id,
  s.status as subscription_status,
  sg.name as group_name,
  sp.name as plan_name,
  sp.status as plan_status
FROM subscriptions s
INNER JOIN school_groups sg ON sg.id = s.school_group_id
INNER JOIN subscription_plans sp ON sp.id = s.plan_id
LIMIT 5;

-- =====================================================
-- ÉTAPE 9 : RAFRAÎCHIR LE CACHE SUPABASE
-- =====================================================

NOTIFY pgrst, 'reload schema';

-- =====================================================
-- MESSAGES DE CONFIRMATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 CORRECTION COMPLÈTE TERMINÉE !';
  RAISE NOTICE '';
  RAISE NOTICE '✅ MODIFICATIONS APPLIQUÉES :';
  RAISE NOTICE '   1. Contrainte FK supprimée temporairement';
  RAISE NOTICE '   2. Abonnements orphelins nettoyés';
  RAISE NOTICE '   3. Colonne status ajoutée à subscription_plans';
  RAISE NOTICE '   4. Plans de base créés/mis à jour';
  RAISE NOTICE '   5. Contrainte FK recréée (propre)';
  RAISE NOTICE '   6. Abonnement de test créé (si possible)';
  RAISE NOTICE '   7. Cache Supabase rafraîchi';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 ACTIONS SUIVANTES :';
  RAISE NOTICE '   1. Rafraîchir la page /dashboard/subscriptions';
  RAISE NOTICE '   2. Vérifier que le tableau affiche les données';
  RAISE NOTICE '   3. Tester la création d''un nouvel abonnement';
END $$;

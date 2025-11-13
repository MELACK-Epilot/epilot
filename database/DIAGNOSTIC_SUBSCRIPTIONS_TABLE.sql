/**
 * Diagnostic complet de la table subscriptions
 * Identifie pourquoi le tableau Hub Abonnements est vide
 * @module DIAGNOSTIC_SUBSCRIPTIONS_TABLE
 */

-- =====================================================
-- ÉTAPE 1 : VÉRIFIER L'EXISTENCE DES DONNÉES
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '🔍 DIAGNOSTIC TABLE SUBSCRIPTIONS';
  RAISE NOTICE '=====================================';
END $$;

-- Compter les abonnements
SELECT 
  COUNT(*) as total_subscriptions,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
FROM subscriptions;

-- =====================================================
-- ÉTAPE 2 : VÉRIFIER LES RELATIONS (JOINTURES)
-- =====================================================

-- Vérifier les relations avec school_groups et subscription_plans
SELECT 
  s.id,
  s.school_group_id,
  s.plan_id,
  s.status,
  sg.name as group_name,
  sg.status as group_status,
  sp.name as plan_name,
  sp.status as plan_status,
  CASE 
    WHEN sg.id IS NULL THEN '❌ Groupe manquant'
    WHEN sp.id IS NULL THEN '❌ Plan manquant'
    WHEN sg.status != 'active' THEN '⚠️ Groupe inactif'
    WHEN sp.status != 'active' THEN '⚠️ Plan inactif'
    ELSE '✅ OK'
  END as validation_status
FROM subscriptions s
LEFT JOIN school_groups sg ON sg.id = s.school_group_id
LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
ORDER BY s.created_at DESC
LIMIT 10;

-- =====================================================
-- ÉTAPE 3 : IDENTIFIER LES ORPHELINS
-- =====================================================

-- Abonnements sans groupe ou sans plan
SELECT 
  'Orphelins' as type,
  COUNT(*) as count
FROM subscriptions s
LEFT JOIN school_groups sg ON sg.id = s.school_group_id
LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
WHERE sg.id IS NULL OR sp.id IS NULL;

-- =====================================================
-- ÉTAPE 4 : VÉRIFIER LES RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Statut RLS
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'subscriptions';

-- Policies RLS
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual as condition
FROM pg_policies 
WHERE tablename = 'subscriptions'
ORDER BY policyname;

-- =====================================================
-- ÉTAPE 5 : TESTER LA REQUÊTE DU HOOK
-- =====================================================

-- Simuler la requête exacte du hook useSubscriptions
SELECT 
  s.*,
  sg.id as sg_id,
  sg.name as sg_name,
  sg.code as sg_code,
  sp.id as sp_id,
  sp.name as sp_name,
  sp.slug as sp_slug
FROM subscriptions s
INNER JOIN school_groups sg ON sg.id = s.school_group_id
INNER JOIN subscription_plans sp ON sp.id = s.plan_id
ORDER BY s.created_at DESC
LIMIT 5;

-- =====================================================
-- ÉTAPE 6 : CRÉER DES DONNÉES DE TEST SI NÉCESSAIRE
-- =====================================================

DO $$
DECLARE
  subscription_count INTEGER;
  test_group_id UUID;
  test_plan_id UUID;
BEGIN
  SELECT COUNT(*) INTO subscription_count FROM subscriptions;
  
  IF subscription_count = 0 THEN
    RAISE NOTICE '📊 Table vide - Création de données de test...';
    
    -- Récupérer un groupe actif
    SELECT id INTO test_group_id 
    FROM school_groups 
    WHERE status = 'active' 
    LIMIT 1;
    
    -- Récupérer un plan actif
    SELECT id INTO test_plan_id 
    FROM subscription_plans 
    WHERE status = 'active' 
    LIMIT 1;
    
    IF test_group_id IS NOT NULL AND test_plan_id IS NOT NULL THEN
      -- Insérer un abonnement de test
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
      SELECT 
        test_group_id,
        test_plan_id,
        'active',
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '1 year',
        sp.price,
        'FCFA',
        sp.billing_period,
        'bank_transfer',
        'paid',
        true
      FROM subscription_plans sp
      WHERE sp.id = test_plan_id;
      
      RAISE NOTICE '✅ Abonnement de test créé';
    ELSE
      RAISE NOTICE '⚠️ Impossible de créer un abonnement de test';
      RAISE NOTICE '   - Groupe actif trouvé: %', CASE WHEN test_group_id IS NOT NULL THEN 'Oui' ELSE 'Non' END;
      RAISE NOTICE '   - Plan actif trouvé: %', CASE WHEN test_plan_id IS NOT NULL THEN 'Oui' ELSE 'Non' END;
    END IF;
  ELSE
    RAISE NOTICE '✅ Table contient déjà % abonnement(s)', subscription_count;
  END IF;
END $$;

-- =====================================================
-- ÉTAPE 7 : VÉRIFIER LES TABLES LIÉES
-- =====================================================

-- Compter les groupes actifs
SELECT 
  'school_groups' as table_name,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active
FROM school_groups;

-- Compter les plans actifs
SELECT 
  'subscription_plans' as table_name,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active
FROM subscription_plans;

-- =====================================================
-- MESSAGES DE CONFIRMATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 DIAGNOSTIC TERMINÉ !';
  RAISE NOTICE '';
  RAISE NOTICE '📋 ACTIONS RECOMMANDÉES :';
  RAISE NOTICE '1. Vérifier les résultats ci-dessus';
  RAISE NOTICE '2. Si "Orphelins" > 0 → Corriger les relations';
  RAISE NOTICE '3. Si RLS bloque → Vérifier les policies';
  RAISE NOTICE '4. Si table vide → Un abonnement de test a été créé';
  RAISE NOTICE '5. Rafraîchir la page /dashboard/subscriptions';
END $$;

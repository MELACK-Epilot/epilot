/**
 * Diagnostic des groupes scolaires sans abonnement
 * Identifie pourquoi certains groupes n'apparaissent pas dans le Hub Abonnements
 * @module DIAGNOSTIC_GROUPES_SANS_ABONNEMENT
 */

-- =====================================================
-- ÉTAPE 1 : LISTER TOUS LES GROUPES SCOLAIRES
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '🔍 DIAGNOSTIC GROUPES SCOLAIRES';
  RAISE NOTICE '================================';
END $$;

-- Tous les groupes avec leur statut
SELECT 
  id,
  name,
  code,
  status,
  plan,
  created_at
FROM school_groups
ORDER BY created_at DESC;

-- =====================================================
-- ÉTAPE 2 : VÉRIFIER LES ABONNEMENTS EXISTANTS
-- =====================================================

-- Groupes AVEC abonnement
SELECT 
  sg.id as group_id,
  sg.name as group_name,
  sg.code as group_code,
  sg.status as group_status,
  s.id as subscription_id,
  s.status as subscription_status,
  sp.name as plan_name
FROM school_groups sg
INNER JOIN subscriptions s ON s.school_group_id = sg.id
INNER JOIN subscription_plans sp ON sp.id = s.plan_id
ORDER BY sg.name;

-- =====================================================
-- ÉTAPE 3 : IDENTIFIER LES GROUPES SANS ABONNEMENT
-- =====================================================

-- Groupes SANS abonnement
SELECT 
  sg.id as group_id,
  sg.name as group_name,
  sg.code as group_code,
  sg.status as group_status,
  sg.plan as group_plan,
  'Pas d''abonnement' as raison
FROM school_groups sg
LEFT JOIN subscriptions s ON s.school_group_id = sg.id
WHERE s.id IS NULL
ORDER BY sg.name;

-- =====================================================
-- ÉTAPE 4 : CRÉER DES ABONNEMENTS POUR LES GROUPES MANQUANTS
-- =====================================================

DO $$
DECLARE
  group_record RECORD;
  plan_id_to_use UUID;
  plan_price NUMERIC;
  plan_period TEXT;
  created_count INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📊 Création d''abonnements pour les groupes sans abonnement...';
  
  -- Parcourir tous les groupes sans abonnement
  FOR group_record IN 
    SELECT 
      sg.id,
      sg.name,
      sg.code,
      sg.plan
    FROM school_groups sg
    LEFT JOIN subscriptions s ON s.school_group_id = sg.id
    WHERE s.id IS NULL
      AND sg.status = 'active'
  LOOP
    RAISE NOTICE '   - Groupe: % (plan: %)', group_record.name, group_record.plan;
    
    -- Récupérer le plan correspondant au groupe (conversion enum → text)
    SELECT id, price, billing_period 
    INTO plan_id_to_use, plan_price, plan_period
    FROM subscription_plans 
    WHERE slug = group_record.plan::TEXT 
      AND status = 'active'
    LIMIT 1;
    
    -- Si le plan n'existe pas, utiliser le plan gratuit par défaut
    IF plan_id_to_use IS NULL THEN
      RAISE NOTICE '     ⚠️ Plan "%" non trouvé, utilisation du plan Gratuit', group_record.plan::TEXT;
      
      SELECT id, price, billing_period 
      INTO plan_id_to_use, plan_price, plan_period
      FROM subscription_plans 
      WHERE slug = 'gratuit' 
        AND status = 'active'
      LIMIT 1;
    END IF;
    
    -- Créer l'abonnement
    IF plan_id_to_use IS NOT NULL THEN
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
        plan_id_to_use,
        'active',
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '1 year',
        plan_price,
        'FCFA',
        plan_period,
        'bank_transfer',
        'paid',
        true
      );
      
      created_count := created_count + 1;
      RAISE NOTICE '     ✅ Abonnement créé (% FCFA)', plan_price;
    ELSE
      RAISE NOTICE '     ❌ Impossible de créer l''abonnement (aucun plan disponible)';
    END IF;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ % abonnement(s) créé(s)', created_count;
END $$;

-- =====================================================
-- ÉTAPE 5 : VÉRIFIER LE RÉSULTAT FINAL
-- =====================================================

-- Compter les groupes et abonnements
SELECT 
  (SELECT COUNT(*) FROM school_groups WHERE status = 'active') as total_groupes_actifs,
  (SELECT COUNT(*) FROM subscriptions) as total_abonnements,
  (SELECT COUNT(*) 
   FROM school_groups sg 
   LEFT JOIN subscriptions s ON s.school_group_id = sg.id 
   WHERE sg.status = 'active' AND s.id IS NULL) as groupes_sans_abonnement;

-- Lister tous les abonnements
SELECT 
  sg.name as groupe,
  sg.code,
  sp.name as plan,
  s.status as statut_abonnement,
  s.amount as montant,
  s.start_date as debut,
  s.end_date as fin
FROM subscriptions s
INNER JOIN school_groups sg ON sg.id = s.school_group_id
INNER JOIN subscription_plans sp ON sp.id = s.plan_id
ORDER BY sg.name;

-- =====================================================
-- MESSAGES DE CONFIRMATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 DIAGNOSTIC ET CORRECTION TERMINÉS !';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 ACTIONS SUIVANTES :';
  RAISE NOTICE '   1. Rafraîchir la page /dashboard/subscriptions';
  RAISE NOTICE '   2. Vérifier que TOUS les groupes apparaissent';
  RAISE NOTICE '   3. Vérifier les détails de chaque abonnement';
END $$;

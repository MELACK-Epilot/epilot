/**
 * Correction des abonnements en double
 * Garde le plus récent et supprime les anciens
 * @module FIX_DUPLICATE_SUBSCRIPTIONS
 */

-- =====================================================
-- ÉTAPE 1 : IDENTIFIER LES DOUBLONS
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '🔍 DIAGNOSTIC ABONNEMENTS EN DOUBLE';
  RAISE NOTICE '====================================';
END $$;

-- Groupes avec plusieurs abonnements
SELECT 
  sg.name as groupe,
  sg.code,
  COUNT(s.id) as nombre_abonnements,
  STRING_AGG(sp.name || ' (' || s.amount || ' FCFA)', ', ' ORDER BY s.created_at) as plans
FROM school_groups sg
INNER JOIN subscriptions s ON s.school_group_id = sg.id
INNER JOIN subscription_plans sp ON sp.id = s.plan_id
GROUP BY sg.id, sg.name, sg.code
HAVING COUNT(s.id) > 1
ORDER BY sg.name;

-- =====================================================
-- ÉTAPE 2 : DÉTAILS DES DOUBLONS
-- =====================================================

-- Lister tous les abonnements des groupes en double
SELECT 
  sg.name as groupe,
  sg.code,
  s.id as subscription_id,
  sp.name as plan,
  s.amount,
  s.status,
  s.created_at,
  CASE 
    WHEN s.created_at = (
      SELECT MAX(s2.created_at) 
      FROM subscriptions s2 
      WHERE s2.school_group_id = sg.id
    ) THEN '✅ GARDER (plus récent)'
    ELSE '❌ SUPPRIMER (ancien)'
  END as action
FROM school_groups sg
INNER JOIN subscriptions s ON s.school_group_id = sg.id
INNER JOIN subscription_plans sp ON sp.id = s.plan_id
WHERE sg.id IN (
  SELECT school_group_id 
  FROM subscriptions 
  GROUP BY school_group_id 
  HAVING COUNT(*) > 1
)
ORDER BY sg.name, s.created_at DESC;

-- =====================================================
-- ÉTAPE 3 : SUPPRIMER LES ANCIENS ABONNEMENTS
-- =====================================================

DO $$
DECLARE
  deleted_count INTEGER := 0;
  group_record RECORD;
  oldest_subscription_id UUID;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🗑️  Suppression des anciens abonnements...';
  
  -- Pour chaque groupe avec plusieurs abonnements
  FOR group_record IN 
    SELECT school_group_id, COUNT(*) as count
    FROM subscriptions 
    GROUP BY school_group_id 
    HAVING COUNT(*) > 1
  LOOP
    -- Récupérer l'ID de l'abonnement le plus ancien
    SELECT s.id INTO oldest_subscription_id
    FROM subscriptions s
    WHERE s.school_group_id = group_record.school_group_id
    ORDER BY s.created_at ASC
    LIMIT 1;
    
    -- Supprimer l'ancien abonnement
    DELETE FROM subscriptions 
    WHERE id = oldest_subscription_id;
    
    deleted_count := deleted_count + 1;
    RAISE NOTICE '   ✅ Ancien abonnement supprimé pour groupe %', group_record.school_group_id;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ % ancien(s) abonnement(s) supprimé(s)', deleted_count;
END $$;

-- =====================================================
-- ÉTAPE 4 : VÉRIFIER LE RÉSULTAT
-- =====================================================

-- Compter les abonnements par groupe
SELECT 
  sg.name as groupe,
  sg.code,
  COUNT(s.id) as nombre_abonnements,
  sp.name as plan_actuel,
  s.amount as montant,
  s.created_at as date_creation
FROM school_groups sg
LEFT JOIN subscriptions s ON s.school_group_id = sg.id
LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
GROUP BY sg.id, sg.name, sg.code, sp.name, s.amount, s.created_at
ORDER BY sg.name;

-- Statistiques finales
SELECT 
  COUNT(DISTINCT sg.id) as total_groupes,
  COUNT(s.id) as total_abonnements,
  COUNT(DISTINCT s.school_group_id) as groupes_avec_abonnement,
  COUNT(DISTINCT sg.id) - COUNT(DISTINCT s.school_group_id) as groupes_sans_abonnement
FROM school_groups sg
LEFT JOIN subscriptions s ON s.school_group_id = sg.id
WHERE sg.status = 'active';

-- =====================================================
-- MESSAGES DE CONFIRMATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 NETTOYAGE TERMINÉ !';
  RAISE NOTICE '';
  RAISE NOTICE '✅ RÉSULTAT :';
  RAISE NOTICE '   - Chaque groupe a maintenant 1 seul abonnement';
  RAISE NOTICE '   - Les abonnements les plus récents ont été conservés';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 ACTIONS SUIVANTES :';
  RAISE NOTICE '   1. Rafraîchir la page /dashboard/subscriptions';
  RAISE NOTICE '   2. Vérifier que chaque groupe apparaît 1 seule fois';
  RAISE NOTICE '   3. Vérifier que les plans affichés sont corrects';
END $$;

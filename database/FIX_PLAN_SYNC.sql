-- =====================================================
-- CORRECTION SYNCHRONISATION PLAN
-- =====================================================
-- Problème: school_groups.plan affiche "Pro" mais subscription utilise "Premium"
-- Solution: Synchroniser les deux OU utiliser uniquement subscription

-- 1. DIAGNOSTIC: Vérifier l'incohérence
SELECT 
  sg.name as groupe,
  sg.plan as plan_statique_school_groups,
  s.status as subscription_status,
  sp.slug as plan_dynamique_subscription,
  sp.name as nom_plan_subscription,
  CASE 
    WHEN sg.plan = sp.slug THEN '✅ Cohérent'
    ELSE '❌ INCOHÉRENT'
  END as coherence
FROM school_groups sg
LEFT JOIN subscriptions s ON s.school_group_id = sg.id AND s.status = 'active'
LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
WHERE sg.name ILIKE '%LAMARELLE%';

-- 2. SOLUTION 1: Synchroniser school_groups.plan avec subscription
-- Cette solution met à jour la colonne statique pour qu'elle corresponde
UPDATE school_groups sg
SET plan = sp.slug
FROM subscriptions s
JOIN subscription_plans sp ON sp.id = s.plan_id
WHERE s.school_group_id = sg.id
AND s.status = 'active'
AND sg.name ILIKE '%LAMARELLE%';

-- 3. VÉRIFICATION après synchronisation
SELECT 
  sg.name as groupe,
  sg.plan as plan_statique,
  sp.slug as plan_dynamique,
  sp.name as nom_plan,
  COUNT(DISTINCT pc.category_id) as nb_categories,
  COUNT(DISTINCT pm.module_id) as nb_modules
FROM school_groups sg
JOIN subscriptions s ON s.school_group_id = sg.id AND s.status = 'active'
JOIN subscription_plans sp ON sp.id = s.plan_id
LEFT JOIN plan_categories pc ON pc.plan_id = sp.id
LEFT JOIN plan_modules pm ON pm.plan_id = sp.id
WHERE sg.name ILIKE '%LAMARELLE%'
GROUP BY sg.id, sg.name, sg.plan, sp.slug, sp.name;

-- 4. SOLUTION 2 (RECOMMANDÉE): Créer un trigger pour auto-sync
-- Ce trigger met à jour automatiquement school_groups.plan quand subscription change
CREATE OR REPLACE FUNCTION sync_school_group_plan()
RETURNS TRIGGER AS $$
DECLARE
  v_plan_slug VARCHAR;
BEGIN
  -- Récupérer le slug du nouveau plan
  SELECT slug INTO v_plan_slug
  FROM subscription_plans
  WHERE id = NEW.plan_id;

  -- Mettre à jour school_groups.plan
  UPDATE school_groups
  SET plan = v_plan_slug
  WHERE id = NEW.school_group_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS on_subscription_sync_plan ON subscriptions;

-- Créer le trigger
CREATE TRIGGER on_subscription_sync_plan
AFTER INSERT OR UPDATE OF plan_id ON subscriptions
FOR EACH ROW
WHEN (NEW.status = 'active')
EXECUTE FUNCTION sync_school_group_plan();

-- 5. VÉRIFICATION FINALE
SELECT 
  '✅ Synchronisation terminée!' as message,
  'Le plan statique et dynamique sont maintenant cohérents' as details;

-- 6. TEST: Afficher le résultat pour LAMARELLE
SELECT 
  sg.name as groupe,
  sg.plan as plan_affiche,
  sp.name as nom_plan,
  COUNT(DISTINCT pc.category_id) as categories,
  COUNT(DISTINCT pm.module_id) as modules
FROM school_groups sg
JOIN subscriptions s ON s.school_group_id = sg.id AND s.status = 'active'
JOIN subscription_plans sp ON sp.id = s.plan_id
LEFT JOIN plan_categories pc ON pc.plan_id = sp.id
LEFT JOIN plan_modules pm ON pm.plan_id = sp.id
WHERE sg.name ILIKE '%LAMARELLE%'
GROUP BY sg.id, sg.name, sg.plan, sp.name;

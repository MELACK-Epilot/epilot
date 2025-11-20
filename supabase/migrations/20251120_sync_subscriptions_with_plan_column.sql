-- Migration: Synchroniser les subscriptions avec la colonne plan
-- Date: 2025-11-20
-- Description: Mettre à jour les subscriptions pour correspondre à school_groups.plan

-- IMPORTANT: Cette migration corrige l'incohérence entre:
-- - school_groups.plan (modifié via l'interface)
-- - subscriptions.plan_id (source de vérité)

-- 1. Mettre à jour les subscriptions existantes selon school_groups.plan
UPDATE subscriptions s
SET plan_id = (
  SELECT sp.id 
  FROM subscription_plans sp
  JOIN school_groups sg ON sg.id = s.school_group_id
  WHERE sp.slug = sg.plan
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 
  FROM school_groups sg
  WHERE sg.id = s.school_group_id
  AND sg.plan IS NOT NULL
);

-- 2. Créer des subscriptions pour les groupes qui n'en ont pas
INSERT INTO subscriptions (
  school_group_id,
  plan_id,
  status,
  start_date,
  end_date,
  auto_renew,
  created_at,
  updated_at
)
SELECT 
  sg.id as school_group_id,
  sp.id as plan_id,
  'active' as status,
  NOW() as start_date,
  NOW() + INTERVAL '1 year' as end_date,
  true as auto_renew,
  NOW() as created_at,
  NOW() as updated_at
FROM school_groups sg
JOIN subscription_plans sp ON sp.slug = sg.plan
WHERE NOT EXISTS (
  SELECT 1 
  FROM subscriptions s 
  WHERE s.school_group_id = sg.id
)
AND sg.plan IS NOT NULL;

-- 3. Vérifier le résultat
-- Cette requête affiche les groupes avec leurs plans (avant/après)
SELECT 
  sg.name as "Groupe",
  sg.plan as "Plan Colonne",
  sp.slug as "Plan Subscription",
  s.status as "Statut"
FROM school_groups sg
LEFT JOIN subscriptions s ON s.school_group_id = sg.id AND s.status = 'active'
LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
ORDER BY sg.name;

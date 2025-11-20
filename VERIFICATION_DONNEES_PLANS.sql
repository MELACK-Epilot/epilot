-- Script de vérification des incohérences Plans & Abonnements
-- Date: 2025-11-20

-- 1. Vérifier les groupes scolaires avec leurs plans
SELECT 
  sg.name as "Groupe Scolaire",
  sg.code as "Code",
  sg.plan as "Plan (colonne statique)",
  sp.name as "Plan (via subscription)",
  sp.slug as "Plan Slug",
  s.status as "Statut Abonnement",
  s.created_at as "Date Création Abonnement"
FROM school_groups sg
LEFT JOIN subscriptions s ON s.school_group_id = sg.id AND s.status = 'active'
LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
ORDER BY sg.name;

-- 2. Vérifier tous les abonnements (actifs et inactifs)
SELECT 
  sg.name as "Groupe Scolaire",
  sp.name as "Plan",
  s.status as "Statut",
  s.start_date as "Date Début",
  s.end_date as "Date Fin",
  s.created_at as "Créé le"
FROM subscriptions s
JOIN school_groups sg ON sg.id = s.school_group_id
JOIN subscription_plans sp ON sp.id = s.plan_id
ORDER BY sg.name, s.created_at DESC;

-- 3. Compter les abonnements par statut
SELECT 
  status as "Statut",
  COUNT(*) as "Nombre"
FROM subscriptions
GROUP BY status;

-- 4. Vérifier les groupes SANS abonnement
SELECT 
  sg.name as "Groupe Scolaire",
  sg.code as "Code",
  sg.plan as "Plan (colonne)",
  sg.created_at as "Créé le"
FROM school_groups sg
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions s 
  WHERE s.school_group_id = sg.id
)
ORDER BY sg.name;

-- 5. Vérifier les statistiques globales
SELECT * FROM plan_global_stats;

-- 6. Vérifier les statistiques par plan
SELECT 
  name as "Plan",
  active_subscription_count as "Abonnements Actifs",
  total_subscription_count as "Total Abonnements",
  monthly_revenue as "MRR",
  active_groups_count as "Groupes Actifs"
FROM plan_stats
ORDER BY price;

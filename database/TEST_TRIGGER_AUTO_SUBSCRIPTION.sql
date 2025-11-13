-- =====================================================
-- TEST : Trigger Auto-Création Abonnement
-- =====================================================
-- Date: 10 Novembre 2025, 00:40
-- Objectif: Vérifier que l'abonnement est créé automatiquement
-- =====================================================

-- =====================================================
-- ÉTAPE 1 : Créer un groupe de test
-- =====================================================
INSERT INTO school_groups (
  name,
  code,
  plan,
  region,
  city,
  address,
  status
)
VALUES (
  'Groupe Test Trigger',
  'TEST-TRIGGER-001',
  'premium',  -- ← Plan Premium
  'Kinshasa',
  'Kinshasa',
  'Avenue Test 123',
  'active'
)
RETURNING id, name, code, plan;

-- =====================================================
-- ÉTAPE 2 : Vérifier l'abonnement créé automatiquement
-- =====================================================
-- Attendre 1 seconde pour que le trigger se termine
SELECT pg_sleep(1);

-- Vérifier l'abonnement
SELECT 
  s.id AS subscription_id,
  s.school_group_id,
  sg.name AS groupe_name,
  sg.code AS groupe_code,
  sg.plan AS groupe_plan,
  sp.name AS plan_name,
  sp.slug AS plan_slug,
  s.amount,
  s.currency,
  s.billing_period,
  s.start_date,
  s.end_date,
  s.status,
  s.payment_status,
  s.payment_method,
  s.auto_renew,
  CASE 
    WHEN sg.plan = sp.slug THEN '✅ Cohérent'
    ELSE '❌ Incohérent'
  END AS coherence_plan
FROM subscriptions s
JOIN school_groups sg ON sg.id = s.school_group_id
JOIN subscription_plans sp ON sp.id = s.plan_id
WHERE sg.code = 'TEST-TRIGGER-001';

-- =====================================================
-- RÉSULTAT ATTENDU :
-- =====================================================
-- ✅ 1 ligne retournée
-- ✅ groupe_plan = 'premium'
-- ✅ plan_slug = 'premium'
-- ✅ amount = 25000 (prix du plan Premium)
-- ✅ billing_period = 'monthly'
-- ✅ end_date = start_date + 1 mois
-- ✅ status = 'active'
-- ✅ coherence_plan = '✅ Cohérent'
-- =====================================================

-- =====================================================
-- ÉTAPE 3 : Vérifier les modules assignés
-- =====================================================
SELECT 
  gmc.school_group_id,
  sg.name AS groupe_name,
  m.name AS module_name,
  gmc.is_enabled
FROM group_module_configs gmc
JOIN school_groups sg ON sg.id = gmc.school_group_id
JOIN modules m ON m.id = gmc.module_id
WHERE sg.code = 'TEST-TRIGGER-001'
ORDER BY m.name;

-- =====================================================
-- RÉSULTAT ATTENDU :
-- =====================================================
-- ✅ Plusieurs lignes (modules du plan Premium)
-- ✅ is_enabled = true
-- =====================================================

-- =====================================================
-- ÉTAPE 4 : Vérifier les catégories assignées
-- =====================================================
SELECT 
  gbc.school_group_id,
  sg.name AS groupe_name,
  bc.name AS category_name,
  gbc.is_enabled
FROM group_business_categories gbc
JOIN school_groups sg ON sg.id = gbc.school_group_id
JOIN business_categories bc ON bc.id = gbc.category_id
WHERE sg.code = 'TEST-TRIGGER-001'
ORDER BY bc.name;

-- =====================================================
-- RÉSULTAT ATTENDU :
-- =====================================================
-- ✅ Plusieurs lignes (catégories du plan Premium)
-- ✅ is_enabled = true
-- =====================================================

-- =====================================================
-- NETTOYAGE (Optionnel)
-- =====================================================
-- Décommenter pour supprimer le groupe de test
-- DELETE FROM school_groups WHERE code = 'TEST-TRIGGER-001';
-- Note: Les abonnements, modules et catégories seront supprimés en cascade
-- =====================================================

-- =====================================================
-- AMÉLIORATION : Table subscription_plans
-- =====================================================
-- Date: 10 Novembre 2025, 01:15
-- Objectif: Adapter la table aux besoins de la plateforme
-- =====================================================

BEGIN;

-- =====================================================
-- ÉTAPE 1 : Ajouter colonnes manquantes
-- =====================================================

-- Ajouter 'status' pour compatibilité avec le code React
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) 
GENERATED ALWAYS AS (
  CASE 
    WHEN is_active = true THEN 'active'
    ELSE 'inactive'
  END
) STORED;

-- Créer un index sur status
CREATE INDEX IF NOT EXISTS idx_subscription_plans_status 
ON subscription_plans(status);

-- =====================================================
-- ÉTAPE 2 : Nettoyer et standardiser les données
-- =====================================================

-- Mettre à jour les slugs pour correspondre aux plans
UPDATE subscription_plans 
SET slug = LOWER(TRIM(slug))
WHERE slug IS NOT NULL;

-- S'assurer que billing_period existe (alias de billing_cycle)
-- Note: On garde billing_cycle mais on s'assure de la cohérence
UPDATE subscription_plans
SET billing_period = billing_cycle
WHERE billing_period IS NULL OR billing_period != billing_cycle;

-- =====================================================
-- ÉTAPE 3 : Insérer/Mettre à jour les plans standards
-- =====================================================

-- Supprimer les anciens plans pour repartir à zéro (optionnel)
-- DELETE FROM subscription_plans;

-- Insérer les 4 plans standards
INSERT INTO subscription_plans (
  name,
  slug,
  description,
  price,
  currency,
  billing_cycle,
  billing_period,
  duration,
  max_schools,
  max_students,
  max_personnel,
  max_staff,
  storage_limit,
  max_storage,
  features,
  support_level,
  custom_branding,
  api_access,
  is_active,
  is_popular,
  plan_type
) VALUES 
  -- Plan Gratuit
  (
    'Gratuit',
    'gratuit',
    'Plan gratuit pour découvrir E-PILOT. Idéal pour tester la plateforme avec une école.',
    0,
    'FCFA',
    'yearly',
    'yearly',
    12,
    3,
    1000,
    50,
    50,
    '5GB',
    5,
    '[
      "Gestion de base",
      "1 école gratuite",
      "Tableau de bord simple",
      "Support communautaire",
      "Stockage 5GB"
    ]'::jsonb,
    'email',
    false,
    false,
    true,
    false,
    'gratuit'
  ),
  
  -- Plan Premium
  (
    'Premium',
    'premium',
    'Plan premium avec fonctionnalités avancées. Parfait pour les groupes scolaires en croissance.',
    25000,
    'FCFA',
    'monthly',
    'monthly',
    1,
    10,
    5000,
    500,
    500,
    '50GB',
    50,
    '[
      "Gestion multi-écoles (jusqu''à 10)",
      "Tableau de bord avancé",
      "Rapports financiers détaillés",
      "Gestion des inscriptions",
      "Suivi des paiements",
      "Support prioritaire",
      "Modules premium",
      "Stockage 50GB",
      "Notifications SMS/Email"
    ]'::jsonb,
    'priority',
    false,
    false,
    true,
    true,
    'premium'
  ),
  
  -- Plan Pro
  (
    'Pro',
    'pro',
    'Plan professionnel pour grandes institutions. Fonctionnalités complètes et support dédié.',
    50000,
    'FCFA',
    'monthly',
    'monthly',
    1,
    50,
    20000,
    2000,
    2000,
    '200GB',
    200,
    '[
      "Toutes fonctionnalités Premium",
      "Gestion multi-écoles (jusqu''à 50)",
      "API Access complet",
      "Intégrations avancées",
      "Rapports personnalisés",
      "Branding personnalisé",
      "Support dédié 24/7",
      "Formation personnalisée",
      "Stockage 200GB",
      "Backup automatique quotidien"
    ]'::jsonb,
    '24/7',
    true,
    true,
    true,
    false,
    'pro'
  ),
  
  -- Plan Institutionnel
  (
    'Institutionnel',
    'institutionnel',
    'Plan sur mesure pour institutions gouvernementales et grandes organisations. Tout inclus.',
    100000,
    'FCFA',
    'yearly',
    'yearly',
    12,
    999999,  -- Illimité (valeur très élevée)
    999999,  -- Illimité (valeur très élevée)
    999999,  -- Illimité (valeur très élevée)
    999999,  -- Illimité (valeur très élevée)
    'Illimité',
    999999,  -- Illimité (valeur très élevée)
    '[
      "Tout inclus",
      "Écoles illimitées",
      "Élèves illimités",
      "Personnel illimité",
      "Personnalisation complète",
      "Infrastructure dédiée",
      "SLA garanti 99.9%",
      "Conformité gouvernementale",
      "Support dédié 24/7/365",
      "Formation sur site",
      "Stockage illimité",
      "Backup en temps réel",
      "Serveur dédié (optionnel)"
    ]'::jsonb,
    '24/7',
    true,
    true,
    true,
    false,
    'institutionnel'
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  billing_cycle = EXCLUDED.billing_cycle,
  billing_period = EXCLUDED.billing_period,
  duration = EXCLUDED.duration,
  max_schools = EXCLUDED.max_schools,
  max_students = EXCLUDED.max_students,
  max_personnel = EXCLUDED.max_personnel,
  max_staff = EXCLUDED.max_staff,
  storage_limit = EXCLUDED.storage_limit,
  max_storage = EXCLUDED.max_storage,
  features = EXCLUDED.features,
  support_level = EXCLUDED.support_level,
  custom_branding = EXCLUDED.custom_branding,
  api_access = EXCLUDED.api_access,
  is_active = EXCLUDED.is_active,
  is_popular = EXCLUDED.is_popular,
  plan_type = EXCLUDED.plan_type,
  updated_at = NOW();

-- =====================================================
-- ÉTAPE 4 : Créer/Mettre à jour le trigger
-- =====================================================

-- Fonction pour créer abonnement automatiquement
CREATE OR REPLACE FUNCTION create_subscription_on_group_creation()
RETURNS TRIGGER AS $$
DECLARE
  v_plan_id UUID;
  v_plan_price DECIMAL(10,2);
  v_billing_cycle VARCHAR(20);
  v_end_date DATE;
BEGIN
  -- Récupérer les infos du plan
  SELECT id, price, billing_cycle
  INTO v_plan_id, v_plan_price, v_billing_cycle
  FROM subscription_plans
  WHERE slug = NEW.plan AND is_active = true;

  IF v_plan_id IS NULL THEN
    RAISE WARNING '⚠️ Plan "%" non trouvé ou inactif', NEW.plan;
    RETURN NEW;
  END IF;

  -- Calculer la date de fin
  IF v_billing_cycle = 'monthly' THEN
    v_end_date := CURRENT_DATE + INTERVAL '1 month';
  ELSE
    v_end_date := CURRENT_DATE + INTERVAL '1 year';
  END IF;

  -- Créer l'abonnement
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
  ) VALUES (
    NEW.id,
    v_plan_id,
    'active',
    CURRENT_DATE,
    v_end_date,
    v_plan_price,
    'FCFA',
    v_billing_cycle,
    'pending',
    'bank_transfer',
    true,
    NOW(),
    NOW()
  );

  RAISE NOTICE '✅ Abonnement créé automatiquement pour groupe "%" avec plan "%"', NEW.name, NEW.plan;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '❌ Erreur création abonnement: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trigger_create_subscription_on_group ON school_groups;

-- Créer le nouveau trigger
CREATE TRIGGER trigger_create_subscription_on_group
  AFTER INSERT ON school_groups
  FOR EACH ROW
  EXECUTE FUNCTION create_subscription_on_group_creation();

-- =====================================================
-- ÉTAPE 5 : Créer abonnements pour groupes existants
-- =====================================================

-- Créer abonnements pour tous les groupes qui n'en ont pas
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
SELECT 
  sg.id AS school_group_id,
  sp.id AS plan_id,
  'active' AS status,
  CURRENT_DATE AS start_date,
  CASE 
    WHEN sp.billing_cycle = 'monthly' THEN CURRENT_DATE + INTERVAL '1 month'
    ELSE CURRENT_DATE + INTERVAL '1 year'
  END AS end_date,
  sp.price AS amount,
  'FCFA' AS currency,
  sp.billing_cycle AS billing_period,
  'pending' AS payment_status,
  'bank_transfer' AS payment_method,
  true AS auto_renew,
  NOW() AS created_at,
  NOW() AS updated_at
FROM school_groups sg
JOIN subscription_plans sp ON sp.slug = sg.plan
WHERE sg.id NOT IN (
  SELECT school_group_id 
  FROM subscriptions 
  WHERE school_group_id IS NOT NULL
)
AND sg.status = 'active'
AND sp.is_active = true;

COMMIT;

-- =====================================================
-- ÉTAPE 6 : Vérification finale
-- =====================================================

-- Compter les plans
SELECT 
  COUNT(*) AS total_plans,
  COUNT(*) FILTER (WHERE is_active = true) AS plans_actifs,
  COUNT(*) FILTER (WHERE is_popular = true) AS plans_populaires
FROM subscription_plans;

-- Afficher les plans
SELECT 
  id,
  name,
  slug,
  price,
  billing_cycle,
  max_schools,
  max_students,
  max_personnel,
  is_active,
  is_popular,
  plan_type
FROM subscription_plans
ORDER BY price;

-- Compter les abonnements
SELECT 
  COUNT(*) AS total_abonnements,
  COUNT(*) FILTER (WHERE status = 'active') AS abonnements_actifs
FROM subscriptions;

-- Afficher les abonnements avec détails
SELECT 
  sg.name AS groupe,
  sg.code,
  sp.name AS plan,
  s.amount,
  s.billing_period,
  s.status,
  s.start_date,
  s.end_date,
  s.payment_status
FROM subscriptions s
JOIN school_groups sg ON sg.id = s.school_group_id
JOIN subscription_plans sp ON sp.id = s.plan_id
ORDER BY s.created_at DESC
LIMIT 20;

-- Vérifier les groupes sans abonnement
SELECT 
  sg.id,
  sg.name,
  sg.code,
  sg.plan,
  'Pas d''abonnement' AS probleme
FROM school_groups sg
WHERE sg.id NOT IN (
  SELECT school_group_id 
  FROM subscriptions 
  WHERE school_group_id IS NOT NULL
)
AND sg.status = 'active';

-- =====================================================
-- ✅ RÉSULTAT ATTENDU
-- =====================================================
-- Plans:
-- ✅ 4 plans créés (gratuit, premium, pro, institutionnel)
-- ✅ Colonne 'status' ajoutée
-- ✅ Données cohérentes
--
-- Abonnements:
-- ✅ 1 abonnement par groupe actif
-- ✅ Trigger installé pour nouveaux groupes
--
-- Groupes sans abonnement:
-- ✅ 0 (tous les groupes ont un abonnement)
-- =====================================================

-- =====================================================
-- 📝 NOTES IMPORTANTES
-- =====================================================
-- 1. La colonne 'status' est générée automatiquement depuis 'is_active'
-- 2. billing_period = billing_cycle (alias pour compatibilité)
-- 3. max_staff = max_personnel (alias pour compatibilité)
-- 4. Le trigger crée automatiquement un abonnement pour chaque nouveau groupe
-- 5. Les plans avec NULL dans max_* sont illimités
-- =====================================================

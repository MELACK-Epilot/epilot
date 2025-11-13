-- Script CORRIGÉ avec logique abonnement et contraintes respectées
-- Chaque plan a ses catégories et modules spécifiques

-- 1. Créer un plan Pro avec toutes les colonnes requises
INSERT INTO subscription_plans (id, name, slug, description, price, status)
VALUES (
  gen_random_uuid(),
  'Plan Professionnel',
  'pro',
  'Plan complet avec tous les modules avancés',
  150000,
  'active'
)
ON CONFLICT (slug) DO NOTHING;

-- 2. Créer des catégories avec TOUTES les colonnes requises
INSERT INTO business_categories (id, name, slug, description, icon, color, status)
VALUES 
  (gen_random_uuid(), 'Gestion Scolaire', 'gestion-scolaire', 'Modules de gestion administrative et scolaire', '🏫', '#2A9D8F', 'active'),
  (gen_random_uuid(), 'Pédagogie Avancée', 'pedagogie-avancee', 'Outils pédagogiques et éducatifs avancés', '📚', '#8B5CF6', 'active'),
  (gen_random_uuid(), 'Communication Pro', 'communication-pro', 'Outils de communication professionnelle', '💬', '#F59E0B', 'active'),
  (gen_random_uuid(), 'Finance & Comptabilité', 'finance-comptabilite', 'Gestion financière et comptable complète', '💰', '#10B981', 'active')
ON CONFLICT (slug) DO NOTHING;

-- 3. Créer des modules avec catégories assignées
INSERT INTO modules (id, name, slug, description, category_id, icon, color, version, status, is_core)
SELECT 
  gen_random_uuid(),
  module_data.name,
  module_data.slug,
  module_data.description,
  bc.id,
  module_data.icon,
  module_data.color,
  '1.0.0',
  'active',
  module_data.is_core
FROM (
  VALUES 
    -- Modules Gestion Scolaire
    ('Gestion des Élèves', 'gestion-eleves', 'Module complet de gestion des dossiers élèves', 'gestion-scolaire', '👥', '#2A9D8F', true),
    ('Emploi du Temps', 'emploi-temps', 'Planification et gestion des emplois du temps', 'gestion-scolaire', '📅', '#1D3557', true),
    ('Inscriptions', 'inscriptions', 'Gestion des inscriptions et réinscriptions', 'gestion-scolaire', '📝', '#457B9D', false),
    
    -- Modules Pédagogie
    ('Notes et Évaluations', 'notes-evaluations', 'Saisie et suivi des notes et évaluations', 'pedagogie-avancee', '📊', '#E9C46A', false),
    ('Cahier de Texte', 'cahier-texte', 'Cahier de texte numérique', 'pedagogie-avancee', '📖', '#F4A261', false),
    ('Ressources Pédagogiques', 'ressources-pedagogiques', 'Bibliothèque de ressources', 'pedagogie-avancee', '📚', '#E76F51', false),
    
    -- Modules Communication
    ('Messagerie Interne', 'messagerie-interne', 'Communication entre utilisateurs', 'communication-pro', '✉️', '#F59E0B', false),
    ('Notifications Push', 'notifications-push', 'Système de notifications avancé', 'communication-pro', '🔔', '#F97316', false),
    
    -- Modules Finance
    ('Comptabilité', 'comptabilite', 'Gestion comptable complète', 'finance-comptabilite', '💰', '#10B981', false),
    ('Facturation', 'facturation', 'Système de facturation automatisé', 'finance-comptabilite', '🧾', '#059669', false)
) AS module_data(name, slug, description, category_slug, icon, color, is_core)
JOIN business_categories bc ON bc.slug = module_data.category_slug
WHERE NOT EXISTS (
  SELECT 1 FROM modules m WHERE m.slug = module_data.slug
);

-- 4. Assigner les catégories au plan Pro (LOGIQUE ABONNEMENT)
INSERT INTO plan_categories (plan_id, category_id)
SELECT DISTINCT
  sp.id,
  bc.id
FROM subscription_plans sp
CROSS JOIN business_categories bc
WHERE sp.slug = 'pro'
AND bc.status = 'active'
AND NOT EXISTS (
  SELECT 1 FROM plan_categories pc 
  WHERE pc.plan_id = sp.id AND pc.category_id = bc.id
);

-- 5. Assigner les modules au plan Pro (LOGIQUE ABONNEMENT)
INSERT INTO plan_modules (plan_id, module_id)
SELECT DISTINCT
  sp.id,
  m.id
FROM subscription_plans sp
CROSS JOIN modules m
WHERE sp.slug = 'pro'
AND m.status = 'active'
AND NOT EXISTS (
  SELECT 1 FROM plan_modules pm 
  WHERE pm.plan_id = sp.id AND pm.module_id = m.id
);

-- 6. Créer un plan Gratuit avec modules limités (EXEMPLE LOGIQUE)
INSERT INTO subscription_plans (id, name, slug, description, price, status)
VALUES (
  gen_random_uuid(),
  'Plan Gratuit',
  'gratuit',
  'Plan de base avec modules essentiels',
  0,
  'active'
)
ON CONFLICT (slug) DO NOTHING;

-- 7. Assigner seulement les modules CORE au plan Gratuit
INSERT INTO plan_modules (plan_id, module_id)
SELECT DISTINCT
  sp.id,
  m.id
FROM subscription_plans sp
CROSS JOIN modules m
WHERE sp.slug = 'gratuit'
AND m.status = 'active'
AND m.is_core = true  -- Seulement les modules essentiels
AND NOT EXISTS (
  SELECT 1 FROM plan_modules pm 
  WHERE pm.plan_id = sp.id AND pm.module_id = m.id
);

-- 8. Vérification de la logique abonnement
SELECT 
  'PLAN PRO' as plan_type,
  sp.name as plan_name,
  COUNT(DISTINCT pc.category_id) as categories_assignees,
  COUNT(DISTINCT pm.module_id) as modules_assignes
FROM subscription_plans sp
LEFT JOIN plan_categories pc ON sp.id = pc.plan_id
LEFT JOIN plan_modules pm ON sp.id = pm.plan_id
WHERE sp.slug = 'pro'
GROUP BY sp.id, sp.name

UNION ALL

SELECT 
  'PLAN GRATUIT' as plan_type,
  sp.name as plan_name,
  COUNT(DISTINCT pc.category_id) as categories_assignees,
  COUNT(DISTINCT pm.module_id) as modules_assignes
FROM subscription_plans sp
LEFT JOIN plan_categories pc ON sp.id = pc.plan_id
LEFT JOIN plan_modules pm ON sp.id = pm.plan_id
WHERE sp.slug = 'gratuit'
GROUP BY sp.id, sp.name;

-- 9. Détail des modules par plan
SELECT 
  sp.name as plan,
  bc.name as categorie,
  m.name as module,
  m.is_core as module_essentiel
FROM subscription_plans sp
JOIN plan_modules pm ON sp.id = pm.plan_id
JOIN modules m ON pm.module_id = m.id
LEFT JOIN business_categories bc ON m.category_id = bc.id
ORDER BY sp.name, bc.name, m.name;

-- 10. Message final
SELECT 
  'LOGIQUE ABONNEMENT IMPLÉMENTÉE ✅' as status,
  'Chaque plan a maintenant ses catégories et modules spécifiques' as message;

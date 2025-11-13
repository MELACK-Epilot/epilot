-- FIX URGENT - Avec catégories obligatoires
-- Corrige l'erreur de contrainte NOT NULL sur category_id

-- 1. CRÉER LE GROUPE LAMARELLE S'IL N'EXISTE PAS
INSERT INTO school_groups (
  id,
  name,
  code,
  description,
  status,
  created_at,
  updated_at
)
VALUES (
  '914d2ced-663a-4732-a521-edcc2423a012'::uuid,
  'LAMARELLE',
  'E-PILOT-003',
  'Groupe scolaire LAMARELLE - Brazzaville',
  'active',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. CRÉER UN PLAN PRO S'IL N'EXISTE PAS
INSERT INTO subscription_plans (id, name, slug, description, price, status, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Plan Professionnel',
  'pro',
  'Plan complet avec tous les modules',
  150000,
  'active',
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;

-- 3. CRÉER DES CATÉGORIES OBLIGATOIRES
INSERT INTO business_categories (id, name, slug, description, icon, color, status, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Gestion Scolaire', 'gestion-scolaire', 'Modules de gestion administrative', '🏫', '#2A9D8F', 'active', NOW(), NOW()),
  (gen_random_uuid(), 'Pédagogie', 'pedagogie', 'Outils pédagogiques et éducatifs', '📚', '#8B5CF6', 'active', NOW(), NOW()),
  (gen_random_uuid(), 'Communication', 'communication', 'Outils de communication', '💬', '#F59E0B', 'active', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- 4. CRÉER DES MODULES AVEC CATÉGORIES OBLIGATOIRES
INSERT INTO modules (id, name, slug, description, category_id, icon, color, version, status, is_core, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  module_data.name,
  module_data.slug,
  module_data.description,
  bc.id, -- CATÉGORIE OBLIGATOIRE
  module_data.icon,
  module_data.color,
  '1.0.0',
  'active',
  module_data.is_core,
  NOW(),
  NOW()
FROM (
  VALUES 
    ('Gestion des Élèves', 'gestion-eleves', 'Module de gestion des élèves', '👥', '#2A9D8F', true, 'gestion-scolaire'),
    ('Emploi du Temps', 'emploi-temps', 'Planification des cours', '📅', '#1D3557', true, 'gestion-scolaire'),
    ('Notes et Évaluations', 'notes-evaluations', 'Gestion des notes', '📊', '#E9C46A', false, 'pedagogie'),
    ('Messagerie Interne', 'messagerie', 'Communication interne', '✉️', '#F4A261', false, 'communication'),
    ('Rapports et Statistiques', 'rapports', 'Génération de rapports', '📈', '#E76F51', false, 'gestion-scolaire')
) AS module_data(name, slug, description, icon, color, is_core, category_slug)
JOIN business_categories bc ON bc.slug = module_data.category_slug
WHERE NOT EXISTS (
  SELECT 1 FROM modules m WHERE m.slug = module_data.slug
);

-- 5. ASSIGNER LE PLAN AU GROUPE
UPDATE school_groups 
SET plan_id = (SELECT id FROM subscription_plans WHERE slug = 'pro' LIMIT 1)
WHERE id = '914d2ced-663a-4732-a521-edcc2423a012'
AND plan_id IS NULL;

-- 6. CRÉER UN ABONNEMENT ACTIF
INSERT INTO subscriptions (
  id,
  school_group_id,
  plan_id,
  status,
  start_date,
  end_date,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  '914d2ced-663a-4732-a521-edcc2423a012'::uuid,
  (SELECT id FROM subscription_plans WHERE slug = 'pro' LIMIT 1),
  'active',
  NOW(),
  NOW() + INTERVAL '1 year',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions 
  WHERE school_group_id = '914d2ced-663a-4732-a521-edcc2423a012'
  AND status = 'active'
);

-- 7. ASSIGNER TOUS LES MODULES AU PLAN PRO
INSERT INTO plan_modules (plan_id, module_id, created_at, updated_at)
SELECT 
  (SELECT id FROM subscription_plans WHERE slug = 'pro' LIMIT 1),
  m.id,
  NOW(),
  NOW()
FROM modules m
WHERE m.status = 'active'
AND NOT EXISTS (
  SELECT 1 FROM plan_modules pm 
  WHERE pm.plan_id = (SELECT id FROM subscription_plans WHERE slug = 'pro' LIMIT 1)
  AND pm.module_id = m.id
);

-- 8. ASSIGNER TOUS LES MODULES AU GROUPE LAMARELLE
INSERT INTO group_module_configs (school_group_id, module_id, is_enabled, created_at, updated_at)
SELECT 
  '914d2ced-663a-4732-a521-edcc2423a012'::uuid,
  m.id,
  true,
  NOW(),
  NOW()
FROM modules m
WHERE m.status = 'active'
AND NOT EXISTS (
  SELECT 1 FROM group_module_configs gmc 
  WHERE gmc.school_group_id = '914d2ced-663a-4732-a521-edcc2423a012'
  AND gmc.module_id = m.id
);

-- 9. VÉRIFICATION FINALE COMPLÈTE
SELECT 
  '✅ GROUPE CRÉÉ' as check_type,
  sg.name as groupe,
  sg.id as groupe_id,
  sp.name as plan,
  s.status as subscription_status
FROM school_groups sg
LEFT JOIN subscription_plans sp ON sg.plan_id = sp.id
LEFT JOIN subscriptions s ON sg.id = s.school_group_id AND s.status = 'active'
WHERE sg.id = '914d2ced-663a-4732-a521-edcc2423a012';

-- 10. VÉRIFIER LES MODULES ASSIGNÉS
SELECT 
  '📦 MODULES ASSIGNÉS' as check_type,
  COUNT(*) as total_modules,
  COUNT(CASE WHEN gmc.is_enabled = true THEN 1 END) as modules_actifs,
  COUNT(DISTINCT m.category_id) as categories_distinctes
FROM group_module_configs gmc
JOIN modules m ON gmc.module_id = m.id
WHERE gmc.school_group_id = '914d2ced-663a-4732-a521-edcc2423a012';

-- 11. EXEMPLES DE MODULES
SELECT 
  '📋 EXEMPLES MODULES' as check_type,
  m.name as module_name,
  bc.name as categorie,
  gmc.is_enabled as actif
FROM group_module_configs gmc
JOIN modules m ON gmc.module_id = m.id
JOIN business_categories bc ON m.category_id = bc.id
WHERE gmc.school_group_id = '914d2ced-663a-4732-a521-edcc2423a012'
ORDER BY bc.name, m.name
LIMIT 5;

-- 12. MESSAGE FINAL
SELECT 
  'CORRECTION AVEC CATÉGORIES TERMINÉE ✅' as status,
  'Le groupe LAMARELLE a maintenant des modules avec catégories' as message;

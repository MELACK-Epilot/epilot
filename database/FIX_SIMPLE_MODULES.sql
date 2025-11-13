-- Script ULTRA-SIMPLE pour créer les données de base
-- Évite toutes les erreurs de colonnes et types

-- 1. Créer un plan Pro simple
INSERT INTO subscription_plans (id, name, slug, description, price, status)
VALUES (
  gen_random_uuid(),
  'Plan Pro',
  'pro',
  'Plan professionnel',
  150000,
  'active'
)
ON CONFLICT (slug) DO NOTHING;

-- 2. Créer des catégories simples
INSERT INTO business_categories (id, name, slug, icon, color, status)
VALUES 
  (gen_random_uuid(), 'Gestion', 'gestion', '🏫', '#2A9D8F', 'active'),
  (gen_random_uuid(), 'Pédagogie', 'pedagogie', '📚', '#8B5CF6', 'active')
ON CONFLICT (slug) DO NOTHING;

-- 3. Créer des modules simples
INSERT INTO modules (id, name, slug, description, status, is_core)
VALUES 
  (gen_random_uuid(), 'Gestion Élèves', 'gestion-eleves', 'Gestion des élèves', 'active', true),
  (gen_random_uuid(), 'Emploi du Temps', 'emploi-temps', 'Planning', 'active', true),
  (gen_random_uuid(), 'Notes', 'notes', 'Gestion des notes', 'active', false),
  (gen_random_uuid(), 'Messagerie', 'messagerie', 'Communication', 'active', false)
ON CONFLICT (slug) DO NOTHING;

-- 4. Lier tous les modules au plan Pro
INSERT INTO plan_modules (plan_id, module_id)
SELECT 
  sp.id,
  m.id
FROM subscription_plans sp
CROSS JOIN modules m
WHERE sp.slug = 'pro'
AND NOT EXISTS (
  SELECT 1 FROM plan_modules pm 
  WHERE pm.plan_id = sp.id AND pm.module_id = m.id
);

-- 5. Message de confirmation
SELECT 
  'DONNÉES DE BASE CRÉÉES' as status,
  (SELECT COUNT(*) FROM modules) as modules_count,
  (SELECT COUNT(*) FROM business_categories) as categories_count,
  (SELECT COUNT(*) FROM plan_modules) as plan_modules_count;

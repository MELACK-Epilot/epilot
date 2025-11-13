-- FIX URGENT - Groupe scolaire manquant ou mal configuré
-- Corrige le problème PGRST116

-- 1. VÉRIFIER SI LE GROUPE EXISTE
SELECT 
  '🔍 VÉRIFICATION GROUPE' as check_type,
  COUNT(*) as nb_groupes_total
FROM school_groups;

-- 2. CHERCHER LE GROUPE SPÉCIFIQUE
SELECT 
  '🎯 GROUPE SPÉCIFIQUE' as check_type,
  id,
  name,
  plan_id,
  created_at
FROM school_groups 
WHERE id = '914d2ced-663a-4732-a521-edcc2423a012';

-- 3. VÉRIFIER LES UTILISATEURS ADMIN GROUPE
SELECT 
  '👤 UTILISATEURS ADMIN' as check_type,
  u.id,
  u.email,
  u.school_group_id,
  sg.name as group_name
FROM users u
LEFT JOIN school_groups sg ON u.school_group_id = sg.id
WHERE u.role = 'admin_groupe';

-- 4. CRÉER LE GROUPE S'IL N'EXISTE PAS
INSERT INTO school_groups (
  id,
  name,
  code,
  description,
  plan_id,
  status,
  created_at,
  updated_at
)
SELECT 
  '914d2ced-663a-4732-a521-edcc2423a012'::uuid,
  'LAMARELLE',
  'E-PILOT-003',
  'Groupe scolaire LAMARELLE - Brazzaville',
  (SELECT id FROM subscription_plans WHERE slug = 'pro' LIMIT 1),
  'active',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM school_groups 
  WHERE id = '914d2ced-663a-4732-a521-edcc2423a012'
);

-- 5. CRÉER UN PLAN PRO S'IL N'EXISTE PAS
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

-- 6. ASSIGNER LE PLAN AU GROUPE
UPDATE school_groups 
SET plan_id = (SELECT id FROM subscription_plans WHERE slug = 'pro' LIMIT 1)
WHERE id = '914d2ced-663a-4732-a521-edcc2423a012'
AND plan_id IS NULL;

-- 7. CRÉER UN ABONNEMENT ACTIF
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

-- 8. CRÉER DES MODULES DE BASE
INSERT INTO modules (id, name, slug, description, icon, color, version, status, is_core, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Gestion des Élèves', 'gestion-eleves', 'Module de gestion des élèves', '👥', '#2A9D8F', '1.0.0', 'active', true, NOW(), NOW()),
  (gen_random_uuid(), 'Emploi du Temps', 'emploi-temps', 'Planification des cours', '📅', '#1D3557', '1.0.0', 'active', true, NOW(), NOW()),
  (gen_random_uuid(), 'Notes et Évaluations', 'notes', 'Gestion des notes', '📊', '#E9C46A', '1.0.0', 'active', false, NOW(), NOW()),
  (gen_random_uuid(), 'Messagerie', 'messagerie', 'Communication interne', '✉️', '#F4A261', '1.0.0', 'active', false, NOW(), NOW()),
  (gen_random_uuid(), 'Rapports', 'rapports', 'Génération de rapports', '📈', '#E76F51', '1.0.0', 'active', false, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- 9. ASSIGNER TOUS LES MODULES AU GROUPE
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

-- 10. VÉRIFICATION FINALE
SELECT 
  '✅ VÉRIFICATION FINALE' as status,
  sg.name as groupe,
  sp.name as plan,
  COUNT(gmc.module_id) as modules_assignes,
  s.status as subscription_status
FROM school_groups sg
LEFT JOIN subscription_plans sp ON sg.plan_id = sp.id
LEFT JOIN subscriptions s ON sg.id = s.school_group_id AND s.status = 'active'
LEFT JOIN group_module_configs gmc ON sg.id = gmc.school_group_id
WHERE sg.id = '914d2ced-663a-4732-a521-edcc2423a012'
GROUP BY sg.id, sg.name, sp.name, s.status;

-- 11. MESSAGE FINAL
SELECT 
  'CORRECTION URGENTE TERMINÉE ✅' as status,
  'Le groupe LAMARELLE devrait maintenant fonctionner' as message;

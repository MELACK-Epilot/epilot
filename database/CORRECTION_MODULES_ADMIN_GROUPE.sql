-- CORRECTION COMPLÈTE - Modules visibles pour Admin Groupe
-- Basé sur le diagnostic, corrige tous les problèmes possibles

-- 1. CRÉER/VÉRIFIER LE PLAN PRO
DO $$
DECLARE
  v_plan_id UUID;
BEGIN
  -- Chercher ou créer le plan Pro
  SELECT id INTO v_plan_id FROM subscription_plans WHERE slug = 'pro';
  
  IF v_plan_id IS NULL THEN
    INSERT INTO subscription_plans (id, name, slug, description, price, status)
    VALUES (
      gen_random_uuid(),
      'Plan Professionnel',
      'pro',
      'Plan complet avec tous les modules',
      150000,
      'active'
    )
    RETURNING id INTO v_plan_id;
    RAISE NOTICE 'Plan Pro créé: %', v_plan_id;
  ELSE
    RAISE NOTICE 'Plan Pro existant: %', v_plan_id;
  END IF;
END;
$$;

-- 2. CRÉER DES CATÉGORIES AVEC DESCRIPTION OBLIGATOIRE
INSERT INTO business_categories (id, name, slug, description, icon, color, status)
VALUES 
  (gen_random_uuid(), 'Gestion Scolaire', 'gestion-scolaire', 'Modules de gestion administrative et des élèves', '🏫', '#2A9D8F', 'active'),
  (gen_random_uuid(), 'Pédagogie', 'pedagogie', 'Outils pédagogiques et éducatifs', '📚', '#8B5CF6', 'active'),
  (gen_random_uuid(), 'Communication', 'communication', 'Outils de communication et collaboration', '💬', '#F59E0B', 'active'),
  (gen_random_uuid(), 'Finance', 'finance', 'Gestion financière et comptabilité', '💰', '#10B981', 'active')
ON CONFLICT (slug) DO NOTHING;

-- 3. CRÉER DES MODULES AVEC CATÉGORIES
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
    ('Gestion des Élèves', 'gestion-eleves', 'Module de gestion complète des élèves', 'gestion-scolaire', '👥', '#2A9D8F', true),
    ('Emploi du Temps', 'emploi-temps', 'Planification des emplois du temps', 'gestion-scolaire', '📅', '#1D3557', true),
    ('Inscriptions', 'inscriptions', 'Gestion des inscriptions', 'gestion-scolaire', '📝', '#457B9D', false),
    ('Notes et Évaluations', 'notes-evaluations', 'Saisie et suivi des notes', 'pedagogie', '📊', '#E9C46A', false),
    ('Cahier de Texte', 'cahier-texte', 'Cahier de texte numérique', 'pedagogie', '📖', '#F4A261', false),
    ('Messagerie', 'messagerie', 'Communication interne', 'communication', '✉️', '#F59E0B', false),
    ('Notifications', 'notifications', 'Système de notifications', 'communication', '🔔', '#F97316', false),
    ('Comptabilité', 'comptabilite', 'Gestion comptable', 'finance', '💰', '#10B981', false)
) AS module_data(name, slug, description, category_slug, icon, color, is_core)
JOIN business_categories bc ON bc.slug = module_data.category_slug
WHERE NOT EXISTS (SELECT 1 FROM modules m WHERE m.slug = module_data.slug);

-- 4. ASSIGNER TOUTES LES CATÉGORIES AU PLAN PRO
INSERT INTO plan_categories (plan_id, category_id)
SELECT 
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

-- 5. ASSIGNER TOUS LES MODULES AU PLAN PRO
INSERT INTO plan_modules (plan_id, module_id)
SELECT 
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

-- 6. ASSIGNER LE PLAN PRO AUX GROUPES ADMIN GROUPE
UPDATE school_groups 
SET plan_id = (SELECT id FROM subscription_plans WHERE slug = 'pro')
WHERE plan_id IS NULL
AND id IN (
  SELECT DISTINCT school_group_id 
  FROM users 
  WHERE role = 'admin_groupe'
);

-- 7. ASSIGNER LES MODULES DU PLAN AUX GROUPES (ÉTAPE CRITIQUE)
INSERT INTO group_module_configs (school_group_id, module_id, is_enabled)
SELECT DISTINCT
  sg.id,
  pm.module_id,
  true
FROM school_groups sg
JOIN subscription_plans sp ON sg.plan_id = sp.id
JOIN plan_modules pm ON sp.id = pm.plan_id
JOIN modules m ON pm.module_id = m.id
WHERE sg.id IN (
  SELECT DISTINCT school_group_id 
  FROM users 
  WHERE role = 'admin_groupe'
)
AND m.status = 'active'
AND NOT EXISTS (
  SELECT 1 FROM group_module_configs gmc 
  WHERE gmc.school_group_id = sg.id AND gmc.module_id = pm.module_id
);

-- 8. VÉRIFICATION FINALE - CE QUE VOIT L'ADMIN GROUPE
SELECT 
  '🎯 RÉSULTAT FINAL ADMIN GROUPE' as section,
  sg.name as groupe_scolaire,
  sp.name as plan_abonnement,
  COUNT(gmc.module_id) as modules_disponibles,
  COUNT(CASE WHEN gmc.is_enabled = true THEN 1 END) as modules_actifs,
  COUNT(DISTINCT bc.id) as categories_disponibles
FROM school_groups sg
JOIN users u ON sg.id = u.school_group_id
LEFT JOIN subscription_plans sp ON sg.plan_id = sp.id
LEFT JOIN group_module_configs gmc ON sg.id = gmc.school_group_id
LEFT JOIN modules m ON gmc.module_id = m.id
LEFT JOIN business_categories bc ON m.category_id = bc.id
WHERE u.role = 'admin_groupe'
GROUP BY sg.id, sg.name, sp.name
ORDER BY sg.name;

-- 9. DÉTAIL DES MODULES PAR CATÉGORIE POUR ADMIN GROUPE
SELECT 
  '📋 MODULES PAR CATÉGORIE' as section,
  bc.name as categorie,
  bc.icon,
  bc.color,
  COUNT(gmc.module_id) as total_modules,
  COUNT(CASE WHEN gmc.is_enabled = true THEN 1 END) as modules_actifs,
  string_agg(m.name, ', ' ORDER BY m.name) as liste_modules
FROM school_groups sg
JOIN users u ON sg.id = u.school_group_id
JOIN group_module_configs gmc ON sg.id = gmc.school_group_id
JOIN modules m ON gmc.module_id = m.id
LEFT JOIN business_categories bc ON m.category_id = bc.id
WHERE u.role = 'admin_groupe'
AND m.status = 'active'
GROUP BY bc.id, bc.name, bc.icon, bc.color
ORDER BY bc.name;

-- 10. MESSAGE DE SUCCÈS
SELECT 
  '✅ CORRECTION TERMINÉE' as status,
  'Les modules devraient maintenant être visibles dans l''interface Admin Groupe' as message,
  CONCAT(
    'Groupes configurés: ', 
    (SELECT COUNT(DISTINCT gmc.school_group_id) 
     FROM group_module_configs gmc 
     JOIN users u ON gmc.school_group_id = u.school_group_id 
     WHERE u.role = 'admin_groupe'),
    ' | Modules assignés: ',
    (SELECT COUNT(*) 
     FROM group_module_configs gmc 
     JOIN users u ON gmc.school_group_id = u.school_group_id 
     WHERE u.role = 'admin_groupe')
  ) as statistiques;

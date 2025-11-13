-- Script de correction pour "Mes Modules" Admin Groupe - VERSION DÉFINITIVE
-- Utilise UNIQUEMENT subscription_plans selon les foreign keys

-- 1. Créer un plan Pro dans subscription_plans si il n'existe pas
DO $$
DECLARE
  v_plan_id UUID;
BEGIN
  -- Chercher un plan Pro existant
  SELECT id INTO v_plan_id
  FROM subscription_plans 
  WHERE slug = 'pro' OR name ILIKE '%pro%'
  LIMIT 1;
  
  -- Si aucun plan Pro, en créer un
  IF v_plan_id IS NULL THEN
    INSERT INTO subscription_plans (id, name, slug, description, price, status, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      'Plan Professionnel',
      'pro',
      'Plan complet avec tous les modules pédagogiques',
      150000,
      'active',
      NOW(),
      NOW()
    )
    RETURNING id INTO v_plan_id;
    
    RAISE NOTICE 'Plan Pro créé avec ID: %', v_plan_id;
  ELSE
    RAISE NOTICE 'Plan Pro existant trouvé avec ID: %', v_plan_id;
  END IF;

  -- Assigner ce plan aux groupes Admin Groupe sans plan
  UPDATE school_groups 
  SET plan_id = v_plan_id,
      updated_at = NOW()
  WHERE plan_id IS NULL
  AND id IN (
    SELECT DISTINCT school_group_id 
    FROM users 
    WHERE role = 'admin_groupe'
  );
  
  GET DIAGNOSTICS v_plan_id = ROW_COUNT;
  RAISE NOTICE 'Groupes mis à jour avec le plan Pro: %', v_plan_id;
END;
$$;

-- 2. Créer des modules de base si aucun n'existe
INSERT INTO modules (id, name, slug, description, category_id, icon, color, version, status, is_core, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  module_data.name,
  module_data.slug,
  module_data.description,
  bc.id, -- Utiliser une catégorie existante ou NULL
  module_data.icon,
  module_data.color,
  '1.0.0',
  'active',
  module_data.is_core,
  NOW(),
  NOW()
FROM (
  VALUES 
    ('Gestion des Élèves', 'gestion-eleves', 'Module de gestion des dossiers élèves', '👥', '#2A9D8F', true),
    ('Emploi du Temps', 'emploi-temps', 'Planification et gestion des emplois du temps', '📅', '#1D3557', true),
    ('Notes et Évaluations', 'notes-evaluations', 'Saisie et suivi des notes', '📊', '#E9C46A', false),
    ('Messagerie Interne', 'messagerie', 'Communication entre utilisateurs', '✉️', '#F4A261', false),
    ('Rapports et Statistiques', 'rapports', 'Génération de rapports détaillés', '📈', '#E76F51', false),
    ('Comptabilité', 'comptabilite', 'Gestion financière et comptable', '💰', '#10B981', false),
    ('Ressources Humaines', 'rh', 'Gestion du personnel', '👨‍💼', '#8B5CF6', false),
    ('Bibliothèque', 'bibliotheque', 'Gestion des ressources documentaires', '📚', '#F59E0B', false)
) AS module_data(name, slug, description, icon, color, is_core)
LEFT JOIN business_categories bc ON bc.slug = 'gestion-scolaire' -- Essayer de lier à une catégorie
WHERE NOT EXISTS (
  SELECT 1 FROM modules m WHERE m.slug = module_data.slug
);

-- 3. Créer des catégories de base si aucune n'existe
INSERT INTO business_categories (id, name, slug, description, icon, color, status, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Gestion Scolaire', 'gestion-scolaire', 'Modules de gestion administrative', '🏫', '#2A9D8F', 'active', NOW(), NOW()),
  (gen_random_uuid(), 'Pédagogie', 'pedagogie', 'Outils pédagogiques et éducatifs', '📚', '#8B5CF6', 'active', NOW(), NOW()),
  (gen_random_uuid(), 'Communication', 'communication', 'Outils de communication et collaboration', '💬', '#F59E0B', 'active', NOW(), NOW()),
  (gen_random_uuid(), 'Finance', 'finance', 'Gestion financière et comptable', '💰', '#10B981', 'active', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- 4. Assigner TOUS les modules au plan Pro
INSERT INTO plan_modules (plan_id, module_id, created_at, updated_at)
SELECT DISTINCT
  sp.id as plan_id,
  m.id as module_id,
  NOW(),
  NOW()
FROM subscription_plans sp
CROSS JOIN modules m
WHERE (sp.slug = 'pro' OR sp.name ILIKE '%pro%')
AND COALESCE(m.status, 'active') = 'active'
AND NOT EXISTS (
  SELECT 1 FROM plan_modules pm
  WHERE pm.plan_id = sp.id 
  AND pm.module_id = m.id
);

-- 5. Fonction pour assigner automatiquement les modules d'un plan à un groupe
CREATE OR REPLACE FUNCTION assign_plan_modules_to_group_definitif(
  p_school_group_id UUID,
  p_plan_id UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_plan_id UUID;
  v_modules_assigned INTEGER := 0;
BEGIN
  -- Récupérer le plan du groupe si pas fourni
  IF p_plan_id IS NULL THEN
    SELECT plan_id INTO v_plan_id
    FROM school_groups 
    WHERE id = p_school_group_id;
  ELSE
    v_plan_id := p_plan_id;
  END IF;

  -- Vérifier que le plan existe
  IF v_plan_id IS NULL THEN
    RAISE EXCEPTION 'Aucun plan trouvé pour le groupe %', p_school_group_id;
  END IF;

  -- Assigner tous les modules du plan au groupe
  INSERT INTO group_module_configs (
    school_group_id,
    module_id,
    is_enabled,
    created_at,
    updated_at
  )
  SELECT 
    p_school_group_id,
    pm.module_id,
    true, -- Activer par défaut
    NOW(),
    NOW()
  FROM plan_modules pm
  JOIN modules m ON pm.module_id = m.id
  WHERE pm.plan_id = v_plan_id
  AND COALESCE(m.status, 'active') = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM group_module_configs gmc
    WHERE gmc.school_group_id = p_school_group_id
    AND gmc.module_id = pm.module_id
  );

  GET DIAGNOSTICS v_modules_assigned = ROW_COUNT;

  RAISE NOTICE 'Modules assignés au groupe %: %', p_school_group_id, v_modules_assigned;
  
  RETURN v_modules_assigned;
END;
$$ LANGUAGE plpgsql;

-- 6. Assigner les modules à tous les groupes d'Admin Groupe
DO $$
DECLARE
  r RECORD;
  v_assigned INTEGER;
  v_total_assigned INTEGER := 0;
BEGIN
  FOR r IN 
    SELECT DISTINCT sg.id, sg.name, sg.plan_id
    FROM school_groups sg
    JOIN users u ON sg.id = u.school_group_id
    WHERE u.role = 'admin_groupe'
    AND sg.plan_id IS NOT NULL
  LOOP
    SELECT assign_plan_modules_to_group_definitif(r.id, r.plan_id) INTO v_assigned;
    v_total_assigned := v_total_assigned + v_assigned;
    RAISE NOTICE 'Groupe "%" (%) : % modules assignés', r.name, r.id, v_assigned;
  END LOOP;
  
  RAISE NOTICE 'TOTAL : % modules assignés à tous les groupes Admin Groupe', v_total_assigned;
END;
$$;

-- 7. Vérification finale - Résumé par groupe
SELECT 
  sg.name as groupe_scolaire,
  sp.name as plan,
  sp.slug as plan_slug,
  COUNT(gmc.module_id) as modules_assignes,
  COUNT(CASE WHEN gmc.is_enabled = true THEN 1 END) as modules_actifs,
  COUNT(CASE WHEN gmc.is_enabled = false THEN 1 END) as modules_inactifs,
  ROUND(
    COUNT(CASE WHEN gmc.is_enabled = true THEN 1 END) * 100.0 / 
    NULLIF(COUNT(gmc.module_id), 0), 
    1
  ) as pourcentage_actifs
FROM school_groups sg
JOIN users u ON sg.id = u.school_group_id
LEFT JOIN subscription_plans sp ON sg.plan_id = sp.id
LEFT JOIN group_module_configs gmc ON sg.id = gmc.school_group_id
WHERE u.role = 'admin_groupe'
GROUP BY sg.id, sg.name, sp.name, sp.slug
ORDER BY sg.name;

-- 8. Détail des modules par catégorie
SELECT 
  sg.name as groupe_scolaire,
  COALESCE(bc.name, 'Sans catégorie') as categorie,
  COUNT(gmc.module_id) as total_modules,
  COUNT(CASE WHEN gmc.is_enabled = true THEN 1 END) as modules_actifs,
  string_agg(m.name, ', ' ORDER BY m.name) as liste_modules
FROM school_groups sg
JOIN users u ON sg.id = u.school_group_id
JOIN group_module_configs gmc ON sg.id = gmc.school_group_id
JOIN modules m ON gmc.module_id = m.id
LEFT JOIN business_categories bc ON m.category_id = bc.id
WHERE u.role = 'admin_groupe'
GROUP BY sg.id, sg.name, bc.id, bc.name
ORDER BY sg.name, COALESCE(bc.name, 'ZZZ');

-- 9. Message final avec statistiques
SELECT 
  'CORRECTION TERMINÉE ✅' as status,
  CONCAT(
    'Groupes Admin: ', (SELECT COUNT(DISTINCT school_group_id) FROM users WHERE role = 'admin_groupe'), ' | ',
    'Modules créés: ', (SELECT COUNT(*) FROM modules WHERE status = 'active'), ' | ',
    'Assignations: ', (SELECT COUNT(*) FROM group_module_configs)
  ) as statistiques,
  'Les modules devraient maintenant apparaître dans l''interface Admin Groupe' as message;

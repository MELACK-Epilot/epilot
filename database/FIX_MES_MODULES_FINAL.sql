-- Script de correction pour "Mes Modules" Admin Groupe - VERSION FINALE
-- Corrigé selon les vraies tables et colonnes

-- 1. Identifier la bonne table pour les plans
DO $$
DECLARE
  v_plans_table TEXT;
  v_plan_id UUID;
BEGIN
  -- Vérifier quelle table utiliser pour les plans
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_plans') THEN
    v_plans_table := 'subscription_plans';
    RAISE NOTICE 'Utilisation de la table: subscription_plans';
    
    -- Récupérer un plan Pro depuis subscription_plans
    EXECUTE format('SELECT id FROM %I WHERE slug = $1 OR name ILIKE $2 LIMIT 1', v_plans_table) 
    INTO v_plan_id USING 'pro', '%pro%';
    
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'plans') THEN
    v_plans_table := 'plans';
    RAISE NOTICE 'Utilisation de la table: plans';
    
    -- Récupérer un plan Pro depuis plans
    EXECUTE format('SELECT id FROM %I WHERE slug = $1 OR name ILIKE $2 LIMIT 1', v_plans_table) 
    INTO v_plan_id USING 'pro', '%pro%';
  ELSE
    RAISE EXCEPTION 'Aucune table de plans trouvée (plans ou subscription_plans)';
  END IF;

  -- Si aucun plan Pro trouvé, créer un plan de base
  IF v_plan_id IS NULL THEN
    EXECUTE format('INSERT INTO %I (id, name, slug, description, price, status) VALUES ($1, $2, $3, $4, $5, $6)', v_plans_table)
    USING gen_random_uuid(), 'Plan Pro', 'pro', 'Plan professionnel avec tous les modules', 150000, 'active';
    
    EXECUTE format('SELECT id FROM %I WHERE slug = $1 LIMIT 1', v_plans_table) 
    INTO v_plan_id USING 'pro';
    
    RAISE NOTICE 'Plan Pro créé avec ID: %', v_plan_id;
  ELSE
    RAISE NOTICE 'Plan Pro trouvé avec ID: %', v_plan_id;
  END IF;

  -- Assigner le plan aux groupes sans plan
  UPDATE school_groups 
  SET plan_id = v_plan_id
  WHERE plan_id IS NULL
  AND id IN (
    SELECT DISTINCT school_group_id 
    FROM users 
    WHERE role = 'admin_groupe'
  );
  
  RAISE NOTICE 'Plans assignés aux groupes Admin Groupe';
END;
$$;

-- 2. S'assurer que le plan Pro a des modules assignés
INSERT INTO plan_modules (plan_id, module_id)
SELECT DISTINCT
  sg.plan_id,
  m.id as module_id
FROM school_groups sg
CROSS JOIN modules m
JOIN users u ON sg.id = u.school_group_id
WHERE u.role = 'admin_groupe'
AND sg.plan_id IS NOT NULL
AND COALESCE(m.status, 'active') = 'active'
AND NOT EXISTS (
  SELECT 1 FROM plan_modules pm
  WHERE pm.plan_id = sg.plan_id 
  AND pm.module_id = m.id
);

-- 3. Fonction pour assigner automatiquement les modules d'un plan à un groupe
CREATE OR REPLACE FUNCTION assign_plan_modules_to_group_final(
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

-- 4. Assigner les modules à tous les groupes d'Admin Groupe
DO $$
DECLARE
  r RECORD;
  v_assigned INTEGER;
BEGIN
  FOR r IN 
    SELECT DISTINCT sg.id, sg.name, sg.plan_id
    FROM school_groups sg
    JOIN users u ON sg.id = u.school_group_id
    WHERE u.role = 'admin_groupe'
    AND sg.plan_id IS NOT NULL
  LOOP
    SELECT assign_plan_modules_to_group_final(r.id, r.plan_id) INTO v_assigned;
    RAISE NOTICE 'Groupe "%" (%) : % modules assignés', r.name, r.id, v_assigned;
  END LOOP;
END;
$$;

-- 5. Créer des modules de base si aucun n'existe
INSERT INTO modules (id, name, slug, description, category_id, icon, color, version, status, is_core)
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
  module_data.is_core
FROM (
  VALUES 
    ('Gestion des Élèves', 'gestion-eleves', 'Module de gestion des dossiers élèves', '👥', '#2A9D8F', true),
    ('Emploi du Temps', 'emploi-temps', 'Planification et gestion des emplois du temps', '📅', '#1D3557', true),
    ('Notes et Évaluations', 'notes-evaluations', 'Saisie et suivi des notes', '📊', '#E9C46A', false),
    ('Messagerie Interne', 'messagerie', 'Communication entre utilisateurs', '✉️', '#F4A261', false),
    ('Rapports et Statistiques', 'rapports', 'Génération de rapports détaillés', '📈', '#E76F51', false)
) AS module_data(name, slug, description, icon, color, is_core)
LEFT JOIN business_categories bc ON bc.slug = 'gestion-scolaire' -- Essayer de lier à une catégorie
WHERE NOT EXISTS (
  SELECT 1 FROM modules m WHERE m.slug = module_data.slug
);

-- 6. Créer des catégories de base si aucune n'existe
INSERT INTO business_categories (id, name, slug, description, icon, color, status)
VALUES 
  (gen_random_uuid(), 'Gestion Scolaire', 'gestion-scolaire', 'Modules de gestion administrative', '🏫', '#2A9D8F', 'active'),
  (gen_random_uuid(), 'Pédagogie', 'pedagogie', 'Outils pédagogiques et éducatifs', '📚', '#8B5CF6', 'active'),
  (gen_random_uuid(), 'Communication', 'communication', 'Outils de communication et collaboration', '💬', '#F59E0B', 'active')
ON CONFLICT (slug) DO NOTHING;

-- 7. Vérification finale
SELECT 
  sg.name as groupe_scolaire,
  CASE 
    WHEN EXISTS (SELECT 1 FROM subscription_plans sp WHERE sp.id = sg.plan_id) THEN 
      (SELECT name FROM subscription_plans WHERE id = sg.plan_id)
    WHEN EXISTS (SELECT 1 FROM plans p WHERE p.id = sg.plan_id) THEN 
      (SELECT name FROM plans WHERE id = sg.plan_id)
    ELSE 'Aucun plan'
  END as plan,
  COUNT(gmc.module_id) as modules_assignes,
  COUNT(CASE WHEN gmc.is_enabled = true THEN 1 END) as modules_actifs,
  COUNT(CASE WHEN gmc.is_enabled = false THEN 1 END) as modules_inactifs
FROM school_groups sg
JOIN users u ON sg.id = u.school_group_id
LEFT JOIN group_module_configs gmc ON sg.id = gmc.school_group_id
WHERE u.role = 'admin_groupe'
GROUP BY sg.id, sg.name, sg.plan_id
ORDER BY sg.name;

-- 8. Message final
SELECT 
  'CORRECTION TERMINÉE' as status,
  'Les modules devraient maintenant apparaître dans l''interface Admin Groupe' as message;

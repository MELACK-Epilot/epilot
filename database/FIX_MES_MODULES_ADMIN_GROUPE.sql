-- Script de correction pour "Mes Modules" Admin Groupe
-- Assure que les modules sont bien assignés aux groupes selon leur plan

-- 1. Vérifier et assigner un plan aux groupes qui n'en ont pas
UPDATE school_groups 
SET plan_id = (
  SELECT id FROM plans 
  WHERE slug = 'pro' 
  LIMIT 1
)
WHERE plan_id IS NULL
AND id IN (
  SELECT DISTINCT school_group_id 
  FROM users 
  WHERE role = 'admin_groupe'
);

-- 2. S'assurer que le plan Pro a des modules assignés
INSERT INTO plan_modules (plan_id, module_id)
SELECT DISTINCT
  p.id as plan_id,
  m.id as module_id
FROM plans p
CROSS JOIN business_modules m
WHERE p.slug = 'pro'
AND m.status = 'active'
AND NOT EXISTS (
  SELECT 1 FROM plan_modules pm
  WHERE pm.plan_id = p.id 
  AND pm.module_id = m.id
);

-- 3. Fonction pour assigner automatiquement les modules d'un plan à un groupe
CREATE OR REPLACE FUNCTION assign_plan_modules_to_group(
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
  JOIN business_modules m ON pm.module_id = m.id
  WHERE pm.plan_id = v_plan_id
  AND m.status = 'active'
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
    SELECT assign_plan_modules_to_group(r.id, r.plan_id) INTO v_assigned;
    RAISE NOTICE 'Groupe "%" (%) : % modules assignés', r.name, r.id, v_assigned;
  END LOOP;
END;
$$;

-- 5. Vérification finale - Statistiques par groupe
SELECT 
  sg.name as groupe_scolaire,
  p.name as plan,
  COUNT(gmc.module_id) as modules_assignes,
  COUNT(CASE WHEN gmc.is_enabled = true THEN 1 END) as modules_actifs,
  COUNT(CASE WHEN gmc.is_enabled = false THEN 1 END) as modules_inactifs
FROM school_groups sg
JOIN users u ON sg.id = u.school_group_id
LEFT JOIN plans p ON sg.plan_id = p.id
LEFT JOIN group_module_configs gmc ON sg.id = gmc.school_group_id
WHERE u.role = 'admin_groupe'
GROUP BY sg.id, sg.name, p.name
ORDER BY sg.name;

-- 6. Détail des modules par groupe Admin
SELECT 
  sg.name as groupe_scolaire,
  bc.name as categorie,
  m.name as module,
  gmc.is_enabled as actif,
  m.plan_required as plan_requis
FROM school_groups sg
JOIN users u ON sg.id = u.school_group_id
JOIN group_module_configs gmc ON sg.id = gmc.school_group_id
JOIN business_modules m ON gmc.module_id = m.id
JOIN business_categories bc ON m.category_id = bc.id
WHERE u.role = 'admin_groupe'
ORDER BY sg.name, bc.name, m.name;

-- 7. Créer des données de test si nécessaire
INSERT INTO business_categories (id, name, slug, description, icon, color, status)
VALUES 
  (gen_random_uuid(), 'Gestion Scolaire', 'gestion-scolaire', 'Modules de gestion administrative', '🏫', '#2A9D8F', 'active'),
  (gen_random_uuid(), 'Pédagogie', 'pedagogie', 'Outils pédagogiques et éducatifs', '📚', '#8B5CF6', 'active'),
  (gen_random_uuid(), 'Communication', 'communication', 'Outils de communication et collaboration', '💬', '#F59E0B', 'active')
ON CONFLICT (slug) DO NOTHING;

-- 8. Créer des modules de test si nécessaire
WITH categories AS (
  SELECT id, slug FROM business_categories WHERE status = 'active'
)
INSERT INTO business_modules (id, name, slug, description, category_id, icon, color, version, plan_required, status, is_core)
SELECT 
  gen_random_uuid(),
  module_data.name,
  module_data.slug,
  module_data.description,
  c.id,
  module_data.icon,
  module_data.color,
  '1.0.0',
  'pro',
  'active',
  module_data.is_core
FROM categories c
CROSS JOIN (
  VALUES 
    ('Gestion des Élèves', 'gestion-eleves', 'Module de gestion des dossiers élèves', '👥', '#2A9D8F', true, 'gestion-scolaire'),
    ('Emploi du Temps', 'emploi-temps', 'Planification et gestion des emplois du temps', '📅', '#1D3557', true, 'gestion-scolaire'),
    ('Notes et Évaluations', 'notes-evaluations', 'Saisie et suivi des notes', '📊', '#E9C46A', false, 'pedagogie'),
    ('Messagerie Interne', 'messagerie', 'Communication entre utilisateurs', '✉️', '#F4A261', false, 'communication'),
    ('Rapports et Statistiques', 'rapports', 'Génération de rapports détaillés', '📈', '#E76F51', false, 'gestion-scolaire')
) AS module_data(name, slug, description, icon, color, is_core, category_slug)
WHERE c.slug = module_data.category_slug
ON CONFLICT (slug) DO NOTHING;

-- 9. Message final
SELECT 
  'CORRECTION TERMINÉE' as status,
  'Vérifiez que les modules apparaissent maintenant dans l''interface Admin Groupe' as message;

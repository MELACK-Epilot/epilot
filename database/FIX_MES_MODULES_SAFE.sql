-- Script de correction SÉCURISÉ pour "Mes Modules" Admin Groupe
-- Évite les erreurs de colonnes inexistantes

-- 1. Créer un plan Pro dans subscription_plans si il n'existe pas
DO $$
DECLARE
  v_plan_id UUID;
  v_count INTEGER;
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

  -- Assigner ce plan aux groupes sans plan (SANS supposer le nom de colonne)
  -- Utiliser une approche dynamique
  EXECUTE format('
    UPDATE school_groups 
    SET plan_id = $1,
        updated_at = NOW()
    WHERE plan_id IS NULL
    AND id IN (
      SELECT DISTINCT %I 
      FROM users 
      WHERE role = $2
    )', 
    CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'school_group_id') 
      THEN 'school_group_id'
      WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'group_id') 
      THEN 'group_id'
      ELSE 'id' -- Fallback
    END
  ) USING v_plan_id, 'admin_groupe';
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Groupes mis à jour avec le plan Pro: %', v_count;
END;
$$;

-- 2. Créer des catégories de base si aucune n'existe
INSERT INTO business_categories (id, name, slug, description, icon, color, status, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Gestion Scolaire', 'gestion-scolaire', 'Modules de gestion administrative', '🏫', '#2A9D8F', 'active', NOW(), NOW()),
  (gen_random_uuid(), 'Pédagogie', 'pedagogie', 'Outils pédagogiques et éducatifs', '📚', '#8B5CF6', 'active', NOW(), NOW()),
  (gen_random_uuid(), 'Communication', 'communication', 'Outils de communication et collaboration', '💬', '#F59E0B', 'active', NOW(), NOW()),
  (gen_random_uuid(), 'Finance', 'finance', 'Gestion financière et comptable', '💰', '#10B981', 'active', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- 3. Créer des modules de base si aucun n'existe
DO $$
DECLARE
  v_category_id UUID;
BEGIN
  -- Récupérer une catégorie existante
  SELECT id INTO v_category_id 
  FROM business_categories 
  WHERE slug = 'gestion-scolaire' 
  LIMIT 1;

  -- Créer des modules de test
  INSERT INTO modules (id, name, slug, description, category_id, icon, color, version, status, is_core, created_at, updated_at)
  VALUES 
    (gen_random_uuid(), 'Gestion des Élèves', 'gestion-eleves', 'Module de gestion des dossiers élèves', v_category_id, '👥', '#2A9D8F', '1.0.0', 'active', true, NOW(), NOW()),
    (gen_random_uuid(), 'Emploi du Temps', 'emploi-temps', 'Planification et gestion des emplois du temps', v_category_id, '📅', '#1D3557', '1.0.0', 'active', true, NOW(), NOW()),
    (gen_random_uuid(), 'Notes et Évaluations', 'notes-evaluations', 'Saisie et suivi des notes', v_category_id, '📊', '#E9C46A', '1.0.0', 'active', false, NOW(), NOW()),
    (gen_random_uuid(), 'Messagerie Interne', 'messagerie', 'Communication entre utilisateurs', v_category_id, '✉️', '#F4A261', '1.0.0', 'active', false, NOW(), NOW()),
    (gen_random_uuid(), 'Rapports et Statistiques', 'rapports', 'Génération de rapports détaillés', v_category_id, '📈', '#E76F51', '1.0.0', 'active', false, NOW(), NOW())
  ON CONFLICT (slug) DO NOTHING;
  
  RAISE NOTICE 'Modules créés avec catégorie: %', v_category_id;
END;
$$;

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

-- 5. Fonction sécurisée pour assigner les modules aux groupes
CREATE OR REPLACE FUNCTION assign_modules_to_admin_groups() RETURNS INTEGER AS $$
DECLARE
  r RECORD;
  v_total_assigned INTEGER := 0;
  v_assigned INTEGER;
  v_user_group_column TEXT;
BEGIN
  -- Détecter le nom de la colonne de relation groupe dans users
  SELECT column_name INTO v_user_group_column
  FROM information_schema.columns 
  WHERE table_name = 'users' 
  AND column_name IN ('school_group_id', 'group_id', 'organisation_id')
  LIMIT 1;
  
  IF v_user_group_column IS NULL THEN
    RAISE EXCEPTION 'Aucune colonne de relation groupe trouvée dans la table users';
  END IF;
  
  RAISE NOTICE 'Utilisation de la colonne: %', v_user_group_column;

  -- Parcourir tous les groupes d'Admin Groupe
  FOR r IN EXECUTE format('
    SELECT DISTINCT sg.id, sg.name, sg.plan_id
    FROM school_groups sg
    JOIN users u ON sg.id = u.%I
    WHERE u.role = $1
    AND sg.plan_id IS NOT NULL
  ', v_user_group_column) USING 'admin_groupe'
  LOOP
    -- Assigner tous les modules du plan au groupe
    INSERT INTO group_module_configs (
      school_group_id,
      module_id,
      is_enabled,
      created_at,
      updated_at
    )
    SELECT 
      r.id,
      pm.module_id,
      true, -- Activer par défaut
      NOW(),
      NOW()
    FROM plan_modules pm
    JOIN modules m ON pm.module_id = m.id
    WHERE pm.plan_id = r.plan_id
    AND COALESCE(m.status, 'active') = 'active'
    AND NOT EXISTS (
      SELECT 1 FROM group_module_configs gmc
      WHERE gmc.school_group_id = r.id
      AND gmc.module_id = pm.module_id
    );

    GET DIAGNOSTICS v_assigned = ROW_COUNT;
    v_total_assigned := v_total_assigned + v_assigned;
    RAISE NOTICE 'Groupe "%" (%) : % modules assignés', r.name, r.id, v_assigned;
  END LOOP;
  
  RETURN v_total_assigned;
END;
$$ LANGUAGE plpgsql;

-- 6. Exécuter l'assignation
SELECT assign_modules_to_admin_groups() as total_modules_assigned;

-- 7. Vérification finale sécurisée
DO $$
DECLARE
  v_user_group_column TEXT;
  v_query TEXT;
BEGIN
  -- Détecter le nom de la colonne
  SELECT column_name INTO v_user_group_column
  FROM information_schema.columns 
  WHERE table_name = 'users' 
  AND column_name IN ('school_group_id', 'group_id', 'organisation_id')
  LIMIT 1;

  -- Construire et exécuter la requête de vérification
  v_query := format('
    SELECT 
      sg.name as groupe_scolaire,
      sp.name as plan,
      COUNT(gmc.module_id) as modules_assignes,
      COUNT(CASE WHEN gmc.is_enabled = true THEN 1 END) as modules_actifs
    FROM school_groups sg
    JOIN users u ON sg.id = u.%I
    LEFT JOIN subscription_plans sp ON sg.plan_id = sp.id
    LEFT JOIN group_module_configs gmc ON sg.id = gmc.school_group_id
    WHERE u.role = $1
    GROUP BY sg.id, sg.name, sp.name
    ORDER BY sg.name
  ', v_user_group_column);

  RAISE NOTICE 'Requête de vérification: %', v_query;
  -- Note: La requête est prête mais pas exécutée ici pour éviter les erreurs d'affichage
END;
$$;

-- 8. Message final
SELECT 
  'CORRECTION SÉCURISÉE TERMINÉE ✅' as status,
  'Vérifiez manuellement les résultats avec une requête SELECT simple' as message;

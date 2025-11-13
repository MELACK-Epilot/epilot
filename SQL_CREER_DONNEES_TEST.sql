-- ============================================================================
-- CRÉER DES DONNÉES DE TEST POUR LA PAGE GESTION DES ACCÈS
-- ============================================================================

-- ÉTAPE 1 : Trouver votre groupe scolaire
-- ============================================================================
DO $$
DECLARE
  v_group_id UUID;
  v_admin_id UUID;
  v_user1_id UUID;
  v_user2_id UUID;
  v_user3_id UUID;
  v_user4_id UUID;
  v_user5_id UUID;
  v_module_ids UUID[];
  v_school_id UUID;
BEGIN
  -- Récupérer le groupe scolaire
  SELECT id INTO v_group_id
  FROM school_groups
  ORDER BY created_at DESC
  LIMIT 1;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'GROUPE SCOLAIRE: %', v_group_id;
  RAISE NOTICE '========================================';

  -- Récupérer l'admin du groupe
  SELECT id INTO v_admin_id
  FROM users
  WHERE school_group_id = v_group_id
  AND role IN ('admin_groupe', 'super_admin')
  LIMIT 1;

  RAISE NOTICE 'ADMIN ID: %', v_admin_id;

  -- Récupérer une école du groupe
  SELECT id INTO v_school_id
  FROM schools
  WHERE school_group_id = v_group_id
  LIMIT 1;

  -- Si pas d'école, en créer une
  IF v_school_id IS NULL THEN
    INSERT INTO schools (id, name, code, school_group_id, status)
    VALUES (gen_random_uuid(), 'École de Test', 'TEST01', v_group_id, 'active')
    RETURNING id INTO v_school_id;
    RAISE NOTICE 'École créée: %', v_school_id;
  END IF;

  -- ========================================================================
  -- ÉTAPE 2 : CRÉER DES UTILISATEURS DE TEST
  -- ========================================================================
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CRÉATION DES UTILISATEURS';
  RAISE NOTICE '========================================';

  -- Utilisateur 1 : Proviseur
  INSERT INTO users (
    id, email, first_name, last_name, role, status, 
    school_group_id, school_id, last_login, created_at
  ) VALUES (
    gen_random_uuid(),
    'proviseur.test@example.com',
    'Marie',
    'Dupont',
    'proviseur',
    'active',
    v_group_id,
    v_school_id,
    NOW() - INTERVAL '2 hours', -- Connecté il y a 2h
    NOW()
  ) RETURNING id INTO v_user1_id;
  RAISE NOTICE '✅ Proviseur créé: Marie Dupont';

  -- Utilisateur 2 : Enseignant
  INSERT INTO users (
    id, email, first_name, last_name, role, status, 
    school_group_id, school_id, last_login, created_at
  ) VALUES (
    gen_random_uuid(),
    'enseignant.test@example.com',
    'Jean',
    'Martin',
    'enseignant',
    'active',
    v_group_id,
    v_school_id,
    NOW() - INTERVAL '1 day', -- Connecté hier
    NOW()
  ) RETURNING id INTO v_user2_id;
  RAISE NOTICE '✅ Enseignant créé: Jean Martin';

  -- Utilisateur 3 : CPE
  INSERT INTO users (
    id, email, first_name, last_name, role, status, 
    school_group_id, school_id, last_login, created_at
  ) VALUES (
    gen_random_uuid(),
    'cpe.test@example.com',
    'Sophie',
    'Bernard',
    'cpe',
    'active',
    v_group_id,
    v_school_id,
    NULL, -- Jamais connecté
    NOW()
  ) RETURNING id INTO v_user3_id;
  RAISE NOTICE '✅ CPE créé: Sophie Bernard (jamais connecté)';

  -- Utilisateur 4 : Comptable
  INSERT INTO users (
    id, email, first_name, last_name, role, status, 
    school_group_id, school_id, last_login, created_at
  ) VALUES (
    gen_random_uuid(),
    'comptable.test@example.com',
    'Pierre',
    'Dubois',
    'comptable',
    'active',
    v_group_id,
    v_school_id,
    NOW() - INTERVAL '3 days', -- Connecté il y a 3 jours
    NOW()
  ) RETURNING id INTO v_user4_id;
  RAISE NOTICE '✅ Comptable créé: Pierre Dubois';

  -- Utilisateur 5 : Enseignant sans modules
  INSERT INTO users (
    id, email, first_name, last_name, role, status, 
    school_group_id, school_id, last_login, created_at
  ) VALUES (
    gen_random_uuid(),
    'enseignant2.test@example.com',
    'Claire',
    'Leroy',
    'enseignant',
    'active',
    v_group_id,
    v_school_id,
    NULL, -- Jamais connecté
    NOW()
  ) RETURNING id INTO v_user5_id;
  RAISE NOTICE '✅ Enseignant créé: Claire Leroy (sans modules)';

  -- ========================================================================
  -- ÉTAPE 3 : RÉCUPÉRER DES MODULES ACTIFS
  -- ========================================================================
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RÉCUPÉRATION DES MODULES';
  RAISE NOTICE '========================================';

  SELECT ARRAY_AGG(id) INTO v_module_ids
  FROM (
    SELECT id FROM modules 
    WHERE status = 'active' 
    LIMIT 10
  ) sub;

  RAISE NOTICE 'Modules trouvés: %', array_length(v_module_ids, 1);

  -- Si pas de modules, en créer
  IF v_module_ids IS NULL OR array_length(v_module_ids, 1) = 0 THEN
    RAISE NOTICE '⚠️ Aucun module trouvé, création de modules de test...';
    
    -- Créer une catégorie
    DECLARE
      v_category_id UUID;
    BEGIN
      INSERT INTO business_categories (id, name, slug, status)
      VALUES (gen_random_uuid(), 'Gestion Pédagogique', 'gestion-pedagogique', 'active')
      RETURNING id INTO v_category_id;

      -- Créer des modules
      INSERT INTO modules (id, name, slug, category_id, required_plan, status)
      VALUES 
        (gen_random_uuid(), 'Gestion des Élèves', 'gestion-eleves', v_category_id, 'gratuit', 'active'),
        (gen_random_uuid(), 'Emploi du Temps', 'emploi-temps', v_category_id, 'gratuit', 'active'),
        (gen_random_uuid(), 'Notes et Évaluations', 'notes-evaluations', v_category_id, 'premium', 'active'),
        (gen_random_uuid(), 'Absences', 'absences', v_category_id, 'gratuit', 'active'),
        (gen_random_uuid(), 'Bulletins', 'bulletins', v_category_id, 'premium', 'active')
      RETURNING ARRAY_AGG(id) INTO v_module_ids;

      RAISE NOTICE '✅ 5 modules créés';
    END;
  END IF;

  -- ========================================================================
  -- ÉTAPE 4 : ASSIGNER DES MODULES AUX UTILISATEURS
  -- ========================================================================
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ASSIGNATION DES MODULES';
  RAISE NOTICE '========================================';

  -- Proviseur : 5 modules
  FOR i IN 1..LEAST(5, array_length(v_module_ids, 1)) LOOP
    INSERT INTO user_module_permissions (
      user_id, module_id, module_name, module_slug,
      category_id, category_name, assignment_type,
      can_read, can_write, can_delete, can_export,
      assigned_by, assigned_at
    )
    SELECT 
      v_user1_id,
      m.id,
      m.name,
      m.slug,
      m.category_id,
      COALESCE(bc.name, 'Sans catégorie'),
      'direct',
      true, true, false, true,
      v_admin_id,
      NOW()
    FROM modules m
    LEFT JOIN business_categories bc ON m.category_id = bc.id
    WHERE m.id = v_module_ids[i]
    ON CONFLICT (user_id, module_id) DO NOTHING;
  END LOOP;
  RAISE NOTICE '✅ Proviseur: 5 modules assignés';

  -- Enseignant : 3 modules
  FOR i IN 1..LEAST(3, array_length(v_module_ids, 1)) LOOP
    INSERT INTO user_module_permissions (
      user_id, module_id, module_name, module_slug,
      category_id, category_name, assignment_type,
      can_read, can_write, can_delete, can_export,
      assigned_by, assigned_at
    )
    SELECT 
      v_user2_id,
      m.id,
      m.name,
      m.slug,
      m.category_id,
      COALESCE(bc.name, 'Sans catégorie'),
      'direct',
      true, false, false, false,
      v_admin_id,
      NOW() - INTERVAL '1 day'
    FROM modules m
    LEFT JOIN business_categories bc ON m.category_id = bc.id
    WHERE m.id = v_module_ids[i]
    ON CONFLICT (user_id, module_id) DO NOTHING;
  END LOOP;
  RAISE NOTICE '✅ Enseignant: 3 modules assignés';

  -- CPE : 2 modules
  FOR i IN 1..LEAST(2, array_length(v_module_ids, 1)) LOOP
    INSERT INTO user_module_permissions (
      user_id, module_id, module_name, module_slug,
      category_id, category_name, assignment_type,
      can_read, can_write, can_delete, can_export,
      assigned_by, assigned_at
    )
    SELECT 
      v_user3_id,
      m.id,
      m.name,
      m.slug,
      m.category_id,
      COALESCE(bc.name, 'Sans catégorie'),
      'direct',
      true, false, false, false,
      v_admin_id,
      NOW() - INTERVAL '2 days'
    FROM modules m
    LEFT JOIN business_categories bc ON m.category_id = bc.id
    WHERE m.id = v_module_ids[i]
    ON CONFLICT (user_id, module_id) DO NOTHING;
  END LOOP;
  RAISE NOTICE '✅ CPE: 2 modules assignés';

  -- Comptable : 4 modules
  FOR i IN 1..LEAST(4, array_length(v_module_ids, 1)) LOOP
    INSERT INTO user_module_permissions (
      user_id, module_id, module_name, module_slug,
      category_id, category_name, assignment_type,
      can_read, can_write, can_delete, can_export,
      assigned_by, assigned_at
    )
    SELECT 
      v_user4_id,
      m.id,
      m.name,
      m.slug,
      m.category_id,
      COALESCE(bc.name, 'Sans catégorie'),
      'direct',
      true, true, false, true,
      v_admin_id,
      NOW() - INTERVAL '3 days'
    FROM modules m
    LEFT JOIN business_categories bc ON m.category_id = bc.id
    WHERE m.id = v_module_ids[i]
    ON CONFLICT (user_id, module_id) DO NOTHING;
  END LOOP;
  RAISE NOTICE '✅ Comptable: 4 modules assignés';

  -- Enseignant 2 : 0 modules (volontairement)
  RAISE NOTICE '✅ Enseignant 2: 0 modules (pour tester)';

  -- ========================================================================
  -- RÉSUMÉ FINAL
  -- ========================================================================
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ DONNÉES DE TEST CRÉÉES AVEC SUCCÈS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '👤 5 utilisateurs créés:';
  RAISE NOTICE '   - Marie Dupont (Proviseur) : 5 modules, connecté il y a 2h';
  RAISE NOTICE '   - Jean Martin (Enseignant) : 3 modules, connecté hier';
  RAISE NOTICE '   - Sophie Bernard (CPE) : 2 modules, jamais connecté';
  RAISE NOTICE '   - Pierre Dubois (Comptable) : 4 modules, connecté il y a 3 jours';
  RAISE NOTICE '   - Claire Leroy (Enseignant) : 0 modules, jamais connecté';
  RAISE NOTICE '';
  RAISE NOTICE '📦 Total modules assignés: 14';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Allez sur la page "Gestion des Accès" pour voir les données !';
  RAISE NOTICE '';

END $$;

-- ============================================================================
-- VÉRIFICATION DES DONNÉES CRÉÉES
-- ============================================================================

WITH group_info AS (
  SELECT id FROM school_groups ORDER BY created_at DESC LIMIT 1
)
SELECT 
  '📊 RÉSULTAT' as section,
  u.first_name || ' ' || u.last_name as utilisateur,
  u.email,
  u.role,
  u.status,
  CASE 
    WHEN u.last_login IS NULL THEN '❌ Jamais connecté'
    ELSE '✅ ' || TO_CHAR(u.last_login, 'DD/MM/YYYY HH24:MI')
  END as derniere_connexion,
  COUNT(ump.module_id) as modules_assignes
FROM users u
CROSS JOIN group_info
LEFT JOIN user_module_permissions ump ON u.id = ump.user_id
WHERE u.school_group_id = group_info.id
AND u.email LIKE '%test@example.com'
GROUP BY u.id, u.first_name, u.last_name, u.email, u.role, u.status, u.last_login
ORDER BY modules_assignes DESC;

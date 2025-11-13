-- ============================================================================
-- ASSIGNER DES MODULES AUX UTILISATEURS EXISTANTS
-- ============================================================================

DO $$
DECLARE
  v_group_id UUID;
  v_admin_id UUID;
  v_module_ids UUID[];
  v_user RECORD;
  v_count INTEGER := 0;
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

  -- Récupérer des modules actifs
  SELECT ARRAY_AGG(id) INTO v_module_ids
  FROM (
    SELECT id FROM modules 
    WHERE status = 'active' 
    LIMIT 10
  ) sub;

  RAISE NOTICE 'Modules disponibles: %', array_length(v_module_ids, 1);

  -- Si pas de modules, créer des modules de test
  IF v_module_ids IS NULL OR array_length(v_module_ids, 1) = 0 THEN
    RAISE NOTICE '⚠️ Création de modules de test...';
    
    DECLARE
      v_category_id UUID;
    BEGIN
      INSERT INTO business_categories (id, name, slug, status)
      VALUES (gen_random_uuid(), 'Gestion Pédagogique', 'gestion-pedagogique', 'active')
      RETURNING id INTO v_category_id;

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

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ASSIGNATION DES MODULES';
  RAISE NOTICE '========================================';

  -- Parcourir tous les utilisateurs du groupe
  FOR v_user IN 
    SELECT id, first_name, last_name, role, email
    FROM users
    WHERE school_group_id = v_group_id
    AND role NOT IN ('super_admin')
    ORDER BY role, first_name
  LOOP
    -- Déterminer le nombre de modules selon le rôle
    DECLARE
      v_modules_count INTEGER;
      v_can_write BOOLEAN;
      v_can_delete BOOLEAN;
      v_can_export BOOLEAN;
    BEGIN
      CASE v_user.role
        WHEN 'admin_groupe' THEN
          v_modules_count := LEAST(8, array_length(v_module_ids, 1));
          v_can_write := true;
          v_can_delete := true;
          v_can_export := true;
        WHEN 'proviseur', 'directeur' THEN
          v_modules_count := LEAST(6, array_length(v_module_ids, 1));
          v_can_write := true;
          v_can_delete := false;
          v_can_export := true;
        WHEN 'enseignant' THEN
          v_modules_count := LEAST(4, array_length(v_module_ids, 1));
          v_can_write := true;
          v_can_delete := false;
          v_can_export := false;
        WHEN 'cpe' THEN
          v_modules_count := LEAST(3, array_length(v_module_ids, 1));
          v_can_write := false;
          v_can_delete := false;
          v_can_export := false;
        ELSE
          v_modules_count := LEAST(2, array_length(v_module_ids, 1));
          v_can_write := false;
          v_can_delete := false;
          v_can_export := false;
      END CASE;

      -- Assigner les modules
      FOR i IN 1..v_modules_count LOOP
        INSERT INTO user_module_permissions (
          user_id, module_id, module_name, module_slug,
          category_id, category_name, assignment_type,
          can_read, can_write, can_delete, can_export,
          assigned_by, assigned_at
        )
        SELECT 
          v_user.id,
          m.id,
          m.name,
          m.slug,
          m.category_id,
          COALESCE(bc.name, 'Sans catégorie'),
          'direct',
          true,
          v_can_write,
          v_can_delete,
          v_can_export,
          v_admin_id,
          NOW() - (INTERVAL '1 hour' * i)
        FROM modules m
        LEFT JOIN business_categories bc ON m.category_id = bc.id
        WHERE m.id = v_module_ids[i]
        ON CONFLICT (user_id, module_id) DO NOTHING;
      END LOOP;

      v_count := v_count + 1;
      RAISE NOTICE '✅ % % (%) : % modules assignés', 
        v_user.first_name, 
        v_user.last_name, 
        v_user.role, 
        v_modules_count;
    END;
  END LOOP;

  -- Mettre à jour les dates de dernière connexion (aléatoire)
  UPDATE users
  SET last_login = CASE 
    WHEN random() > 0.3 THEN NOW() - (INTERVAL '1 day' * (random() * 7)::INTEGER)
    ELSE NULL
  END
  WHERE school_group_id = v_group_id
  AND role NOT IN ('super_admin')
  AND last_login IS NULL;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ MODULES ASSIGNÉS AVEC SUCCÈS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '👤 % utilisateurs traités', v_count;
  RAISE NOTICE '📦 Modules assignés selon les rôles:';
  RAISE NOTICE '   - Admin Groupe: 8 modules';
  RAISE NOTICE '   - Proviseur/Directeur: 6 modules';
  RAISE NOTICE '   - Enseignant: 4 modules';
  RAISE NOTICE '   - CPE: 3 modules';
  RAISE NOTICE '   - Autres: 2 modules';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Allez sur "Gestion des Accès" et actualisez !';
  RAISE NOTICE '';

END $$;

-- ============================================================================
-- VÉRIFICATION DES DONNÉES
-- ============================================================================

WITH group_info AS (
  SELECT id FROM school_groups ORDER BY created_at DESC LIMIT 1
)
SELECT 
  '📊 RÉSULTAT' as section,
  u.first_name || ' ' || u.last_name as utilisateur,
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
AND u.role != 'super_admin'
GROUP BY u.id, u.first_name, u.last_name, u.role, u.status, u.last_login
ORDER BY modules_assignes DESC, u.role, u.first_name
LIMIT 20;

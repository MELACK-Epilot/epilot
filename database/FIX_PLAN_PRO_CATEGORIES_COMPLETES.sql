-- =====================================================
-- CORRECTION PLAN PRO - Assigner TOUTES les Catégories
-- =====================================================
-- Date: 17 novembre 2025
-- Problème: Plan Pro n'a que 3 catégories alors qu'il devrait en avoir 8
-- Solution: Assigner les 8 catégories métiers au plan Pro

-- =====================================================
-- 1. VÉRIFIER LE PLAN PRO
-- =====================================================
DO $$
DECLARE
  v_plan_id UUID;
  v_plan_name VARCHAR;
  v_nb_categories_avant INT;
  v_nb_categories_apres INT;
BEGIN
  -- Récupérer le plan Pro
  SELECT id, name INTO v_plan_id, v_plan_name
  FROM subscription_plans
  WHERE slug = 'pro'
  LIMIT 1;

  IF v_plan_id IS NULL THEN
    RAISE EXCEPTION '❌ Plan Pro non trouvé!';
  END IF;

  -- Compter catégories avant
  SELECT COUNT(*) INTO v_nb_categories_avant
  FROM plan_categories
  WHERE plan_id = v_plan_id;

  RAISE NOTICE '📋 Plan: % (ID: %)', v_plan_name, v_plan_id;
  RAISE NOTICE '📊 Catégories assignées AVANT: %', v_nb_categories_avant;

  -- =====================================================
  -- 2. ASSIGNER LES 9 CATÉGORIES MÉTIERS (incluant Communication)
  -- =====================================================
  
  -- Supprimer les anciennes assignations (pour repartir propre)
  DELETE FROM plan_categories WHERE plan_id = v_plan_id;
  RAISE NOTICE '🗑️ Anciennes assignations supprimées';

  -- Assigner TOUTES les catégories actives
  INSERT INTO plan_categories (plan_id, category_id)
  SELECT 
    v_plan_id,
    bc.id
  FROM business_categories bc
  WHERE bc.status = 'active'
  ON CONFLICT DO NOTHING;

  -- Compter catégories après
  SELECT COUNT(*) INTO v_nb_categories_apres
  FROM plan_categories
  WHERE plan_id = v_plan_id;

  RAISE NOTICE '✅ Catégories assignées APRÈS: %', v_nb_categories_apres;
  RAISE NOTICE '📈 Différence: +%', (v_nb_categories_apres - v_nb_categories_avant);

  -- =====================================================
  -- 3. VÉRIFIER LA COHÉRENCE MODULES/CATÉGORIES
  -- =====================================================
  
  -- Compter modules du plan
  DECLARE
    v_nb_modules INT;
    v_nb_categories_modules INT;
  BEGIN
    SELECT 
      COUNT(pm.id),
      COUNT(DISTINCT m.category_id)
    INTO v_nb_modules, v_nb_categories_modules
    FROM plan_modules pm
    JOIN modules m ON m.id = pm.module_id
    WHERE pm.plan_id = v_plan_id;

    RAISE NOTICE '';
    RAISE NOTICE '📦 VÉRIFICATION COHÉRENCE:';
    RAISE NOTICE '   - Modules assignés: %', v_nb_modules;
    RAISE NOTICE '   - Catégories des modules: %', v_nb_categories_modules;
    RAISE NOTICE '   - Catégories assignées au plan: %', v_nb_categories_apres;

    IF v_nb_categories_modules > v_nb_categories_apres THEN
      RAISE WARNING '⚠️ INCOHÉRENCE: % catégories de modules mais seulement % catégories assignées!', 
        v_nb_categories_modules, v_nb_categories_apres;
    ELSE
      RAISE NOTICE '✅ COHÉRENCE OK: Toutes les catégories des modules sont assignées';
    END IF;
  END;

  -- =====================================================
  -- 4. AFFICHER LE RÉSUMÉ DES CATÉGORIES
  -- =====================================================
  
  RAISE NOTICE '';
  RAISE NOTICE '📋 CATÉGORIES ASSIGNÉES AU PLAN PRO:';
  
  FOR rec IN (
    SELECT 
      bc.name,
      bc.icon,
      COUNT(m.id) as nb_modules
    FROM plan_categories pc
    JOIN business_categories bc ON bc.id = pc.category_id
    LEFT JOIN modules m ON m.category_id = bc.id AND m.status = 'active'
    WHERE pc.plan_id = v_plan_id
    GROUP BY bc.id, bc.name, bc.icon
    ORDER BY bc.name
  ) LOOP
    RAISE NOTICE '   % % - % modules', rec.icon, rec.name, rec.nb_modules;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '✅ CORRECTION TERMINÉE!';
  
END $$;

-- =====================================================
-- 5. VÉRIFICATION FINALE
-- =====================================================
SELECT 
  '📊 VÉRIFICATION FINALE' as titre,
  sp.name as plan_name,
  COUNT(DISTINCT pc.category_id) as nb_categories,
  COUNT(DISTINCT pm.module_id) as nb_modules,
  STRING_AGG(DISTINCT bc.name, ', ' ORDER BY bc.name) as categories
FROM subscription_plans sp
LEFT JOIN plan_categories pc ON pc.plan_id = sp.id
LEFT JOIN plan_modules pm ON pm.plan_id = sp.id
LEFT JOIN business_categories bc ON bc.id = pc.category_id
WHERE sp.slug = 'pro'
GROUP BY sp.id, sp.name;

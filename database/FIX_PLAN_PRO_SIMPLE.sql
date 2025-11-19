-- =====================================================
-- CORRECTION SIMPLE - PLAN PRO (Sans créer les catégories)
-- =====================================================
-- Les catégories existent déjà, on assigne juste au plan

BEGIN;

-- =====================================================
-- 1. ASSIGNER LES 9 CATÉGORIES AU PLAN PRO
-- =====================================================

DO $$
DECLARE
  v_plan_id UUID;
  v_nb_avant INT;
  v_nb_apres INT;
  v_plan_name VARCHAR;
BEGIN
  -- Récupérer le plan Pro
  SELECT id, name INTO v_plan_id, v_plan_name 
  FROM subscription_plans 
  WHERE slug = 'pro' 
  LIMIT 1;
  
  IF v_plan_id IS NULL THEN
    RAISE EXCEPTION '❌ Plan Pro non trouvé!';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '📋 Plan: % (ID: %)', v_plan_name, v_plan_id;
  
  -- Compter catégories avant
  SELECT COUNT(*) INTO v_nb_avant 
  FROM plan_categories 
  WHERE plan_id = v_plan_id;
  
  RAISE NOTICE '📊 Catégories assignées AVANT: %', v_nb_avant;
  
  -- Supprimer anciennes assignations
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
  SELECT COUNT(*) INTO v_nb_apres 
  FROM plan_categories 
  WHERE plan_id = v_plan_id;
  
  RAISE NOTICE '✅ Catégories assignées APRÈS: %', v_nb_apres;
  RAISE NOTICE '📈 Différence: +%', (v_nb_apres - v_nb_avant);
  
  -- Vérifier cohérence
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
    RAISE NOTICE '   - Catégories assignées au plan: %', v_nb_apres;
    
    IF v_nb_categories_modules > v_nb_apres THEN
      RAISE WARNING '⚠️ INCOHÉRENCE: % catégories de modules mais seulement % catégories assignées!', 
        v_nb_categories_modules, v_nb_apres;
    ELSE
      RAISE NOTICE '✅ COHÉRENCE OK';
    END IF;
  END;
  
  -- Afficher les catégories
  RAISE NOTICE '';
  RAISE NOTICE '📋 CATÉGORIES ASSIGNÉES:';
  
  FOR rec IN (
    SELECT 
      bc.name,
      bc.icon,
      COUNT(m.id) as nb_modules
    FROM plan_categories pc
    JOIN business_categories bc ON bc.id = pc.category_id
    LEFT JOIN modules m ON m.category_id = bc.id AND m.status = 'active'
    WHERE pc.plan_id = v_plan_id
    GROUP BY bc.id, bc.name, bc.icon, bc.order_index
    ORDER BY bc.order_index
  ) LOOP
    RAISE NOTICE '   % % - % modules', rec.icon, rec.name, rec.nb_modules;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ CORRECTION TERMINÉE!';
  
END $$;

-- =====================================================
-- 2. CRÉER TRIGGER DE VALIDATION (si n'existe pas)
-- =====================================================

CREATE OR REPLACE FUNCTION auto_assign_category_to_plan()
RETURNS TRIGGER AS $$
DECLARE
  v_category_id UUID;
  v_category_assigned BOOLEAN;
BEGIN
  SELECT category_id INTO v_category_id FROM modules WHERE id = NEW.module_id;
  
  IF v_category_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  SELECT EXISTS(
    SELECT 1 FROM plan_categories
    WHERE plan_id = NEW.plan_id AND category_id = v_category_id
  ) INTO v_category_assigned;
  
  IF NOT v_category_assigned THEN
    INSERT INTO plan_categories (plan_id, category_id)
    VALUES (NEW.plan_id, v_category_id)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_category_assigned ON plan_modules;

CREATE TRIGGER ensure_category_assigned
BEFORE INSERT ON plan_modules
FOR EACH ROW
EXECUTE FUNCTION auto_assign_category_to_plan();

-- =====================================================
-- 3. CRÉER INDEXES (si n'existent pas)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_plan_modules_plan_id ON plan_modules(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_modules_module_id ON plan_modules(module_id);
CREATE INDEX IF NOT EXISTS idx_plan_categories_plan_id ON plan_categories(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_categories_category_id ON plan_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_modules_category_id ON modules(category_id);
CREATE INDEX IF NOT EXISTS idx_modules_status ON modules(status);

COMMIT;

-- =====================================================
-- 4. VÉRIFICATION FINALE
-- =====================================================

SELECT 
  '✅ VÉRIFICATION FINALE' as titre,
  sp.name as plan_name,
  sp.slug as plan_slug,
  COUNT(DISTINCT pc.category_id) as nb_categories,
  COUNT(DISTINCT pm.module_id) as nb_modules
FROM subscription_plans sp
LEFT JOIN plan_categories pc ON pc.plan_id = sp.id
LEFT JOIN plan_modules pm ON pm.plan_id = sp.id
WHERE sp.slug = 'pro'
GROUP BY sp.id, sp.name, sp.slug;

-- Afficher les catégories
SELECT 
  '📋 DÉTAIL CATÉGORIES' as titre,
  bc.order_index,
  bc.icon,
  bc.name,
  bc.slug,
  COUNT(m.id) as nb_modules
FROM plan_categories pc
JOIN subscription_plans sp ON sp.id = pc.plan_id
JOIN business_categories bc ON bc.id = pc.category_id
LEFT JOIN modules m ON m.category_id = bc.id AND m.status = 'active'
WHERE sp.slug = 'pro'
GROUP BY bc.id, bc.order_index, bc.icon, bc.name, bc.slug
ORDER BY bc.order_index;

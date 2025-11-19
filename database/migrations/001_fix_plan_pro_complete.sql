-- =====================================================
-- MIGRATION COMPLÈTE - Correction Plan Pro + Validation
-- =====================================================
-- Date: 17 novembre 2025
-- Version: 1.0
-- Description: Correction complète du plan Pro avec 9 catégories + triggers de validation

-- =====================================================
-- 1. ASSURER QUE LES 9 CATÉGORIES EXISTENT
-- =====================================================

-- Catégorie 1: Scolarité & Admissions
INSERT INTO business_categories (name, slug, description, icon, color, order_index, is_core, required_plan, status)
VALUES (
  'Scolarité & Admissions',
  'scolarite-admissions',
  'Gestion complète des inscriptions, dossiers élèves, admissions et réinscriptions',
  'GraduationCap',
  '#2A9D8F',
  1,
  true,
  'gratuit',
  'active'
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  order_index = EXCLUDED.order_index,
  is_core = EXCLUDED.is_core,
  required_plan = EXCLUDED.required_plan,
  status = EXCLUDED.status,
  updated_at = NOW();

-- Catégorie 2: Pédagogie & Évaluations
INSERT INTO business_categories (name, slug, description, icon, color, order_index, is_core, required_plan, status)
VALUES (
  'Pédagogie & Évaluations',
  'pedagogie-evaluations',
  'Saisie des notes, bulletins, emplois du temps, cahier de texte et ressources pédagogiques',
  'BookOpen',
  '#8B5CF6',
  2,
  true,
  'gratuit',
  'active'
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  order_index = EXCLUDED.order_index,
  updated_at = NOW();

-- Catégorie 3: Finances & Comptabilité
INSERT INTO business_categories (name, slug, description, icon, color, order_index, is_core, required_plan, status)
VALUES (
  'Finances & Comptabilité',
  'finances-comptabilite',
  'Gestion des frais scolaires, paiements, factures, comptabilité générale et analytique',
  'DollarSign',
  '#10B981',
  3,
  false,
  'premium',
  'active'
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Catégorie 4: Ressources Humaines
INSERT INTO business_categories (name, slug, description, icon, color, order_index, is_core, required_plan, status)
VALUES (
  'Ressources Humaines',
  'ressources-humaines',
  'Gestion du personnel enseignant et administratif, paie, congés, absences',
  'Users',
  '#F59E0B',
  4,
  false,
  'pro',
  'active'
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Catégorie 5: Vie Scolaire & Discipline
INSERT INTO business_categories (name, slug, description, icon, color, order_index, is_core, required_plan, status)
VALUES (
  'Vie Scolaire & Discipline',
  'vie-scolaire-discipline',
  'Suivi des absences, retards, sanctions, comportement et vie scolaire',
  'ClipboardCheck',
  '#EF4444',
  5,
  true,
  'gratuit',
  'active'
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Catégorie 6: Services & Infrastructures
INSERT INTO business_categories (name, slug, description, icon, color, order_index, is_core, required_plan, status)
VALUES (
  'Services & Infrastructures',
  'services-infrastructures',
  'Gestion de la cantine, transport scolaire, bibliothèque, salles de classe',
  'Building2',
  '#3B82F6',
  6,
  false,
  'premium',
  'active'
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Catégorie 7: Sécurité & Accès
INSERT INTO business_categories (name, slug, description, icon, color, order_index, is_core, required_plan, status)
VALUES (
  'Sécurité & Accès',
  'securite-acces',
  'Contrôle d''accès, badges, vidéosurveillance, gestion des entrées/sorties',
  'Shield',
  '#6366F1',
  7,
  true,
  'gratuit',
  'active'
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Catégorie 8: Documents & Rapports
INSERT INTO business_categories (name, slug, description, icon, color, order_index, is_core, required_plan, status)
VALUES (
  'Documents & Rapports',
  'documents-rapports',
  'Génération automatique de feuilles de rapport, listes d''admission et rapports personnalisés',
  'FileText',
  '#06A77D',
  8,
  false,
  'premium',
  'active'
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Catégorie 9: Communication
INSERT INTO business_categories (name, slug, description, icon, color, order_index, is_core, required_plan, status)
VALUES (
  'Communication',
  'communication',
  'Messagerie interne, notifications push, SMS aux parents, emails automatiques',
  'MessageSquare',
  '#EC4899',
  9,
  false,
  'premium',
  'active'
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- =====================================================
-- 2. ASSIGNER LES 9 CATÉGORIES AU PLAN PRO
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

  RAISE NOTICE '';
  RAISE NOTICE '📋 Plan: % (ID: %)', v_plan_name, v_plan_id;
  RAISE NOTICE '📊 Catégories assignées AVANT: %', v_nb_categories_avant;

  -- Supprimer les anciennes assignations
  DELETE FROM plan_categories WHERE plan_id = v_plan_id;
  RAISE NOTICE '🗑️ Anciennes assignations supprimées';

  -- Assigner TOUTES les 9 catégories actives
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

  -- Vérifier la cohérence
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

  -- Afficher le résumé
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
    GROUP BY bc.id, bc.name, bc.icon, bc.order_index
    ORDER BY bc.order_index
  ) LOOP
    RAISE NOTICE '   % % - % modules', rec.icon, rec.name, rec.nb_modules;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '✅ CORRECTION TERMINÉE!';
  
END $$;

-- =====================================================
-- 3. CRÉER TRIGGER DE VALIDATION AUTOMATIQUE
-- =====================================================

-- Fonction pour auto-assigner les catégories
CREATE OR REPLACE FUNCTION auto_assign_category_to_plan()
RETURNS TRIGGER AS $$
DECLARE
  v_category_id UUID;
  v_category_name VARCHAR;
  v_category_assigned BOOLEAN;
BEGIN
  -- Récupérer la catégorie du module
  SELECT category_id INTO v_category_id
  FROM modules
  WHERE id = NEW.module_id;

  IF v_category_id IS NULL THEN
    RAISE WARNING 'Module % n''a pas de catégorie!', NEW.module_id;
    RETURN NEW;
  END IF;

  -- Vérifier si la catégorie est déjà assignée au plan
  SELECT EXISTS(
    SELECT 1 FROM plan_categories
    WHERE plan_id = NEW.plan_id
    AND category_id = v_category_id
  ) INTO v_category_assigned;

  -- Si la catégorie n'est pas assignée, la créer automatiquement
  IF NOT v_category_assigned THEN
    -- Récupérer le nom de la catégorie pour le log
    SELECT name INTO v_category_name
    FROM business_categories
    WHERE id = v_category_id;

    INSERT INTO plan_categories (plan_id, category_id)
    VALUES (NEW.plan_id, v_category_id)
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE '✅ Catégorie "%" auto-assignée au plan', v_category_name;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe
DROP TRIGGER IF EXISTS ensure_category_assigned ON plan_modules;

-- Créer le trigger
CREATE TRIGGER ensure_category_assigned
BEFORE INSERT ON plan_modules
FOR EACH ROW
EXECUTE FUNCTION auto_assign_category_to_plan();

-- =====================================================
-- 4. CRÉER INDEX POUR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_plan_modules_plan_id ON plan_modules(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_modules_module_id ON plan_modules(module_id);
CREATE INDEX IF NOT EXISTS idx_plan_categories_plan_id ON plan_categories(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_categories_category_id ON plan_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_modules_category_id ON modules(category_id);
CREATE INDEX IF NOT EXISTS idx_modules_status ON modules(status);

-- =====================================================
-- 5. VÉRIFICATION FINALE
-- =====================================================

SELECT 
  '📊 VÉRIFICATION FINALE' as titre,
  sp.name as plan_name,
  sp.slug as plan_slug,
  COUNT(DISTINCT pc.category_id) as nb_categories,
  COUNT(DISTINCT pm.module_id) as nb_modules,
  STRING_AGG(DISTINCT bc.name, ', ' ORDER BY bc.name) as categories
FROM subscription_plans sp
LEFT JOIN plan_categories pc ON pc.plan_id = sp.id
LEFT JOIN plan_modules pm ON pm.plan_id = sp.id
LEFT JOIN business_categories bc ON bc.id = pc.category_id
WHERE sp.slug = 'pro'
GROUP BY sp.id, sp.name, sp.slug;

-- =====================================================
-- 6. COMMENTAIRES
-- =====================================================

COMMENT ON TRIGGER ensure_category_assigned ON plan_modules IS 
'Auto-assigne la catégorie d''un module au plan lors de l''ajout du module';

COMMENT ON FUNCTION auto_assign_category_to_plan() IS 
'Fonction trigger pour garantir la cohérence catégories/modules dans les plans';

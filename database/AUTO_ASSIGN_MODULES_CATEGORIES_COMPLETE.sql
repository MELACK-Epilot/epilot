/**
 * =====================================================
 * AUTO-ASSIGNATION COMPLÈTE - MODULES & CATÉGORIES
 * =====================================================
 * 
 * Objectif : Quand un groupe scolaire souscrit à un plan :
 * 1. Assigner automatiquement les MODULES du plan
 * 2. Assigner automatiquement les CATÉGORIES du plan
 * 3. Gérer les changements de plan (upgrade/downgrade)
 * 4. Désactiver les modules/catégories à la fin de l'abonnement
 * 
 * Tables concernées :
 * - subscriptions (ou school_group_subscriptions)
 * - plan_modules (modules inclus dans un plan)
 * - plan_categories (catégories incluses dans un plan)
 * - group_module_configs (modules assignés au groupe)
 * - group_business_categories (catégories assignées au groupe)
 * 
 * Date : 7 novembre 2025, 22:15 PM
 * =====================================================
 */

BEGIN;

-- =====================================================
-- PARTIE 1 : TABLE POUR CATÉGORIES DU GROUPE
-- =====================================================

-- Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS group_business_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_group_id UUID NOT NULL REFERENCES school_groups(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES business_categories(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  enabled_at TIMESTAMPTZ,
  disabled_at TIMESTAMPTZ,
  enabled_by UUID REFERENCES users(id),
  disabled_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Contraintes
  UNIQUE(school_group_id, category_id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_group_categories_group ON group_business_categories(school_group_id);
CREATE INDEX IF NOT EXISTS idx_group_categories_category ON group_business_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_group_categories_enabled ON group_business_categories(is_enabled) WHERE is_enabled = true;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_group_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_group_categories_updated_at ON group_business_categories;
CREATE TRIGGER trigger_group_categories_updated_at
  BEFORE UPDATE ON group_business_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_group_categories_updated_at();

-- RLS
ALTER TABLE group_business_categories ENABLE ROW LEVEL SECURITY;

-- Supprimer les policies si elles existent déjà
DROP POLICY IF EXISTS "Super Admin can manage group categories" ON group_business_categories;
DROP POLICY IF EXISTS "Admin Groupe can view own categories" ON group_business_categories;

-- Policy : Super Admin peut tout voir
CREATE POLICY "Super Admin can manage group categories"
  ON group_business_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Policy : Admin Groupe peut voir ses catégories
CREATE POLICY "Admin Groupe can view own categories"
  ON group_business_categories
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin_groupe'
      AND users.school_group_id = group_business_categories.school_group_id
    )
  );

COMMENT ON TABLE group_business_categories IS 'Catégories métiers assignées aux groupes scolaires';

-- =====================================================
-- PARTIE 2 : FONCTION AUTO-ASSIGNATION (INSERT)
-- =====================================================

CREATE OR REPLACE FUNCTION auto_assign_plan_content_to_group()
RETURNS TRIGGER AS $$
DECLARE
  v_module_count INTEGER := 0;
  v_category_count INTEGER := 0;
  v_table_name TEXT;
BEGIN
  -- Déterminer le nom de la table (subscriptions ou school_group_subscriptions)
  v_table_name := TG_TABLE_NAME;
  
  RAISE NOTICE '🔄 Auto-assignation déclenchée pour le groupe % (plan %)', 
    NEW.school_group_id, NEW.plan_id;
  
  -- =====================================================
  -- 1️⃣ ASSIGNER LES MODULES DU PLAN
  -- =====================================================
  INSERT INTO group_module_configs (
    school_group_id, 
    module_id, 
    is_enabled, 
    enabled_at, 
    enabled_by
  )
  SELECT 
    NEW.school_group_id,
    pm.module_id,
    true,  -- Activé par défaut
    NOW(),
    NULL   -- Assigné automatiquement par le système
  FROM plan_modules pm
  WHERE pm.plan_id = NEW.plan_id
  ON CONFLICT (school_group_id, module_id) 
  DO UPDATE SET 
    is_enabled = true,
    enabled_at = NOW(),
    disabled_at = NULL,
    disabled_by = NULL;
  
  GET DIAGNOSTICS v_module_count = ROW_COUNT;
  
  -- =====================================================
  -- 2️⃣ ASSIGNER LES CATÉGORIES DU PLAN
  -- =====================================================
  INSERT INTO group_business_categories (
    school_group_id, 
    category_id, 
    is_enabled, 
    enabled_at, 
    enabled_by
  )
  SELECT 
    NEW.school_group_id,
    pc.category_id,
    true,  -- Activé par défaut
    NOW(),
    NULL   -- Assigné automatiquement par le système
  FROM plan_categories pc
  WHERE pc.plan_id = NEW.plan_id
  ON CONFLICT (school_group_id, category_id) 
  DO UPDATE SET 
    is_enabled = true,
    enabled_at = NOW(),
    disabled_at = NULL,
    disabled_by = NULL;
  
  GET DIAGNOSTICS v_category_count = ROW_COUNT;
  
  -- =====================================================
  -- 3️⃣ LOG DE CONFIRMATION
  -- =====================================================
  RAISE NOTICE '✅ Auto-assignation terminée : % modules + % catégories assignés au groupe %', 
    v_module_count, v_category_count, NEW.school_group_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_assign_plan_content_to_group() IS 
  'Assigne automatiquement les modules ET catégories d''un plan au groupe lors de la souscription';

-- =====================================================
-- PARTIE 3 : FONCTION CHANGEMENT DE PLAN (UPDATE)
-- =====================================================

CREATE OR REPLACE FUNCTION update_plan_content_on_change()
RETURNS TRIGGER AS $$
DECLARE
  v_old_plan_id UUID;
  v_new_plan_id UUID;
  v_modules_disabled INTEGER := 0;
  v_modules_enabled INTEGER := 0;
  v_categories_disabled INTEGER := 0;
  v_categories_enabled INTEGER := 0;
BEGIN
  -- Vérifier si le plan a changé
  IF OLD.plan_id IS DISTINCT FROM NEW.plan_id THEN
    v_old_plan_id := OLD.plan_id;
    v_new_plan_id := NEW.plan_id;
    
    RAISE NOTICE '🔄 Changement de plan détecté : % → % pour le groupe %', 
      v_old_plan_id, v_new_plan_id, NEW.school_group_id;
    
    -- =====================================================
    -- 1️⃣ GÉRER LES MODULES
    -- =====================================================
    
    -- Désactiver les modules de l'ancien plan qui ne sont PAS dans le nouveau
    UPDATE group_module_configs
    SET 
      is_enabled = false, 
      disabled_at = NOW(),
      disabled_by = NULL  -- Désactivé automatiquement
    WHERE school_group_id = NEW.school_group_id
      AND module_id IN (
        SELECT module_id FROM plan_modules WHERE plan_id = v_old_plan_id
        EXCEPT
        SELECT module_id FROM plan_modules WHERE plan_id = v_new_plan_id
      );
    
    GET DIAGNOSTICS v_modules_disabled = ROW_COUNT;
    
    -- Activer les nouveaux modules du nouveau plan
    INSERT INTO group_module_configs (
      school_group_id, 
      module_id, 
      is_enabled, 
      enabled_at
    )
    SELECT 
      NEW.school_group_id,
      pm.module_id,
      true,
      NOW()
    FROM plan_modules pm
    WHERE pm.plan_id = v_new_plan_id
    ON CONFLICT (school_group_id, module_id) 
    DO UPDATE SET 
      is_enabled = true,
      enabled_at = NOW(),
      disabled_at = NULL,
      disabled_by = NULL;
    
    GET DIAGNOSTICS v_modules_enabled = ROW_COUNT;
    
    -- =====================================================
    -- 2️⃣ GÉRER LES CATÉGORIES
    -- =====================================================
    
    -- Désactiver les catégories de l'ancien plan qui ne sont PAS dans le nouveau
    UPDATE group_business_categories
    SET 
      is_enabled = false, 
      disabled_at = NOW(),
      disabled_by = NULL  -- Désactivé automatiquement
    WHERE school_group_id = NEW.school_group_id
      AND category_id IN (
        SELECT category_id FROM plan_categories WHERE plan_id = v_old_plan_id
        EXCEPT
        SELECT category_id FROM plan_categories WHERE plan_id = v_new_plan_id
      );
    
    GET DIAGNOSTICS v_categories_disabled = ROW_COUNT;
    
    -- Activer les nouvelles catégories du nouveau plan
    INSERT INTO group_business_categories (
      school_group_id, 
      category_id, 
      is_enabled, 
      enabled_at
    )
    SELECT 
      NEW.school_group_id,
      pc.category_id,
      true,
      NOW()
    FROM plan_categories pc
    WHERE pc.plan_id = v_new_plan_id
    ON CONFLICT (school_group_id, category_id) 
    DO UPDATE SET 
      is_enabled = true,
      enabled_at = NOW(),
      disabled_at = NULL,
      disabled_by = NULL;
    
    GET DIAGNOSTICS v_categories_enabled = ROW_COUNT;
    
    -- =====================================================
    -- 3️⃣ LOG DE CONFIRMATION
    -- =====================================================
    RAISE NOTICE '✅ Changement de plan terminé pour le groupe % :', NEW.school_group_id;
    RAISE NOTICE '   📦 Modules : % désactivés, % activés', v_modules_disabled, v_modules_enabled;
    RAISE NOTICE '   📂 Catégories : % désactivées, % activées', v_categories_disabled, v_categories_enabled;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_plan_content_on_change() IS 
  'Met à jour les modules ET catégories lors d''un changement de plan (upgrade/downgrade)';

-- =====================================================
-- PARTIE 4 : FONCTION FIN D'ABONNEMENT
-- =====================================================

CREATE OR REPLACE FUNCTION disable_content_on_subscription_end()
RETURNS TRIGGER AS $$
DECLARE
  v_modules_disabled INTEGER := 0;
  v_categories_disabled INTEGER := 0;
BEGIN
  -- Si l'abonnement passe à expired ou cancelled
  IF (OLD.status IN ('active', 'pending') AND NEW.status IN ('expired', 'cancelled')) THEN
    
    RAISE NOTICE '⚠️ Abonnement terminé (statut : %) pour le groupe %', 
      NEW.status, NEW.school_group_id;
    
    -- =====================================================
    -- 1️⃣ DÉSACTIVER LES MODULES
    -- =====================================================
    UPDATE group_module_configs
    SET 
      is_enabled = false, 
      disabled_at = NOW(),
      disabled_by = NULL  -- Désactivé automatiquement
    WHERE school_group_id = NEW.school_group_id
      AND is_enabled = true;
    
    GET DIAGNOSTICS v_modules_disabled = ROW_COUNT;
    
    -- =====================================================
    -- 2️⃣ DÉSACTIVER LES CATÉGORIES
    -- =====================================================
    UPDATE group_business_categories
    SET 
      is_enabled = false, 
      disabled_at = NOW(),
      disabled_by = NULL  -- Désactivé automatiquement
    WHERE school_group_id = NEW.school_group_id
      AND is_enabled = true;
    
    GET DIAGNOSTICS v_categories_disabled = ROW_COUNT;
    
    -- =====================================================
    -- 3️⃣ LOG DE CONFIRMATION
    -- =====================================================
    RAISE NOTICE '✅ Contenu désactivé pour le groupe % : % modules + % catégories', 
      NEW.school_group_id, v_modules_disabled, v_categories_disabled;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION disable_content_on_subscription_end() IS 
  'Désactive les modules ET catégories quand l''abonnement expire ou est annulé';

-- =====================================================
-- PARTIE 5 : TRIGGERS SUR SUBSCRIPTIONS
-- =====================================================

-- Déterminer le nom de la table (subscriptions ou school_group_subscriptions)
DO $$
DECLARE
  v_table_exists BOOLEAN;
  v_table_name TEXT;
BEGIN
  -- Vérifier quelle table existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'school_group_subscriptions'
  ) INTO v_table_exists;
  
  IF v_table_exists THEN
    v_table_name := 'school_group_subscriptions';
  ELSE
    v_table_name := 'subscriptions';
  END IF;
  
  RAISE NOTICE '📋 Création des triggers sur la table : %', v_table_name;
  
  -- Trigger 1 : Auto-assignation à la création
  EXECUTE format('
    DROP TRIGGER IF EXISTS trigger_auto_assign_content ON %I;
    CREATE TRIGGER trigger_auto_assign_content
      AFTER INSERT ON %I
      FOR EACH ROW
      WHEN (NEW.status IN (''active'', ''pending''))
      EXECUTE FUNCTION auto_assign_plan_content_to_group();
  ', v_table_name, v_table_name);
  
  -- Trigger 2 : Mise à jour lors du changement de plan
  EXECUTE format('
    DROP TRIGGER IF EXISTS trigger_update_content_on_change ON %I;
    CREATE TRIGGER trigger_update_content_on_change
      AFTER UPDATE OF plan_id ON %I
      FOR EACH ROW
      WHEN (NEW.status = ''active'')
      EXECUTE FUNCTION update_plan_content_on_change();
  ', v_table_name, v_table_name);
  
  -- Trigger 3 : Désactivation à la fin de l'abonnement
  EXECUTE format('
    DROP TRIGGER IF EXISTS trigger_disable_content_on_end ON %I;
    CREATE TRIGGER trigger_disable_content_on_end
      AFTER UPDATE OF status ON %I
      FOR EACH ROW
      EXECUTE FUNCTION disable_content_on_subscription_end();
  ', v_table_name, v_table_name);
  
  RAISE NOTICE '✅ Triggers créés avec succès sur %', v_table_name;
END $$;

COMMIT;

-- =====================================================
-- PARTIE 6 : VÉRIFICATION FINALE
-- =====================================================

DO $$
DECLARE
  v_table_name TEXT;
  v_trigger_count INTEGER;
BEGIN
  -- Déterminer la table
  SELECT CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'school_group_subscriptions')
    THEN 'school_group_subscriptions'
    ELSE 'subscriptions'
  END INTO v_table_name;
  
  -- Compter les triggers
  SELECT COUNT(*) INTO v_trigger_count
  FROM information_schema.triggers
  WHERE event_object_table = v_table_name
    AND trigger_name LIKE 'trigger_%content%';
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'INSTALLATION TERMINÉE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Table surveillée : %', v_table_name;
  RAISE NOTICE 'Triggers actifs : %', v_trigger_count;
  RAISE NOTICE 'Table group_business_categories : ✅ Créée';
  RAISE NOTICE 'Fonctions créées : 3';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 FONCTIONNEMENT :';
  RAISE NOTICE '1. Groupe souscrit à un plan → Modules + Catégories assignés automatiquement';
  RAISE NOTICE '2. Groupe change de plan → Contenu mis à jour automatiquement';
  RAISE NOTICE '3. Abonnement expire → Contenu désactivé automatiquement';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- PARTIE 7 : TESTS (À DÉCOMMENTER POUR TESTER)
-- =====================================================

/*
-- Test 1 : Créer un abonnement
INSERT INTO school_group_subscriptions (
  school_group_id, 
  plan_id, 
  status, 
  start_date, 
  end_date,
  billing_cycle
)
VALUES (
  (SELECT id FROM school_groups LIMIT 1),
  (SELECT id FROM subscription_plans WHERE slug = 'premium' LIMIT 1),
  'active',
  NOW(),
  NOW() + INTERVAL '1 year',
  'monthly'
);

-- Vérifier les modules assignés
SELECT 
  sg.name as groupe,
  m.name as module,
  gmc.is_enabled
FROM group_module_configs gmc
JOIN school_groups sg ON sg.id = gmc.school_group_id
JOIN modules m ON m.id = gmc.module_id
WHERE gmc.school_group_id = (SELECT id FROM school_groups LIMIT 1);

-- Vérifier les catégories assignées
SELECT 
  sg.name as groupe,
  bc.name as categorie,
  gbc.is_enabled
FROM group_business_categories gbc
JOIN school_groups sg ON sg.id = gbc.school_group_id
JOIN business_categories bc ON bc.id = gbc.category_id
WHERE gbc.school_group_id = (SELECT id FROM school_groups LIMIT 1);

-- Test 2 : Changer de plan
UPDATE school_group_subscriptions
SET plan_id = (SELECT id FROM subscription_plans WHERE slug = 'pro' LIMIT 1)
WHERE school_group_id = (SELECT id FROM school_groups LIMIT 1);

-- Test 3 : Expirer l'abonnement
UPDATE school_group_subscriptions
SET status = 'expired'
WHERE school_group_id = (SELECT id FROM school_groups LIMIT 1);
*/

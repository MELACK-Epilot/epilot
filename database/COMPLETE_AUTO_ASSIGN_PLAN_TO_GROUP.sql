-- =====================================================
-- SYSTÈME COMPLET : AUTO-ASSIGNATION PLAN → GROUPE
-- =====================================================
-- Date: 9 Novembre 2025, 23:40
-- Objectif: Assigner automatiquement modules ET catégories d'un plan au groupe
-- Temps réel: OUI (via triggers PostgreSQL)
-- =====================================================

BEGIN;

-- =====================================================
-- 📋 TABLE : group_category_configs (SI N'EXISTE PAS)
-- =====================================================
-- Stocker les catégories activées par groupe
CREATE TABLE IF NOT EXISTS group_category_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_group_id UUID NOT NULL REFERENCES school_groups(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES business_categories(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT true,
  enabled_at TIMESTAMPTZ DEFAULT NOW(),
  disabled_at TIMESTAMPTZ,
  enabled_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contrainte unique
  CONSTRAINT unique_group_category UNIQUE (school_group_id, category_id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_group_category_configs_school_group 
  ON group_category_configs(school_group_id);
  
CREATE INDEX IF NOT EXISTS idx_group_category_configs_category 
  ON group_category_configs(category_id);
  
CREATE INDEX IF NOT EXISTS idx_group_category_configs_enabled 
  ON group_category_configs(is_enabled);

-- Trigger updated_at
CREATE TRIGGER update_group_category_configs_updated_at 
  BEFORE UPDATE ON group_category_configs
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE group_category_configs ENABLE ROW LEVEL SECURITY;

-- Policy: Super Admin full access
CREATE POLICY "Super Admin full access on group_category_configs" 
  ON group_category_configs
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Policy: Admin Groupe peut voir ses catégories
CREATE POLICY "Admin Groupe can view own group categories" 
  ON group_category_configs
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.school_group_id = group_category_configs.school_group_id
      AND users.role = 'admin_groupe'
    )
  );

-- Commentaire
COMMENT ON TABLE group_category_configs IS 
  'Configuration des catégories métiers activées par groupe scolaire';

-- =====================================================
-- 🎯 FONCTION PRINCIPALE : auto_assign_plan_to_group
-- =====================================================
-- Assigne MODULES + CATÉGORIES automatiquement
CREATE OR REPLACE FUNCTION auto_assign_plan_to_group()
RETURNS TRIGGER AS $$
DECLARE
  v_module_count INTEGER := 0;
  v_category_count INTEGER := 0;
BEGIN
  -- ✅ 1. ASSIGNER LES MODULES DU PLAN
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
    disabled_at = NULL;
  
  GET DIAGNOSTICS v_module_count = ROW_COUNT;
  
  -- ✅ 2. ASSIGNER LES CATÉGORIES DU PLAN
  INSERT INTO group_category_configs (
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
    disabled_at = NULL;
  
  GET DIAGNOSTICS v_category_count = ROW_COUNT;
  
  -- ✅ 3. LOG POUR DEBUG
  RAISE NOTICE '✅ Auto-assignation complète pour groupe % (plan %): % modules + % catégories', 
    NEW.school_group_id, NEW.plan_id, v_module_count, v_category_count;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 🔥 TRIGGER : Sur INSERT dans subscriptions
-- =====================================================
DROP TRIGGER IF EXISTS trigger_auto_assign_plan_to_group ON subscriptions;

CREATE TRIGGER trigger_auto_assign_plan_to_group
  AFTER INSERT ON subscriptions
  FOR EACH ROW
  WHEN (NEW.status IN ('active', 'pending'))
  EXECUTE FUNCTION auto_assign_plan_to_group();

-- =====================================================
-- 🔄 FONCTION : update_plan_on_upgrade
-- =====================================================
-- Mettre à jour modules + catégories lors d'un changement de plan
CREATE OR REPLACE FUNCTION update_plan_on_upgrade()
RETURNS TRIGGER AS $$
DECLARE
  v_old_plan_id UUID;
  v_new_plan_id UUID;
  v_modules_added INTEGER := 0;
  v_modules_removed INTEGER := 0;
  v_categories_added INTEGER := 0;
  v_categories_removed INTEGER := 0;
BEGIN
  -- Détecter un changement de plan
  IF OLD.plan_id != NEW.plan_id THEN
    v_old_plan_id := OLD.plan_id;
    v_new_plan_id := NEW.plan_id;
    
    -- ✅ 1. MODULES : Désactiver ceux de l'ancien plan qui ne sont pas dans le nouveau
    UPDATE group_module_configs
    SET is_enabled = false, disabled_at = NOW()
    WHERE school_group_id = NEW.school_group_id
      AND module_id IN (
        SELECT module_id FROM plan_modules WHERE plan_id = v_old_plan_id
        EXCEPT
        SELECT module_id FROM plan_modules WHERE plan_id = v_new_plan_id
      );
    
    GET DIAGNOSTICS v_modules_removed = ROW_COUNT;
    
    -- ✅ 2. MODULES : Activer les nouveaux modules du nouveau plan
    INSERT INTO group_module_configs (school_group_id, module_id, is_enabled, enabled_at)
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
      disabled_at = NULL;
    
    GET DIAGNOSTICS v_modules_added = ROW_COUNT;
    
    -- ✅ 3. CATÉGORIES : Désactiver celles de l'ancien plan qui ne sont pas dans le nouveau
    UPDATE group_category_configs
    SET is_enabled = false, disabled_at = NOW()
    WHERE school_group_id = NEW.school_group_id
      AND category_id IN (
        SELECT category_id FROM plan_categories WHERE plan_id = v_old_plan_id
        EXCEPT
        SELECT category_id FROM plan_categories WHERE plan_id = v_new_plan_id
      );
    
    GET DIAGNOSTICS v_categories_removed = ROW_COUNT;
    
    -- ✅ 4. CATÉGORIES : Activer les nouvelles catégories du nouveau plan
    INSERT INTO group_category_configs (school_group_id, category_id, is_enabled, enabled_at)
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
      disabled_at = NULL;
    
    GET DIAGNOSTICS v_categories_added = ROW_COUNT;
    
    -- ✅ 5. LOG POUR DEBUG
    RAISE NOTICE '🔄 Upgrade plan pour groupe %: Plan % → Plan %. Modules: +% -%  | Catégories: +% -%', 
      NEW.school_group_id, v_old_plan_id, v_new_plan_id, 
      v_modules_added, v_modules_removed, v_categories_added, v_categories_removed;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 🔥 TRIGGER : Sur UPDATE de plan_id dans subscriptions
-- =====================================================
DROP TRIGGER IF EXISTS trigger_update_plan_on_upgrade ON subscriptions;

CREATE TRIGGER trigger_update_plan_on_upgrade
  AFTER UPDATE OF plan_id ON subscriptions
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION update_plan_on_upgrade();

-- =====================================================
-- ❌ FONCTION : disable_on_subscription_end
-- =====================================================
-- Désactiver modules + catégories quand l'abonnement expire
CREATE OR REPLACE FUNCTION disable_on_subscription_end()
RETURNS TRIGGER AS $$
DECLARE
  v_modules_disabled INTEGER := 0;
  v_categories_disabled INTEGER := 0;
BEGIN
  -- Si l'abonnement passe à expired ou cancelled
  IF (OLD.status IN ('active', 'pending') AND NEW.status IN ('expired', 'cancelled')) THEN
    
    -- ✅ 1. Désactiver tous les modules du groupe
    UPDATE group_module_configs
    SET is_enabled = false, disabled_at = NOW()
    WHERE school_group_id = NEW.school_group_id;
    
    GET DIAGNOSTICS v_modules_disabled = ROW_COUNT;
    
    -- ✅ 2. Désactiver toutes les catégories du groupe
    UPDATE group_category_configs
    SET is_enabled = false, disabled_at = NOW()
    WHERE school_group_id = NEW.school_group_id;
    
    GET DIAGNOSTICS v_categories_disabled = ROW_COUNT;
    
    -- ✅ 3. LOG POUR DEBUG
    RAISE NOTICE '❌ Abonnement terminé pour groupe %: % modules + % catégories désactivés', 
      NEW.school_group_id, v_modules_disabled, v_categories_disabled;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 🔥 TRIGGER : Sur UPDATE de status dans subscriptions
-- =====================================================
DROP TRIGGER IF EXISTS trigger_disable_on_subscription_end ON subscriptions;

CREATE TRIGGER trigger_disable_on_subscription_end
  AFTER UPDATE OF status ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION disable_on_subscription_end();

COMMIT;

-- =====================================================
-- ✅ COMMENTAIRES
-- =====================================================
COMMENT ON FUNCTION auto_assign_plan_to_group() IS 
  'Assigne automatiquement les modules ET catégories d''un plan au groupe lors de la souscription';

COMMENT ON FUNCTION update_plan_on_upgrade() IS 
  'Met à jour les modules ET catégories lors d''un changement de plan (upgrade/downgrade)';

COMMENT ON FUNCTION disable_on_subscription_end() IS 
  'Désactive les modules ET catégories quand l''abonnement expire ou est annulé';

-- =====================================================
-- 📝 TESTS MANUELS
-- =====================================================
-- Test 1: Créer un groupe et l'abonner à un plan
-- INSERT INTO subscriptions (school_group_id, plan_id, status, start_date, end_date, amount, currency, billing_period)
-- VALUES ('UUID_GROUPE', 'UUID_PLAN', 'active', NOW(), NOW() + INTERVAL '1 year', 50000, 'FCFA', 'monthly');
-- 
-- Vérifier modules : SELECT * FROM group_module_configs WHERE school_group_id = 'UUID_GROUPE';
-- Vérifier catégories : SELECT * FROM group_category_configs WHERE school_group_id = 'UUID_GROUPE';
-- 
-- Test 2: Changer de plan (upgrade)
-- UPDATE subscriptions SET plan_id = 'UUID_NOUVEAU_PLAN' WHERE school_group_id = 'UUID_GROUPE';
-- 
-- Vérifier modules : SELECT * FROM group_module_configs WHERE school_group_id = 'UUID_GROUPE' AND is_enabled = true;
-- Vérifier catégories : SELECT * FROM group_category_configs WHERE school_group_id = 'UUID_GROUPE' AND is_enabled = true;
-- 
-- Test 3: Annuler l'abonnement
-- UPDATE subscriptions SET status = 'cancelled' WHERE school_group_id = 'UUID_GROUPE';
-- 
-- Vérifier : SELECT * FROM group_module_configs WHERE school_group_id = 'UUID_GROUPE' AND is_enabled = true;
-- (Devrait retourner 0 lignes)
-- =====================================================

-- =====================================================
-- 🔔 TEMPS RÉEL SUPABASE (OPTIONNEL)
-- =====================================================
-- Pour activer le temps réel dans Supabase, exécutez dans le dashboard:
-- 
-- 1. Aller dans Database > Replication
-- 2. Activer la réplication pour ces tables:
--    ✅ subscriptions
--    ✅ group_module_configs
--    ✅ group_category_configs
--    ✅ plan_modules
--    ✅ plan_categories
-- 
-- 3. Dans votre code React, utilisez:
--    supabase
--      .channel('group-modules-changes')
--      .on('postgres_changes', 
--        { event: '*', schema: 'public', table: 'group_module_configs' },
--        (payload) => { /* Rafraîchir les données */ }
--      )
--      .subscribe()
-- =====================================================

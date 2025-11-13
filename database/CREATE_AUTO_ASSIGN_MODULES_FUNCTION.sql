-- =====================================================
-- FONCTION : AUTO-ASSIGNATION MODULES & CATÉGORIES
-- Assigner automatiquement les modules d'un plan au groupe
-- =====================================================
-- Date: 6 Novembre 2025
-- Objectif: Quand un groupe souscrit à un plan, assigner automatiquement ses modules
-- =====================================================

BEGIN;

-- =====================================================
-- 1️⃣ FONCTION : auto_assign_plan_modules_to_group
-- =====================================================
CREATE OR REPLACE FUNCTION auto_assign_plan_modules_to_group()
RETURNS TRIGGER AS $$
DECLARE
  v_module_count INTEGER;
BEGIN
  -- Assigner les modules du plan au groupe scolaire
  INSERT INTO group_module_configs (school_group_id, module_id, is_enabled, enabled_at, enabled_by)
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
    enabled_at = NOW();
  
  -- Compter les modules assignés
  GET DIAGNOSTICS v_module_count = ROW_COUNT;
  
  -- Log pour debug
  RAISE NOTICE 'Auto-assignation: % modules assignés au groupe % pour le plan %', 
    v_module_count, NEW.school_group_id, NEW.plan_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2️⃣ TRIGGER : Déclencher l'assignation sur subscriptions
-- =====================================================
DROP TRIGGER IF EXISTS trigger_auto_assign_modules ON subscriptions;

CREATE TRIGGER trigger_auto_assign_modules
  AFTER INSERT ON subscriptions
  FOR EACH ROW
  WHEN (NEW.status IN ('active', 'pending'))
  EXECUTE FUNCTION auto_assign_plan_modules_to_group();

-- =====================================================
-- 3️⃣ FONCTION : update_plan_modules_on_upgrade
-- Mettre à jour les modules lors d'un changement de plan
-- =====================================================
CREATE OR REPLACE FUNCTION update_plan_modules_on_upgrade()
RETURNS TRIGGER AS $$
DECLARE
  v_old_plan_id UUID;
  v_new_plan_id UUID;
BEGIN
  -- Détecter un changement de plan
  IF OLD.plan_id != NEW.plan_id THEN
    v_old_plan_id := OLD.plan_id;
    v_new_plan_id := NEW.plan_id;
    
    -- Désactiver les modules de l'ancien plan qui ne sont pas dans le nouveau
    UPDATE group_module_configs
    SET is_enabled = false, disabled_at = NOW()
    WHERE school_group_id = NEW.school_group_id
      AND module_id IN (
        SELECT module_id FROM plan_modules WHERE plan_id = v_old_plan_id
        EXCEPT
        SELECT module_id FROM plan_modules WHERE plan_id = v_new_plan_id
      );
    
    -- Activer les nouveaux modules du nouveau plan
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
      enabled_at = NOW();
    
    -- Log pour debug
    RAISE NOTICE 'Upgrade plan: Groupe % passé du plan % au plan %', 
      NEW.school_group_id, v_old_plan_id, v_new_plan_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4️⃣ TRIGGER : Déclencher la mise à jour sur changement de plan
-- =====================================================
DROP TRIGGER IF EXISTS trigger_update_modules_on_upgrade ON subscriptions;

CREATE TRIGGER trigger_update_modules_on_upgrade
  AFTER UPDATE OF plan_id ON subscriptions
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION update_plan_modules_on_upgrade();

-- =====================================================
-- 5️⃣ FONCTION : disable_modules_on_subscription_end
-- Désactiver les modules quand l'abonnement expire
-- =====================================================
CREATE OR REPLACE FUNCTION disable_modules_on_subscription_end()
RETURNS TRIGGER AS $$
BEGIN
  -- Si l'abonnement passe à expired ou cancelled
  IF (OLD.status IN ('active', 'pending') AND NEW.status IN ('expired', 'cancelled')) THEN
    -- Désactiver tous les modules du groupe
    UPDATE group_module_configs
    SET is_enabled = false, disabled_at = NOW()
    WHERE school_group_id = NEW.school_group_id;
    
    -- Log pour debug
    RAISE NOTICE 'Abonnement terminé: Modules désactivés pour le groupe %', NEW.school_group_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6️⃣ TRIGGER : Désactiver modules sur fin d'abonnement
-- =====================================================
DROP TRIGGER IF EXISTS trigger_disable_modules_on_end ON subscriptions;

CREATE TRIGGER trigger_disable_modules_on_end
  AFTER UPDATE OF status ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION disable_modules_on_subscription_end();

COMMIT;

-- =====================================================
-- ✅ COMMENTAIRES
-- =====================================================
COMMENT ON FUNCTION auto_assign_plan_modules_to_group() IS 
  'Assigne automatiquement les modules d''un plan au groupe lors de la souscription';

COMMENT ON FUNCTION update_plan_modules_on_upgrade() IS 
  'Met à jour les modules lors d''un changement de plan (upgrade/downgrade)';

COMMENT ON FUNCTION disable_modules_on_subscription_end() IS 
  'Désactive les modules quand l''abonnement expire ou est annulé';

-- =====================================================
-- 📝 TESTS
-- =====================================================
-- Test 1: Créer un abonnement actif
-- INSERT INTO subscriptions (school_group_id, plan_id, status, start_date, end_date, amount, currency, billing_period)
-- VALUES ('...', '...', 'active', NOW(), NOW() + INTERVAL '1 year', 50000, 'FCFA', 'monthly');
-- 
-- Vérifier : SELECT * FROM group_module_configs WHERE school_group_id = '...';
-- 
-- Test 2: Changer de plan
-- UPDATE subscriptions SET plan_id = '...' WHERE id = '...';
-- 
-- Vérifier : SELECT * FROM group_module_configs WHERE school_group_id = '...';
-- =====================================================

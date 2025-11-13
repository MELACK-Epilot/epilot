/**
 * =====================================================
 * CORRECTION - Trigger Module Limit Intelligent
 * =====================================================
 * 
 * Modifier le trigger pour ignorer les assignations automatiques
 * et bloquer seulement les assignations manuelles
 * 
 * Date : 8 novembre 2025, 00:31 AM
 * =====================================================
 */

-- =====================================================
-- ÉTAPE 1 : SUPPRIMER L'ANCIEN TRIGGER
-- =====================================================

DROP TRIGGER IF EXISTS check_module_limit_trigger ON group_module_configs;

-- =====================================================
-- ÉTAPE 2 : CRÉER LA FONCTION AMÉLIORÉE
-- =====================================================

CREATE OR REPLACE FUNCTION check_module_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_plan_id UUID;
  v_plan_slug TEXT;
  v_max_modules INTEGER;
  v_current_count INTEGER;
BEGIN
  -- ✅ IGNORER les assignations automatiques (enabled_by IS NULL)
  IF NEW.enabled_by IS NULL THEN
    RAISE NOTICE '🔄 Assignation automatique détectée - Pas de vérification de limite';
    RETURN NEW;
  END IF;
  
  -- Pour les assignations manuelles, vérifier la limite
  RAISE NOTICE '👤 Assignation manuelle détectée - Vérification de la limite';
  
  -- Récupérer le plan actif du groupe
  SELECT sgs.plan_id, sp.slug
  INTO v_plan_id, v_plan_slug
  FROM school_group_subscriptions sgs
  JOIN subscription_plans sp ON sp.id = sgs.plan_id
  WHERE sgs.school_group_id = NEW.school_group_id
    AND sgs.status = 'active'
  LIMIT 1;
  
  IF v_plan_id IS NULL THEN
    RAISE EXCEPTION 'Aucun plan actif trouvé pour ce groupe';
  END IF;
  
  -- Définir les limites par plan
  CASE v_plan_slug
    WHEN 'gratuit' THEN v_max_modules := 5;
    WHEN 'plan-rentree-scolaire' THEN v_max_modules := 10;
    WHEN 'premium' THEN v_max_modules := 15;
    WHEN 'pro' THEN v_max_modules := 20;
    WHEN 'institutionnel' THEN v_max_modules := -1; -- Illimité
    ELSE v_max_modules := 5; -- Par défaut
  END CASE;
  
  -- Si illimité, pas de vérification
  IF v_max_modules = -1 THEN
    RETURN NEW;
  END IF;
  
  -- Compter les modules actuellement actifs
  SELECT COUNT(*)
  INTO v_current_count
  FROM group_module_configs
  WHERE school_group_id = NEW.school_group_id
    AND is_enabled = true
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);
  
  -- Vérifier la limite
  IF v_current_count >= v_max_modules THEN
    RAISE EXCEPTION 'Limite de % module(s) atteinte pour le plan %. Veuillez upgrader votre plan.', 
      v_max_modules, v_plan_slug;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ÉTAPE 3 : RECRÉER LE TRIGGER
-- =====================================================

CREATE TRIGGER check_module_limit_trigger
  BEFORE INSERT OR UPDATE ON group_module_configs
  FOR EACH ROW
  WHEN (NEW.is_enabled = true)
  EXECUTE FUNCTION check_module_limit();

-- =====================================================
-- ÉTAPE 4 : VÉRIFICATION
-- =====================================================

SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'check_module_limit_trigger';

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================

/*
trigger_name              | event_object_table    | action_timing | event_manipulation
--------------------------|----------------------|---------------|-------------------
check_module_limit_trigger| group_module_configs | BEFORE        | INSERT

✅ Trigger recréé avec succès

Maintenant :
- ✅ Assignations automatiques (enabled_by = NULL) → Pas de limite
- ✅ Assignations manuelles (enabled_by = user_id) → Limite vérifiée
- ✅ Changements de plan → Automatiques et sans blocage
*/

/**
 * =====================================================
 * SYSTÈME DE SUPPRESSION COMPLET - Plans d'Abonnement
 * =====================================================
 * 
 * Système intelligent de suppression avec :
 * - Vérification des dépendances
 * - Suppression en cascade sécurisée
 * - Archivage automatique si suppression impossible
 * - Logs d'audit
 * 
 * Date : 8 novembre 2025, 00:50 AM
 * =====================================================
 */

-- =====================================================
-- ÉTAPE 1 : TABLE D'AUDIT DES SUPPRESSIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS deletion_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  record_data JSONB NOT NULL,
  deleted_by UUID REFERENCES users(id),
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deletion_type TEXT NOT NULL, -- 'soft' ou 'hard'
  reason TEXT,
  dependencies_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_deletion_logs_table ON deletion_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_deletion_logs_record ON deletion_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_deletion_logs_deleted_at ON deletion_logs(deleted_at);

COMMENT ON TABLE deletion_logs IS 'Logs d''audit pour toutes les suppressions dans le système';

-- =====================================================
-- ÉTAPE 2 : FONCTION DE VÉRIFICATION DES DÉPENDANCES
-- =====================================================

CREATE OR REPLACE FUNCTION check_plan_dependencies(p_plan_id UUID)
RETURNS TABLE (
  dependency_type TEXT,
  count INTEGER,
  can_delete BOOLEAN,
  message TEXT
) AS $$
BEGIN
  -- Vérifier les abonnements actifs
  RETURN QUERY
  SELECT 
    'active_subscriptions'::TEXT,
    COUNT(*)::INTEGER,
    COUNT(*) = 0,
    CASE 
      WHEN COUNT(*) = 0 THEN '✅ Aucun abonnement actif'
      ELSE '❌ ' || COUNT(*) || ' abonnement(s) actif(s) - Suppression impossible'
    END
  FROM school_group_subscriptions
  WHERE plan_id = p_plan_id
    AND status = 'active';

  -- Vérifier les modules assignés
  RETURN QUERY
  SELECT 
    'plan_modules'::TEXT,
    COUNT(*)::INTEGER,
    true, -- Les modules peuvent être supprimés en cascade
    CASE 
      WHEN COUNT(*) = 0 THEN '✅ Aucun module assigné'
      ELSE '⚠️ ' || COUNT(*) || ' module(s) assigné(s) - Seront supprimés'
    END
  FROM plan_modules
  WHERE plan_id = p_plan_id;

  -- Vérifier les catégories assignées
  RETURN QUERY
  SELECT 
    'plan_categories'::TEXT,
    COUNT(*)::INTEGER,
    true, -- Les catégories peuvent être supprimées en cascade
    CASE 
      WHEN COUNT(*) = 0 THEN '✅ Aucune catégorie assignée'
      ELSE '⚠️ ' || COUNT(*) || ' catégorie(s) assignée(s) - Seront supprimées'
    END
  FROM plan_categories
  WHERE plan_id = p_plan_id;

  -- Vérifier les abonnements expirés/annulés (historique)
  RETURN QUERY
  SELECT 
    'inactive_subscriptions'::TEXT,
    COUNT(*)::INTEGER,
    true, -- L'historique peut être conservé
    CASE 
      WHEN COUNT(*) = 0 THEN '✅ Aucun historique'
      ELSE 'ℹ️ ' || COUNT(*) || ' abonnement(s) inactif(s) - Historique conservé'
    END
  FROM school_group_subscriptions
  WHERE plan_id = p_plan_id
    AND status IN ('expired', 'cancelled', 'pending');
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_plan_dependencies IS 'Vérifie toutes les dépendances d''un plan avant suppression';

-- =====================================================
-- ÉTAPE 3 : FONCTION DE SUPPRESSION SÉCURISÉE
-- =====================================================

CREATE OR REPLACE FUNCTION delete_plan_safely(
  p_plan_id UUID,
  p_user_id UUID,
  p_force BOOLEAN DEFAULT false,
  p_reason TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  deletion_type TEXT,
  message TEXT,
  dependencies_removed INTEGER
) AS $$
DECLARE
  v_plan_name TEXT;
  v_plan_data JSONB;
  v_has_active_subscriptions BOOLEAN;
  v_modules_count INTEGER;
  v_categories_count INTEGER;
  v_total_dependencies INTEGER := 0;
BEGIN
  -- Récupérer les infos du plan
  SELECT name, row_to_json(subscription_plans.*)
  INTO v_plan_name, v_plan_data
  FROM subscription_plans
  WHERE id = p_plan_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      false,
      'error'::TEXT,
      '❌ Plan introuvable'::TEXT,
      0;
    RETURN;
  END IF;

  -- Vérifier les abonnements actifs
  SELECT EXISTS (
    SELECT 1 FROM school_group_subscriptions
    WHERE plan_id = p_plan_id AND status = 'active'
  ) INTO v_has_active_subscriptions;

  -- Si des abonnements actifs existent et force = false
  IF v_has_active_subscriptions AND NOT p_force THEN
    RETURN QUERY SELECT 
      false,
      'blocked'::TEXT,
      '❌ Impossible de supprimer : Des abonnements actifs utilisent ce plan. Archivez-le plutôt.'::TEXT,
      0;
    RETURN;
  END IF;

  -- Si force = true, archiver les abonnements actifs d'abord
  IF v_has_active_subscriptions AND p_force THEN
    UPDATE school_group_subscriptions
    SET status = 'cancelled'
    WHERE plan_id = p_plan_id AND status = 'active';
    
    RAISE NOTICE '⚠️ Abonnements actifs annulés automatiquement';
  END IF;

  -- Compter les dépendances à supprimer
  SELECT COUNT(*) INTO v_modules_count
  FROM plan_modules WHERE plan_id = p_plan_id;

  SELECT COUNT(*) INTO v_categories_count
  FROM plan_categories WHERE plan_id = p_plan_id;

  v_total_dependencies := v_modules_count + v_categories_count;

  -- Supprimer les dépendances en cascade
  DELETE FROM plan_modules WHERE plan_id = p_plan_id;
  DELETE FROM plan_categories WHERE plan_id = p_plan_id;

  -- Supprimer le plan
  DELETE FROM subscription_plans WHERE id = p_plan_id;

  -- Logger la suppression
  INSERT INTO deletion_logs (
    table_name,
    record_id,
    record_data,
    deleted_by,
    deletion_type,
    reason,
    dependencies_count
  ) VALUES (
    'subscription_plans',
    p_plan_id,
    v_plan_data,
    p_user_id,
    'hard',
    p_reason,
    v_total_dependencies
  );

  RETURN QUERY SELECT 
    true,
    'hard'::TEXT,
    ('✅ Plan "' || v_plan_name || '" supprimé avec succès (' || v_total_dependencies || ' dépendances supprimées)')::TEXT,
    v_total_dependencies;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION delete_plan_safely IS 'Supprime un plan de manière sécurisée avec gestion des dépendances';

-- =====================================================
-- ÉTAPE 4 : FONCTION D'ARCHIVAGE (SOFT DELETE)
-- =====================================================

CREATE OR REPLACE FUNCTION archive_plan(
  p_plan_id UUID,
  p_user_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_plan_name TEXT;
  v_plan_data JSONB;
BEGIN
  -- Récupérer les infos du plan
  SELECT name, row_to_json(subscription_plans.*)
  INTO v_plan_name, v_plan_data
  FROM subscription_plans
  WHERE id = p_plan_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      false,
      '❌ Plan introuvable'::TEXT;
    RETURN;
  END IF;

  -- Archiver le plan (soft delete)
  UPDATE subscription_plans
  SET is_active = false
  WHERE id = p_plan_id;

  -- Logger l'archivage
  INSERT INTO deletion_logs (
    table_name,
    record_id,
    record_data,
    deleted_by,
    deletion_type,
    reason,
    dependencies_count
  ) VALUES (
    'subscription_plans',
    p_plan_id,
    v_plan_data,
    p_user_id,
    'soft',
    p_reason,
    0
  );

  RETURN QUERY SELECT 
    true,
    ('✅ Plan "' || v_plan_name || '" archivé avec succès')::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION archive_plan IS 'Archive un plan (soft delete) sans le supprimer';

-- =====================================================
-- ÉTAPE 5 : FONCTION DE RESTAURATION
-- =====================================================

CREATE OR REPLACE FUNCTION restore_plan(
  p_plan_id UUID,
  p_user_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_plan_name TEXT;
BEGIN
  -- Récupérer le nom du plan
  SELECT name INTO v_plan_name
  FROM subscription_plans
  WHERE id = p_plan_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      false,
      '❌ Plan introuvable'::TEXT;
    RETURN;
  END IF;

  -- Restaurer le plan
  UPDATE subscription_plans
  SET is_active = true
  WHERE id = p_plan_id;

  RETURN QUERY SELECT 
    true,
    ('✅ Plan "' || v_plan_name || '" restauré avec succès')::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION restore_plan IS 'Restaure un plan archivé';

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================

/*
UTILISATION :

1. VÉRIFIER LES DÉPENDANCES :
   SELECT * FROM check_plan_dependencies('uuid-du-plan');

   Résultat :
   dependency_type        | count | can_delete | message
   -----------------------|-------|------------|---------------------------
   active_subscriptions   | 0     | true       | ✅ Aucun abonnement actif
   plan_modules           | 25    | true       | ⚠️ 25 module(s) assigné(s)
   plan_categories        | 3     | true       | ⚠️ 3 catégorie(s) assignée(s)

2. ARCHIVER UN PLAN (RECOMMANDÉ) :
   SELECT * FROM archive_plan(
     'uuid-du-plan',
     'uuid-user',
     'Plan obsolète'
   );

   Résultat :
   success | message
   --------|----------------------------------
   true    | ✅ Plan "Premium" archivé avec succès

3. SUPPRIMER UN PLAN (SI AUCUN ABONNEMENT ACTIF) :
   SELECT * FROM delete_plan_safely(
     'uuid-du-plan',
     'uuid-user',
     false,  -- force = false
     'Plan non utilisé'
   );

   Résultat :
   success | deletion_type | message                              | dependencies_removed
   --------|---------------|--------------------------------------|---------------------
   true    | hard          | ✅ Plan "Premium" supprimé (28 deps) | 28

4. FORCER LA SUPPRESSION (ANNULE LES ABONNEMENTS ACTIFS) :
   SELECT * FROM delete_plan_safely(
     'uuid-du-plan',
     'uuid-user',
     true,  -- force = true
     'Migration vers nouveau plan'
   );

5. RESTAURER UN PLAN ARCHIVÉ :
   SELECT * FROM restore_plan(
     'uuid-du-plan',
     'uuid-user'
   );

6. VOIR L'HISTORIQUE DES SUPPRESSIONS :
   SELECT 
     table_name,
     record_data->>'name' as plan_name,
     deletion_type,
     reason,
     dependencies_count,
     deleted_at
   FROM deletion_logs
   WHERE table_name = 'subscription_plans'
   ORDER BY deleted_at DESC;
*/

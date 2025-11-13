/**
 * Ajouter la colonne modules_count à school_groups
 * Avec trigger automatique pour mise à jour
 * @module ADD_MODULES_COUNT_TO_SCHOOL_GROUPS
 */

-- =====================================================
-- ÉTAPE 1 : AJOUTER LA COLONNE
-- =====================================================

ALTER TABLE school_groups 
ADD COLUMN IF NOT EXISTS modules_count INTEGER DEFAULT 0;

DO $$
BEGIN
  RAISE NOTICE '✅ Colonne modules_count ajoutée à school_groups';
END $$;

-- =====================================================
-- ÉTAPE 2 : CALCULER LES VALEURS ACTUELLES
-- =====================================================

-- Mettre à jour avec le nombre réel de modules actifs
UPDATE school_groups sg
SET modules_count = (
  SELECT COUNT(*)
  FROM group_module_configs gmc
  WHERE gmc.school_group_id = sg.id
    AND gmc.is_enabled = true
);

DO $$
BEGIN
  RAISE NOTICE '✅ Valeurs modules_count calculées';
END $$;

-- =====================================================
-- ÉTAPE 3 : CRÉER LA FONCTION DE MISE À JOUR
-- =====================================================

CREATE OR REPLACE FUNCTION update_school_group_modules_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour le compteur du groupe
  UPDATE school_groups
  SET 
    modules_count = (
      SELECT COUNT(*)
      FROM group_module_configs
      WHERE school_group_id = COALESCE(NEW.school_group_id, OLD.school_group_id)
        AND is_enabled = true
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.school_group_id, OLD.school_group_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  RAISE NOTICE '✅ Fonction update_school_group_modules_count créée';
END $$;

-- =====================================================
-- ÉTAPE 4 : CRÉER LES TRIGGERS
-- =====================================================

-- Trigger sur INSERT
DROP TRIGGER IF EXISTS trigger_update_modules_count_insert ON group_module_configs;
CREATE TRIGGER trigger_update_modules_count_insert
  AFTER INSERT ON group_module_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_school_group_modules_count();

-- Trigger sur UPDATE
DROP TRIGGER IF EXISTS trigger_update_modules_count_update ON group_module_configs;
CREATE TRIGGER trigger_update_modules_count_update
  AFTER UPDATE ON group_module_configs
  FOR EACH ROW
  WHEN (OLD.is_enabled IS DISTINCT FROM NEW.is_enabled)
  EXECUTE FUNCTION update_school_group_modules_count();

-- Trigger sur DELETE
DROP TRIGGER IF EXISTS trigger_update_modules_count_delete ON group_module_configs;
CREATE TRIGGER trigger_update_modules_count_delete
  AFTER DELETE ON group_module_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_school_group_modules_count();

DO $$
BEGIN
  RAISE NOTICE '✅ Triggers créés sur group_module_configs';
END $$;

-- =====================================================
-- ÉTAPE 5 : CRÉER UN INDEX
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_school_groups_modules_count 
ON school_groups(modules_count);

DO $$
BEGIN
  RAISE NOTICE '✅ Index créé sur modules_count';
END $$;

-- =====================================================
-- ÉTAPE 6 : VÉRIFIER LE RÉSULTAT
-- =====================================================

SELECT 
  sg.name as groupe,
  sg.school_count as ecoles,
  sg.student_count + sg.staff_count as utilisateurs,
  sg.modules_count as modules,
  sg.plan
FROM school_groups sg
ORDER BY sg.name;

-- =====================================================
-- MESSAGES DE CONFIRMATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 MODULES_COUNT AJOUTÉ !';
  RAISE NOTICE '';
  RAISE NOTICE '✅ MODIFICATIONS APPLIQUÉES :';
  RAISE NOTICE '   1. Colonne modules_count ajoutée';
  RAISE NOTICE '   2. Valeurs calculées depuis group_module_configs';
  RAISE NOTICE '   3. Triggers automatiques créés';
  RAISE NOTICE '   4. Index créé pour performance';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 MISE À JOUR AUTOMATIQUE :';
  RAISE NOTICE '   - INSERT module → modules_count++';
  RAISE NOTICE '   - UPDATE is_enabled → modules_count recalculé';
  RAISE NOTICE '   - DELETE module → modules_count--';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 RÉSULTAT :';
  RAISE NOTICE '   - La card "Utilisation du Plan" affichera le vrai nombre de modules';
  RAISE NOTICE '   - Rafraîchir /dashboard/subscriptions';
END $$;

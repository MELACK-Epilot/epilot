/**
 * Triggers SQL pour appliquer les restrictions de plan
 * Vérifie les limites et met à jour les compteurs automatiquement
 * @module CREATE_PLAN_RESTRICTIONS_TRIGGERS
 */

-- =====================================================
-- FONCTION 1 : Vérifier limite écoles avant insertion
-- =====================================================

CREATE OR REPLACE FUNCTION check_school_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_group RECORD;
  v_max_schools INTEGER;
BEGIN
  -- Récupérer le groupe et son plan
  SELECT plan, school_count INTO v_group
  FROM school_groups
  WHERE id = NEW.school_group_id;

  -- Définir les limites par plan
  v_max_schools := CASE v_group.plan
    WHEN 'gratuit' THEN 1
    WHEN 'premium' THEN 5
    WHEN 'pro' THEN 20
    WHEN 'institutionnel' THEN NULL  -- illimité
    ELSE 1
  END;

  -- Vérifier la limite (sauf si illimité)
  IF v_max_schools IS NOT NULL AND v_group.school_count >= v_max_schools THEN
    RAISE EXCEPTION 'Limite de % école(s) atteinte pour le plan %. Veuillez upgrader votre plan.', 
      v_max_schools, v_group.plan;
  END IF;

  RETURN NEW;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS check_school_limit_trigger ON schools;
CREATE TRIGGER check_school_limit_trigger
  BEFORE INSERT ON schools
  FOR EACH ROW
  EXECUTE FUNCTION check_school_limit();

-- =====================================================
-- FONCTION 2 : Mettre à jour compteur écoles
-- =====================================================

CREATE OR REPLACE FUNCTION update_school_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Incrémenter le compteur
    UPDATE school_groups
    SET school_count = school_count + 1,
        updated_at = NOW()
    WHERE id = NEW.school_group_id;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Décrémenter le compteur
    UPDATE school_groups
    SET school_count = GREATEST(0, school_count - 1),
        updated_at = NOW()
    WHERE id = OLD.school_group_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS update_school_count_trigger ON schools;
CREATE TRIGGER update_school_count_trigger
  AFTER INSERT OR DELETE ON schools
  FOR EACH ROW
  EXECUTE FUNCTION update_school_count();

-- =====================================================
-- FONCTION 3 : Vérifier limite utilisateurs
-- =====================================================

CREATE OR REPLACE FUNCTION check_user_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_group RECORD;
  v_max_users INTEGER;
  v_current_users INTEGER;
BEGIN
  -- Récupérer le groupe et son plan
  SELECT plan, student_count, staff_count INTO v_group
  FROM school_groups
  WHERE id = NEW.school_group_id;

  -- Calculer le nombre actuel d'utilisateurs
  v_current_users := COALESCE(v_group.student_count, 0) + COALESCE(v_group.staff_count, 0);

  -- Définir les limites par plan
  v_max_users := CASE v_group.plan
    WHEN 'gratuit' THEN 10
    WHEN 'premium' THEN 50
    WHEN 'pro' THEN 200
    WHEN 'institutionnel' THEN NULL  -- illimité
    ELSE 10
  END;

  -- Vérifier la limite (sauf si illimité)
  IF v_max_users IS NOT NULL AND v_current_users >= v_max_users THEN
    RAISE EXCEPTION 'Limite de % utilisateur(s) atteinte pour le plan %. Veuillez upgrader votre plan.', 
      v_max_users, v_group.plan;
  END IF;

  RETURN NEW;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS check_user_limit_trigger ON users;
CREATE TRIGGER check_user_limit_trigger
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION check_user_limit();

-- =====================================================
-- FONCTION 4 : Mettre à jour compteurs utilisateurs
-- =====================================================

CREATE OR REPLACE FUNCTION update_user_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Incrémenter le compteur selon le rôle
    IF NEW.role IN ('eleve', 'student') THEN
      UPDATE school_groups
      SET student_count = student_count + 1,
          updated_at = NOW()
      WHERE id = NEW.school_group_id;
    ELSIF NEW.role IN ('enseignant', 'directeur', 'cpe', 'comptable', 'admin_groupe') THEN
      UPDATE school_groups
      SET staff_count = staff_count + 1,
          updated_at = NOW()
      WHERE id = NEW.school_group_id;
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Décrémenter le compteur selon le rôle
    IF OLD.role IN ('eleve', 'student') THEN
      UPDATE school_groups
      SET student_count = GREATEST(0, student_count - 1),
          updated_at = NOW()
      WHERE id = OLD.school_group_id;
    ELSIF OLD.role IN ('enseignant', 'directeur', 'cpe', 'comptable', 'admin_groupe') THEN
      UPDATE school_groups
      SET staff_count = GREATEST(0, staff_count - 1),
          updated_at = NOW()
      WHERE id = OLD.school_group_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS update_user_count_trigger ON users;
CREATE TRIGGER update_user_count_trigger
  AFTER INSERT OR DELETE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_user_count();

-- =====================================================
-- FONCTION 5 : Vérifier limite stockage
-- =====================================================

CREATE OR REPLACE FUNCTION check_storage_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_group RECORD;
  v_max_storage NUMERIC;
  v_file_size_gb NUMERIC;
BEGIN
  -- Récupérer le groupe et son plan
  SELECT plan, storage_used INTO v_group
  FROM school_groups
  WHERE id = NEW.school_group_id;

  -- Calculer la taille du fichier en GB
  v_file_size_gb := NEW.file_size / (1024.0 * 1024.0 * 1024.0);

  -- Définir les limites par plan (en GB)
  v_max_storage := CASE v_group.plan
    WHEN 'gratuit' THEN 1
    WHEN 'premium' THEN 10
    WHEN 'pro' THEN 50
    WHEN 'institutionnel' THEN NULL  -- illimité
    ELSE 1
  END;

  -- Vérifier la limite (sauf si illimité)
  IF v_max_storage IS NOT NULL AND (v_group.storage_used + v_file_size_gb) > v_max_storage THEN
    RAISE EXCEPTION 'Limite de stockage de % GB atteinte pour le plan %. Veuillez upgrader votre plan.', 
      v_max_storage, v_group.plan;
  END IF;

  RETURN NEW;
END;
$$;

-- Créer le trigger (si table files existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'files') THEN
    DROP TRIGGER IF EXISTS check_storage_limit_trigger ON files;
    CREATE TRIGGER check_storage_limit_trigger
      BEFORE INSERT ON files
      FOR EACH ROW
      EXECUTE FUNCTION check_storage_limit();
    RAISE NOTICE '✅ Trigger check_storage_limit_trigger créé sur table files';
  ELSE
    RAISE NOTICE '⚠️  Table files n''existe pas - trigger check_storage_limit_trigger ignoré';
  END IF;
END $$;

-- =====================================================
-- FONCTION 6 : Mettre à jour stockage utilisé
-- =====================================================

CREATE OR REPLACE FUNCTION update_storage_used()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_file_size_gb NUMERIC;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Calculer la taille en GB
    v_file_size_gb := NEW.file_size / (1024.0 * 1024.0 * 1024.0);
    
    -- Incrémenter le stockage
    UPDATE school_groups
    SET storage_used = storage_used + v_file_size_gb,
        updated_at = NOW()
    WHERE id = NEW.school_group_id;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Calculer la taille en GB
    v_file_size_gb := OLD.file_size / (1024.0 * 1024.0 * 1024.0);
    
    -- Décrémenter le stockage
    UPDATE school_groups
    SET storage_used = GREATEST(0, storage_used - v_file_size_gb),
        updated_at = NOW()
    WHERE id = OLD.school_group_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Créer le trigger (si table files existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'files') THEN
    DROP TRIGGER IF EXISTS update_storage_used_trigger ON files;
    CREATE TRIGGER update_storage_used_trigger
      AFTER INSERT OR DELETE ON files
      FOR EACH ROW
      EXECUTE FUNCTION update_storage_used();
    RAISE NOTICE '✅ Trigger update_storage_used_trigger créé sur table files';
  ELSE
    RAISE NOTICE '⚠️  Table files n''existe pas - trigger update_storage_used_trigger ignoré';
  END IF;
END $$;

-- =====================================================
-- FONCTION 7 : Vérifier limite modules
-- =====================================================

CREATE OR REPLACE FUNCTION check_module_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_group RECORD;
  v_max_modules INTEGER;
  v_current_modules INTEGER;
BEGIN
  -- Récupérer le groupe et son plan
  SELECT plan INTO v_group
  FROM school_groups
  WHERE id = NEW.school_group_id;

  -- Compter les modules actuels
  SELECT COUNT(*) INTO v_current_modules
  FROM group_module_configs
  WHERE school_group_id = NEW.school_group_id
    AND is_enabled = true;

  -- Définir les limites par plan
  v_max_modules := CASE v_group.plan
    WHEN 'gratuit' THEN 5
    WHEN 'premium' THEN 15
    WHEN 'pro' THEN NULL  -- illimité
    WHEN 'institutionnel' THEN NULL  -- illimité
    ELSE 5
  END;

  -- Vérifier la limite (sauf si illimité)
  IF v_max_modules IS NOT NULL AND v_current_modules >= v_max_modules THEN
    RAISE EXCEPTION 'Limite de % module(s) atteinte pour le plan %. Veuillez upgrader votre plan.', 
      v_max_modules, v_group.plan;
  END IF;

  RETURN NEW;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS check_module_limit_trigger ON group_module_configs;
CREATE TRIGGER check_module_limit_trigger
  BEFORE INSERT ON group_module_configs
  FOR EACH ROW
  WHEN (NEW.is_enabled = true)
  EXECUTE FUNCTION check_module_limit();

-- =====================================================
-- PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION check_school_limit TO authenticated;
GRANT EXECUTE ON FUNCTION update_school_count TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_limit TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_count TO authenticated;
GRANT EXECUTE ON FUNCTION check_storage_limit TO authenticated;
GRANT EXECUTE ON FUNCTION update_storage_used TO authenticated;
GRANT EXECUTE ON FUNCTION check_module_limit TO authenticated;

-- =====================================================
-- COMMENTAIRES
-- =====================================================

COMMENT ON FUNCTION check_school_limit IS 
'Vérifie la limite d''écoles avant insertion selon le plan';

COMMENT ON FUNCTION update_school_count IS 
'Met à jour automatiquement le compteur school_count';

COMMENT ON FUNCTION check_user_limit IS 
'Vérifie la limite d''utilisateurs avant insertion selon le plan';

COMMENT ON FUNCTION update_user_count IS 
'Met à jour automatiquement les compteurs student_count et staff_count';

COMMENT ON FUNCTION check_storage_limit IS 
'Vérifie la limite de stockage avant upload selon le plan';

COMMENT ON FUNCTION update_storage_used IS 
'Met à jour automatiquement le stockage utilisé';

COMMENT ON FUNCTION check_module_limit IS 
'Vérifie la limite de modules avant activation selon le plan';

-- =====================================================
-- SUCCÈS
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Triggers de restrictions de plan créés avec succès !';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Vérifications automatiques :';
  RAISE NOTICE '   ✅ Limite écoles (Gratuit: 1, Premium: 5, Pro: 20, Institutionnel: illimité)';
  RAISE NOTICE '   ✅ Limite utilisateurs (Gratuit: 10, Premium: 50, Pro: 200, Institutionnel: illimité)';
  RAISE NOTICE '   ✅ Limite stockage (Gratuit: 1GB, Premium: 10GB, Pro: 50GB, Institutionnel: illimité)';
  RAISE NOTICE '   ✅ Limite modules (Gratuit: 5, Premium: 15, Pro: illimité, Institutionnel: illimité)';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Compteurs automatiques :';
  RAISE NOTICE '   ✅ school_count mis à jour automatiquement';
  RAISE NOTICE '   ✅ student_count mis à jour automatiquement';
  RAISE NOTICE '   ✅ staff_count mis à jour automatiquement';
  RAISE NOTICE '   ✅ storage_used mis à jour automatiquement';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Les restrictions sont maintenant APPLIQUÉES !';
END $$;

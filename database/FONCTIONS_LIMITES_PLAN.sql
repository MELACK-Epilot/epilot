/**
 * =====================================================
 * FONCTIONS SQL POUR GESTION DES LIMITES
 * =====================================================
 *
 * Fonctions nécessaires pour la création d'écoles
 * avec vérification des limites de plan
 *
 * Date : 8 novembre 2025, 01:10 AM
 * =====================================================
 */

-- =====================================================
-- FONCTION: Vérifier les limites de plan
-- =====================================================

-- Fonction check_plan_limit (si elle n'existe pas)
DROP FUNCTION IF EXISTS check_plan_limit(uuid,text);
CREATE OR REPLACE FUNCTION check_plan_limit(
  p_school_group_id UUID,
  p_resource_type TEXT
)
RETURNS TABLE (
  allowed BOOLEAN,
  message TEXT,
  current_count INTEGER,
  max_limit INTEGER
) AS $$
DECLARE
  v_plan_id UUID;
  v_plan_slug TEXT;
  v_current_count INTEGER := 0;
  v_max_limit INTEGER := 0;
BEGIN
  -- Récupérer le plan actif du groupe
  SELECT sgs.plan_id, sp.slug
  INTO v_plan_id, v_plan_slug
  FROM school_group_subscriptions sgs
  JOIN subscription_plans sp ON sp.id = sgs.plan_id
  WHERE sgs.school_group_id = p_school_group_id
    AND sgs.status = 'active'
  LIMIT 1;

  -- Si pas de plan actif, autoriser avec limite par défaut
  IF v_plan_id IS NULL THEN
    RETURN QUERY SELECT
      true,
      'Pas de plan actif - limite par défaut appliquée'::TEXT,
      0::INTEGER,
      5::INTEGER; -- Limite par défaut de 5 écoles
    RETURN;
  END IF;

  -- Définir les limites selon le plan
  CASE v_plan_slug
    WHEN 'gratuit' THEN v_max_limit := 1;
    WHEN 'plan-rentree-scolaire' THEN v_max_limit := 1;
    WHEN 'premium' THEN v_max_limit := 5;
    WHEN 'pro' THEN v_max_limit := 20;
    WHEN 'institutionnel' THEN v_max_limit := -1; -- Illimité
    ELSE v_max_limit := 1; -- Par défaut
  END CASE;

  -- Si illimité, autoriser
  IF v_max_limit = -1 THEN
    RETURN QUERY SELECT
      true,
      'Plan illimité'::TEXT,
      0::INTEGER,
      v_max_limit::INTEGER;
    RETURN;
  END IF;

  -- Compter les ressources actuelles
  CASE p_resource_type
    WHEN 'schools' THEN
      SELECT COUNT(*) INTO v_current_count
      FROM schools
      WHERE school_group_id = p_school_group_id
        AND status = 'active';
    WHEN 'users' THEN
      SELECT COUNT(*) INTO v_current_count
      FROM users
      WHERE school_group_id = p_school_group_id
        AND status = 'active';
    ELSE
      v_current_count := 0;
  END CASE;

  -- Vérifier si la limite est atteinte
  IF v_current_count >= v_max_limit THEN
    RETURN QUERY SELECT
      false,
      format('Limite de %s %s atteinte pour le plan %s (%s/%s)',
             v_max_limit, p_resource_type, v_plan_slug, v_current_count, v_max_limit)::TEXT,
      v_current_count::INTEGER,
      v_max_limit::INTEGER;
  ELSE
    RETURN QUERY SELECT
      true,
      format('Limite OK (%s/%s %s)', v_current_count, v_max_limit, p_resource_type)::TEXT,
      v_current_count::INTEGER,
      v_max_limit::INTEGER;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_plan_limit IS 'Vérifie si une ressource peut être ajoutée selon les limites du plan';

-- =====================================================
-- FONCTION: Incrémenter le compteur de ressources
-- =====================================================

-- Fonction increment_resource_count (placeholder)
DROP FUNCTION IF EXISTS increment_resource_count(uuid,text,integer);
CREATE OR REPLACE FUNCTION increment_resource_count(
  p_school_group_id UUID,
  p_resource_type TEXT,
  p_increment INTEGER DEFAULT 1
)
RETURNS VOID AS $$
DECLARE
  v_current_count INTEGER := 0;
BEGIN
  -- Pour l'instant, cette fonction ne fait rien
  -- Elle pourrait être utilisée pour mettre à jour des compteurs globaux
  -- Mais nous nous reposons sur les requêtes COUNT(*) en temps réel

  -- Log pour debug
  RAISE NOTICE 'Compteur %s incrémenté de %s pour le groupe %s',
    p_resource_type, p_increment, p_school_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_resource_count IS 'Incrémente le compteur de ressources (placeholder)';

-- =====================================================
-- VÉRIFICATION DES FONCTIONS
-- =====================================================

-- Vérifier que les fonctions existent
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name IN ('check_plan_limit', 'increment_resource_count')
  AND routine_schema = 'public'
ORDER BY routine_name;

-- =====================================================
-- TEST DES FONCTIONS
-- =====================================================

/*
-- Test 1 : Vérifier les limites pour un groupe
SELECT * FROM check_plan_limit(
  'uuid-du-groupe-ici', -- Remplacer par un vrai UUID
  'schools'
);

-- Test 2 : Incrémenter le compteur
SELECT increment_resource_count(
  'uuid-du-groupe-ici',
  'schools',
  1
);
*/

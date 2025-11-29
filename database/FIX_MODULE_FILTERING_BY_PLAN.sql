-- =====================================================
-- CORRECTION CRITIQUE: Filtrage des modules par plan d'abonnement
-- Date: 2024-11-28
-- =====================================================
-- 
-- PROBLÈME IDENTIFIÉ:
-- Le groupe scolaire LAMARELLE (E-PILOT-003) avec un plan Pro
-- voyait 9 catégories et 47 modules au lieu de 8 catégories et 43 modules
-- 
-- CAUSE:
-- L'ancienne fonction get_available_modules_for_group utilisait
-- la colonne statique school_groups.plan et le champ modules.required_plan
-- au lieu de la nouvelle architecture basée sur:
-- - subscriptions (abonnement actif)
-- - plan_modules (modules assignés au plan)
-- - plan_categories (catégories assignées au plan)
--
-- SOLUTION:
-- Nouvelle fonction qui utilise la bonne logique de filtrage
-- =====================================================

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS public.get_available_modules_for_group(uuid);

-- Créer la nouvelle fonction avec la bonne logique
CREATE OR REPLACE FUNCTION public.get_available_modules_for_group(p_school_group_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
DECLARE
  v_plan_id UUID;
  v_plan_name TEXT;
  result JSON;
BEGIN
  -- 1. Récupérer le plan_id depuis la subscription ACTIVE du groupe
  SELECT s.plan_id, sp.name INTO v_plan_id, v_plan_name
  FROM subscriptions s
  JOIN subscription_plans sp ON sp.id = s.plan_id
  WHERE s.school_group_id = p_school_group_id
  AND s.status = 'active'
  LIMIT 1;
  
  -- Si pas de subscription active, retourner vide
  IF v_plan_id IS NULL THEN
    RETURN '[]'::json;
  END IF;

  -- 2. Récupérer les modules groupés par catégorie
  -- UNIQUEMENT ceux assignés au plan via plan_modules et plan_categories
  SELECT json_agg(cat_row ORDER BY cat_row.cat_name) INTO result
  FROM (
    SELECT 
      bc.id,
      bc.name as cat_name,
      bc.description,
      bc.icon,
      bc.color,
      bc.slug as code,
      (
        SELECT json_agg(
          json_build_object(
            'id', m.id,
            'name', m.name,
            'description', m.description,
            'icon', m.icon,
            'slug', m.slug,
            'code', m.slug,
            'status', m.status,
            'category_id', m.category_id,
            'is_active', true
          ) ORDER BY m.name
        )
        FROM plan_modules pm
        JOIN modules m ON m.id = pm.module_id
        WHERE pm.plan_id = v_plan_id
        AND m.category_id = bc.id
        AND m.status = 'active'
      ) as modules
    FROM plan_categories pc
    JOIN business_categories bc ON bc.id = pc.category_id
    WHERE pc.plan_id = v_plan_id
    AND bc.status = 'active'
  ) cat_row
  WHERE cat_row.modules IS NOT NULL;

  -- Reformater pour avoir la structure attendue
  SELECT json_agg(
    json_build_object(
      'id', elem->>'id',
      'name', elem->>'cat_name',
      'description', elem->>'description',
      'icon', elem->>'icon',
      'color', elem->>'color',
      'code', elem->>'code',
      'modules', elem->'modules'
    )
  ) INTO result
  FROM json_array_elements(result) elem;

  RETURN COALESCE(result, '[]'::json);
END;
$function$;

-- Commentaire explicatif
COMMENT ON FUNCTION public.get_available_modules_for_group(uuid) IS 
'Récupère les modules et catégories disponibles pour un groupe scolaire selon son plan d''abonnement actif.
Utilise subscriptions + plan_modules + plan_categories pour le filtrage.
CORRIGÉ le 2024-11-28 pour utiliser la bonne architecture.';

-- =====================================================
-- VÉRIFICATION
-- =====================================================
-- Tester avec le groupe LAMARELLE (Plan Pro = 8 catégories, 43 modules)
-- SELECT json_array_length(get_available_modules_for_group('914d2ced-663a-4732-a521-edcc2423a012'));
-- Résultat attendu: 8

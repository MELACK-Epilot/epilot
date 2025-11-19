-- Vérifier l'abonnement de LAMARELLE

-- 1. Vérifier le groupe
SELECT 
  id,
  name,
  plan as plan_statique,
  subscription_plan_id
FROM school_groups
WHERE name ILIKE '%LAMARELLE%';

-- 2. Vérifier s'il y a une subscription active
SELECT 
  s.id,
  s.school_group_id,
  s.plan_id,
  s.status,
  s.start_date,
  s.end_date,
  sp.name as plan_name,
  sp.slug as plan_slug
FROM subscriptions s
JOIN subscription_plans sp ON sp.id = s.plan_id
WHERE s.school_group_id = (SELECT id FROM school_groups WHERE name ILIKE '%LAMARELLE%');

-- 3. Vérifier les catégories du plan Pro
SELECT 
  sp.name as plan_name,
  COUNT(pc.id) as nb_categories
FROM subscription_plans sp
LEFT JOIN plan_categories pc ON pc.plan_id = sp.id
WHERE sp.slug = 'pro'
GROUP BY sp.id, sp.name;

-- 4. Si pas de subscription, créer une subscription active pour LAMARELLE
DO $$
DECLARE
  v_group_id UUID;
  v_plan_id UUID;
  v_subscription_exists BOOLEAN;
BEGIN
  -- Récupérer le groupe LAMARELLE
  SELECT id INTO v_group_id FROM school_groups WHERE name ILIKE '%LAMARELLE%' LIMIT 1;
  
  -- Récupérer le plan Pro
  SELECT id INTO v_plan_id FROM subscription_plans WHERE slug = 'pro' LIMIT 1;
  
  IF v_group_id IS NULL THEN
    RAISE NOTICE '❌ Groupe LAMARELLE non trouvé';
    RETURN;
  END IF;
  
  IF v_plan_id IS NULL THEN
    RAISE NOTICE '❌ Plan Pro non trouvé';
    RETURN;
  END IF;
  
  -- Vérifier si une subscription existe
  SELECT EXISTS(
    SELECT 1 FROM subscriptions WHERE school_group_id = v_group_id
  ) INTO v_subscription_exists;
  
  IF NOT v_subscription_exists THEN
    RAISE NOTICE '⚠️ Aucune subscription trouvée pour LAMARELLE';
    RAISE NOTICE '📝 Création d''une subscription active...';
    
    -- Créer une subscription active
    INSERT INTO subscriptions (
      school_group_id,
      plan_id,
      status,
      start_date,
      end_date
    ) VALUES (
      v_group_id,
      v_plan_id,
      'active',
      NOW(),
      NOW() + INTERVAL '1 year'
    );
    
    RAISE NOTICE '✅ Subscription créée pour LAMARELLE avec le plan Pro';
  ELSE
    RAISE NOTICE '✅ Subscription existe déjà pour LAMARELLE';
  END IF;
END $$;

-- 5. Vérification finale
SELECT 
  sg.name as groupe,
  sg.plan as plan_statique,
  s.status as subscription_status,
  sp.name as plan_subscription,
  sp.slug as plan_slug,
  COUNT(DISTINCT pc.category_id) as nb_categories,
  COUNT(DISTINCT pm.module_id) as nb_modules
FROM school_groups sg
LEFT JOIN subscriptions s ON s.school_group_id = sg.id AND s.status = 'active'
LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
LEFT JOIN plan_categories pc ON pc.plan_id = sp.id
LEFT JOIN plan_modules pm ON pm.plan_id = sp.id
WHERE sg.name ILIKE '%LAMARELLE%'
GROUP BY sg.id, sg.name, sg.plan, s.status, sp.name, sp.slug;

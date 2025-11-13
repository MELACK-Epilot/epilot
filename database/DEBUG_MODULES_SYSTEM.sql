-- ============================================
-- SCRIPT DE DIAGNOSTIC - SYSTÈME DE MODULES
-- Vérifie la structure et les données
-- ============================================

-- 1. Vérifier la table modules
SELECT 
  '📦 TABLE MODULES' AS info,
  COUNT(*) AS total,
  COUNT(CASE WHEN status = 'active' THEN 1 END) AS actifs,
  COUNT(CASE WHEN category_id IS NOT NULL THEN 1 END) AS avec_categorie
FROM modules;

-- 2. Vérifier les colonnes de la table modules
SELECT 
  '🔍 COLONNES DE MODULES' AS info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'modules'
ORDER BY ordinal_position;

-- 3. Vérifier la table business_categories
SELECT 
  '🏷️ TABLE BUSINESS_CATEGORIES' AS info,
  COUNT(*) AS total,
  COUNT(CASE WHEN status = 'active' THEN 1 END) AS actifs
FROM business_categories;

-- 4. Vérifier les modules par plan
SELECT 
  '📊 MODULES PAR PLAN' AS info,
  required_plan,
  COUNT(*) AS nombre
FROM modules
WHERE status = 'active'
GROUP BY required_plan
ORDER BY 
  CASE required_plan
    WHEN 'gratuit' THEN 1
    WHEN 'premium' THEN 2
    WHEN 'pro' THEN 3
    WHEN 'institutionnel' THEN 4
    ELSE 5
  END;

-- 5. Vérifier les modules par catégorie
SELECT 
  '📁 MODULES PAR CATÉGORIE' AS info,
  COALESCE(bc.name, 'Sans catégorie') AS categorie,
  COUNT(m.id) AS nombre_modules
FROM modules m
LEFT JOIN business_categories bc ON m.category_id = bc.id
WHERE m.status = 'active'
GROUP BY bc.name
ORDER BY nombre_modules DESC;

-- 6. Vérifier les school_groups
SELECT 
  '🏫 SCHOOL GROUPS' AS info,
  COUNT(*) AS total,
  COUNT(CASE WHEN plan = 'gratuit' THEN 1 END) AS gratuit,
  COUNT(CASE WHEN plan = 'premium' THEN 1 END) AS premium,
  COUNT(CASE WHEN plan = 'pro' THEN 1 END) AS pro,
  COUNT(CASE WHEN plan = 'institutionnel' THEN 1 END) AS institutionnel
FROM school_groups;

-- 7. Exemple de modules disponibles pour un plan gratuit
SELECT 
  '✅ MODULES DISPONIBLES (PLAN GRATUIT)' AS info,
  m.name,
  m.slug,
  m.required_plan,
  bc.name AS categorie
FROM modules m
LEFT JOIN business_categories bc ON m.category_id = bc.id
WHERE m.status = 'active'
  AND m.required_plan = 'gratuit'
ORDER BY m.name
LIMIT 10;

-- 8. Vérifier les clés étrangères
SELECT 
  '🔗 CLÉS ÉTRANGÈRES' AS info,
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('modules', 'user_assigned_modules', 'user_assigned_categories')
ORDER BY tc.table_name, tc.constraint_name;

-- 9. Vérifier les tables d'assignation
SELECT 
  '📋 TABLE USER_ASSIGNED_MODULES' AS info,
  COUNT(*) AS total_assignations
FROM user_assigned_modules;

SELECT 
  '📋 TABLE USER_ASSIGNED_CATEGORIES' AS info,
  COUNT(*) AS total_assignations
FROM user_assigned_categories;

-- 10. Vérifier la vue user_module_permissions
SELECT 
  '👁️ VUE USER_MODULE_PERMISSIONS' AS info,
  COUNT(*) AS total_permissions
FROM user_module_permissions;

-- 11. Tester un exemple d'assignation (simulation)
SELECT 
  '🧪 SIMULATION ASSIGNATION' AS info,
  'Pour un groupe avec plan "premium", voici les modules disponibles:' AS description;

SELECT 
  m.name,
  m.slug,
  m.required_plan,
  bc.name AS categorie
FROM modules m
LEFT JOIN business_categories bc ON m.category_id = bc.id
WHERE m.status = 'active'
  AND m.required_plan IN ('gratuit', 'premium')
ORDER BY m.required_plan, m.name
LIMIT 20;

-- 12. Vérifier si category_id existe dans modules
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'modules' 
    AND column_name = 'category_id'
  ) THEN
    RAISE NOTICE '✅ La colonne category_id existe dans modules';
  ELSE
    RAISE NOTICE '❌ La colonne category_id N''EXISTE PAS dans modules';
    RAISE NOTICE '💡 Exécutez: ALTER TABLE modules ADD COLUMN category_id UUID REFERENCES business_categories(id);';
  END IF;
END $$;

-- 13. Afficher un résumé
SELECT 
  '📊 RÉSUMÉ FINAL' AS titre,
  (SELECT COUNT(*) FROM modules WHERE status = 'active') AS modules_actifs,
  (SELECT COUNT(*) FROM business_categories WHERE status = 'active') AS categories_actives,
  (SELECT COUNT(*) FROM school_groups) AS groupes_scolaires,
  (SELECT COUNT(*) FROM user_assigned_modules) AS assignations_modules,
  (SELECT COUNT(*) FROM user_assigned_categories) AS assignations_categories;

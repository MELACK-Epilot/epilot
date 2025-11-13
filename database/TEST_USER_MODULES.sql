-- ============================================
-- TEST RAPIDE - VÉRIFIER LES DONNÉES UTILISATEUR
-- ============================================

-- 1. Vérifier l'utilisateur proviseur avec toutes ses données
SELECT 
  '👤 UTILISATEUR PROVISEUR' AS info,
  u.id,
  u.first_name,
  u.last_name,
  u.email,
  u.role,
  u.school_group_id,
  u.school_id,
  u.status,
  sg.name AS groupe_nom,
  sg.plan AS groupe_plan,
  s.name AS ecole_nom
FROM users u
LEFT JOIN school_groups sg ON u.school_group_id = sg.id
LEFT JOIN schools s ON u.school_id = s.id
WHERE u.role = 'proviseur'
LIMIT 1;

-- 2. Compter les modules disponibles pour le plan premium
SELECT 
  '📦 MODULES DISPONIBLES (PREMIUM)' AS info,
  COUNT(*) AS total_modules
FROM modules
WHERE status = 'active'
  AND required_plan IN ('gratuit', 'premium');

-- 3. Lister quelques modules disponibles
SELECT 
  '📋 EXEMPLES DE MODULES' AS info,
  m.id,
  m.name,
  m.slug,
  m.required_plan,
  m.status,
  bc.name AS categorie
FROM modules m
LEFT JOIN business_categories bc ON m.category_id = bc.id
WHERE m.status = 'active'
  AND m.required_plan IN ('gratuit', 'premium')
ORDER BY m.required_plan, m.name
LIMIT 10;

-- 4. Vérifier si l'utilisateur a déjà des modules assignés
SELECT 
  '✅ MODULES DÉJÀ ASSIGNÉS' AS info,
  COUNT(*) AS nombre
FROM user_assigned_modules
WHERE user_id IN (SELECT id FROM users WHERE role = 'proviseur');

-- 5. Test de la fonction d'assignation (simulation)
SELECT 
  '🧪 TEST FONCTION ASSIGNATION' AS info,
  'La fonction assign_module_to_user existe-t-elle ?' AS question;

SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'assign_module_to_user';

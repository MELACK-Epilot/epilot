-- SOLUTION D'URGENCE - Forcer l'assignation des modules

-- 1. NETTOYER COMPLÈTEMENT group_module_configs pour admin groupe
DELETE FROM group_module_configs 
WHERE school_group_id IN (
  SELECT DISTINCT school_group_id 
  FROM users 
  WHERE role = 'admin_groupe'
);

-- 2. CRÉER DES MODULES DE BASE SI AUCUN N'EXISTE
INSERT INTO modules (id, name, slug, description, icon, color, version, status, is_core)
VALUES 
  (gen_random_uuid(), 'Gestion des Élèves', 'gestion-eleves', 'Module de gestion des élèves', '👥', '#2A9D8F', '1.0.0', 'active', true),
  (gen_random_uuid(), 'Emploi du Temps', 'emploi-temps', 'Planification des cours', '📅', '#1D3557', '1.0.0', 'active', true),
  (gen_random_uuid(), 'Notes et Évaluations', 'notes', 'Gestion des notes', '📊', '#E9C46A', '1.0.0', 'active', false),
  (gen_random_uuid(), 'Messagerie', 'messagerie', 'Communication interne', '✉️', '#F4A261', '1.0.0', 'active', false),
  (gen_random_uuid(), 'Rapports', 'rapports', 'Génération de rapports', '📈', '#E76F51', '1.0.0', 'active', false)
ON CONFLICT (slug) DO NOTHING;

-- 3. CRÉER DES CATÉGORIES DE BASE
INSERT INTO business_categories (id, name, slug, description, icon, color, status)
VALUES 
  (gen_random_uuid(), 'Gestion Scolaire', 'gestion', 'Modules de gestion', '🏫', '#2A9D8F', 'active'),
  (gen_random_uuid(), 'Pédagogie', 'pedagogie', 'Outils pédagogiques', '📚', '#8B5CF6', 'active')
ON CONFLICT (slug) DO NOTHING;

-- 4. ASSIGNER UNE CATÉGORIE AUX MODULES SANS CATÉGORIE
UPDATE modules 
SET category_id = (SELECT id FROM business_categories WHERE slug = 'gestion' LIMIT 1)
WHERE category_id IS NULL 
AND status = 'active';

-- 5. FORCER L'ASSIGNATION DE TOUS LES MODULES À TOUS LES GROUPES ADMIN
INSERT INTO group_module_configs (school_group_id, module_id, is_enabled, created_at, updated_at)
SELECT DISTINCT
  u.school_group_id,
  m.id,
  true,
  NOW(),
  NOW()
FROM users u
CROSS JOIN modules m
WHERE u.role = 'admin_groupe'
AND u.school_group_id IS NOT NULL
AND m.status = 'active'
AND NOT EXISTS (
  SELECT 1 FROM group_module_configs gmc 
  WHERE gmc.school_group_id = u.school_group_id 
  AND gmc.module_id = m.id
);

-- 6. VÉRIFICATION IMMÉDIATE
SELECT 
  '✅ VÉRIFICATION POST-ASSIGNATION' as status,
  sg.name as groupe,
  COUNT(gmc.module_id) as modules_assignes,
  COUNT(CASE WHEN gmc.is_enabled = true THEN 1 END) as modules_actifs,
  COUNT(DISTINCT m.category_id) as categories_distinctes
FROM school_groups sg
JOIN users u ON sg.id = u.school_group_id
LEFT JOIN group_module_configs gmc ON sg.id = gmc.school_group_id
LEFT JOIN modules m ON gmc.module_id = m.id
WHERE u.role = 'admin_groupe'
GROUP BY sg.id, sg.name
ORDER BY sg.name;

-- 7. EXEMPLE DE MODULES ASSIGNÉS
SELECT 
  '📋 EXEMPLES MODULES ASSIGNÉS' as status,
  m.name as module_name,
  bc.name as categorie,
  gmc.is_enabled as actif
FROM group_module_configs gmc
JOIN modules m ON gmc.module_id = m.id
LEFT JOIN business_categories bc ON m.category_id = bc.id
WHERE gmc.school_group_id IN (
  SELECT DISTINCT school_group_id 
  FROM users 
  WHERE role = 'admin_groupe'
  LIMIT 1
)
ORDER BY bc.name, m.name
LIMIT 10;

-- 8. MESSAGE FINAL
SELECT 
  'ASSIGNATION FORCÉE TERMINÉE ✅' as status,
  CONCAT(
    'Modules: ', (SELECT COUNT(*) FROM modules WHERE status = 'active'),
    ' | Assignations: ', (SELECT COUNT(*) FROM group_module_configs gmc JOIN users u ON gmc.school_group_id = u.school_group_id WHERE u.role = 'admin_groupe')
  ) as statistiques;

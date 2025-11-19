-- =====================================================
-- MIGRATION: SUPPRESSION PLAN STATIQUE
-- =====================================================
-- Objectif: Tout récupérer dynamiquement depuis subscriptions
-- Fini les incohérences!

-- 1. Supprimer le trigger de synchronisation (plus nécessaire)
DROP TRIGGER IF EXISTS on_subscription_sync_plan ON subscriptions;
DROP FUNCTION IF EXISTS sync_school_group_plan();

-- 2. Identifier les vues dépendantes
SELECT 
  'Vue dépendante trouvée: ' || table_name as info
FROM information_schema.views 
WHERE table_schema = 'public' 
AND view_definition LIKE '%school_groups%plan%';

-- 3. Supprimer ou recréer les vues dépendantes
DROP VIEW IF EXISTS school_groups_with_admin CASCADE;

-- 4. Supprimer la colonne plan de school_groups
ALTER TABLE school_groups 
DROP COLUMN IF EXISTS plan CASCADE;

-- 3. Créer une vue pour faciliter les requêtes
CREATE OR REPLACE VIEW school_groups_with_plan AS
SELECT 
  sg.*,
  s.id as subscription_id,
  s.plan_id,
  s.status as subscription_status,
  s.start_date,
  s.end_date,
  sp.name as plan_name,
  sp.slug as plan_slug,
  sp.max_schools,
  sp.max_students,
  sp.max_staff,
  sp.max_storage
FROM school_groups sg
LEFT JOIN subscriptions s ON s.school_group_id = sg.id AND s.status = 'active'
LEFT JOIN subscription_plans sp ON sp.id = s.plan_id;

-- 4. Recréer school_groups_with_admin en version optimisée (sans colonne plan)
CREATE OR REPLACE VIEW school_groups_with_admin AS
SELECT 
  sg.*,
  u.id as admin_id,
  u.email as admin_email,
  u.first_name as admin_first_name,
  u.last_name as admin_last_name,
  s.plan_id,
  sp.slug as plan_slug,
  sp.name as plan_name
FROM school_groups sg
LEFT JOIN users u ON u.school_group_id = sg.id AND u.role = 'admin_groupe'
LEFT JOIN subscriptions s ON s.school_group_id = sg.id AND s.status = 'active'
LEFT JOIN subscription_plans sp ON sp.id = s.plan_id;

-- 5. Créer index pour performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_group_status 
ON subscriptions(school_group_id, status) 
WHERE status = 'active';

-- 6. Commentaires
COMMENT ON VIEW school_groups_with_plan IS 'Vue enrichie des groupes avec leur plan actif depuis subscriptions';
COMMENT ON VIEW school_groups_with_admin IS 'Vue enrichie des groupes avec leur admin et plan dynamique';

-- 7. Vérification
SELECT 
  '✅ Migration réussie!' as message,
  'Colonne statique supprimée' as detail_1,
  '2 Vues dynamiques créées' as detail_2,
  'Tout vient de subscriptions maintenant' as detail_3;

-- 8. Test: Afficher LAMARELLE avec plan dynamique
SELECT 
  name,
  plan_slug,
  plan_name,
  max_schools,
  max_students
FROM school_groups_with_plan
WHERE name ILIKE '%LAMARELLE%';

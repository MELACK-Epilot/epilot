-- DEBUG REQUÊTE SUPABASE - Identifier le problème exact

-- 1. VÉRIFIER SI LA TABLE school_group_subscriptions EXISTE
SELECT 
  '🔍 TABLE school_group_subscriptions' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'school_group_subscriptions'
    ) THEN 'EXISTE'
    ELSE 'N''EXISTE PAS'
  END as status;

-- 2. LISTER TOUTES LES TABLES CONTENANT 'subscription'
SELECT 
  '📋 TABLES SUBSCRIPTION' as check_type,
  table_name
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name LIKE '%subscription%'
ORDER BY table_name;

-- 3. VÉRIFIER LA TABLE subscriptions (probablement la bonne)
SELECT 
  '✅ TABLE subscriptions' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'subscriptions'
    ) THEN 'EXISTE'
    ELSE 'N''EXISTE PAS'
  END as status;

-- 4. STRUCTURE DE LA TABLE subscriptions
SELECT 
  '📊 COLONNES subscriptions' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'subscriptions'
ORDER BY ordinal_position;

-- 5. VÉRIFIER LES ABONNEMENTS DU GROUPE LAMARELLE
SELECT 
  '🎯 ABONNEMENTS LAMARELLE' as check_type,
  s.*
FROM subscriptions s
WHERE s.school_group_id = '914d2ced-663a-4732-a521-edcc2423a012';

-- 6. VÉRIFIER LE GROUPE LAMARELLE DIRECTEMENT
SELECT 
  '🏫 GROUPE LAMARELLE DIRECT' as check_type,
  sg.*
FROM school_groups sg
WHERE sg.id = '914d2ced-663a-4732-a521-edcc2423a012';

-- 7. TEST DE LA REQUÊTE CORRECTE (sans school_group_subscriptions)
SELECT 
  '✅ REQUÊTE CORRIGÉE' as check_type,
  sg.id,
  sg.name,
  sg.plan_id,
  sp.name as plan_name,
  s.status as subscription_status
FROM school_groups sg
LEFT JOIN subscription_plans sp ON sg.plan_id = sp.id
LEFT JOIN subscriptions s ON s.school_group_id = sg.id AND s.status = 'active'
WHERE sg.id = '914d2ced-663a-4732-a521-edcc2423a012';

-- 8. MODULES ASSIGNÉS AU GROUPE (test direct)
SELECT 
  '📦 MODULES ASSIGNÉS TEST' as check_type,
  COUNT(*) as total_modules,
  COUNT(CASE WHEN gmc.is_enabled = true THEN 1 END) as modules_actifs
FROM group_module_configs gmc
WHERE gmc.school_group_id = '914d2ced-663a-4732-a521-edcc2423a012';

-- 9. DIAGNOSTIC COMPLET
SELECT 
  '🎯 DIAGNOSTIC FINAL' as check_type,
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM school_groups WHERE id = '914d2ced-663a-4732-a521-edcc2423a012') 
    THEN 'GROUPE N''EXISTE PAS'
    WHEN NOT EXISTS (SELECT 1 FROM subscriptions WHERE school_group_id = '914d2ced-663a-4732-a521-edcc2423a012')
    THEN 'AUCUN ABONNEMENT'
    WHEN NOT EXISTS (SELECT 1 FROM group_module_configs WHERE school_group_id = '914d2ced-663a-4732-a521-edcc2423a012')
    THEN 'AUCUN MODULE ASSIGNÉ'
    ELSE 'DONNÉES OK - PROBLÈME DANS LA REQUÊTE FRONTEND'
  END as probleme;

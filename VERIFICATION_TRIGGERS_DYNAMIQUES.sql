/**
 * =====================================================
 * VÉRIFICATION - Système Dynamique (Triggers)
 * =====================================================
 * 
 * Vérifier que les triggers de changement de plan sont actifs
 * 
 * Date : 8 novembre 2025, 00:12 AM
 * =====================================================
 */

-- =====================================================
-- VÉRIFIER LES TRIGGERS INSTALLÉS
-- =====================================================

SELECT 
  trigger_name,
  event_object_table as table_name,
  action_timing as timing,
  event_manipulation as event,
  action_statement as function_called
FROM information_schema.triggers
WHERE event_object_table = 'school_group_subscriptions'
ORDER BY trigger_name;

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================

/*
Si le système est dynamique, vous devriez voir :

trigger_name                              | table_name                  | timing | event  | function_called
------------------------------------------|----------------------------|--------|--------|------------------
auto_assign_plan_content_trigger          | school_group_subscriptions | AFTER  | INSERT | auto_assign_plan_content_to_group()
disable_content_on_subscription_end       | school_group_subscriptions | AFTER  | UPDATE | disable_content_on_subscription_end()
update_plan_content_on_change_trigger     | school_group_subscriptions | AFTER  | UPDATE | update_plan_content_on_change()

✅ Si vous voyez ces 3 triggers → Le système est DYNAMIQUE
❌ Si vous ne voyez rien → Les triggers ne sont pas installés
*/

-- =====================================================
-- VÉRIFIER LES FONCTIONS
-- =====================================================

SELECT 
  routine_name as function_name,
  routine_type as type
FROM information_schema.routines
WHERE routine_name LIKE '%plan_content%'
  OR routine_name LIKE '%subscription%'
ORDER BY routine_name;

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================

/*
Vous devriez voir :

function_name                          | type
---------------------------------------|----------
auto_assign_plan_content_to_group      | FUNCTION
disable_content_on_subscription_end    | FUNCTION
update_plan_content_on_change          | FUNCTION

✅ Si vous voyez ces 3 fonctions → Le système est complet
*/

/**
 * =====================================================
 * CORRECTION - Trigger updated_at Problématique
 * =====================================================
 * 
 * Supprimer le trigger qui cause l'erreur
 * 
 * Date : 8 novembre 2025, 00:22 AM
 * =====================================================
 */

-- =====================================================
-- SUPPRIMER LE TRIGGER PROBLÉMATIQUE
-- =====================================================

DROP TRIGGER IF EXISTS trigger_group_categories_updated_at ON group_business_categories;

-- =====================================================
-- VÉRIFIER QUE LE TRIGGER EST SUPPRIMÉ
-- =====================================================

SELECT 
  trigger_name,
  event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'group_business_categories';

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================

/*
Aucune ligne retournée = ✅ Trigger supprimé

Maintenant réexécutez FORCE_UPDATE_PLAN_PREMIUM.sql
*/

/**
 * CORRECTION AUTO_RENEW - DÉSACTIVÉ PAR DÉFAUT
 * 
 * L'auto-renouvellement doit être un CHOIX de l'admin de groupe,
 * pas activé automatiquement pour tout le monde.
 * 
 * Ce script:
 * 1. Change la valeur par défaut à FALSE
 * 2. Désactive l'auto-renew pour tous les abonnements existants
 * 3. L'admin pourra l'activer via un toggle dans l'interface
 */

-- ============================================
-- PARTIE 1 : CHANGER LA VALEUR PAR DÉFAUT
-- ============================================

-- Modifier la colonne pour avoir FALSE par défaut
ALTER TABLE subscriptions 
ALTER COLUMN auto_renew SET DEFAULT false;

-- Mettre à jour le commentaire
COMMENT ON COLUMN subscriptions.auto_renew IS 'Renouvellement automatique de l''abonnement (désactivé par défaut, activé par l''admin de groupe via toggle)';

-- ============================================
-- PARTIE 2 : DÉSACTIVER POUR TOUS LES ABONNEMENTS EXISTANTS
-- ============================================

-- Mettre auto_renew à FALSE pour tous les abonnements
-- L'admin devra l'activer manuellement via l'interface
UPDATE subscriptions
SET auto_renew = false
WHERE auto_renew = true;

-- ============================================
-- PARTIE 3 : VÉRIFICATION
-- ============================================

-- Afficher les abonnements
SELECT 
  sg.name as groupe_scolaire,
  sp.name as plan,
  s.status,
  s.auto_renew as renouvellement_auto,
  CASE 
    WHEN s.auto_renew THEN '✅ Activé (par choix)'
    ELSE '⚠️ Désactivé (par défaut)'
  END as statut_renouvellement
FROM subscriptions s
INNER JOIN school_groups sg ON sg.id = s.school_group_id
INNER JOIN subscription_plans sp ON sp.id = s.plan_id
ORDER BY s.end_date ASC;

-- ============================================
-- PARTIE 4 : STATISTIQUES
-- ============================================

SELECT 
  COUNT(*) FILTER (WHERE auto_renew = true AND status = 'active') as abonnements_auto_renew_actifs,
  COUNT(*) FILTER (WHERE auto_renew = false AND status = 'active') as abonnements_manuels,
  COUNT(*) FILTER (WHERE status = 'active') as total_actifs,
  ROUND(
    COUNT(*) FILTER (WHERE auto_renew = true AND status = 'active')::NUMERIC / 
    NULLIF(COUNT(*) FILTER (WHERE status = 'active'), 0) * 100, 
    2
  ) as pourcentage_auto_renew
FROM subscriptions;

-- ============================================
-- RÉSULTAT ATTENDU
-- ============================================

/**
 * ✅ CORRECTION APPLIQUÉE
 * 
 * Maintenant:
 * - auto_renew = FALSE par défaut
 * - Tous les abonnements existants ont auto_renew = FALSE
 * - L'admin de groupe pourra l'activer via un toggle dans l'interface
 * - Le badge "Auto-renouvelé" ne s'affichera que si l'admin l'active
 * 
 * Prochaine étape:
 * - Ajouter un toggle (switch) dans l'interface pour que l'admin puisse activer/désactiver
 */

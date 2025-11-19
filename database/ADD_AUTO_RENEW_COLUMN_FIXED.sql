/**
 * AJOUT COLONNE AUTO_RENEW - RENOUVELLEMENT AUTOMATIQUE (VERSION CORRIGÉE)
 * 
 * Cette version gère les différentes contraintes de statut possibles
 * Temps d'exécution: ~5 secondes
 */

-- ============================================
-- PARTIE 0 : VÉRIFICATION DES STATUTS EXISTANTS
-- ============================================

-- Afficher les statuts actuels dans la table
DO $$
BEGIN
  RAISE NOTICE '📊 Statuts actuels dans la table subscriptions:';
END $$;

SELECT DISTINCT status, COUNT(*) as count
FROM subscriptions
GROUP BY status
ORDER BY count DESC;

-- ============================================
-- PARTIE 1 : AJOUT COLONNE AUTO_RENEW
-- ============================================

-- Ajouter la colonne auto_renew si elle n'existe pas
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT true;

-- Commentaire explicatif
COMMENT ON COLUMN subscriptions.auto_renew IS 'Renouvellement automatique de l''abonnement à l''expiration (true par défaut)';

-- ============================================
-- PARTIE 2 : MISE À JOUR DES DONNÉES EXISTANTES
-- ============================================

-- Mettre à jour les abonnements existants sans valeur
UPDATE subscriptions
SET auto_renew = true
WHERE auto_renew IS NULL;

-- Définir auto_renew à false pour les abonnements annulés ou expirés
-- On utilise uniquement les statuts qui existent vraiment
UPDATE subscriptions
SET auto_renew = false
WHERE status IN ('cancelled', 'expired')
  AND auto_renew = true;

-- ============================================
-- PARTIE 3 : INDEX POUR PERFORMANCE
-- ============================================

-- Index pour les requêtes de renouvellement automatique
CREATE INDEX IF NOT EXISTS idx_subscriptions_auto_renew 
ON subscriptions(auto_renew, end_date) 
WHERE status = 'active' AND auto_renew = true;

-- ============================================
-- PARTIE 4 : FONCTION DE RENOUVELLEMENT AUTOMATIQUE
-- ============================================

CREATE OR REPLACE FUNCTION process_auto_renewals()
RETURNS TABLE(
  subscription_id UUID,
  school_group_name TEXT,
  plan_name TEXT,
  old_end_date TIMESTAMPTZ,
  new_end_date TIMESTAMPTZ,
  status TEXT
) AS $$
DECLARE
  v_subscription RECORD;
  v_new_end_date TIMESTAMPTZ;
  v_billing_days INTEGER;
BEGIN
  -- Parcourir les abonnements à renouveler (expirant dans les 7 prochains jours)
  FOR v_subscription IN
    SELECT 
      s.id,
      s.end_date,
      s.billing_period,
      sg.name as group_name,
      sp.name as plan_name
    FROM subscriptions s
    INNER JOIN school_groups sg ON sg.id = s.school_group_id
    INNER JOIN subscription_plans sp ON sp.id = s.plan_id
    WHERE s.status = 'active'
      AND s.auto_renew = true
      AND s.end_date IS NOT NULL
      AND s.end_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
  LOOP
    -- Calculer la nouvelle date de fin selon le cycle de facturation
    v_billing_days := CASE v_subscription.billing_period
      WHEN 'monthly' THEN 30
      WHEN 'quarterly' THEN 90
      WHEN 'biannual' THEN 180
      WHEN 'yearly' THEN 365
      ELSE 30
    END;
    
    v_new_end_date := v_subscription.end_date + (v_billing_days || ' days')::INTERVAL;
    
    -- Mettre à jour l'abonnement
    UPDATE subscriptions
    SET 
      end_date = v_new_end_date,
      updated_at = NOW()
    WHERE id = v_subscription.id;
    
    -- Retourner les informations du renouvellement
    subscription_id := v_subscription.id;
    school_group_name := v_subscription.group_name;
    plan_name := v_subscription.plan_name;
    old_end_date := v_subscription.end_date;
    new_end_date := v_new_end_date;
    status := 'renewed';
    
    RETURN NEXT;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaire
COMMENT ON FUNCTION process_auto_renewals() IS 'Traite les renouvellements automatiques des abonnements expirant dans les 7 prochains jours';

-- ============================================
-- PARTIE 5 : FONCTION POUR ACTIVER/DÉSACTIVER AUTO-RENEW
-- ============================================

CREATE OR REPLACE FUNCTION toggle_auto_renew(
  p_subscription_id UUID,
  p_auto_renew BOOLEAN
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Mettre à jour le statut auto_renew
  UPDATE subscriptions
  SET 
    auto_renew = p_auto_renew,
    updated_at = NOW()
  WHERE id = p_subscription_id
    AND status = 'active';
  
  -- Vérifier si la mise à jour a réussi
  IF FOUND THEN
    v_result := jsonb_build_object(
      'success', true,
      'message', CASE 
        WHEN p_auto_renew THEN 'Renouvellement automatique activé'
        ELSE 'Renouvellement automatique désactivé'
      END,
      'subscription_id', p_subscription_id,
      'auto_renew', p_auto_renew
    );
  ELSE
    v_result := jsonb_build_object(
      'success', false,
      'message', 'Abonnement introuvable ou inactif',
      'subscription_id', p_subscription_id
    );
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaire
COMMENT ON FUNCTION toggle_auto_renew(UUID, BOOLEAN) IS 'Active ou désactive le renouvellement automatique d''un abonnement';

-- ============================================
-- PARTIE 6 : VÉRIFICATION
-- ============================================

-- Afficher les abonnements avec auto-renouvellement
SELECT 
  sg.name as groupe_scolaire,
  sp.name as plan,
  s.status,
  s.start_date,
  s.end_date,
  s.auto_renew as renouvellement_auto,
  CASE 
    WHEN s.auto_renew AND s.status = 'active' THEN '✅ Auto-renouvelé'
    WHEN NOT s.auto_renew AND s.status = 'active' THEN '⚠️ Manuel'
    ELSE '❌ Inactif'
  END as statut_renouvellement
FROM subscriptions s
INNER JOIN school_groups sg ON sg.id = s.school_group_id
INNER JOIN subscription_plans sp ON sp.id = s.plan_id
ORDER BY s.end_date ASC;

-- ============================================
-- PARTIE 7 : STATISTIQUES
-- ============================================

-- Statistiques sur les renouvellements automatiques
SELECT 
  COUNT(*) FILTER (WHERE auto_renew = true AND status = 'active') as abonnements_auto_renew,
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
 * ✅ SUCCÈS !
 * 
 * Après exécution de ce script:
 * 
 * ✅ Colonne auto_renew ajoutée à la table subscriptions
 * ✅ Valeur par défaut: true (renouvellement automatique activé)
 * ✅ Index créé pour optimiser les requêtes de renouvellement
 * ✅ Fonction process_auto_renewals() disponible
 * ✅ Fonction toggle_auto_renew() disponible
 * ✅ Badge "Auto-renouvelé" s'affiche dans l'interface
 * ✅ Service SubscriptionAutomationService peut traiter les renouvellements
 * 
 * UTILISATION:
 * 
 * 1. Traiter les renouvellements automatiques:
 *    SELECT * FROM process_auto_renewals();
 * 
 * 2. Activer le renouvellement automatique:
 *    SELECT toggle_auto_renew('subscription-uuid', true);
 * 
 * 3. Désactiver le renouvellement automatique:
 *    SELECT toggle_auto_renew('subscription-uuid', false);
 */

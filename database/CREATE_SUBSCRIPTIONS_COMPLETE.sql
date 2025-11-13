/**
 * CONFIGURATION COMPLÈTE - SYSTÈME D'ABONNEMENTS
 * Active les stats réelles : MRR, ARR, graphiques de distribution
 * 
 * Ce script crée :
 * 1. Table school_group_subscriptions
 * 2. Foreign keys et contraintes
 * 3. Index pour performance
 * 4. RLS (Row Level Security)
 * 5. Triggers automatiques
 * 6. Fonctions utilitaires
 * 7. Données de test (optionnel)
 * 
 * Exécution : Copier-coller dans Supabase SQL Editor
 * Temps : ~30 secondes
 */

-- ============================================
-- PARTIE 1 : NETTOYAGE (si table existe déjà)
-- ============================================

-- Supprimer la table si elle existe (ATTENTION : perte de données)
DROP TABLE IF EXISTS school_group_subscriptions CASCADE;

-- ============================================
-- PARTIE 2 : CRÉATION TABLE PRINCIPALE
-- ============================================

CREATE TABLE school_group_subscriptions (
  -- Identifiants
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relations
  school_group_id UUID NOT NULL REFERENCES school_groups(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  
  -- Statut de l'abonnement
  status TEXT NOT NULL DEFAULT 'active',
  
  -- Dates
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  trial_end_date TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  -- Facturation
  billing_cycle TEXT NOT NULL DEFAULT 'monthly', -- monthly, yearly, quarterly, biannual
  next_billing_date TIMESTAMPTZ,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  
  -- Contraintes
  CONSTRAINT valid_status CHECK (status IN ('active', 'pending', 'expired', 'cancelled', 'suspended')),
  CONSTRAINT valid_billing_cycle CHECK (billing_cycle IN ('monthly', 'yearly', 'quarterly', 'biannual')),
  CONSTRAINT valid_dates CHECK (
    (end_date IS NULL OR end_date > start_date) AND
    (trial_end_date IS NULL OR trial_end_date >= start_date)
  ),
  CONSTRAINT unique_active_subscription UNIQUE (school_group_id, status) 
    WHERE status = 'active' -- Un seul abonnement actif par groupe
);

-- Commentaires
COMMENT ON TABLE school_group_subscriptions IS 'Abonnements des groupes scolaires aux plans';
COMMENT ON COLUMN school_group_subscriptions.status IS 'active: en cours, pending: en attente, expired: expiré, cancelled: annulé, suspended: suspendu';
COMMENT ON COLUMN school_group_subscriptions.billing_cycle IS 'Cycle de facturation : monthly, yearly, quarterly, biannual';
COMMENT ON COLUMN school_group_subscriptions.metadata IS 'Données additionnelles en JSON (historique, raisons annulation, etc.)';

-- ============================================
-- PARTIE 3 : INDEX POUR PERFORMANCE
-- ============================================

-- Index essentiels
CREATE INDEX idx_subscriptions_group ON school_group_subscriptions(school_group_id);
CREATE INDEX idx_subscriptions_plan ON school_group_subscriptions(plan_id);
CREATE INDEX idx_subscriptions_status ON school_group_subscriptions(status);
CREATE INDEX idx_subscriptions_dates ON school_group_subscriptions(start_date, end_date);
CREATE INDEX idx_subscriptions_billing ON school_group_subscriptions(next_billing_date) WHERE status = 'active';

-- Index composites pour requêtes fréquentes
CREATE INDEX idx_subscriptions_active_plan ON school_group_subscriptions(plan_id, status) WHERE status = 'active';
CREATE INDEX idx_subscriptions_expiring ON school_group_subscriptions(end_date) 
  WHERE status = 'active' AND end_date IS NOT NULL;

-- Index JSONB pour metadata
CREATE INDEX idx_subscriptions_metadata ON school_group_subscriptions USING gin(metadata);

-- ============================================
-- PARTIE 4 : TRIGGER UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_subscriptions_updated_at
  BEFORE UPDATE ON school_group_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

-- ============================================
-- PARTIE 5 : TRIGGER AUTO-EXPIRATION
-- ============================================

CREATE OR REPLACE FUNCTION auto_expire_subscriptions()
RETURNS void AS $$
BEGIN
  -- Marquer comme expirés les abonnements dont la date de fin est dépassée
  UPDATE school_group_subscriptions
  SET 
    status = 'expired',
    updated_at = NOW()
  WHERE 
    status = 'active'
    AND end_date IS NOT NULL
    AND end_date < NOW();
    
  RAISE NOTICE 'Abonnements expirés mis à jour';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_expire_subscriptions IS 'Marque automatiquement les abonnements expirés (à exécuter via cron)';

-- ============================================
-- PARTIE 6 : FONCTION CALCUL MRR
-- ============================================

CREATE OR REPLACE FUNCTION calculate_subscription_mrr(
  p_plan_id UUID,
  p_billing_cycle TEXT
)
RETURNS NUMERIC AS $$
DECLARE
  v_plan_price NUMERIC;
  v_mrr NUMERIC;
BEGIN
  -- Récupérer le prix du plan
  SELECT price INTO v_plan_price
  FROM subscription_plans
  WHERE id = p_plan_id;
  
  IF v_plan_price IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Convertir en MRR selon le cycle de facturation
  CASE p_billing_cycle
    WHEN 'monthly' THEN
      v_mrr := v_plan_price;
    WHEN 'quarterly' THEN
      v_mrr := v_plan_price / 3;
    WHEN 'biannual' THEN
      v_mrr := v_plan_price / 6;
    WHEN 'yearly' THEN
      v_mrr := v_plan_price / 12;
    ELSE
      v_mrr := v_plan_price;
  END CASE;
  
  RETURN ROUND(v_mrr, 2);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_subscription_mrr IS 'Calcule le MRR (Monthly Recurring Revenue) d''un abonnement';

-- ============================================
-- PARTIE 7 : VUE STATS ABONNEMENTS
-- ============================================

CREATE OR REPLACE VIEW subscription_stats AS
SELECT
  -- Compteurs par statut
  COUNT(*) FILTER (WHERE status = 'active') as active_subscriptions,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_subscriptions,
  COUNT(*) FILTER (WHERE status = 'expired') as expired_subscriptions,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_subscriptions,
  COUNT(*) FILTER (WHERE status = 'suspended') as suspended_subscriptions,
  
  -- Total
  COUNT(*) as total_subscriptions,
  
  -- MRR/ARR (calculés via la fonction)
  COALESCE(SUM(
    CASE 
      WHEN status = 'active' THEN calculate_subscription_mrr(plan_id, billing_cycle)
      ELSE 0
    END
  ), 0) as total_mrr,
  
  COALESCE(SUM(
    CASE 
      WHEN status = 'active' THEN calculate_subscription_mrr(plan_id, billing_cycle) * 12
      ELSE 0
    END
  ), 0) as total_arr,
  
  -- Abonnements expirant bientôt (30 jours)
  COUNT(*) FILTER (
    WHERE status = 'active' 
    AND end_date IS NOT NULL 
    AND end_date BETWEEN NOW() AND NOW() + INTERVAL '30 days'
  ) as expiring_soon,
  
  -- Nouveaux abonnements (30 derniers jours)
  COUNT(*) FILTER (
    WHERE created_at >= NOW() - INTERVAL '30 days'
  ) as new_subscriptions_30d,
  
  -- Annulations (30 derniers jours)
  COUNT(*) FILTER (
    WHERE status = 'cancelled'
    AND cancelled_at >= NOW() - INTERVAL '30 days'
  ) as cancelled_30d
  
FROM school_group_subscriptions;

COMMENT ON VIEW subscription_stats IS 'Vue agrégée des statistiques d''abonnements (MRR, ARR, compteurs)';

-- ============================================
-- PARTIE 8 : VUE DISTRIBUTION PAR PLAN
-- ============================================

CREATE OR REPLACE VIEW plan_distribution AS
SELECT
  sp.id as plan_id,
  sp.name as plan_name,
  sp.slug as plan_slug,
  sp.plan_type,
  sp.price as plan_price,
  
  -- Compteurs
  COUNT(sgs.id) FILTER (WHERE sgs.status = 'active') as active_subscriptions,
  COUNT(sgs.id) as total_subscriptions,
  
  -- MRR par plan
  COALESCE(SUM(
    CASE 
      WHEN sgs.status = 'active' THEN calculate_subscription_mrr(sgs.plan_id, sgs.billing_cycle)
      ELSE 0
    END
  ), 0) as plan_mrr,
  
  -- Pourcentage du total
  ROUND(
    COUNT(sgs.id) FILTER (WHERE sgs.status = 'active')::NUMERIC * 100.0 / 
    NULLIF((SELECT COUNT(*) FROM school_group_subscriptions WHERE status = 'active'), 0),
    2
  ) as percentage_of_total

FROM subscription_plans sp
LEFT JOIN school_group_subscriptions sgs ON sgs.plan_id = sp.id
WHERE sp.is_active = true
GROUP BY sp.id, sp.name, sp.slug, sp.plan_type, sp.price
ORDER BY active_subscriptions DESC;

COMMENT ON VIEW plan_distribution IS 'Distribution des abonnements par plan avec MRR';

-- ============================================
-- PARTIE 9 : RLS (ROW LEVEL SECURITY)
-- ============================================

-- Activer RLS
ALTER TABLE school_group_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy 1 : Super Admin peut tout voir et modifier
CREATE POLICY "Super Admin can manage all subscriptions"
  ON school_group_subscriptions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Policy 2 : Admin Groupe peut voir son abonnement
CREATE POLICY "Admin Groupe can view own subscription"
  ON school_group_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin_groupe'
      AND users.school_group_id = school_group_subscriptions.school_group_id
    )
  );

-- Policy 3 : Admin Groupe peut demander upgrade (via fonction dédiée)
CREATE POLICY "Admin Groupe can request upgrade"
  ON school_group_subscriptions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin_groupe'
      AND users.school_group_id = school_group_subscriptions.school_group_id
    )
  )
  WITH CHECK (
    -- Seul le Super Admin peut changer le plan_id
    (OLD.plan_id = NEW.plan_id) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- ============================================
-- PARTIE 10 : FONCTION CRÉATION ABONNEMENT
-- ============================================

CREATE OR REPLACE FUNCTION create_subscription(
  p_school_group_id UUID,
  p_plan_id UUID,
  p_billing_cycle TEXT DEFAULT 'monthly',
  p_trial_days INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_subscription_id UUID;
  v_end_date TIMESTAMPTZ;
  v_trial_end_date TIMESTAMPTZ;
BEGIN
  -- Calculer les dates
  IF p_billing_cycle = 'yearly' THEN
    v_end_date := NOW() + INTERVAL '1 year';
  ELSIF p_billing_cycle = 'quarterly' THEN
    v_end_date := NOW() + INTERVAL '3 months';
  ELSIF p_billing_cycle = 'biannual' THEN
    v_end_date := NOW() + INTERVAL '6 months';
  ELSE
    v_end_date := NOW() + INTERVAL '1 month';
  END IF;
  
  -- Date fin essai
  IF p_trial_days IS NOT NULL AND p_trial_days > 0 THEN
    v_trial_end_date := NOW() + (p_trial_days || ' days')::INTERVAL;
  END IF;
  
  -- Annuler l'abonnement actif existant
  UPDATE school_group_subscriptions
  SET 
    status = 'cancelled',
    cancelled_at = NOW(),
    updated_at = NOW()
  WHERE 
    school_group_id = p_school_group_id
    AND status = 'active';
  
  -- Créer le nouvel abonnement
  INSERT INTO school_group_subscriptions (
    school_group_id,
    plan_id,
    billing_cycle,
    start_date,
    end_date,
    trial_end_date,
    status,
    next_billing_date,
    created_by
  ) VALUES (
    p_school_group_id,
    p_plan_id,
    p_billing_cycle,
    NOW(),
    v_end_date,
    v_trial_end_date,
    'active',
    v_end_date,
    auth.uid()
  )
  RETURNING id INTO v_subscription_id;
  
  RETURN v_subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_subscription IS 'Crée un nouvel abonnement pour un groupe scolaire';

-- ============================================
-- PARTIE 11 : FONCTION ANNULATION
-- ============================================

CREATE OR REPLACE FUNCTION cancel_subscription(
  p_subscription_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_metadata JSONB;
BEGIN
  -- Récupérer metadata existant
  SELECT metadata INTO v_metadata
  FROM school_group_subscriptions
  WHERE id = p_subscription_id;
  
  -- Ajouter la raison d'annulation
  IF p_reason IS NOT NULL THEN
    v_metadata := jsonb_set(
      COALESCE(v_metadata, '{}'::jsonb),
      '{cancellation_reason}',
      to_jsonb(p_reason)
    );
  END IF;
  
  -- Mettre à jour l'abonnement
  UPDATE school_group_subscriptions
  SET 
    status = 'cancelled',
    cancelled_at = NOW(),
    metadata = v_metadata,
    updated_at = NOW(),
    updated_by = auth.uid()
  WHERE id = p_subscription_id
  AND status = 'active';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cancel_subscription IS 'Annule un abonnement avec raison optionnelle';

-- ============================================
-- PARTIE 12 : DONNÉES DE TEST (OPTIONNEL)
-- ============================================

-- Décommenter pour créer des données de test

/*
DO $$
DECLARE
  v_group_id UUID;
  v_plan_gratuit UUID;
  v_plan_premium UUID;
  v_plan_pro UUID;
BEGIN
  -- Récupérer les IDs des plans
  SELECT id INTO v_plan_gratuit FROM subscription_plans WHERE slug = 'gratuit' LIMIT 1;
  SELECT id INTO v_plan_premium FROM subscription_plans WHERE slug = 'premium' LIMIT 1;
  SELECT id INTO v_plan_pro FROM subscription_plans WHERE slug = 'pro' LIMIT 1;
  
  -- Créer 3 abonnements de test
  FOR v_group_id IN (SELECT id FROM school_groups LIMIT 3)
  LOOP
    -- Abonnement 1 : Gratuit
    IF v_plan_gratuit IS NOT NULL THEN
      PERFORM create_subscription(v_group_id, v_plan_gratuit, 'monthly', 30);
      EXIT; -- Sortir après le premier
    END IF;
  END LOOP;
  
  -- Abonnement 2 : Premium
  FOR v_group_id IN (SELECT id FROM school_groups OFFSET 1 LIMIT 1)
  LOOP
    IF v_plan_premium IS NOT NULL THEN
      PERFORM create_subscription(v_group_id, v_plan_premium, 'yearly', NULL);
      EXIT;
    END IF;
  END LOOP;
  
  -- Abonnement 3 : Pro
  FOR v_group_id IN (SELECT id FROM school_groups OFFSET 2 LIMIT 1)
  LOOP
    IF v_plan_pro IS NOT NULL THEN
      PERFORM create_subscription(v_group_id, v_plan_pro, 'monthly', NULL);
      EXIT;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Données de test créées avec succès';
END $$;
*/

-- ============================================
-- PARTIE 13 : VÉRIFICATION FINALE
-- ============================================

-- Afficher un résumé
DO $$
DECLARE
  v_table_exists BOOLEAN;
  v_index_count INTEGER;
  v_policy_count INTEGER;
BEGIN
  -- Vérifier table
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'school_group_subscriptions'
  ) INTO v_table_exists;
  
  -- Compter index
  SELECT COUNT(*) INTO v_index_count
  FROM pg_indexes
  WHERE tablename = 'school_group_subscriptions';
  
  -- Compter policies
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE tablename = 'school_group_subscriptions';
  
  -- Afficher résumé
  RAISE NOTICE '========================================';
  RAISE NOTICE 'INSTALLATION TERMINÉE AVEC SUCCÈS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Table créée : %', v_table_exists;
  RAISE NOTICE 'Index créés : %', v_index_count;
  RAISE NOTICE 'Policies RLS : %', v_policy_count;
  RAISE NOTICE 'Vues créées : subscription_stats, plan_distribution';
  RAISE NOTICE 'Fonctions créées : 4 (MRR, création, annulation, expiration)';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Prochaine étape : Décommenter PARTIE 12 pour données de test';
  RAISE NOTICE 'Ou créer abonnements via l''interface Super Admin';
  RAISE NOTICE '========================================';
END $$;

-- ============================================
-- FIN DU SCRIPT
-- ============================================

-- Requêtes de vérification (à exécuter séparément)

-- Voir les stats
-- SELECT * FROM subscription_stats;

-- Voir la distribution par plan
-- SELECT * FROM plan_distribution;

-- Voir tous les abonnements
-- SELECT * FROM school_group_subscriptions ORDER BY created_at DESC;

-- ============================================================================
-- AJOUT DE COLONNES POUR TRACKING AVANCÉ
-- ============================================================================
-- Objectif: Améliorer le suivi des abonnements et analytics
-- ============================================================================

BEGIN;

-- 1. Ajouter la colonne trial_end_date
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ;

COMMENT ON COLUMN subscriptions.trial_end_date IS 'Date de fin de la période d''essai';

-- 2. Ajouter la colonne cancellation_reason
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

COMMENT ON COLUMN subscriptions.cancellation_reason IS 'Raison de l''annulation de l''abonnement';

-- 3. Ajouter la colonne cancelled_at
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

COMMENT ON COLUMN subscriptions.cancelled_at IS 'Date d''annulation de l''abonnement';

-- 4. Ajouter la colonne cancelled_by
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES users(id) ON DELETE SET NULL;

COMMENT ON COLUMN subscriptions.cancelled_by IS 'Utilisateur qui a annulé l''abonnement';

-- 5. Ajouter la colonne renewal_count
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS renewal_count INTEGER DEFAULT 0;

COMMENT ON COLUMN subscriptions.renewal_count IS 'Nombre de renouvellements de l''abonnement';

-- 6. Ajouter la colonne last_renewal_date
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS last_renewal_date TIMESTAMPTZ;

COMMENT ON COLUMN subscriptions.last_renewal_date IS 'Date du dernier renouvellement';

-- 7. Créer un index sur trial_end_date pour les requêtes d'alertes
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_end_date 
ON subscriptions(trial_end_date) 
WHERE status = 'trial';

-- 8. Créer un index sur end_date pour les alertes d'expiration
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date 
ON subscriptions(end_date) 
WHERE status = 'active';

COMMIT;

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================

SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'subscriptions'
AND column_name IN (
  'trial_end_date',
  'cancellation_reason',
  'cancelled_at',
  'cancelled_by',
  'renewal_count',
  'last_renewal_date'
)
ORDER BY column_name;

-- ============================================================================
-- RÉSULTAT ATTENDU
-- ============================================================================
-- ✅ 6 nouvelles colonnes ajoutées
-- ✅ Indexes créés pour performance
-- ✅ Commentaires ajoutés pour documentation
-- ============================================================================

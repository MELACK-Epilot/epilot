-- Création de la table d'historique des abonnements
CREATE TABLE IF NOT EXISTS subscription_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    previous_value JSONB,
    new_value JSONB,
    reason TEXT,
    performed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour la performance
CREATE INDEX idx_subscription_history_subscription_id ON subscription_history(subscription_id);
CREATE INDEX idx_subscription_history_created_at ON subscription_history(created_at DESC);

-- Commentaire
COMMENT ON TABLE subscription_history IS 'Historique complet des modifications des abonnements (Audit Log)';

-- Ajouter la colonne transaction_id à la table subscriptions
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS transaction_id TEXT;

-- Commentaire pour documentation
COMMENT ON COLUMN subscriptions.transaction_id IS 'Identifiant unique de la transaction de paiement (ex: ID Stripe, Reference Mobile Money)';

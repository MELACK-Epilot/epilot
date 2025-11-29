-- Table pour l'historique des emails envoyés
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  email_type TEXT NOT NULL CHECK (email_type IN ('receipt', 'reminder', 'overdue')),
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les recherches
CREATE INDEX idx_email_logs_payment_id ON email_logs(payment_id);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_created_at ON email_logs(created_at DESC);

-- RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Policy : Les utilisateurs peuvent voir les logs de leurs paiements
CREATE POLICY "Users can view their email logs"
  ON email_logs
  FOR SELECT
  USING (
    payment_id IN (
      SELECT p.id 
      FROM payments p
      JOIN subscriptions s ON p.subscription_id = s.id
      WHERE s.school_group_id = (
        SELECT school_group_id 
        FROM user_profiles 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Commentaire
COMMENT ON TABLE email_logs IS 'Historique des emails envoyés pour les paiements';

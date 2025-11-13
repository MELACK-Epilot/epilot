-- =====================================================
-- E-PILOT CONGO - PLANS & ABONNEMENTS
-- Gestion des plans tarifaires et abonnements
-- =====================================================

-- 1. TABLE: plans
-- Définition des plans d'abonnement disponibles
-- =====================================================
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL DEFAULT 'FCFA',
  billing_period VARCHAR(20) NOT NULL DEFAULT 'monthly',
  features JSONB DEFAULT '[]'::jsonb,
  max_schools INTEGER NOT NULL DEFAULT 1,
  max_students INTEGER NOT NULL DEFAULT 100,
  max_staff INTEGER NOT NULL DEFAULT 10,
  max_storage INTEGER NOT NULL DEFAULT 5, -- En GB
  support_level VARCHAR(20) NOT NULL DEFAULT 'email',
  custom_branding BOOLEAN DEFAULT false,
  api_access BOOLEAN DEFAULT false,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  is_popular BOOLEAN DEFAULT false,
  discount DECIMAL(5, 2) DEFAULT 0, -- Pourcentage
  trial_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT plans_slug_check CHECK (slug IN ('gratuit', 'premium', 'pro', 'institutionnel')),
  CONSTRAINT plans_currency_check CHECK (currency IN ('FCFA', 'EUR', 'USD')),
  CONSTRAINT plans_billing_check CHECK (billing_period IN ('monthly', 'yearly')),
  CONSTRAINT plans_support_check CHECK (support_level IN ('email', 'priority', '24/7')),
  CONSTRAINT plans_status_check CHECK (status IN ('active', 'inactive', 'archived'))
);

-- 2. TABLE: subscriptions
-- Gestion des abonnements des groupes scolaires
-- =====================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_group_id UUID NOT NULL REFERENCES school_groups(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  trial_end_date DATE,
  auto_renew BOOLEAN DEFAULT true,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'FCFA',
  billing_period VARCHAR(20) NOT NULL,
  payment_method VARCHAR(30) NOT NULL DEFAULT 'bank_transfer',
  last_payment_date DATE,
  next_payment_date DATE,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  invoice_number VARCHAR(50),
  notes TEXT,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES users(id),
  cancel_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT subscriptions_status_check CHECK (status IN ('active', 'expired', 'cancelled', 'pending', 'trial', 'suspended')),
  CONSTRAINT subscriptions_currency_check CHECK (currency IN ('FCFA', 'EUR', 'USD')),
  CONSTRAINT subscriptions_billing_check CHECK (billing_period IN ('monthly', 'yearly')),
  CONSTRAINT subscriptions_payment_method_check CHECK (payment_method IN ('bank_transfer', 'mobile_money', 'card', 'cash')),
  CONSTRAINT subscriptions_payment_status_check CHECK (payment_status IN ('paid', 'pending', 'overdue', 'failed')),
  CONSTRAINT subscriptions_dates_check CHECK (end_date > start_date)
);

-- 3. TABLE: subscription_history
-- Historique des changements d'abonnements
-- =====================================================
CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  school_group_id UUID NOT NULL REFERENCES school_groups(id) ON DELETE CASCADE,
  action VARCHAR(30) NOT NULL,
  old_plan_id UUID REFERENCES plans(id),
  new_plan_id UUID REFERENCES plans(id),
  amount DECIMAL(10, 2),
  reason TEXT,
  performed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT subscription_history_action_check CHECK (action IN ('created', 'renewed', 'upgraded', 'downgraded', 'cancelled', 'suspended', 'reactivated'))
);

-- 4. INDEX pour optimiser les performances
-- =====================================================
CREATE INDEX idx_plans_slug ON plans(slug);
CREATE INDEX idx_plans_status ON plans(status);
CREATE INDEX idx_subscriptions_school_group ON subscriptions(school_group_id);
CREATE INDEX idx_subscriptions_plan ON subscriptions(plan_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_payment_status ON subscriptions(payment_status);
CREATE INDEX idx_subscriptions_end_date ON subscriptions(end_date);
CREATE INDEX idx_subscription_history_subscription ON subscription_history(subscription_id);
CREATE INDEX idx_subscription_history_school_group ON subscription_history(school_group_id);

-- 5. TRIGGERS pour updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- Politique: Super Admin a accès total
CREATE POLICY "Super Admin full access on plans" ON plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

CREATE POLICY "Super Admin full access on subscriptions" ON subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

CREATE POLICY "Super Admin full access on subscription_history" ON subscription_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Politique: Admin Groupe peut voir ses abonnements
CREATE POLICY "Admin Groupe can view their subscriptions" ON subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin_groupe'
      AND users.school_group_id = subscriptions.school_group_id
    )
  );

-- 7. INSERTION DES PLANS PAR DÉFAUT
-- =====================================================

-- Plan Gratuit (Essai)
INSERT INTO plans (name, slug, description, price, currency, billing_period, features, max_schools, max_students, max_staff, max_storage, support_level, custom_branding, api_access, status, is_popular, trial_days)
VALUES (
  'Plan Gratuit',
  'gratuit',
  'Idéal pour découvrir E-Pilot avec une école de petite taille',
  0,
  'FCFA',
  'monthly',
  '["Gestion de base des élèves", "Gestion des notes", "Bulletins scolaires", "Support par email", "1 école maximum"]'::jsonb,
  1,
  100,
  10,
  5,
  'email',
  false,
  false,
  'active',
  false,
  30
) ON CONFLICT (slug) DO NOTHING;

-- Plan Premium
INSERT INTO plans (name, slug, description, price, currency, billing_period, features, max_schools, max_students, max_staff, max_storage, support_level, custom_branding, api_access, status, is_popular, trial_days)
VALUES (
  'Plan Premium',
  'premium',
  'Pour les groupes scolaires en croissance avec plusieurs établissements',
  75000,
  'FCFA',
  'monthly',
  '["Jusqu''à 5 écoles", "Gestion complète des élèves", "Gestion financière avancée", "Gestion RH", "Support prioritaire", "Rapports avancés", "20 Go de stockage"]'::jsonb,
  5,
  1000,
  100,
  20,
  'priority',
  false,
  false,
  'active',
  true,
  14
) ON CONFLICT (slug) DO NOTHING;

-- Plan Pro
INSERT INTO plans (name, slug, description, price, currency, billing_period, features, max_schools, max_students, max_staff, max_storage, support_level, custom_branding, api_access, status, is_popular, trial_days)
VALUES (
  'Plan Pro',
  'pro',
  'Solution complète pour les grands groupes scolaires',
  150000,
  'FCFA',
  'monthly',
  '["Jusqu''à 15 écoles", "Tous les modules inclus", "Gestion multi-sites", "API complète", "Branding personnalisé", "Support 24/7", "100 Go de stockage", "Formation incluse"]'::jsonb,
  15,
  5000,
  500,
  100,
  '24/7',
  true,
  true,
  'active',
  false,
  14
) ON CONFLICT (slug) DO NOTHING;

-- Plan Institutionnel
INSERT INTO plans (name, slug, description, price, currency, billing_period, features, max_schools, max_students, max_staff, max_storage, support_level, custom_branding, api_access, status, is_popular, trial_days)
VALUES (
  'Plan Institutionnel',
  'institutionnel',
  'Solution sur mesure pour les grandes institutions éducatives',
  0, -- Prix sur devis
  'FCFA',
  'yearly',
  '["Écoles illimitées", "Élèves illimités", "Tous les modules premium", "API complète", "Branding personnalisé", "Support dédié 24/7", "Stockage illimité", "Formation sur site", "Développements personnalisés", "SLA garanti"]'::jsonb,
  999999,
  999999,
  999999,
  999999,
  '24/7',
  true,
  true,
  'active',
  false,
  30
) ON CONFLICT (slug) DO NOTHING;

-- 8. COMMENTAIRES
-- =====================================================
COMMENT ON TABLE plans IS 'Plans d''abonnement disponibles sur la plateforme E-Pilot';
COMMENT ON TABLE subscriptions IS 'Abonnements actifs des groupes scolaires';
COMMENT ON TABLE subscription_history IS 'Historique des changements d''abonnements';
COMMENT ON COLUMN plans.slug IS 'Identifiant unique du plan (gratuit, premium, pro, institutionnel)';
COMMENT ON COLUMN plans.trial_days IS 'Nombre de jours d''essai gratuit';
COMMENT ON COLUMN subscriptions.auto_renew IS 'Renouvellement automatique activé';
COMMENT ON COLUMN subscriptions.payment_status IS 'Statut du paiement (paid, pending, overdue, failed)';

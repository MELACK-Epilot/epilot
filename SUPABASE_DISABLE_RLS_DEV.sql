-- ============================================
-- E-PILOT CONGO - DÉSACTIVATION RLS POUR DÉVELOPPEMENT
-- ⚠️ À UTILISER UNIQUEMENT EN DÉVELOPPEMENT
-- ============================================

-- Désactiver RLS sur school_groups pour permettre les tests
ALTER TABLE school_groups DISABLE ROW LEVEL SECURITY;

-- Désactiver RLS sur users pour permettre les tests
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Désactiver RLS sur schools pour permettre les tests
ALTER TABLE schools DISABLE ROW LEVEL SECURITY;

-- Désactiver RLS sur plans pour permettre les tests
ALTER TABLE plans DISABLE ROW LEVEL SECURITY;

-- Désactiver RLS sur subscriptions pour permettre les tests
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;

-- Désactiver RLS sur business_categories pour permettre les tests
ALTER TABLE business_categories DISABLE ROW LEVEL SECURITY;

-- Désactiver RLS sur modules pour permettre les tests
ALTER TABLE modules DISABLE ROW LEVEL SECURITY;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '⚠️  RLS DÉSACTIVÉ POUR LE DÉVELOPPEMENT';
  RAISE NOTICE 'Les tables sont maintenant accessibles sans authentification';
  RAISE NOTICE '🔒 IMPORTANT: Réactivez RLS avant la mise en production !';
END $$;

-- Pour réactiver RLS plus tard (PRODUCTION) :
-- ALTER TABLE school_groups ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- etc...

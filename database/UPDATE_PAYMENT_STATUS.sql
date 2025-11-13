/**
 * Mise à jour du statut de paiement des abonnements
 * Permet de modifier payment_status selon les besoins
 * @module UPDATE_PAYMENT_STATUS
 */

-- =====================================================
-- OPTION 1 : VOIR LES STATUTS ACTUELS
-- =====================================================

SELECT 
  sg.name as groupe,
  sp.name as plan,
  s.amount as montant,
  s.payment_status as statut_paiement,
  s.payment_method as methode_paiement,
  s.last_payment_date as dernier_paiement,
  s.created_at as date_creation
FROM subscriptions s
INNER JOIN school_groups sg ON sg.id = s.school_group_id
INNER JOIN subscription_plans sp ON sp.id = s.plan_id
ORDER BY sg.name;

-- =====================================================
-- OPTION 2 : METTRE UN ABONNEMENT EN "EN ATTENTE"
-- =====================================================

-- Exemple : Mettre LAMARELLE en "pending"
-- UPDATE subscriptions
-- SET 
--   payment_status = 'pending',
--   updated_at = NOW()
-- WHERE school_group_id = (
--   SELECT id FROM school_groups WHERE name = 'LAMARELLE'
-- );

-- =====================================================
-- OPTION 3 : METTRE UN ABONNEMENT EN "EN RETARD"
-- =====================================================

-- Exemple : Mettre un groupe en "overdue"
-- UPDATE subscriptions
-- SET 
--   payment_status = 'overdue',
--   updated_at = NOW()
-- WHERE school_group_id = (
--   SELECT id FROM school_groups WHERE code = 'E-PILOT-003'
-- );

-- =====================================================
-- OPTION 4 : METTRE TOUS LES ABONNEMENTS GRATUITS EN "PAYÉ"
-- =====================================================

-- Les plans gratuits devraient toujours être "paid"
UPDATE subscriptions
SET 
  payment_status = 'paid',
  updated_at = NOW()
WHERE plan_id IN (
  SELECT id FROM subscription_plans WHERE slug = 'gratuit'
)
AND payment_status != 'paid';

-- =====================================================
-- OPTION 5 : DÉFINIR DES RÈGLES AUTOMATIQUES
-- =====================================================

-- Mettre en "overdue" si la date de fin est dépassée et non payé
UPDATE subscriptions
SET 
  payment_status = 'overdue',
  updated_at = NOW()
WHERE end_date < CURRENT_DATE
  AND payment_status = 'pending'
  AND status = 'active';

-- =====================================================
-- VÉRIFIER LES MODIFICATIONS
-- =====================================================

SELECT 
  sg.name as groupe,
  sp.name as plan,
  s.payment_status as statut_paiement,
  CASE 
    WHEN s.payment_status = 'paid' THEN '✅ Payé'
    WHEN s.payment_status = 'pending' THEN '⏳ En attente'
    WHEN s.payment_status = 'overdue' THEN '⚠️ En retard'
    WHEN s.payment_status = 'failed' THEN '❌ Échoué'
  END as statut_lisible
FROM subscriptions s
INNER JOIN school_groups sg ON sg.id = s.school_group_id
INNER JOIN subscription_plans sp ON sp.id = s.plan_id
ORDER BY sg.name;

-- =====================================================
-- MESSAGES D'INFORMATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📋 STATUTS DE PAIEMENT DISPONIBLES :';
  RAISE NOTICE '   - paid : Paiement effectué ✅';
  RAISE NOTICE '   - pending : En attente de paiement ⏳';
  RAISE NOTICE '   - overdue : Paiement en retard ⚠️';
  RAISE NOTICE '   - failed : Paiement échoué ❌';
  RAISE NOTICE '';
  RAISE NOTICE '💡 UTILISATION :';
  RAISE NOTICE '   1. Décommenter l''option souhaitée (OPTION 2, 3, etc.)';
  RAISE NOTICE '   2. Modifier le nom du groupe ou le code';
  RAISE NOTICE '   3. Exécuter le script';
  RAISE NOTICE '   4. Rafraîchir la page /dashboard/subscriptions';
END $$;

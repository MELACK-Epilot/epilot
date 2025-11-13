-- ============================================
-- VUES FINANCIÈRES COMPLÉMENTAIRES E-PILOT CONGO
-- À exécuter APRÈS SUPABASE_PAYMENTS_ALERTS.sql
-- Table payments existe déjà, on ajoute les vues
-- ============================================

-- ============================================
-- 1. VUE FINANCIAL_STATS
-- Statistiques financières globales
-- ============================================

CREATE OR REPLACE VIEW financial_stats AS
SELECT
  -- Abonnements
  COUNT(DISTINCT s.id) AS total_subscriptions,
  COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.id END) AS active_subscriptions,
  COUNT(DISTINCT CASE WHEN s.status = 'pending' THEN s.id END) AS pending_subscriptions,
  COUNT(DISTINCT CASE WHEN s.status = 'expired' THEN s.id END) AS expired_subscriptions,
  COUNT(DISTINCT CASE WHEN s.status = 'cancelled' THEN s.id END) AS cancelled_subscriptions,
  COUNT(DISTINCT CASE WHEN s.status = 'trial' THEN s.id END) AS trial_subscriptions,
  
  -- Revenus totaux
  COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) AS total_revenue,
  
  -- Revenus mensuels (30 derniers jours)
  COALESCE(SUM(CASE 
    WHEN p.status = 'completed' 
    AND p.paid_at >= NOW() - INTERVAL '30 days' 
    THEN p.amount 
    ELSE 0 
  END), 0) AS monthly_revenue,
  
  -- Revenus annuels (365 derniers jours)
  COALESCE(SUM(CASE 
    WHEN p.status = 'completed' 
    AND p.paid_at >= NOW() - INTERVAL '365 days' 
    THEN p.amount 
    ELSE 0 
  END), 0) AS yearly_revenue,
  
  -- Paiements en retard (pas de due_date dans la table existante, on utilise created_at + 30 jours)
  COUNT(DISTINCT CASE 
    WHEN p.status = 'pending' 
    AND p.created_at < NOW() - INTERVAL '30 days'
    THEN p.id 
  END) AS overdue_payments,
  
  COALESCE(SUM(CASE 
    WHEN p.status = 'pending' 
    AND p.created_at < NOW() - INTERVAL '30 days'
    THEN p.amount 
    ELSE 0 
  END), 0) AS overdue_amount,
  
  -- Revenus ce mois (mois calendaire)
  COALESCE(SUM(CASE 
    WHEN p.status = 'completed' 
    AND DATE_TRUNC('month', p.paid_at) = DATE_TRUNC('month', NOW()) 
    THEN p.amount 
    ELSE 0 
  END), 0) AS current_month_revenue,
  
  -- Revenus mois dernier
  COALESCE(SUM(CASE 
    WHEN p.status = 'completed' 
    AND DATE_TRUNC('month', p.paid_at) = DATE_TRUNC('month', NOW() - INTERVAL '1 month') 
    THEN p.amount 
    ELSE 0 
  END), 0) AS last_month_revenue,
  
  -- Croissance (%)
  CASE 
    WHEN SUM(CASE 
      WHEN p.status = 'completed' 
      AND DATE_TRUNC('month', p.paid_at) = DATE_TRUNC('month', NOW() - INTERVAL '1 month') 
      THEN p.amount 
      ELSE 0 
    END) > 0 
    THEN (
      (SUM(CASE 
        WHEN p.status = 'completed' 
        AND DATE_TRUNC('month', p.paid_at) = DATE_TRUNC('month', NOW()) 
        THEN p.amount 
        ELSE 0 
      END) - SUM(CASE 
        WHEN p.status = 'completed' 
        AND DATE_TRUNC('month', p.paid_at) = DATE_TRUNC('month', NOW() - INTERVAL '1 month') 
        THEN p.amount 
        ELSE 0 
      END)) / NULLIF(SUM(CASE 
        WHEN p.status = 'completed' 
        AND DATE_TRUNC('month', p.paid_at) = DATE_TRUNC('month', NOW() - INTERVAL '1 month') 
        THEN p.amount 
        ELSE 0 
      END), 0)
    ) * 100
    ELSE 0 
  END AS revenue_growth,
  
  -- Revenu moyen par groupe
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.school_group_id END) > 0 
    THEN COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) / 
         NULLIF(COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.school_group_id END), 0)
    ELSE 0 
  END AS average_revenue_per_group,
  
  -- Taux de churn (annulés / total)
  CASE 
    WHEN COUNT(DISTINCT s.id) > 0 
    THEN (COUNT(DISTINCT CASE WHEN s.status = 'cancelled' THEN s.id END)::DECIMAL / NULLIF(COUNT(DISTINCT s.id), 0)) * 100
    ELSE 0 
  END AS churn_rate

FROM subscriptions s
LEFT JOIN payments p ON s.id = p.subscription_id;

-- ============================================
-- 2. VUE PLAN_STATS
-- Statistiques par plan d'abonnement
-- ============================================

CREATE OR REPLACE VIEW plan_stats AS
SELECT
  sp.id AS plan_id,
  sp.name AS plan_name,
  sp.slug AS plan_slug,
  sp.price,
  COUNT(DISTINCT s.id) AS subscription_count,
  COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) AS revenue,
  CASE 
    WHEN (SELECT SUM(CASE WHEN p2.status = 'completed' THEN p2.amount ELSE 0 END) FROM payments p2) > 0
    THEN (COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) / 
          NULLIF((SELECT SUM(CASE WHEN p2.status = 'completed' THEN p2.amount ELSE 0 END) FROM payments p2), 0)) * 100
    ELSE 0
  END AS percentage,
  COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.id END) AS active_count,
  COUNT(DISTINCT CASE WHEN s.status = 'cancelled' THEN s.id END) AS cancelled_count
FROM subscription_plans sp
LEFT JOIN subscriptions s ON sp.id = s.plan_id
LEFT JOIN payments p ON s.id = p.subscription_id
GROUP BY sp.id, sp.name, sp.slug, sp.price
ORDER BY revenue DESC;

-- ============================================
-- 3. FONCTION UTILITAIRE - Marquer paiements en retard
-- ============================================

CREATE OR REPLACE FUNCTION mark_overdue_payments()
RETURNS void AS $$
BEGIN
  -- Marquer comme en retard les paiements pending de plus de 30 jours
  UPDATE payments
  SET 
    status = 'failed',
    updated_at = NOW(),
    notes = COALESCE(notes || ' | ', '') || 'Marqué en retard automatiquement le ' || NOW()::DATE
  WHERE 
    status = 'pending'
    AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. GRANTS - Permissions sur les vues
-- ============================================

GRANT SELECT ON financial_stats TO authenticated;
GRANT SELECT ON plan_stats TO authenticated;

-- ============================================
-- NOTES D'UTILISATION
-- ============================================

-- 1. Voir les stats financières :
-- SELECT * FROM financial_stats;

-- 2. Voir les stats par plan :
-- SELECT * FROM plan_stats;

-- 3. Marquer les paiements en retard (à exécuter quotidiennement) :
-- SELECT mark_overdue_payments();

-- 4. Exemple de requête pour les revenus par période :
-- SELECT 
--   DATE_TRUNC('month', paid_at) AS period,
--   SUM(amount) AS revenue,
--   COUNT(*) AS payment_count
-- FROM payments
-- WHERE status = 'completed'
-- GROUP BY DATE_TRUNC('month', paid_at)
-- ORDER BY period DESC;

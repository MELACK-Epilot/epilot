-- Migration pour corriger la vue financial_stats
-- Problème : Le MRR et l'ARR ne sont pas calculés correctement
-- Solution : Sommer tous les abonnements actifs de tous les plans

-- Supprimer l'ancienne vue si elle existe
DROP VIEW IF EXISTS financial_stats;

-- Créer la nouvelle vue avec calculs corrects
CREATE OR REPLACE VIEW financial_stats AS
SELECT
  -- Compteurs d'abonnements
  COUNT(*) as total_subscriptions,
  COUNT(*) FILTER (WHERE s.status = 'active') as active_subscriptions,
  COUNT(*) FILTER (WHERE s.status = 'pending') as pending_subscriptions,
  COUNT(*) FILTER (WHERE s.status = 'expired') as expired_subscriptions,
  COUNT(*) FILTER (WHERE s.status = 'cancelled') as cancelled_subscriptions,
  COUNT(*) FILTER (WHERE s.status = 'trial') as trial_subscriptions,
  
  -- Revenus totaux (cumul de tous les paiements)
  COALESCE(SUM(
    CASE 
      WHEN s.payment_status = 'paid' THEN s.amount
      ELSE 0
    END
  ), 0) as total_revenue,
  
  -- Revenus mensuels (ce mois)
  COALESCE(SUM(
    CASE 
      WHEN s.payment_status = 'paid' 
        AND DATE_TRUNC('month', s.last_payment_date) = DATE_TRUNC('month', CURRENT_DATE)
      THEN s.amount
      ELSE 0
    END
  ), 0) as monthly_revenue,
  
  -- Revenus annuels (cette année)
  COALESCE(SUM(
    CASE 
      WHEN s.payment_status = 'paid' 
        AND DATE_TRUNC('year', s.last_payment_date) = DATE_TRUNC('year', CURRENT_DATE)
      THEN s.amount
      ELSE 0
    END
  ), 0) as yearly_revenue,
  
  -- Paiements en retard
  COUNT(*) FILTER (WHERE s.payment_status = 'overdue') as overdue_payments,
  COALESCE(SUM(
    CASE 
      WHEN s.payment_status = 'overdue' THEN sp.price
      ELSE 0
    END
  ), 0) as overdue_amount,
  
  -- MRR (Monthly Recurring Revenue) - SOMME DE TOUS LES ABONNEMENTS ACTIFS
  COALESCE(SUM(
    CASE 
      WHEN s.status = 'active' THEN 
        CASE 
          WHEN sp.billing_period = 'monthly' THEN sp.price
          WHEN sp.billing_period = 'yearly' THEN sp.price / 12
          ELSE 0
        END
      ELSE 0
    END
  ), 0) as mrr,
  
  -- ARR (Annual Recurring Revenue) - MRR × 12
  COALESCE(SUM(
    CASE 
      WHEN s.status = 'active' THEN 
        CASE 
          WHEN sp.billing_period = 'monthly' THEN sp.price * 12
          WHEN sp.billing_period = 'yearly' THEN sp.price
          ELSE 0
        END
      ELSE 0
    END
  ), 0) as arr,
  
  -- Taux de croissance (revenus mensuels vs mois précédent)
  CASE 
    WHEN COALESCE(SUM(
      CASE 
        WHEN s.payment_status = 'paid' 
          AND DATE_TRUNC('month', s.last_payment_date) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        THEN s.amount
        ELSE 0
      END
    ), 0) > 0
    THEN (
      (COALESCE(SUM(
        CASE 
          WHEN s.payment_status = 'paid' 
            AND DATE_TRUNC('month', s.last_payment_date) = DATE_TRUNC('month', CURRENT_DATE)
          THEN s.amount
          ELSE 0
        END
      ), 0) - COALESCE(SUM(
        CASE 
          WHEN s.payment_status = 'paid' 
            AND DATE_TRUNC('month', s.last_payment_date) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
          THEN s.amount
          ELSE 0
        END
      ), 0)) / COALESCE(SUM(
        CASE 
          WHEN s.payment_status = 'paid' 
            AND DATE_TRUNC('month', s.last_payment_date) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
          THEN s.amount
          ELSE 0
        END
      ), 0)
    ) * 100
    ELSE 0
  END as revenue_growth,
  
  -- Revenu moyen par groupe
  CASE 
    WHEN COUNT(DISTINCT s.school_group_id) > 0 
    THEN COALESCE(SUM(
      CASE 
        WHEN s.status = 'active' THEN 
          CASE 
            WHEN sp.billing_period = 'monthly' THEN sp.price
            WHEN sp.billing_period = 'yearly' THEN sp.price / 12
            ELSE 0
          END
        ELSE 0
      END
    ), 0) / COUNT(DISTINCT s.school_group_id)
    ELSE 0
  END as average_revenue_per_group,
  
  -- Taux de churn (abonnements annulés / total abonnements)
  CASE 
    WHEN COUNT(*) > 0 
    THEN (COUNT(*) FILTER (WHERE s.status = 'cancelled')::DECIMAL / COUNT(*)) * 100
    ELSE 0
  END as churn_rate,
  
  -- Taux de rétention (100 - churn)
  CASE 
    WHEN COUNT(*) > 0 
    THEN 100 - ((COUNT(*) FILTER (WHERE s.status = 'cancelled')::DECIMAL / COUNT(*)) * 100)
    ELSE 100
  END as retention_rate,
  
  -- Taux de conversion (abonnements actifs / total abonnements)
  CASE 
    WHEN COUNT(*) > 0 
    THEN (COUNT(*) FILTER (WHERE s.status = 'active')::DECIMAL / COUNT(*)) * 100
    ELSE 0
  END as conversion_rate,
  
  -- Lifetime Value (MRR / Churn Rate)
  CASE 
    WHEN COUNT(*) FILTER (WHERE s.status = 'cancelled') > 0 
    THEN COALESCE(SUM(
      CASE 
        WHEN s.status = 'active' THEN 
          CASE 
            WHEN sp.billing_period = 'monthly' THEN sp.price
            WHEN sp.billing_period = 'yearly' THEN sp.price / 12
            ELSE 0
          END
        ELSE 0
      END
    ), 0) / (COUNT(*) FILTER (WHERE s.status = 'cancelled')::DECIMAL / COUNT(*))
    ELSE 0
  END as lifetime_value,
  
  -- Revenus mensuels du mois précédent (pour comparaison)
  COALESCE(SUM(
    CASE 
      WHEN s.payment_status = 'paid' 
        AND DATE_TRUNC('month', s.last_payment_date) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
      THEN s.amount
      ELSE 0
    END
  ), 0) as monthly_revenue_previous,
  
  -- Timestamp de dernière mise à jour
  NOW() as last_updated
  
FROM subscriptions s
INNER JOIN subscription_plans sp ON s.plan_id = sp.id;

-- Ajouter un commentaire sur la vue
COMMENT ON VIEW financial_stats IS 'Vue agrégée des statistiques financières globales - MRR, ARR, revenus, taux de conversion, etc.';

-- Vérifier que la vue fonctionne correctement
SELECT 
  total_subscriptions,
  active_subscriptions,
  mrr,
  arr,
  retention_rate,
  conversion_rate
FROM financial_stats;

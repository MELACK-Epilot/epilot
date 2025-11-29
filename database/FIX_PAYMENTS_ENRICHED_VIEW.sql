-- Migration pour corriger la vue payments_enriched
-- Problème : plan_name est NULL
-- Solution : Corriger la jointure avec subscriptions et subscription_plans

DROP VIEW IF EXISTS payments_enriched;

CREATE OR REPLACE VIEW payments_enriched AS
SELECT 
  p.id,
  p.amount,
  p.currency,
  p.status,
  p.payment_method,
  p.transaction_id,
  p.created_at,
  p.paid_at,
  p.due_date,
  p.invoice_number,
  p.subscription_id,
  
  -- Informations enrichies
  s.school_group_id,
  sg.name as school_group_name,
  sg.code as school_group_code,
  sp.name as plan_name,
  sp.slug as plan_slug,
  
  -- Statut détaillé (ajout de 'overdue' si date dépassée)
  CASE 
    WHEN p.status = 'pending' AND p.due_date < CURRENT_DATE THEN 'overdue'
    ELSE p.status
  END as detailed_status

FROM payments p
LEFT JOIN subscriptions s ON p.subscription_id = s.id
LEFT JOIN school_groups sg ON s.school_group_id = sg.id
LEFT JOIN subscription_plans sp ON s.plan_id = sp.id;

-- Commentaire
COMMENT ON VIEW payments_enriched IS 'Vue enrichie des paiements avec noms des groupes et plans';

-- Vérification
SELECT invoice_number, school_group_name, plan_name, amount, detailed_status FROM payments_enriched LIMIT 5;

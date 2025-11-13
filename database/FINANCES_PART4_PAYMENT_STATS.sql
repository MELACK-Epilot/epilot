-- =====================================================
-- PARTIE 4 : VUE PAYMENT_STATS
-- =====================================================
-- Statistiques des paiements avec calcul des retards
-- Pour la page Paiements
-- =====================================================

DROP VIEW IF EXISTS public.payment_stats CASCADE;

CREATE OR REPLACE VIEW public.payment_stats AS
SELECT 
  fp.id as payment_id,
  fp.school_id,
  s.name as school_name,
  s.school_group_id,
  sg.name as school_group_name,
  fp.student_fee_id,
  fp.amount,
  fp.status,
  fp.payment_date,
  fp.payment_method,
  fp.created_at,
  
  -- Calcul retard (CORRECTION : cast explicite en DATE)
  CASE 
    WHEN fp.status = 'pending' AND fp.payment_date < CURRENT_DATE 
    THEN (CURRENT_DATE::DATE - fp.payment_date::DATE)
    ELSE 0
  END as days_overdue,
  
  -- Statut détaillé
  CASE 
    WHEN fp.status = 'completed' THEN 'completed'
    WHEN fp.status = 'pending' AND fp.payment_date < CURRENT_DATE THEN 'overdue'
    WHEN fp.status = 'pending' AND fp.payment_date >= CURRENT_DATE THEN 'pending'
    WHEN fp.status = 'cancelled' THEN 'cancelled'
    WHEN fp.status = 'failed' THEN 'failed'
    ELSE 'unknown'
  END as detailed_status,
  
  NOW() as last_updated

FROM public.fee_payments fp
JOIN public.schools s ON fp.school_id = s.id
JOIN public.school_groups sg ON s.school_group_id = sg.id

ORDER BY 
  CASE fp.status
    WHEN 'pending' THEN 1
    WHEN 'completed' THEN 2
    ELSE 3
  END,
  fp.payment_date DESC;

COMMENT ON VIEW public.payment_stats IS 'Statistiques des paiements avec calcul automatique des retards';

-- Test
SELECT 
  'payment_stats' as vue,
  COUNT(*) as nb_paiements,
  COUNT(*) FILTER (WHERE status = 'completed') as completes
FROM public.payment_stats;

SELECT '✅ PARTIE 4 : Vue payment_stats créée avec succès !' as status;

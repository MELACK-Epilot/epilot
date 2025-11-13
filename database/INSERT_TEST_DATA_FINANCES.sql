-- ============================================================================
-- DONNÉES DE TEST POUR LES FINANCES
-- Ajoute des paiements et dépenses de test pour voir les KPIs fonctionner
-- Date : 7 novembre 2025
-- ============================================================================

-- ÉTAPE 1 : Vérifier les données existantes
SELECT 
  'Paiements' as type,
  COUNT(*) as count,
  COALESCE(SUM(amount), 0) as total
FROM fee_payments
UNION ALL
SELECT 
  'Dépenses',
  COUNT(*),
  COALESCE(SUM(amount), 0)
FROM school_expenses
UNION ALL
SELECT 
  'Écoles',
  COUNT(*),
  0
FROM schools;

-- ÉTAPE 2 : Ajouter des paiements de test (si aucun n'existe)
DO $$
DECLARE
  v_school_id uuid;
  v_student_id uuid;
  v_count integer;
BEGIN
  -- Vérifier s'il y a déjà des paiements
  SELECT COUNT(*) INTO v_count FROM fee_payments;
  
  IF v_count = 0 THEN
    -- Récupérer une école
    SELECT id INTO v_school_id FROM schools LIMIT 1;
    
    IF v_school_id IS NOT NULL THEN
      -- Récupérer un étudiant
      SELECT id INTO v_student_id FROM students WHERE school_id = v_school_id LIMIT 1;
      
      IF v_student_id IS NOT NULL THEN
        -- Ajouter des paiements de test pour les 3 derniers mois
        
        -- Mois actuel (Novembre 2025)
        INSERT INTO fee_payments (school_id, student_id, amount, status, payment_date, fee_type, description)
        VALUES 
          (v_school_id, v_student_id, 50000, 'completed', '2025-11-05', 'scolarite', 'Frais de scolarité Novembre'),
          (v_school_id, v_student_id, 30000, 'completed', '2025-11-10', 'inscription', 'Frais d''inscription'),
          (v_school_id, v_student_id, 20000, 'completed', '2025-11-15', 'cantine', 'Frais de cantine'),
          (v_school_id, v_student_id, 15000, 'pending', '2025-11-20', 'transport', 'Frais de transport'),
          (v_school_id, v_student_id, 25000, 'overdue', '2025-11-01', 'scolarite', 'Frais en retard');
        
        -- Mois précédent (Octobre 2025)
        INSERT INTO fee_payments (school_id, student_id, amount, status, payment_date, fee_type, description)
        VALUES 
          (v_school_id, v_student_id, 45000, 'completed', '2025-10-05', 'scolarite', 'Frais de scolarité Octobre'),
          (v_school_id, v_student_id, 28000, 'completed', '2025-10-12', 'cantine', 'Frais de cantine'),
          (v_school_id, v_student_id, 18000, 'completed', '2025-10-18', 'transport', 'Frais de transport');
        
        -- Il y a 2 mois (Septembre 2025)
        INSERT INTO fee_payments (school_id, student_id, amount, status, payment_date, fee_type, description)
        VALUES 
          (v_school_id, v_student_id, 50000, 'completed', '2025-09-05', 'scolarite', 'Frais de scolarité Septembre'),
          (v_school_id, v_student_id, 35000, 'completed', '2025-09-10', 'inscription', 'Frais d''inscription'),
          (v_school_id, v_student_id, 22000, 'completed', '2025-09-15', 'cantine', 'Frais de cantine');
        
        RAISE NOTICE '✅ 11 paiements de test ajoutés';
      ELSE
        RAISE NOTICE '⚠️ Aucun étudiant trouvé. Créez d''abord un étudiant.';
      END IF;
    ELSE
      RAISE NOTICE '⚠️ Aucune école trouvée. Créez d''abord une école.';
    END IF;
  ELSE
    RAISE NOTICE 'ℹ️ Des paiements existent déjà (% paiements)', v_count;
  END IF;
END $$;

-- ÉTAPE 3 : Ajouter des dépenses de test (si aucune n'existe)
DO $$
DECLARE
  v_school_id uuid;
  v_school_group_id uuid;
  v_count integer;
BEGIN
  -- Vérifier s'il y a déjà des dépenses
  SELECT COUNT(*) INTO v_count FROM school_expenses;
  
  IF v_count = 0 THEN
    -- Récupérer une école et son groupe
    SELECT id, school_group_id INTO v_school_id, v_school_group_id 
    FROM schools LIMIT 1;
    
    IF v_school_id IS NOT NULL THEN
      -- Ajouter des dépenses de test
      
      -- Dépenses de l'école (school_id uniquement, pas school_group_id)
      -- Catégories possibles : salaires, fournitures, maintenance, utilities, transport, other
      INSERT INTO school_expenses (school_id, amount, status, expense_date, category, description)
      VALUES 
        (v_school_id, 30000, 'paid', '2025-11-05', 'salaires', 'Salaire enseignant'),
        (v_school_id, 15000, 'paid', '2025-11-10', 'fournitures', 'Fournitures scolaires'),
        (v_school_id, 10000, 'paid', '2025-11-15', 'maintenance', 'Entretien locaux'),
        (v_school_id, 8000, 'pending', '2025-11-20', 'utilities', 'Facture électricité');
      
      -- Dépenses du mois précédent
      INSERT INTO school_expenses (school_id, amount, status, expense_date, category, description)
      VALUES 
        (v_school_id, 28000, 'paid', '2025-10-05', 'salaires', 'Salaire enseignant'),
        (v_school_id, 12000, 'paid', '2025-10-12', 'fournitures', 'Fournitures'),
        (v_school_id, 9000, 'paid', '2025-10-18', 'maintenance', 'Entretien');
      
      RAISE NOTICE '✅ 7 dépenses de test ajoutées';
    ELSE
      RAISE NOTICE '⚠️ Aucune école trouvée. Créez d''abord une école.';
    END IF;
  ELSE
    RAISE NOTICE 'ℹ️ Des dépenses existent déjà (% dépenses)', v_count;
  END IF;
END $$;

-- ÉTAPE 4 : Rafraîchir les vues matérialisées
REFRESH MATERIALIZED VIEW CONCURRENTLY group_financial_stats;
REFRESH MATERIALIZED VIEW CONCURRENTLY school_financial_stats;

-- ÉTAPE 5 : Vérifier les résultats
SELECT 
  'Après insertion' as moment,
  'Paiements' as type,
  COUNT(*) as count,
  COALESCE(SUM(amount), 0) as total,
  status
FROM fee_payments
GROUP BY status
UNION ALL
SELECT 
  'Après insertion',
  'Dépenses',
  COUNT(*),
  COALESCE(SUM(amount), 0),
  status
FROM school_expenses
GROUP BY status;

-- ÉTAPE 6 : Vérifier les KPIs
SELECT 
  total_revenue,
  total_expenses,
  net_profit,
  total_overdue,
  global_recovery_rate
FROM group_financial_stats
LIMIT 1;

-- FIN
SELECT '✅ DONNÉES DE TEST AJOUTÉES AVEC SUCCÈS !' AS statut;

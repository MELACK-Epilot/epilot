/**
 * SYSTÈME DÉPENSES - VUES & FONCTIONS
 * Basé sur la table expenses existante
 * @module CREATE_EXPENSES_VIEWS_FUNCTIONS
 */

-- =====================================================
-- 1. VUE ENRICHIE DES DÉPENSES
-- =====================================================

CREATE OR REPLACE VIEW expenses_enriched AS
SELECT 
  e.*,
  
  -- Groupe scolaire
  sg.name as school_group_name,
  sg.code as school_group_code,
  sg.city as school_group_city,
  sg.region as school_group_region,
  
  -- Calculs
  CASE 
    WHEN e.status = 'pending' AND e.date < CURRENT_DATE - INTERVAL '30 days'
    THEN 'overdue'
    ELSE e.status
  END as detailed_status,
  
  (CURRENT_DATE - e.date) as days_since_expense,
  
  -- Métadonnées catégorie
  CASE e.category
    WHEN 'salaires' THEN 'Salaires'
    WHEN 'fournitures' THEN 'Fournitures'
    WHEN 'infrastructure' THEN 'Infrastructure'
    WHEN 'utilities' THEN 'Services publics'
    WHEN 'transport' THEN 'Transport'
    WHEN 'marketing' THEN 'Marketing'
    WHEN 'formation' THEN 'Formation'
    WHEN 'autres' THEN 'Autres'
  END as category_label,
  
  CASE e.category
    WHEN 'salaires' THEN '#2A9D8F'
    WHEN 'fournitures' THEN '#E9C46A'
    WHEN 'infrastructure' THEN '#457B9D'
    WHEN 'utilities' THEN '#F4A261'
    WHEN 'transport' THEN '#E76F51'
    WHEN 'marketing' THEN '#EC4899'
    WHEN 'formation' THEN '#8B5CF6'
    WHEN 'autres' THEN '#6B7280'
  END as category_color

FROM expenses e
LEFT JOIN school_groups sg ON e.school_group_id = sg.id;

COMMENT ON VIEW expenses_enriched IS 'Vue enrichie des dépenses avec toutes les relations';

-- =====================================================
-- 2. VUE STATISTIQUES GLOBALES
-- =====================================================

CREATE OR REPLACE VIEW expense_statistics AS
SELECT
  -- Compteurs
  COUNT(*) as total_expenses,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'paid') as paid_count,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
  COUNT(*) FILTER (WHERE status = 'pending' AND date < CURRENT_DATE - INTERVAL '30 days') as overdue_count,
  
  -- Montants
  COALESCE(SUM(amount), 0) as total_amount,
  COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) as pending_amount,
  COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0) as paid_amount,
  COALESCE(SUM(amount) FILTER (WHERE status = 'cancelled'), 0) as cancelled_amount,
  
  -- Moyennes
  COALESCE(AVG(amount), 0) as average_expense,
  COALESCE(AVG(amount) FILTER (WHERE status = 'paid'), 0) as average_paid,
  
  -- Taux
  ROUND(
    (COUNT(*) FILTER (WHERE status = 'paid')::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
    2
  ) as payment_rate,
  
  ROUND(
    (COUNT(*) FILTER (WHERE status = 'cancelled')::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
    2
  ) as cancellation_rate,
  
  -- Période
  MIN(date) as first_expense_date,
  MAX(date) as last_expense_date,
  
  -- Mois en cours
  COALESCE(SUM(amount) FILTER (WHERE DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE)), 0) as current_month_amount,
  COALESCE(SUM(amount) FILTER (WHERE DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')), 0) as previous_month_amount
  
FROM expenses;

COMMENT ON VIEW expense_statistics IS 'Statistiques globales des dépenses';

-- =====================================================
-- 3. VUE DÉPENSES PAR CATÉGORIE
-- =====================================================

CREATE OR REPLACE VIEW expenses_by_category AS
SELECT
  category,
  CASE category
    WHEN 'salaires' THEN 'Salaires'
    WHEN 'fournitures' THEN 'Fournitures'
    WHEN 'infrastructure' THEN 'Infrastructure'
    WHEN 'utilities' THEN 'Services publics'
    WHEN 'transport' THEN 'Transport'
    WHEN 'marketing' THEN 'Marketing'
    WHEN 'formation' THEN 'Formation'
    WHEN 'autres' THEN 'Autres'
  END as category_label,
  
  CASE category
    WHEN 'salaires' THEN '#2A9D8F'
    WHEN 'fournitures' THEN '#E9C46A'
    WHEN 'infrastructure' THEN '#457B9D'
    WHEN 'utilities' THEN '#F4A261'
    WHEN 'transport' THEN '#E76F51'
    WHEN 'marketing' THEN '#EC4899'
    WHEN 'formation' THEN '#8B5CF6'
    WHEN 'autres' THEN '#6B7280'
  END as category_color,
  
  COUNT(*) as expense_count,
  COALESCE(SUM(amount), 0) as total_amount,
  COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0) as paid_amount,
  COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) as pending_amount,
  COALESCE(AVG(amount), 0) as average_amount,
  
  -- Pourcentage du total
  ROUND(
    (COALESCE(SUM(amount), 0) / NULLIF((SELECT SUM(amount) FROM expenses), 0)) * 100,
    2
  ) as percentage_of_total,
  
  -- Mois en cours
  COALESCE(SUM(amount) FILTER (WHERE DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE)), 0) as current_month_amount

FROM expenses
GROUP BY category
ORDER BY total_amount DESC;

COMMENT ON VIEW expenses_by_category IS 'Dépenses groupées par catégorie avec statistiques';

-- =====================================================
-- 4. VUE DÉPENSES MENSUELLES
-- =====================================================

CREATE OR REPLACE VIEW expenses_monthly AS
SELECT
  DATE_TRUNC('month', date) as month,
  TO_CHAR(DATE_TRUNC('month', date), 'Mon YYYY') as month_label,
  TO_CHAR(DATE_TRUNC('month', date), 'YYYY-MM') as month_key,
  
  COUNT(*) as expense_count,
  COUNT(*) FILTER (WHERE status = 'paid') as paid_count,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  
  COALESCE(SUM(amount), 0) as total_amount,
  COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0) as paid_amount,
  COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) as pending_amount,
  
  COALESCE(AVG(amount), 0) as average_amount,
  
  -- Croissance vs mois précédent
  COALESCE(
    ROUND(
      ((SUM(amount) - LAG(SUM(amount)) OVER (ORDER BY DATE_TRUNC('month', date))) 
      / NULLIF(LAG(SUM(amount)) OVER (ORDER BY DATE_TRUNC('month', date)), 0)) * 100,
      2
    ),
    0
  ) as growth_rate

FROM expenses
GROUP BY DATE_TRUNC('month', date)
ORDER BY month DESC;

COMMENT ON VIEW expenses_monthly IS 'Dépenses groupées par mois avec croissance';

-- =====================================================
-- 5. VUE DÉPENSES PAR GROUPE
-- =====================================================

CREATE OR REPLACE VIEW expenses_by_group AS
SELECT
  sg.id as school_group_id,
  sg.name as school_group_name,
  sg.code as school_group_code,
  
  COUNT(e.id) as expense_count,
  COALESCE(SUM(e.amount), 0) as total_amount,
  COALESCE(SUM(e.amount) FILTER (WHERE e.status = 'paid'), 0) as paid_amount,
  COALESCE(SUM(e.amount) FILTER (WHERE e.status = 'pending'), 0) as pending_amount,
  COALESCE(AVG(e.amount), 0) as average_amount,
  
  -- Mois en cours
  COALESCE(SUM(e.amount) FILTER (WHERE DATE_TRUNC('month', e.date) = DATE_TRUNC('month', CURRENT_DATE)), 0) as current_month_amount,
  
  -- Catégorie principale
  (
    SELECT category 
    FROM expenses 
    WHERE school_group_id = sg.id 
    GROUP BY category 
    ORDER BY SUM(amount) DESC 
    LIMIT 1
  ) as top_category

FROM school_groups sg
LEFT JOIN expenses e ON sg.id = e.school_group_id
GROUP BY sg.id, sg.name, sg.code
ORDER BY total_amount DESC;

COMMENT ON VIEW expenses_by_group IS 'Dépenses groupées par groupe scolaire';

-- =====================================================
-- 6. FONCTION : GÉNÉRER RÉFÉRENCE DÉPENSE
-- =====================================================

CREATE OR REPLACE FUNCTION set_expense_reference()
RETURNS TRIGGER AS $$
DECLARE
  v_year TEXT;
  v_month TEXT;
  v_day TEXT;
  v_sequence INTEGER;
  v_reference TEXT;
BEGIN
  -- Si la référence existe déjà, ne rien faire
  IF NEW.reference IS NOT NULL AND NEW.reference != '' THEN
    RETURN NEW;
  END IF;

  -- Extraire date
  v_year := TO_CHAR(NEW.date, 'YYYY');
  v_month := TO_CHAR(NEW.date, 'MM');
  v_day := TO_CHAR(NEW.date, 'DD');

  -- Obtenir le prochain numéro de séquence
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(reference FROM 'EXP-[0-9]{8}-([0-9]+)') AS INTEGER
    )
  ), 0) + 1
  INTO v_sequence
  FROM expenses
  WHERE reference LIKE 'EXP-' || v_year || v_month || v_day || '-%';

  -- Générer la référence : EXP-YYYYMMDD-XXXXXX
  v_reference := 'EXP-' || v_year || v_month || v_day || '-' || LPAD(v_sequence::TEXT, 6, '0');

  NEW.reference := v_reference;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION set_expense_reference() IS 'Génère automatiquement une référence unique pour chaque dépense';

-- =====================================================
-- 7. FONCTION : METTRE À JOUR TIMESTAMP
-- =====================================================

CREATE OR REPLACE FUNCTION update_expense_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_expense_timestamp() IS 'Met à jour automatiquement le champ updated_at';

-- =====================================================
-- 8. FONCTION : APPROUVER DÉPENSE
-- =====================================================

CREATE OR REPLACE FUNCTION approve_expense(
  p_expense_id UUID,
  p_payment_method TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_expense RECORD;
BEGIN
  -- Récupérer la dépense
  SELECT * INTO v_expense
  FROM expenses
  WHERE id = p_expense_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Dépense non trouvée';
  END IF;
  
  IF v_expense.status != 'pending' THEN
    RAISE EXCEPTION 'Seules les dépenses en attente peuvent être approuvées';
  END IF;
  
  -- Approuver
  UPDATE expenses
  SET 
    status = 'paid',
    payment_method = COALESCE(p_payment_method, payment_method),
    updated_at = NOW()
  WHERE id = p_expense_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'expense_id', p_expense_id,
    'reference', v_expense.reference,
    'amount', v_expense.amount,
    'status', 'paid'
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION approve_expense IS 'Approuve et marque une dépense comme payée';

-- =====================================================
-- 9. FONCTION : ANNULER DÉPENSE
-- =====================================================

CREATE OR REPLACE FUNCTION cancel_expense(
  p_expense_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_expense RECORD;
BEGIN
  SELECT * INTO v_expense
  FROM expenses
  WHERE id = p_expense_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Dépense non trouvée';
  END IF;
  
  -- Annuler
  UPDATE expenses
  SET 
    status = 'cancelled',
    notes = COALESCE(notes || E'\n\nRaison annulation: ' || p_reason, 'Annulée: ' || p_reason),
    updated_at = NOW()
  WHERE id = p_expense_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'expense_id', p_expense_id,
    'reference', v_expense.reference,
    'status', 'cancelled'
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cancel_expense IS 'Annule une dépense';

-- =====================================================
-- 10. FONCTION : GÉNÉRER DONNÉES DE TEST
-- =====================================================

CREATE OR REPLACE FUNCTION generate_test_expenses(p_count INTEGER DEFAULT 20)
RETURNS TEXT AS $$
DECLARE
  v_group_id UUID;
  v_categories TEXT[] := ARRAY['salaires', 'fournitures', 'infrastructure', 'utilities', 'transport', 'marketing', 'formation', 'autres'];
  v_methods TEXT[] := ARRAY['cash', 'bank_transfer', 'mobile_money', 'check'];
  v_statuses TEXT[] := ARRAY['pending', 'paid', 'paid', 'paid']; -- Plus de paid
  i INTEGER;
BEGIN
  -- Récupérer un groupe
  SELECT id INTO v_group_id FROM school_groups LIMIT 1;
  
  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'Aucun groupe scolaire trouvé';
  END IF;
  
  FOR i IN 1..p_count LOOP
    INSERT INTO expenses (
      school_group_id,
      amount,
      category,
      description,
      date,
      status,
      payment_method,
      notes
    ) VALUES (
      v_group_id,
      (RANDOM() * 100000 + 5000)::NUMERIC(12,2),
      v_categories[1 + FLOOR(RANDOM() * array_length(v_categories, 1))::INTEGER],
      'Dépense de test #' || i,
      CURRENT_DATE - (RANDOM() * 90)::INTEGER,
      v_statuses[1 + FLOOR(RANDOM() * array_length(v_statuses, 1))::INTEGER],
      v_methods[1 + FLOOR(RANDOM() * array_length(v_methods, 1))::INTEGER],
      'Notes de test'
    );
  END LOOP;
  
  RETURN p_count || ' dépenses de test créées avec succès';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_test_expenses IS 'Génère des dépenses de test';

-- =====================================================
-- RÉSUMÉ
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '✅ SYSTÈME DÉPENSES CRÉÉ';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE 'Vues créées :';
  RAISE NOTICE '  - expenses_enriched : Vue enrichie avec relations';
  RAISE NOTICE '  - expense_statistics : Statistiques globales';
  RAISE NOTICE '  - expenses_by_category : Par catégorie';
  RAISE NOTICE '  - expenses_monthly : Par mois avec croissance';
  RAISE NOTICE '  - expenses_by_group : Par groupe scolaire';
  RAISE NOTICE '';
  RAISE NOTICE 'Fonctions créées :';
  RAISE NOTICE '  - set_expense_reference() : Génération référence auto';
  RAISE NOTICE '  - update_expense_timestamp() : MAJ timestamp';
  RAISE NOTICE '  - approve_expense() : Approuver dépense';
  RAISE NOTICE '  - cancel_expense() : Annuler dépense';
  RAISE NOTICE '  - generate_test_expenses() : Données de test';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 EXEMPLES D''UTILISATION :';
  RAISE NOTICE '';
  RAISE NOTICE '-- Générer 20 dépenses de test';
  RAISE NOTICE 'SELECT generate_test_expenses(20);';
  RAISE NOTICE '';
  RAISE NOTICE '-- Voir statistiques';
  RAISE NOTICE 'SELECT * FROM expense_statistics;';
  RAISE NOTICE '';
  RAISE NOTICE '-- Voir par catégorie';
  RAISE NOTICE 'SELECT * FROM expenses_by_category;';
  RAISE NOTICE '';
  RAISE NOTICE '-- Approuver une dépense';
  RAISE NOTICE 'SELECT approve_expense(''expense-uuid'', ''bank_transfer'');';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
END $$;

-- =====================================================
-- VUES MATÉRIALISÉES POUR DASHBOARD
-- Statistiques en temps réel optimisées
-- =====================================================

-- =====================================================
-- 1. VUE STATISTIQUES GLOBALES ÉCOLE
-- =====================================================

CREATE OR REPLACE VIEW public.school_statistics AS
SELECT 
  s.id as school_id,
  s.name as school_name,
  
  -- Statistiques élèves
  (SELECT COUNT(*) FROM users WHERE school_id = s.id AND role = 'eleve') as total_students,
  (SELECT COUNT(*) FROM users WHERE school_id = s.id AND role = 'eleve' AND status = 'active') as active_students,
  
  -- Statistiques personnel
  (SELECT COUNT(*) FROM users WHERE school_id = s.id AND role IN ('enseignant', 'cpe', 'comptable', 'proviseur', 'directeur')) as total_teachers,
  (SELECT COUNT(*) FROM users WHERE school_id = s.id AND role IN ('enseignant', 'cpe', 'comptable', 'proviseur', 'directeur') AND status = 'active') as active_teachers,
  
  -- Statistiques classes
  (SELECT COUNT(*) FROM classes WHERE school_id = s.id) as total_classes,
  (SELECT COUNT(*) FROM classes WHERE school_id = s.id AND status = 'active') as active_classes,
  
  -- Statistiques financières
  COALESCE((SELECT SUM(amount) FROM fee_payments WHERE school_id = s.id), 0) as total_revenue,
  COALESCE((SELECT SUM(amount) FROM fee_payments WHERE school_id = s.id AND EXTRACT(MONTH FROM payment_date) = EXTRACT(MONTH FROM CURRENT_DATE)), 0) as monthly_revenue,
  COALESCE((SELECT SUM(amount) FROM fee_payments WHERE school_id = s.id AND status = 'pending'), 0) as pending_payments,
  COALESCE((SELECT SUM(amount) FROM fee_payments WHERE school_id = s.id AND status = 'overdue'), 0) as overdue_payments,
  
  -- Satisfaction (simulée)
  ROUND(CAST((RANDOM() * 0.3 + 0.7) * 5 AS NUMERIC), 1) as satisfaction_rate,
  
  NOW() as last_updated
FROM schools s;

-- =====================================================
-- 2. VUE FINANCIÈRE
-- =====================================================

CREATE OR REPLACE VIEW public.financial_overview AS
SELECT 
  s.id as school_id,
  s.name as school_name,
  
  -- Revenus totaux
  COALESCE(SUM(fp.amount), 0) as total_amount,
  
  -- Revenus ce mois
  COALESCE(SUM(CASE WHEN EXTRACT(MONTH FROM fp.payment_date) = EXTRACT(MONTH FROM CURRENT_DATE) THEN fp.amount ELSE 0 END), 0) as this_month,
  
  -- Revenus mois dernier
  COALESCE(SUM(CASE WHEN EXTRACT(MONTH FROM fp.payment_date) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month') THEN fp.amount ELSE 0 END), 0) as last_month,
  
  -- Taux de croissance
  CASE 
    WHEN COALESCE(SUM(CASE WHEN EXTRACT(MONTH FROM fp.payment_date) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month') THEN fp.amount ELSE 0 END), 0) = 0 THEN 0
    ELSE ROUND(
      ((SUM(CASE WHEN EXTRACT(MONTH FROM fp.payment_date) = EXTRACT(MONTH FROM CURRENT_DATE) THEN fp.amount ELSE 0 END) - 
        SUM(CASE WHEN EXTRACT(MONTH FROM fp.payment_date) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month') THEN fp.amount ELSE 0 END)) /
       SUM(CASE WHEN EXTRACT(MONTH FROM fp.payment_date) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month') THEN fp.amount ELSE 0 END)) * 100, 2)
  END as growth_rate,
  
  -- Paiements en attente
  COALESCE(SUM(CASE WHEN fp.status = 'pending' THEN fp.amount ELSE 0 END), 0) as pending_amount,
  
  -- Paiements en retard
  COALESCE(SUM(CASE WHEN fp.status = 'overdue' THEN fp.amount ELSE 0 END), 0) as overdue_amount
  
FROM schools s
LEFT JOIN fee_payments fp ON fp.school_id = s.id
GROUP BY s.id, s.name;

-- =====================================================
-- 3. VUE ÉLÈVES
-- =====================================================

CREATE OR REPLACE VIEW public.student_overview AS
SELECT 
  s.id as school_id,
  s.name as school_name,
  
  -- Nombre total
  COUNT(u.id) as total,
  
  -- Actifs
  COUNT(CASE WHEN u.status = 'active' THEN 1 END) as active,
  
  -- Nouveaux ce mois
  COUNT(CASE WHEN EXTRACT(MONTH FROM u.created_at) = EXTRACT(MONTH FROM CURRENT_DATE) THEN 1 END) as new_this_month,
  
  -- Moyenne des notes (simulation)
  ROUND(CAST((RANDOM() * 2 + 12) AS NUMERIC), 1) as average_grade,
  
  -- Taux de présence (simulation)
  ROUND(CAST((RANDOM() * 0.2 + 0.8) * 100 AS NUMERIC), 1) as attendance_rate
  
FROM schools s
LEFT JOIN users u ON u.school_id = s.id AND u.role = 'eleve'
GROUP BY s.id, s.name;

-- =====================================================
-- 4. VUE PERSONNEL
-- =====================================================

CREATE OR REPLACE VIEW public.staff_overview AS
SELECT 
  s.id as school_id,
  s.name as school_name,
  
  -- Nombre total
  COUNT(u.id) as total,
  
  -- Actifs
  COUNT(CASE WHEN u.status = 'active' THEN 1 END) as active,
  
  -- Nouveaux ce mois
  COUNT(CASE WHEN EXTRACT(MONTH FROM u.created_at) = EXTRACT(MONTH FROM CURRENT_DATE) THEN 1 END) as new_this_month,
  
  -- Satisfaction moyenne (simulation)
  ROUND(CAST((RANDOM() * 0.3 + 0.7) * 5 AS NUMERIC), 1) as average_satisfaction
  
FROM schools s
LEFT JOIN users u ON u.school_id = s.id AND u.role IN ('enseignant', 'cpe', 'comptable', 'proviseur', 'directeur')
GROUP BY s.id, s.name;

-- =====================================================
-- 5. FONCTIONS DE RAFRAÎCHISSEMENT
-- =====================================================

-- Rafraîchir toutes les vues
CREATE OR REPLACE FUNCTION refresh_dashboard_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY school_statistics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY financial_overview;
  REFRESH MATERIALIZED VIEW CONCURRENTLY student_overview;
  REFRESH MATERIALIZED VIEW CONCURRENTLY staff_overview;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. INDEXES POUR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_fee_payments_school_date ON fee_payments(school_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_users_school_role ON users(school_id, role);
CREATE INDEX IF NOT EXISTS idx_classes_school ON classes(school_id);

-- =====================================================
-- 7. TRIGGERS POUR MISE À JOUR AUTOMATIQUE
-- =====================================================

-- Trigger sur fee_payments
CREATE OR REPLACE FUNCTION update_school_stats_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Rafraîchir les vues après modification de paiement
  PERFORM refresh_dashboard_views();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON fee_payments
FOR EACH STATEMENT
EXECUTE FUNCTION update_school_stats_on_payment();

-- Trigger sur users
CREATE OR REPLACE FUNCTION update_school_stats_on_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Rafraîchir les vues après modification d'utilisateur
  PERFORM refresh_dashboard_views();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH STATEMENT
EXECUTE FUNCTION update_school_stats_on_user();

-- Trigger sur classes
CREATE OR REPLACE FUNCTION update_school_stats_on_class()
RETURNS TRIGGER AS $$
BEGIN
  -- Rafraîchir les vues après modification de classe
  PERFORM refresh_dashboard_views();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER class_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON classes
FOR EACH STATEMENT
EXECUTE FUNCTION update_school_stats_on_class();

-- ============================================================================
-- SYSTÈME D'ALERTES FINANCIÈRES INTELLIGENT
-- Détection automatique des problèmes financiers
-- Date : 2025-11-05
-- ============================================================================

-- TABLE DES ALERTES
CREATE TABLE IF NOT EXISTS financial_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_group_id UUID REFERENCES school_groups(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  
  -- Type et catégorie
  alert_type TEXT NOT NULL CHECK (alert_type IN ('critical', 'warning', 'info')),
  category TEXT NOT NULL CHECK (category IN (
    'treasury',      -- Trésorerie
    'overdue',       -- Retards
    'margin',        -- Marge
    'expense',       -- Dépense
    'revenue',       -- Revenus
    'trend'          -- Tendance
  )),
  
  -- Détails
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity INTEGER NOT NULL CHECK (severity BETWEEN 1 AND 5), -- 1=info, 5=critique
  
  -- Valeurs
  threshold_value DECIMAL(12, 2),
  current_value DECIMAL(12, 2),
  
  -- Statut
  is_read BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP,
  resolved_by UUID REFERENCES users(id),
  resolution_notes TEXT,
  
  -- Métadonnées
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index
CREATE INDEX idx_financial_alerts_school_group ON financial_alerts(school_group_id);
CREATE INDEX idx_financial_alerts_school ON financial_alerts(school_id);
CREATE INDEX idx_financial_alerts_type ON financial_alerts(alert_type);
CREATE INDEX idx_financial_alerts_resolved ON financial_alerts(is_resolved);
CREATE INDEX idx_financial_alerts_created ON financial_alerts(created_at DESC);

-- ============================================================================
-- FONCTION : DÉTECTER LES ALERTES FINANCIÈRES
-- ============================================================================

CREATE OR REPLACE FUNCTION detect_financial_alerts()
RETURNS INTEGER AS $$
DECLARE
  v_alerts_created INTEGER := 0;
  v_school RECORD;
BEGIN
  -- Supprimer les anciennes alertes non résolues (plus de 30 jours)
  DELETE FROM financial_alerts 
  WHERE is_resolved = false 
    AND created_at < NOW() - INTERVAL '30 days';

  -- ALERTE 1 : Retards > 20% des revenus (CRITIQUE)
  FOR v_school IN 
    SELECT 
      s.school_group_id,
      s.school_id,
      s.school_name,
      s.total_revenue,
      s.overdue_amount,
      (s.overdue_amount / NULLIF(s.total_revenue, 0)) * 100 AS overdue_percentage
    FROM school_financial_stats s
    WHERE s.total_revenue > 0
      AND (s.overdue_amount / NULLIF(s.total_revenue, 0)) > 0.20
      AND NOT EXISTS (
        SELECT 1 FROM financial_alerts
        WHERE school_id = s.school_id
          AND category = 'overdue'
          AND is_resolved = false
          AND created_at > NOW() - INTERVAL '7 days'
      )
  LOOP
    INSERT INTO financial_alerts (
      school_group_id, school_id, alert_type, category, title, message, severity,
      threshold_value, current_value
    ) VALUES (
      v_school.school_group_id,
      v_school.school_id,
      'critical',
      'overdue',
      'Retards de paiement critiques',
      format('École %s : Les retards (%s FCFA) représentent %.1f%% des revenus (seuil: 20%%)',
        v_school.school_name,
        to_char(v_school.overdue_amount, 'FM999,999,999'),
        v_school.overdue_percentage
      ),
      5,
      0.20,
      v_school.overdue_percentage / 100
    );
    v_alerts_created := v_alerts_created + 1;
  END LOOP;

  -- ALERTE 2 : Marge < 15% (WARNING)
  FOR v_school IN 
    SELECT 
      s.school_group_id,
      s.school_id,
      s.school_name,
      s.total_revenue,
      s.net_profit,
      (s.net_profit / NULLIF(s.total_revenue, 0)) * 100 AS margin
    FROM school_financial_stats s
    WHERE s.total_revenue > 0
      AND (s.net_profit / NULLIF(s.total_revenue, 0)) < 0.15
      AND NOT EXISTS (
        SELECT 1 FROM financial_alerts
        WHERE school_id = s.school_id
          AND category = 'margin'
          AND is_resolved = false
          AND created_at > NOW() - INTERVAL '7 days'
      )
  LOOP
    INSERT INTO financial_alerts (
      school_group_id, school_id, alert_type, category, title, message, severity,
      threshold_value, current_value
    ) VALUES (
      v_school.school_group_id,
      v_school.school_id,
      'warning',
      'margin',
      'Marge bénéficiaire faible',
      format('École %s : Marge de %.1f%% (seuil recommandé: 15%%). Envisager réduction dépenses ou augmentation revenus.',
        v_school.school_name,
        v_school.margin
      ),
      3,
      0.15,
      v_school.margin / 100
    );
    v_alerts_created := v_alerts_created + 1;
  END LOOP;

  -- ALERTE 3 : Déficit (CRITIQUE)
  FOR v_school IN 
    SELECT 
      s.school_group_id,
      s.school_id,
      s.school_name,
      s.total_revenue,
      s.total_expenses,
      s.net_profit
    FROM school_financial_stats s
    WHERE s.net_profit < 0
      AND NOT EXISTS (
        SELECT 1 FROM financial_alerts
        WHERE school_id = s.school_id
          AND category = 'treasury'
          AND is_resolved = false
          AND created_at > NOW() - INTERVAL '7 days'
      )
  LOOP
    INSERT INTO financial_alerts (
      school_group_id, school_id, alert_type, category, title, message, severity,
      threshold_value, current_value
    ) VALUES (
      v_school.school_group_id,
      v_school.school_id,
      'critical',
      'treasury',
      'Déficit financier',
      format('École %s : Déficit de %s FCFA (Revenus: %s, Dépenses: %s)',
        v_school.school_name,
        to_char(ABS(v_school.net_profit), 'FM999,999,999'),
        to_char(v_school.total_revenue, 'FM999,999,999'),
        to_char(v_school.total_expenses, 'FM999,999,999')
      ),
      5,
      0,
      v_school.net_profit
    );
    v_alerts_created := v_alerts_created + 1;
  END LOOP;

  -- ALERTE 4 : Taux de recouvrement < 70% (WARNING)
  FOR v_school IN 
    SELECT 
      s.school_group_id,
      s.school_id,
      s.school_name,
      s.recovery_rate
    FROM school_financial_stats s
    WHERE s.recovery_rate < 70
      AND s.recovery_rate > 0
      AND NOT EXISTS (
        SELECT 1 FROM financial_alerts
        WHERE school_id = s.school_id
          AND category = 'overdue'
          AND alert_type = 'warning'
          AND is_resolved = false
          AND created_at > NOW() - INTERVAL '7 days'
      )
  LOOP
    INSERT INTO financial_alerts (
      school_group_id, school_id, alert_type, category, title, message, severity,
      threshold_value, current_value
    ) VALUES (
      v_school.school_group_id,
      v_school.school_id,
      'warning',
      'overdue',
      'Taux de recouvrement faible',
      format('École %s : Taux de recouvrement de %.1f%% (objectif: 70%%). Intensifier les relances.',
        v_school.school_name,
        v_school.recovery_rate
      ),
      3,
      70,
      v_school.recovery_rate
    );
    v_alerts_created := v_alerts_created + 1;
  END LOOP;

  RETURN v_alerts_created;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FONCTION : MARQUER UNE ALERTE COMME RÉSOLUE
-- ============================================================================

CREATE OR REPLACE FUNCTION resolve_financial_alert(
  p_alert_id UUID,
  p_resolved_by UUID,
  p_resolution_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE financial_alerts
  SET 
    is_resolved = true,
    resolved_at = NOW(),
    resolved_by = p_resolved_by,
    resolution_notes = p_resolution_notes,
    updated_at = NOW()
  WHERE id = p_alert_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TÂCHE AUTOMATIQUE : Détecter les alertes toutes les 6 heures
-- ============================================================================

SELECT cron.schedule(
  'detect-financial-alerts',
  '0 */6 * * *', -- Toutes les 6 heures
  'SELECT detect_financial_alerts()'
);

-- ============================================================================
-- EXÉCUTION INITIALE
-- ============================================================================

SELECT detect_financial_alerts() AS alerts_created;

-- ✅ Système d'alertes créé et initialisé

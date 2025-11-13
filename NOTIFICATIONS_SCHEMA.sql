-- ============================================
-- SCHÉMA SQL : SYSTÈME DE NOTIFICATIONS
-- ============================================
-- Description : Notifications automatiques pour quotas et événements
-- Auteur : E-Pilot Congo
-- Date : 2025-01-30
-- ============================================

-- ============================================
-- 1. TABLE : notifications
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Destinataire (au moins un des deux doit être renseigné)
  user_id UUID,
  school_group_id UUID REFERENCES school_groups(id) ON DELETE CASCADE,
  
  -- Type et contenu
  type VARCHAR(50) NOT NULL, -- 'quota_warning', 'quota_critical', 'payment_due', 'plan_upgraded', etc.
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb, -- Données supplémentaires
  
  -- Statut
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_school_group_id ON notifications(school_group_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================
-- 2. FONCTION : check_quota_warnings
-- ============================================
-- Vérifie les quotas et crée des notifications automatiques

CREATE OR REPLACE FUNCTION check_quota_warnings()
RETURNS void AS $$
DECLARE
  v_group RECORD;
  v_max_percent DECIMAL;
  v_resource_type VARCHAR;
BEGIN
  FOR v_group IN 
    SELECT * FROM school_groups_with_quotas
    WHERE 
      schools_usage_percent >= 80 OR
      students_usage_percent >= 80 OR
      personnel_usage_percent >= 80 OR
      storage_usage_percent >= 80
  LOOP
    -- Déterminer le quota le plus critique
    v_max_percent := GREATEST(
      v_group.schools_usage_percent,
      v_group.students_usage_percent,
      v_group.personnel_usage_percent,
      v_group.storage_usage_percent
    );
    
    -- Déterminer le type de ressource
    CASE 
      WHEN v_group.schools_usage_percent = v_max_percent THEN
        v_resource_type := 'écoles';
      WHEN v_group.students_usage_percent = v_max_percent THEN
        v_resource_type := 'élèves';
      WHEN v_group.personnel_usage_percent = v_max_percent THEN
        v_resource_type := 'personnel';
      ELSE
        v_resource_type := 'stockage';
    END CASE;
    
    -- Créer notification si pas déjà envoyée aujourd'hui
    INSERT INTO notifications (
      user_id,
      school_group_id,
      type,
      title,
      message,
      data
    )
    SELECT
      NULL, -- user_id (NULL car notification pour le groupe)
      v_group.school_group_id,
      CASE 
        WHEN v_max_percent >= 95 THEN 'quota_critical'
        ELSE 'quota_warning'
      END,
      CASE 
        WHEN v_max_percent >= 95 THEN '🚨 Quota critique atteint !'
        ELSE '⚠️ Attention : Quota bientôt atteint'
      END,
      format(
        'Vous avez utilisé %s%% de votre quota %s (%s/%s). %s',
        ROUND(v_max_percent, 0),
        v_resource_type,
        CASE v_resource_type
          WHEN 'écoles' THEN v_group.current_schools::TEXT
          WHEN 'élèves' THEN v_group.current_students::TEXT
          WHEN 'personnel' THEN v_group.current_personnel::TEXT
          ELSE v_group.current_storage
        END,
        CASE v_resource_type
          WHEN 'écoles' THEN v_group.max_schools::TEXT
          WHEN 'élèves' THEN v_group.max_students::TEXT
          WHEN 'personnel' THEN v_group.max_personnel::TEXT
          ELSE v_group.storage_limit
        END,
        CASE 
          WHEN v_max_percent >= 95 THEN 'Vous ne pouvez plus créer de nouvelles ressources. Passez à un plan supérieur immédiatement.'
          ELSE 'Pensez à passer à un plan supérieur pour éviter toute interruption.'
        END
      ),
      jsonb_build_object(
        'plan_name', v_group.plan_name,
        'schools_percent', v_group.schools_usage_percent,
        'students_percent', v_group.students_usage_percent,
        'personnel_percent', v_group.personnel_usage_percent,
        'storage_percent', v_group.storage_usage_percent,
        'resource_type', v_resource_type,
        'max_percent', v_max_percent
      )
    WHERE NOT EXISTS (
      SELECT 1 FROM notifications
      WHERE school_group_id = v_group.school_group_id
      AND type IN ('quota_warning', 'quota_critical')
      AND created_at > NOW() - INTERVAL '24 hours'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. FONCTION : create_notification
-- ============================================
-- Helper pour créer facilement des notifications

CREATE OR REPLACE FUNCTION create_notification(
  p_type VARCHAR,
  p_title VARCHAR,
  p_message TEXT,
  p_user_id UUID DEFAULT NULL,
  p_school_group_id UUID DEFAULT NULL,
  p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id,
    school_group_id,
    type,
    title,
    message,
    data
  ) VALUES (
    p_user_id,
    p_school_group_id,
    p_type,
    p_title,
    p_message,
    p_data
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. TRIGGER : Notification sur changement de plan
-- ============================================

CREATE OR REPLACE FUNCTION notify_plan_change()
RETURNS TRIGGER AS $$
DECLARE
  v_old_plan_name VARCHAR;
  v_new_plan_name VARCHAR;
BEGIN
  -- Récupérer les noms des plans
  SELECT name INTO v_old_plan_name FROM subscription_plans WHERE id = OLD.plan_id;
  SELECT name INTO v_new_plan_name FROM subscription_plans WHERE id = NEW.plan_id;
  
  -- Créer notification
  IF OLD.plan_id IS DISTINCT FROM NEW.plan_id THEN
    PERFORM create_notification(
      'plan_upgraded',
      '🎉 Plan mis à niveau !',
      format('Votre plan a été changé de "%s" à "%s". Vos nouvelles limites sont maintenant actives.', 
        v_old_plan_name, 
        v_new_plan_name
      ),
      NULL, -- user_id
      NEW.id, -- school_group_id
      jsonb_build_object(
        'old_plan', v_old_plan_name,
        'new_plan', v_new_plan_name
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_plan_change
  AFTER UPDATE OF plan_id ON school_groups
  FOR EACH ROW
  WHEN (OLD.plan_id IS DISTINCT FROM NEW.plan_id)
  EXECUTE FUNCTION notify_plan_change();

-- ============================================
-- 5. POLITIQUES RLS (Row Level Security)
-- ============================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Super Admin peut tout voir
CREATE POLICY "Super Admin can view all notifications"
ON notifications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

-- Admin Groupe peut voir les notifications de son groupe
CREATE POLICY "Admin Groupe can view their group notifications"
ON notifications
FOR SELECT
TO authenticated
USING (
  school_group_id IN (
    SELECT id FROM school_groups
    WHERE admin_id = auth.uid()
  )
  OR user_id = auth.uid()
);

-- Utilisateur peut marquer ses notifications comme lues
CREATE POLICY "Users can update their own notifications"
ON notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR school_group_id IN (
  SELECT school_group_id FROM users WHERE id = auth.uid()
))
WITH CHECK (user_id = auth.uid() OR school_group_id IN (
  SELECT school_group_id FROM users WHERE id = auth.uid()
));

-- ============================================
-- 6. COMMENTAIRES
-- ============================================

COMMENT ON TABLE notifications IS 'Notifications système pour alertes quotas, paiements, etc.';
COMMENT ON COLUMN notifications.type IS 'Type de notification : quota_warning, quota_critical, payment_due, plan_upgraded, etc.';
COMMENT ON COLUMN notifications.data IS 'Données JSON supplémentaires spécifiques au type de notification';
COMMENT ON FUNCTION check_quota_warnings IS 'Vérifie les quotas et crée des notifications automatiques (à exécuter via cron)';
COMMENT ON FUNCTION create_notification IS 'Helper pour créer facilement une notification';

-- ============================================
-- FIN DU SCHÉMA
-- ============================================

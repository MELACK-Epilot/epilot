# 🗄️ COMMANDES SQL UTILES - PROFIL UTILISATEUR

## 📋 REQUÊTES DE VÉRIFICATION

### 1. Vérifier les Tables
```sql
-- Vérifier que toutes les tables existent
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'user_preferences',
  'notification_settings',
  'user_security_settings',
  'login_history',
  'active_sessions'
)
ORDER BY table_name;

-- Résultat attendu: 5 tables
```

### 2. Compter les Enregistrements
```sql
-- Compter les préférences
SELECT 'user_preferences' as table_name, COUNT(*) as count FROM user_preferences
UNION ALL
SELECT 'notification_settings', COUNT(*) FROM notification_settings
UNION ALL
SELECT 'user_security_settings', COUNT(*) FROM user_security_settings
UNION ALL
SELECT 'login_history', COUNT(*) FROM login_history
UNION ALL
SELECT 'active_sessions', COUNT(*) FROM active_sessions;
```

### 3. Profil Complet d'un Utilisateur
```sql
-- Voir toutes les données de Vianney
SELECT 
  u.id,
  u.first_name,
  u.last_name,
  u.email,
  u.role,
  up.language,
  up.theme,
  up.timezone,
  ns.email_enabled,
  ns.email_weekly_report,
  ns.email_monthly_report,
  ns.push_enabled,
  ns.sms_enabled,
  uss.two_factor_enabled,
  uss.password_last_changed
FROM users u
LEFT JOIN user_preferences up ON u.id = up.user_id
LEFT JOIN notification_settings ns ON u.id = ns.user_id
LEFT JOIN user_security_settings uss ON u.id = uss.user_id
WHERE u.email = 'vianney@epilot.cg';
```

---

## 🔧 REQUÊTES DE MODIFICATION

### 1. Mettre à Jour Préférences
```sql
-- Changer langue
UPDATE user_preferences
SET language = 'en', updated_at = NOW()
WHERE user_id = (SELECT id FROM users WHERE email = 'vianney@epilot.cg');

-- Changer thème
UPDATE user_preferences
SET theme = 'dark', updated_at = NOW()
WHERE user_id = (SELECT id FROM users WHERE email = 'vianney@epilot.cg');

-- Changer timezone
UPDATE user_preferences
SET timezone = 'Africa/Kinshasa', updated_at = NOW()
WHERE user_id = (SELECT id FROM users WHERE email = 'vianney@epilot.cg');
```

### 2. Mettre à Jour Notifications
```sql
-- Activer rapports
UPDATE notification_settings
SET 
  email_weekly_report = true,
  email_monthly_report = true,
  updated_at = NOW()
WHERE user_id = (SELECT id FROM users WHERE email = 'vianney@epilot.cg');

-- Désactiver SMS
UPDATE notification_settings
SET sms_enabled = false, updated_at = NOW()
WHERE user_id = (SELECT id FROM users WHERE email = 'vianney@epilot.cg');
```

### 3. Activer/Désactiver 2FA
```sql
-- Activer 2FA
UPDATE user_security_settings
SET 
  two_factor_enabled = true,
  two_factor_method = 'app',
  two_factor_enabled_at = NOW(),
  updated_at = NOW()
WHERE user_id = (SELECT id FROM users WHERE email = 'vianney@epilot.cg');

-- Désactiver 2FA
UPDATE user_security_settings
SET 
  two_factor_enabled = false,
  two_factor_method = NULL,
  two_factor_enabled_at = NULL,
  updated_at = NOW()
WHERE user_id = (SELECT id FROM users WHERE email = 'vianney@epilot.cg');
```

---

## 📜 HISTORIQUE DE CONNEXION

### 1. Voir Historique
```sql
-- Dernières 10 connexions
SELECT 
  id,
  login_at,
  device_type,
  device_os,
  browser,
  location_city,
  location_country,
  status
FROM login_history
WHERE user_id = (SELECT id FROM users WHERE email = 'vianney@epilot.cg')
ORDER BY login_at DESC
LIMIT 10;
```

### 2. Ajouter Connexion
```sql
-- Ajouter une nouvelle connexion
INSERT INTO login_history (
  user_id,
  login_at,
  device_type,
  device_os,
  browser,
  location_city,
  location_country,
  status
)
VALUES (
  (SELECT id FROM users WHERE email = 'vianney@epilot.cg'),
  NOW(),
  'MacBook Pro',
  'macOS 14',
  'Safari',
  'Pointe-Noire',
  'Congo',
  'success'
);
```

### 3. Supprimer Ancien Historique
```sql
-- Supprimer connexions > 90 jours
DELETE FROM login_history
WHERE login_at < NOW() - INTERVAL '90 days';
```

---

## 🧹 REQUÊTES DE NETTOYAGE

### 1. Réinitialiser Préférences
```sql
-- Remettre préférences par défaut
UPDATE user_preferences
SET 
  language = 'fr',
  theme = 'system',
  timezone = 'Africa/Brazzaville',
  updated_at = NOW()
WHERE user_id = (SELECT id FROM users WHERE email = 'vianney@epilot.cg');
```

### 2. Réinitialiser Notifications
```sql
-- Remettre notifications par défaut
UPDATE notification_settings
SET 
  email_enabled = true,
  email_weekly_report = true,
  email_monthly_report = true,
  push_enabled = true,
  sms_enabled = false,
  updated_at = NOW()
WHERE user_id = (SELECT id FROM users WHERE email = 'vianney@epilot.cg');
```

### 3. Nettoyer Sessions Expirées
```sql
-- Supprimer sessions expirées
DELETE FROM active_sessions
WHERE expires_at < NOW();
```

---

## 🔍 REQUÊTES DE DEBUG

### 1. Vérifier RPC Functions
```sql
-- Lister toutes les RPC functions du profil
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE proname LIKE '%user_preferences%'
   OR proname LIKE '%notification_settings%'
   OR proname LIKE '%login_history%'
   OR proname LIKE '%two_factor%'
   OR proname LIKE '%active_sessions%'
ORDER BY proname;
```

### 2. Tester RPC Functions
```sql
-- Tester update_user_preferences
SELECT update_user_preferences(
  (SELECT id FROM users WHERE email = 'vianney@epilot.cg'),
  'en',
  'Africa/Kinshasa',
  'dark'
);

-- Tester get_login_history
SELECT get_login_history(
  (SELECT id FROM users WHERE email = 'vianney@epilot.cg'),
  10,
  0
);

-- Tester toggle_two_factor_auth
SELECT toggle_two_factor_auth(
  (SELECT id FROM users WHERE email = 'vianney@epilot.cg'),
  true,
  'app'
);
```

### 3. Vérifier Triggers
```sql
-- Lister les triggers
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE event_object_table IN (
  'user_preferences',
  'notification_settings',
  'user_security_settings',
  'users'
)
ORDER BY event_object_table, trigger_name;
```

---

## 📊 REQUÊTES STATISTIQUES

### 1. Statistiques Préférences
```sql
-- Répartition des langues
SELECT 
  language,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM user_preferences), 2) as percentage
FROM user_preferences
GROUP BY language
ORDER BY count DESC;

-- Répartition des thèmes
SELECT 
  theme,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM user_preferences), 2) as percentage
FROM user_preferences
GROUP BY theme
ORDER BY count DESC;
```

### 2. Statistiques Notifications
```sql
-- Utilisateurs avec rapports activés
SELECT 
  'Rapport hebdomadaire' as type,
  COUNT(*) as count
FROM notification_settings
WHERE email_weekly_report = true
UNION ALL
SELECT 
  'Rapport mensuel',
  COUNT(*)
FROM notification_settings
WHERE email_monthly_report = true
UNION ALL
SELECT 
  'SMS activé',
  COUNT(*)
FROM notification_settings
WHERE sms_enabled = true;
```

### 3. Statistiques Connexions
```sql
-- Connexions par jour (7 derniers jours)
SELECT 
  DATE(login_at) as date,
  COUNT(*) as connexions,
  COUNT(DISTINCT user_id) as utilisateurs_uniques
FROM login_history
WHERE login_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(login_at)
ORDER BY date DESC;

-- Appareils les plus utilisés
SELECT 
  device_type,
  COUNT(*) as count
FROM login_history
GROUP BY device_type
ORDER BY count DESC
LIMIT 5;
```

---

## 🚨 REQUÊTES DE SÉCURITÉ

### 1. Utilisateurs avec 2FA
```sql
-- Lister utilisateurs avec 2FA activé
SELECT 
  u.first_name,
  u.last_name,
  u.email,
  u.role,
  uss.two_factor_method,
  uss.two_factor_enabled_at
FROM users u
JOIN user_security_settings uss ON u.id = uss.user_id
WHERE uss.two_factor_enabled = true
ORDER BY uss.two_factor_enabled_at DESC;
```

### 2. Connexions Suspectes
```sql
-- Connexions échouées récentes
SELECT 
  u.email,
  lh.login_at,
  lh.device_type,
  lh.location_city,
  lh.failure_reason
FROM login_history lh
JOIN users u ON lh.user_id = u.id
WHERE lh.status = 'failed'
  AND lh.login_at >= NOW() - INTERVAL '24 hours'
ORDER BY lh.login_at DESC;
```

### 3. Sessions Actives
```sql
-- Voir toutes les sessions actives
SELECT 
  u.email,
  u.role,
  s.device_type,
  s.location_city,
  s.started_at,
  s.last_activity_at,
  s.expires_at,
  s.is_current
FROM active_sessions s
JOIN users u ON s.user_id = u.id
WHERE s.expires_at > NOW()
ORDER BY s.last_activity_at DESC;
```

---

## 🔄 REQUÊTES DE MIGRATION

### 1. Créer Préférences pour Nouveaux Utilisateurs
```sql
-- Créer préférences pour utilisateurs sans
INSERT INTO user_preferences (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM user_preferences)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO notification_settings (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM notification_settings)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_security_settings (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM user_security_settings)
ON CONFLICT (user_id) DO NOTHING;
```

### 2. Backup des Données
```sql
-- Exporter préférences
COPY (
  SELECT * FROM user_preferences
) TO '/tmp/user_preferences_backup.csv' CSV HEADER;

-- Exporter notifications
COPY (
  SELECT * FROM notification_settings
) TO '/tmp/notification_settings_backup.csv' CSV HEADER;
```

---

## 📝 NOTES IMPORTANTES

### Permissions RLS
```sql
-- Vérifier que RLS est activé
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN (
  'user_preferences',
  'notification_settings',
  'user_security_settings'
);

-- Activer RLS si nécessaire
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_security_settings ENABLE ROW LEVEL SECURITY;
```

### Index Performance
```sql
-- Vérifier les index
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN (
  'user_preferences',
  'notification_settings',
  'login_history'
)
ORDER BY tablename, indexname;
```

---

**Utilisez ces commandes pour gérer et débugger le système de profil!** 🚀

**Développé avec ❤️ pour E-Pilot Congo-Brazzaville** 🇨🇬

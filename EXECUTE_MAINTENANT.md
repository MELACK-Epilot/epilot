# 🚀 EXÉCUTE MAINTENANT - JOURNAL D'ACTIVITÉ

## ⚡ INSTRUCTIONS RAPIDES (5 MINUTES)

### Étape 1 : Ouvre Supabase
1. Va sur https://supabase.com
2. Ouvre ton projet E-Pilot
3. Clique sur **SQL Editor** dans le menu de gauche

---

### Étape 2 : Copie ce script et exécute-le

**Copie TOUT le code ci-dessous et colle-le dans SQL Editor, puis clique sur RUN** :

```sql
-- ============================================================================
-- SCRIPT COMPLET : CRÉATION TABLE + DONNÉES DE TEST
-- ============================================================================

-- 1. CRÉER LA TABLE activity_logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  details TEXT,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CRÉER LES INDEX
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- 3. ACTIVER RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- 4. CRÉER LES POLITIQUES RLS
DROP POLICY IF EXISTS "Users can view activity logs from their school" ON activity_logs;
CREATE POLICY "Users can view activity logs from their school"
  ON activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u1, users u2
      WHERE u1.id = auth.uid()
      AND u2.id = activity_logs.user_id
      AND u1.school_id = u2.school_id
      AND u1.role IN ('proviseur', 'directeur', 'directeur_etudes', 'admin_groupe', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "System can insert activity logs" ON activity_logs;
CREATE POLICY "System can insert activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view all activity logs" ON activity_logs;
CREATE POLICY "Admins can view all activity logs"
  ON activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin_groupe', 'super_admin')
    )
  );

-- 5. INSÉRER DES DONNÉES DE TEST
-- Logs de connexion
INSERT INTO activity_logs (user_id, action, entity, entity_id, details, ip_address, timestamp)
SELECT 
  u.id as user_id,
  'login' as action,
  'user' as entity,
  u.id as entity_id,
  'Connexion réussie à l''application' as details,
  '192.168.1.' || (RANDOM() * 255)::INT as ip_address,
  NOW() - (RANDOM() * INTERVAL '7 days') as timestamp
FROM users u
WHERE u.role IN ('proviseur', 'directeur', 'enseignant', 'cpe', 'comptable')
LIMIT 10;

-- Logs d'actions variées
INSERT INTO activity_logs (user_id, action, entity, entity_id, details, ip_address, timestamp)
SELECT 
  u.id as user_id,
  (ARRAY['create', 'update', 'view', 'delete'])[FLOOR(RANDOM() * 4 + 1)] as action,
  (ARRAY['student', 'class', 'grade', 'payment', 'document'])[FLOOR(RANDOM() * 5 + 1)] as entity,
  gen_random_uuid() as entity_id,
  CASE 
    WHEN RANDOM() < 0.25 THEN 'Création d''un nouvel élément'
    WHEN RANDOM() < 0.5 THEN 'Modification des informations'
    WHEN RANDOM() < 0.75 THEN 'Consultation des données'
    ELSE 'Suppression d''un élément'
  END as details,
  '192.168.1.' || (RANDOM() * 255)::INT as ip_address,
  NOW() - (RANDOM() * INTERVAL '30 days') as timestamp
FROM users u
WHERE u.role IN ('proviseur', 'directeur', 'enseignant', 'cpe', 'comptable')
LIMIT 50;

-- Logs d'exports
INSERT INTO activity_logs (user_id, action, entity, entity_id, details, ip_address, timestamp)
SELECT 
  u.id as user_id,
  'export' as action,
  'report' as entity,
  gen_random_uuid() as entity_id,
  'Export du rapport ' || (ARRAY['académique', 'financier', 'global', 'personnel'])[FLOOR(RANDOM() * 4 + 1)] || ' en PDF',
  '192.168.1.' || (RANDOM() * 255)::INT as ip_address,
  NOW() - (RANDOM() * INTERVAL '7 days') as timestamp
FROM users u
WHERE u.role IN ('proviseur', 'directeur')
LIMIT 15;

-- Logs de saisie de notes
INSERT INTO activity_logs (user_id, action, entity, entity_id, details, ip_address, timestamp)
SELECT 
  u.id as user_id,
  (ARRAY['create', 'update'])[FLOOR(RANDOM() * 2 + 1)] as action,
  'grade' as entity,
  gen_random_uuid() as entity_id,
  'Saisie de ' || (10 + FLOOR(RANDOM() * 30))::TEXT || ' notes pour le contrôle de ' || 
  (ARRAY['Mathématiques', 'Français', 'Anglais', 'Histoire', 'Sciences'])[FLOOR(RANDOM() * 5 + 1)],
  '192.168.1.' || (RANDOM() * 255)::INT as ip_address,
  NOW() - (RANDOM() * INTERVAL '14 days') as timestamp
FROM users u
WHERE u.role = 'enseignant'
LIMIT 25;

-- Logs de paiements
INSERT INTO activity_logs (user_id, action, entity, entity_id, details, ip_address, timestamp)
SELECT 
  u.id as user_id,
  'create' as action,
  'payment' as entity,
  gen_random_uuid() as entity_id,
  'Paiement de ' || (50000 + FLOOR(RANDOM() * 200000))::TEXT || ' FCFA pour frais de scolarité',
  '192.168.1.' || (RANDOM() * 255)::INT as ip_address,
  NOW() - (RANDOM() * INTERVAL '30 days') as timestamp
FROM users u
WHERE u.role = 'comptable'
LIMIT 20;

-- 6. VÉRIFIER QUE TOUT FONCTIONNE
SELECT 
  COUNT(*) as total_logs,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT action) as unique_actions,
  MIN(timestamp) as oldest_log,
  MAX(timestamp) as newest_log
FROM activity_logs;

-- Afficher quelques exemples
SELECT 
  al.action,
  al.entity,
  al.details,
  u.first_name || ' ' || u.last_name as user_name,
  u.role,
  al.timestamp
FROM activity_logs al
LEFT JOIN users u ON u.id = al.user_id
ORDER BY al.timestamp DESC
LIMIT 10;
```

---

### Étape 3 : Vérifie le résultat

Tu devrais voir :
```
✅ Table créée
✅ Index créés
✅ RLS activé
✅ Politiques créées
✅ 120+ logs insérés
✅ Statistiques affichées
✅ 10 exemples de logs
```

---

### Étape 4 : Teste la page

1. Va sur ton application
2. Connecte-toi en tant que **Proviseur** ou **Directeur**
3. Va sur `/user/activity-logs`
4. Tu devrais voir tous les logs ! 🎉

---

## 🎯 SI ÇA NE MARCHE PAS

### Erreur : "relation activity_logs does not exist"
→ La table n'a pas été créée
→ Réexécute le script

### Erreur : "permission denied"
→ Problème de RLS
→ Vérifie que tu es connecté avec le bon rôle

### La page est vide
→ Pas de données
→ Vérifie avec : `SELECT COUNT(*) FROM activity_logs;`

### Erreur : "foreign key violation"
→ Pas d'utilisateurs dans la table `users`
→ Crée d'abord des utilisateurs

---

## ✅ CHECKLIST

- [ ] Script SQL copié
- [ ] Script exécuté dans Supabase SQL Editor
- [ ] Aucune erreur affichée
- [ ] Statistiques affichées (120+ logs)
- [ ] Page `/user/activity-logs` testée
- [ ] Logs visibles dans la page
- [ ] Filtres fonctionnels
- [ ] Export CSV fonctionne

---

**EXÉCUTE LE SCRIPT MAINTENANT ! 🚀**

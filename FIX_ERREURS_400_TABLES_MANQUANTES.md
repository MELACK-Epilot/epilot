# ✅ FIX ERREURS 400 - TABLES MANQUANTES

**Date** : 5 Novembre 2025 00h25  
**Problème** : Erreurs 400 sur fee_payments, activity_logs, system_alerts  
**Cause** : Tables manquantes + Champ manquant + RLS policies absentes  
**Solution** : Scripts SQL de création  
**Statut** : ✅ SCRIPTS CRÉÉS

---

## ❌ ERREURS CONSOLE

```
csltuxbanvweyfzqpfap.supabase.co/rest/v1/fee_payments?...
Failed to load resource: 400

csltuxbanvweyfzqpfap.supabase.co/rest/v1/activity_logs?...
Failed to load resource: 400

csltuxbanvweyfzqpfap.supabase.co/rest/v1/system_alerts?...
Failed to load resource: 400
```

---

## 🔍 ANALYSE

### Tables Manquantes

1. ❌ **system_alerts** - N'existe PAS dans SUPABASE_SQL_SCHEMA.sql
2. ❌ **fee_payments** - N'existe PAS dans SUPABASE_SQL_SCHEMA.sql
3. ⚠️ **activity_logs** - Existe MAIS sans `school_group_id`

### Hooks Affectés

```typescript
// useGroupAlerts.ts
- Requête fee_payments (table manquante)
- Requête system_alerts (table manquante)

// useRecentActivity.ts
- Requête activity_logs (champ school_group_id manquant)
```

---

## ✅ SOLUTIONS CRÉÉES

### 1. Script CREATE_SYSTEM_ALERTS_FEE_PAYMENTS.sql ✅

**Crée 2 tables** :

#### Table: system_alerts

```sql
CREATE TABLE system_alerts (
  id UUID PRIMARY KEY,
  school_group_id UUID REFERENCES school_groups(id),
  school_id UUID REFERENCES schools(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  category TEXT CHECK (category IN ('system', 'payment', 'user', 'school', 'security')),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  read_by UUID REFERENCES users(id),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Index** :
- school_group_id
- school_id
- severity
- is_read
- created_at

---

#### Table: fee_payments

```sql
CREATE TABLE fee_payments (
  id UUID PRIMARY KEY,
  school_group_id UUID REFERENCES school_groups(id),
  school_id UUID NOT NULL REFERENCES schools(id),
  student_id UUID REFERENCES users(id),
  fee_type TEXT CHECK (fee_type IN ('scolarite', 'inscription', 'cantine', 'transport', 'uniforme', 'materiel', 'activite', 'autre')),
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'FCFA',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'partial', 'overdue', 'cancelled')),
  due_date DATE NOT NULL,
  paid_date DATE,
  paid_amount DECIMAL(12, 2) DEFAULT 0,
  payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'mobile_money', 'check', 'card')),
  reference TEXT,
  notes TEXT,
  metadata JSONB,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Index** :
- school_group_id
- school_id
- student_id
- status
- due_date
- created_at

---

#### RLS Policies Créées

**system_alerts** :
- ✅ Super Admin : Accès complet
- ✅ Admin Groupe : SELECT + UPDATE sur son groupe
- ✅ Marquer comme lu

**fee_payments** :
- ✅ Super Admin : Accès complet
- ✅ Admin Groupe : Gérer paiements de son groupe
- ✅ Comptable : Gérer paiements de son école

**activity_logs** :
- ✅ Super Admin : Accès complet
- ✅ Admin Groupe : SELECT sur son groupe
- ✅ Utilisateurs : SELECT leurs propres logs

---

### 2. Script FIX_ACTIVITY_LOGS_ADD_SCHOOL_GROUP.sql ✅

**Ajoute champ manquant** :

```sql
-- Ajouter colonne
ALTER TABLE activity_logs 
ADD COLUMN school_group_id UUID REFERENCES school_groups(id);

-- Créer index
CREATE INDEX idx_activity_logs_school_group_id ON activity_logs(school_group_id);

-- Mettre à jour logs existants
UPDATE activity_logs
SET school_group_id = users.school_group_id
FROM users
WHERE activity_logs.user_id = users.id;
```

---

## 📋 INSTALLATION

### Étape 1 : Exécuter dans Supabase SQL Editor

```bash
1. Ouvrir Supabase Dashboard
2. Aller dans SQL Editor
3. Exécuter dans l'ordre :

   A. CREATE_SYSTEM_ALERTS_FEE_PAYMENTS.sql
      ✅ Crée system_alerts
      ✅ Crée fee_payments
      ✅ Crée RLS policies

   B. FIX_ACTIVITY_LOGS_ADD_SCHOOL_GROUP.sql
      ✅ Ajoute school_group_id à activity_logs
      ✅ Met à jour logs existants
```

---

### Étape 2 : Vérifier Tables Créées

```sql
-- Vérifier system_alerts
SELECT * FROM system_alerts LIMIT 1;

-- Vérifier fee_payments
SELECT * FROM fee_payments LIMIT 1;

-- Vérifier activity_logs avec school_group_id
SELECT id, user_id, school_group_id, action 
FROM activity_logs 
LIMIT 5;
```

---

### Étape 3 : Tester Hooks

```bash
1. Recharger application (Ctrl + Shift + R)
2. Aller sur Dashboard Admin Groupe
3. Vérifier console :
   ✅ Pas d'erreur 400
   ✅ Activité récente s'affiche
   ✅ Alertes s'affichent
```

---

## 🎯 RÉSULTAT ATTENDU

### Avant ❌

```
Console :
❌ fee_payments: 400 (table manquante)
❌ activity_logs: 400 (champ manquant)
❌ system_alerts: 400 (table manquante)

Dashboard :
❌ Activité récente vide
❌ Alertes vides
❌ Erreurs dans console
```

---

### Après ✅

```
Console :
✅ fee_payments: 200 OK
✅ activity_logs: 200 OK
✅ system_alerts: 200 OK

Dashboard :
✅ Activité récente affichée
✅ Alertes affichées
✅ Pas d'erreur
```

---

## 📁 FICHIERS CRÉÉS

### Scripts SQL ✅

1. **CREATE_SYSTEM_ALERTS_FEE_PAYMENTS.sql**
   - Crée system_alerts (13 colonnes)
   - Crée fee_payments (17 colonnes)
   - RLS policies complètes

2. **FIX_ACTIVITY_LOGS_ADD_SCHOOL_GROUP.sql**
   - Ajoute school_group_id
   - Met à jour logs existants

### Documentation ✅

3. **FIX_ERREURS_400_TABLES_MANQUANTES.md**
   - Analyse complète
   - Guide installation

---

## 🔧 DÉTAILS TECHNIQUES

### Types de Frais (fee_type)

```
- scolarite : Frais de scolarité
- inscription : Frais d'inscription
- cantine : Frais de cantine
- transport : Frais de transport
- uniforme : Frais d'uniforme
- materiel : Matériel scolaire
- activite : Activités extra-scolaires
- autre : Autres frais
```

---

### Statuts Paiement (status)

```
- pending : En attente
- paid : Payé
- partial : Partiellement payé
- overdue : En retard
- cancelled : Annulé
```

---

### Niveaux Alerte (severity)

```
- info : Information
- warning : Avertissement
- error : Erreur
- critical : Critique
```

---

### Catégories Alerte (category)

```
- system : Système
- payment : Paiement
- user : Utilisateur
- school : École
- security : Sécurité
```

---

## 🧪 TESTS POST-INSTALLATION

### Test 1 : Créer Alerte Système

```sql
INSERT INTO system_alerts (
  school_group_id,
  title,
  message,
  severity,
  category
) VALUES (
  '508ed785-99c1-498e-bdef-ea8e85302d0a',
  'Test Alerte',
  'Ceci est un test',
  'info',
  'system'
);
```

---

### Test 2 : Créer Paiement

```sql
INSERT INTO fee_payments (
  school_group_id,
  school_id,
  fee_type,
  amount,
  status,
  due_date
) VALUES (
  '508ed785-99c1-498e-bdef-ea8e85302d0a',
  '58dc2eca-093b-45b7-8209-24b7c972279c',
  'scolarite',
  50000,
  'pending',
  '2025-12-31'
);
```

---

### Test 3 : Vérifier Activity Logs

```sql
SELECT 
  id,
  user_id,
  school_group_id,
  action,
  entity,
  created_at
FROM activity_logs
WHERE school_group_id = '508ed785-99c1-498e-bdef-ea8e85302d0a'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🎉 RÉSULTAT FINAL

### Dashboard Fonctionnel ✅

```
┌─────────────────────────────────────────┐
│  Dashboard Admin Groupe                 │
├─────────────────────────────────────────┤
│  KPIs (4 cards) ✅                      │
├─────────────────────────────────────────┤
│  Actions Rapides (6 cards) ✅           │
├─────────────────────────────────────────┤
│  Activité Récente ✅                    │
│  ├─ Dernières actions                   │
│  └─ Temps réel                          │
├─────────────────────────────────────────┤
│  Alertes ✅                             │
│  ├─ Paiements en retard                 │
│  ├─ Utilisateurs inactifs               │
│  └─ Alertes système                     │
└─────────────────────────────────────────┘
```

---

**✅ SCRIPTS CRÉÉS ! Exécute-les dans Supabase SQL Editor !** 🎯✨🇨🇬

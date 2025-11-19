# 📊 TABLES CONCERNÉES - AUTO-RENOUVELLEMENT

**Date:** 19 novembre 2025  
**Fonctionnalité:** Renouvellement automatique des abonnements  
**Status:** Documentation des tables impactées

---

## 🎯 TABLES PRINCIPALES

### 1. **`subscriptions`** 🔴 **TABLE PRINCIPALE**

**Rôle:** Stocke tous les abonnements des groupes scolaires aux plans

**Colonnes concernées:**
```sql
-- Colonne à ajouter
auto_renew BOOLEAN DEFAULT true

-- Colonnes utilisées
id UUID PRIMARY KEY
school_group_id UUID REFERENCES school_groups(id)
plan_id UUID REFERENCES subscription_plans(id)
status TEXT -- 'active', 'cancelled', 'expired', 'suspended'
start_date TIMESTAMPTZ
end_date TIMESTAMPTZ
billing_period TEXT -- 'monthly', 'quarterly', 'yearly', 'biannual'
amount DECIMAL(10,2)
currency VARCHAR(10)
payment_status TEXT
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

**Modifications nécessaires:**
- ✅ Ajouter colonne `auto_renew BOOLEAN DEFAULT true`
- ✅ Créer index `idx_subscriptions_auto_renew` sur `(auto_renew, end_date)`
- ✅ Mettre à jour les données existantes

**Requêtes impactées:**
```sql
-- Récupérer les abonnements à renouveler
SELECT * FROM subscriptions
WHERE status = 'active'
  AND auto_renew = true
  AND end_date BETWEEN NOW() AND NOW() + INTERVAL '7 days';

-- Renouveler un abonnement
UPDATE subscriptions
SET end_date = end_date + INTERVAL '30 days',
    updated_at = NOW()
WHERE id = 'subscription-uuid'
  AND auto_renew = true;

-- Activer/désactiver auto-renew
UPDATE subscriptions
SET auto_renew = true/false,
    updated_at = NOW()
WHERE id = 'subscription-uuid';
```

---

### 2. **`school_groups`** 🟡 **TABLE LIÉE**

**Rôle:** Stocke les groupes scolaires (clients E-Pilot)

**Colonnes concernées:**
```sql
id UUID PRIMARY KEY
name TEXT
auto_subscription_config JSONB -- Configuration auto-renouvellement
contact_email TEXT
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

**Configuration auto-renouvellement:**
```json
{
  "auto_renewal": true,
  "billing_cycle": "monthly",
  "grace_period_days": 7,
  "auto_suspend_on_failure": true,
  "max_retry_attempts": 3,
  "notification_days_before_expiry": [30, 15, 7, 3, 1]
}
```

**Requêtes impactées:**
```sql
-- Récupérer config auto-renouvellement
SELECT 
  sg.id,
  sg.name,
  sg.auto_subscription_config
FROM school_groups sg
INNER JOIN subscriptions s ON s.school_group_id = sg.id
WHERE s.auto_renew = true;
```

---

### 3. **`subscription_plans`** 🟡 **TABLE LIÉE**

**Rôle:** Définit les plans d'abonnement (Gratuit, Standard, Premium, etc.)

**Colonnes concernées:**
```sql
id UUID PRIMARY KEY
name TEXT
slug TEXT
price DECIMAL(10,2)
billing_cycle TEXT -- 'monthly', 'yearly', etc.
features JSONB
created_at TIMESTAMPTZ
```

**Requêtes impactées:**
```sql
-- Récupérer infos plan pour renouvellement
SELECT 
  sp.id,
  sp.name,
  sp.price,
  sp.billing_cycle
FROM subscription_plans sp
INNER JOIN subscriptions s ON s.plan_id = sp.id
WHERE s.auto_renew = true;
```

---

### 4. **`subscription_logs`** 🟢 **TABLE OPTIONNELLE**

**Rôle:** Enregistre l'historique des actions sur les abonnements

**Structure suggérée:**
```sql
CREATE TABLE subscription_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES subscriptions(id),
  action TEXT, -- 'renewal_success', 'renewal_failed', 'auto_renew_enabled', etc.
  details JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Actions enregistrées:**
- `renewal_success` - Renouvellement réussi
- `renewal_failed` - Échec de renouvellement
- `auto_renew_enabled` - Auto-renew activé
- `auto_renew_disabled` - Auto-renew désactivé
- `suspension_triggered` - Suspension déclenchée
- `notification_sent` - Notification envoyée

**Requêtes impactées:**
```sql
-- Enregistrer un renouvellement réussi
INSERT INTO subscription_logs (
  subscription_id,
  action,
  details,
  created_at
) VALUES (
  'subscription-uuid',
  'renewal_success',
  '{"old_end_date": "2025-11-25", "new_end_date": "2025-12-25"}'::jsonb,
  NOW()
);

-- Enregistrer un échec
INSERT INTO subscription_logs (
  subscription_id,
  action,
  error_message,
  created_at
) VALUES (
  'subscription-uuid',
  'renewal_failed',
  'Payment method expired',
  NOW()
);
```

---

### 5. **`payment_history`** 🟢 **TABLE OPTIONNELLE**

**Rôle:** Historique des paiements liés aux abonnements

**Structure suggérée:**
```sql
CREATE TABLE payment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES subscriptions(id),
  amount DECIMAL(10,2),
  currency VARCHAR(10),
  status TEXT, -- 'pending', 'paid', 'failed', 'refunded'
  payment_method TEXT,
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Requêtes impactées:**
```sql
-- Vérifier historique paiements avant renouvellement
SELECT 
  ph.status,
  ph.attempts,
  ph.due_date
FROM payment_history ph
WHERE ph.subscription_id = 'subscription-uuid'
ORDER BY ph.created_at DESC
LIMIT 5;
```

---

## 📊 SCHÉMA DES RELATIONS

```
┌─────────────────────────┐
│   school_groups         │
│  ┌──────────────────┐   │
│  │ id (PK)          │   │
│  │ name             │   │
│  │ auto_subscription│   │
│  │   _config (JSONB)│   │
│  └──────────────────┘   │
└───────────┬─────────────┘
            │
            │ 1:N
            ▼
┌─────────────────────────┐
│   subscriptions         │ ◄─── TABLE PRINCIPALE
│  ┌──────────────────┐   │
│  │ id (PK)          │   │
│  │ school_group_id  │   │
│  │ plan_id (FK)     │   │
│  │ status           │   │
│  │ auto_renew ✨    │◄──── NOUVELLE COLONNE
│  │ start_date       │   │
│  │ end_date         │   │
│  │ billing_period   │   │
│  └──────────────────┘   │
└───────────┬─────────────┘
            │
            │ N:1
            ▼
┌─────────────────────────┐
│  subscription_plans     │
│  ┌──────────────────┐   │
│  │ id (PK)          │   │
│  │ name             │   │
│  │ price            │   │
│  │ billing_cycle    │   │
│  └──────────────────┘   │
└─────────────────────────┘

┌─────────────────────────┐
│  subscription_logs      │ ◄─── LOGS
│  ┌──────────────────┐   │
│  │ id (PK)          │   │
│  │ subscription_id  │───┼──► subscriptions.id
│  │ action           │   │
│  │ error_message    │   │
│  └──────────────────┘   │
└─────────────────────────┘

┌─────────────────────────┐
│  payment_history        │ ◄─── PAIEMENTS
│  ┌──────────────────┐   │
│  │ id (PK)          │   │
│  │ subscription_id  │───┼──► subscriptions.id
│  │ amount           │   │
│  │ status           │   │
│  │ attempts         │   │
│  └──────────────────┘   │
└─────────────────────────┘
```

---

## 🔄 FLUX DE DONNÉES

### Scénario: Renouvellement Automatique

```sql
-- 1. DÉTECTION des abonnements à renouveler
SELECT 
  s.id,
  s.school_group_id,
  s.end_date,
  sg.name,
  sg.auto_subscription_config
FROM subscriptions s
INNER JOIN school_groups sg ON sg.id = s.school_group_id
WHERE s.status = 'active'
  AND s.auto_renew = true  -- ✨ Nouvelle colonne
  AND s.end_date BETWEEN NOW() AND NOW() + INTERVAL '7 days';

-- 2. VÉRIFICATION de la config du groupe
SELECT 
  auto_subscription_config->>'auto_renewal' as auto_renewal,
  auto_subscription_config->>'billing_cycle' as billing_cycle,
  auto_subscription_config->>'grace_period_days' as grace_period
FROM school_groups
WHERE id = 'group-uuid';

-- 3. CALCUL de la nouvelle date de fin
-- (selon billing_period: monthly=30j, quarterly=90j, yearly=365j)

-- 4. MISE À JOUR de l'abonnement
UPDATE subscriptions
SET 
  end_date = end_date + INTERVAL '30 days',
  updated_at = NOW()
WHERE id = 'subscription-uuid'
  AND auto_renew = true;

-- 5. LOG du renouvellement
INSERT INTO subscription_logs (
  subscription_id,
  action,
  details
) VALUES (
  'subscription-uuid',
  'renewal_success',
  '{"old_end_date": "2025-11-25", "new_end_date": "2025-12-25"}'::jsonb
);

-- 6. CRÉATION d'une entrée de paiement
INSERT INTO payment_history (
  subscription_id,
  amount,
  currency,
  status,
  due_date
) VALUES (
  'subscription-uuid',
  50000,
  'FCFA',
  'pending',
  NOW() + INTERVAL '7 days'
);
```

---

## 📋 CHECKLIST DES MODIFICATIONS

### Table `subscriptions`
- [ ] Ajouter colonne `auto_renew BOOLEAN DEFAULT true`
- [ ] Créer index `idx_subscriptions_auto_renew`
- [ ] Mettre à jour les données existantes
- [ ] Créer fonction `process_auto_renewals()`
- [ ] Créer fonction `toggle_auto_renew()`

### Table `school_groups`
- [x] Colonne `auto_subscription_config` existe déjà ✅
- [ ] Vérifier la structure JSONB
- [ ] Ajouter valeurs par défaut si NULL

### Table `subscription_plans`
- [x] Aucune modification nécessaire ✅
- [x] Colonnes existantes suffisantes ✅

### Table `subscription_logs` (Optionnel)
- [ ] Créer la table si elle n'existe pas
- [ ] Ajouter index sur `subscription_id`
- [ ] Ajouter index sur `action`
- [ ] Ajouter index sur `created_at`

### Table `payment_history` (Optionnel)
- [ ] Créer la table si elle n'existe pas
- [ ] Ajouter index sur `subscription_id`
- [ ] Ajouter index sur `status`
- [ ] Ajouter index sur `due_date`

---

## 🎯 REQUÊTES CRITIQUES

### 1. Récupérer les abonnements à renouveler

```sql
SELECT 
  s.id,
  s.school_group_id,
  sg.name as group_name,
  sp.name as plan_name,
  s.end_date,
  s.billing_period,
  s.auto_renew
FROM subscriptions s
INNER JOIN school_groups sg ON sg.id = s.school_group_id
INNER JOIN subscription_plans sp ON sp.id = s.plan_id
WHERE s.status = 'active'
  AND s.auto_renew = true
  AND s.end_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
ORDER BY s.end_date ASC;
```

### 2. Statistiques auto-renouvellement

```sql
SELECT 
  COUNT(*) FILTER (WHERE auto_renew = true AND status = 'active') as auto_renew_actifs,
  COUNT(*) FILTER (WHERE auto_renew = false AND status = 'active') as manuels_actifs,
  COUNT(*) FILTER (WHERE status = 'active') as total_actifs,
  ROUND(
    COUNT(*) FILTER (WHERE auto_renew = true AND status = 'active')::NUMERIC / 
    NULLIF(COUNT(*) FILTER (WHERE status = 'active'), 0) * 100, 
    2
  ) as pourcentage_auto_renew
FROM subscriptions;
```

### 3. Historique des renouvellements

```sql
SELECT 
  sg.name as groupe,
  sp.name as plan,
  sl.action,
  sl.details,
  sl.created_at
FROM subscription_logs sl
INNER JOIN subscriptions s ON s.id = sl.subscription_id
INNER JOIN school_groups sg ON sg.id = s.school_group_id
INNER JOIN subscription_plans sp ON sp.id = s.plan_id
WHERE sl.action IN ('renewal_success', 'renewal_failed')
ORDER BY sl.created_at DESC
LIMIT 50;
```

### 4. Abonnements avec échecs de paiement

```sql
SELECT 
  sg.name as groupe,
  sp.name as plan,
  s.end_date,
  ph.attempts,
  ph.status
FROM subscriptions s
INNER JOIN school_groups sg ON sg.id = s.school_group_id
INNER JOIN subscription_plans sp ON sp.id = s.plan_id
LEFT JOIN payment_history ph ON ph.subscription_id = s.id
WHERE s.auto_renew = true
  AND ph.status = 'failed'
  AND ph.attempts >= 3
ORDER BY s.end_date ASC;
```

---

## 📊 IMPACT SUR LES PERFORMANCES

### Index à créer

```sql
-- Index principal (CRITIQUE)
CREATE INDEX idx_subscriptions_auto_renew 
ON subscriptions(auto_renew, end_date) 
WHERE status = 'active' AND auto_renew = true;

-- Index pour logs (RECOMMANDÉ)
CREATE INDEX idx_subscription_logs_subscription_id 
ON subscription_logs(subscription_id);

CREATE INDEX idx_subscription_logs_action 
ON subscription_logs(action);

-- Index pour paiements (RECOMMANDÉ)
CREATE INDEX idx_payment_history_subscription_id 
ON payment_history(subscription_id);

CREATE INDEX idx_payment_history_status 
ON payment_history(status, due_date);
```

### Estimation des performances

| Requête | Sans index | Avec index | Gain |
|---------|-----------|------------|------|
| Récupérer abonnements à renouveler | 500ms | 5ms | **99%** |
| Statistiques auto-renew | 200ms | 10ms | **95%** |
| Historique renouvellements | 300ms | 15ms | **95%** |
| Échecs de paiement | 400ms | 20ms | **95%** |

---

## 🚀 RÉSUMÉ

### Tables Principales (Modifications requises)
1. ✅ **`subscriptions`** - Ajouter colonne `auto_renew` + index
2. ✅ **`school_groups`** - Utiliser `auto_subscription_config` existant
3. ✅ **`subscription_plans`** - Aucune modification

### Tables Optionnelles (Recommandées)
4. 🟢 **`subscription_logs`** - Créer pour historique
5. 🟢 **`payment_history`** - Créer pour suivi paiements

### Colonnes Critiques
- ✨ **`subscriptions.auto_renew`** - NOUVELLE (BOOLEAN)
- ✅ **`subscriptions.end_date`** - Existante
- ✅ **`subscriptions.status`** - Existante
- ✅ **`subscriptions.billing_period`** - Existante
- ✅ **`school_groups.auto_subscription_config`** - Existante (JSONB)

---

**Script SQL prêt:** `database/ADD_AUTO_RENEW_COLUMN.sql` ✅

**Exécute le script pour activer la fonctionnalité!** 🚀✨

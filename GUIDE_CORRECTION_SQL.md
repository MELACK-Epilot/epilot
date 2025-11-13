# 🔧 Guide de Correction SQL - E-Pilot

## ⚠️ Erreurs Rencontrées

### **Erreur 1 : Index déjà existant**
```sql
ERROR: 42P07: relation "idx_subscriptions_status" already exists
```

### **Erreur 2 : Contrainte déjà existante**
```sql
ERROR: 42710: constraint "check_slug_values" for relation "subscription_plans" already exists
```

---

## ✅ Solutions Appliquées

### **Solution 1 : Vérification d'existence des index**

**❌ Avant (Erreur) :**
```sql
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

**✅ Après (Corrigé) :**
```sql
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_subscriptions_status'
  ) THEN
    CREATE INDEX idx_subscriptions_status ON subscriptions(status);
  END IF;
END $$;
```

### **Solution 2 : Vérification d'existence des contraintes**

**❌ Avant (Erreur) :**
```sql
ALTER TABLE subscription_plans
ADD CONSTRAINT check_slug_values CHECK (slug IN ('gratuit', 'premium', 'pro', 'institutionnel'));
```

**✅ Après (Corrigé) :**
```sql
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_slug_values' 
    AND conrelid = 'subscription_plans'::regclass
  ) THEN
    ALTER TABLE subscription_plans
    ADD CONSTRAINT check_slug_values CHECK (slug IN ('gratuit', 'premium', 'pro', 'institutionnel'));
  END IF;
END $$;
```

### **Solution 3 : Gestion des doublons dans INSERT**

**❌ Avant (Erreur si réexécuté) :**
```sql
INSERT INTO subscription_plans (...) VALUES (...);
```

**✅ Après (Corrigé) :**
```sql
INSERT INTO subscription_plans (...)
VALUES (...)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  updated_at = NOW();
```

### **Solution 4 : Suppression conditionnelle des triggers**

**❌ Avant (Erreur) :**
```sql
CREATE TRIGGER trigger_update_subscriptions_updated_at ...
```

**✅ Après (Corrigé) :**
```sql
DROP TRIGGER IF EXISTS trigger_update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER trigger_update_subscriptions_updated_at ...
```

### **Solution 5 : Suppression conditionnelle des politiques RLS**

**❌ Avant (Erreur) :**
```sql
CREATE POLICY "Super Admin can view all subscriptions" ...
```

**✅ Après (Corrigé) :**
```sql
DROP POLICY IF EXISTS "Super Admin can view all subscriptions" ON subscriptions;
CREATE POLICY "Super Admin can view all subscriptions" ...
```

---

## 📁 Fichiers SQL Corrigés

### **1. SUBSCRIPTION_PLANS_SCHEMA_FIXED.sql**
**Corrections appliquées :**
- ✅ Vérification contrainte `check_slug_values`
- ✅ Vérification index (3 index)
- ✅ `DROP TRIGGER IF EXISTS`
- ✅ `DROP POLICY IF EXISTS` (2 politiques)
- ✅ `ON CONFLICT DO UPDATE` pour INSERT

**Utilisation :**
```bash
# Dans Supabase SQL Editor
1. Ouvrir SUBSCRIPTION_PLANS_SCHEMA_FIXED.sql
2. Copier tout le contenu
3. Coller dans SQL Editor
4. Cliquer sur "Run"
```

### **2. FINANCES_TABLES_SCHEMA_FIXED.sql**
**Corrections appliquées :**
- ✅ Vérification index subscriptions (5 index)
- ✅ Vérification index payments (8 index)
- ✅ `DROP TRIGGER IF EXISTS` (2 triggers)
- ✅ `DROP POLICY IF EXISTS` (6 politiques)
- ✅ `CREATE OR REPLACE` pour vues et fonctions

**Utilisation :**
```bash
# Dans Supabase SQL Editor
1. Ouvrir FINANCES_TABLES_SCHEMA_FIXED.sql
2. Copier tout le contenu
3. Coller dans SQL Editor
4. Cliquer sur "Run"
```

---

## 🚀 Ordre d'Exécution

### **Étape 1 : Plans d'abonnement**
```sql
-- Exécuter en premier
SUBSCRIPTION_PLANS_SCHEMA_FIXED.sql
```

**Vérifie :**
- Table `subscription_plans` créée
- 4 plans insérés (Gratuit, Premium, Pro, Institutionnel)
- Vue `school_groups_with_quotas` créée
- Fonction `check_quota_before_creation()` créée

### **Étape 2 : Finances (Subscriptions + Payments)**
```sql
-- Exécuter en second
FINANCES_TABLES_SCHEMA_FIXED.sql
```

**Vérifie :**
- Table `subscriptions` créée
- Table `payments` créée
- Vue `financial_analytics` créée
- Vue `subscription_stats` créée
- Fonctions et triggers créés

---

## ✅ Vérification Post-Exécution

### **1. Vérifier les tables**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('subscription_plans', 'subscriptions', 'payments')
ORDER BY table_name;
```

**Résultat attendu :**
```
table_name
-----------------
payments
subscription_plans
subscriptions
```

### **2. Vérifier les vues**
```sql
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name IN ('financial_analytics', 'subscription_stats', 'school_groups_with_quotas')
ORDER BY table_name;
```

**Résultat attendu :**
```
table_name
--------------------------
financial_analytics
school_groups_with_quotas
subscription_stats
```

### **3. Vérifier les index**
```sql
SELECT indexname, tablename
FROM pg_indexes 
WHERE tablename IN ('subscription_plans', 'subscriptions', 'payments')
ORDER BY tablename, indexname;
```

**Résultat attendu (16 index) :**
```
indexname                              | tablename
---------------------------------------+-------------------
idx_payments_created_at                | payments
idx_payments_method                    | payments
idx_payments_paid_at                   | payments
idx_payments_reference                 | payments
idx_payments_school_group              | payments
idx_payments_status                    | payments
idx_payments_subscription              | payments
idx_payments_transaction_id            | payments
idx_subscription_plans_created_at      | subscription_plans
idx_subscription_plans_is_active       | subscription_plans
idx_subscription_plans_slug            | subscription_plans
idx_subscriptions_end_date             | subscriptions
idx_subscriptions_next_billing         | subscriptions
idx_subscriptions_plan                 | subscriptions
idx_subscriptions_school_group         | subscriptions
idx_subscriptions_status               | subscriptions
```

### **4. Vérifier les plans insérés**
```sql
SELECT name, slug, price, max_schools, max_students 
FROM subscription_plans 
ORDER BY price;
```

**Résultat attendu :**
```
name              | slug           | price    | max_schools | max_students
------------------+----------------+----------+-------------+--------------
Gratuit           | gratuit        | 0        | 1           | 50
Premium ⭐        | premium        | 25000    | 3           | 200
Pro               | pro            | 50000    | 10          | 1000
Institutionnel    | institutionnel | 150000   | 999999      | 999999
```

### **5. Vérifier les contraintes**
```sql
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'subscription_plans'::regclass
ORDER BY conname;
```

**Résultat attendu :**
```
conname                | contype
-----------------------+---------
check_slug_values      | c
subscription_plans_pkey| p
subscription_plans_slug_key | u
```

### **6. Vérifier les triggers**
```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table IN ('subscription_plans', 'subscriptions', 'payments')
ORDER BY event_object_table, trigger_name;
```

**Résultat attendu :**
```
trigger_name                              | event_manipulation | event_object_table
------------------------------------------+--------------------+--------------------
trigger_notify_payment_completed          | INSERT             | payments
trigger_notify_payment_completed          | UPDATE             | payments
trigger_update_payments_updated_at        | UPDATE             | payments
trigger_update_subscription_plans_updated_at | UPDATE          | subscription_plans
trigger_update_subscriptions_updated_at   | UPDATE             | subscriptions
```

### **7. Vérifier les fonctions**
```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'generate_payment_reference',
  'check_subscription_expiry',
  'check_quota_before_creation',
  'notify_payment_completed',
  'update_subscriptions_updated_at',
  'update_payments_updated_at',
  'update_subscription_plans_updated_at'
)
ORDER BY routine_name;
```

**Résultat attendu (7 fonctions) :**
```
routine_name                          | routine_type
--------------------------------------+--------------
check_quota_before_creation           | FUNCTION
check_subscription_expiry             | FUNCTION
generate_payment_reference            | FUNCTION
notify_payment_completed              | FUNCTION
update_payments_updated_at            | FUNCTION
update_subscription_plans_updated_at  | FUNCTION
update_subscriptions_updated_at       | FUNCTION
```

---

## 🔄 En cas d'erreur persistante

### **Option 1 : Nettoyage complet (ATTENTION : Perte de données)**
```sql
-- ⚠️ ATTENTION : Ceci supprime TOUTES les données !
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP VIEW IF EXISTS financial_analytics CASCADE;
DROP VIEW IF EXISTS subscription_stats CASCADE;
DROP VIEW IF EXISTS school_groups_with_quotas CASCADE;
DROP FUNCTION IF EXISTS generate_payment_reference CASCADE;
DROP FUNCTION IF EXISTS check_subscription_expiry CASCADE;
DROP FUNCTION IF EXISTS check_quota_before_creation CASCADE;
DROP FUNCTION IF EXISTS notify_payment_completed CASCADE;
```

**Puis réexécuter les 2 fichiers corrigés.**

### **Option 2 : Suppression sélective**
```sql
-- Supprimer uniquement les contraintes problématiques
ALTER TABLE subscription_plans DROP CONSTRAINT IF EXISTS check_slug_values;

-- Supprimer uniquement les index problématiques
DROP INDEX IF EXISTS idx_subscriptions_status;
DROP INDEX IF EXISTS idx_subscriptions_plan;
-- etc.
```

---

## 📊 Checklist Finale

- [ ] ✅ `SUBSCRIPTION_PLANS_SCHEMA_FIXED.sql` exécuté sans erreur
- [ ] ✅ `FINANCES_TABLES_SCHEMA_FIXED.sql` exécuté sans erreur
- [ ] ✅ 3 tables créées (subscription_plans, subscriptions, payments)
- [ ] ✅ 3 vues créées (financial_analytics, subscription_stats, school_groups_with_quotas)
- [ ] ✅ 16 index créés
- [ ] ✅ 7 fonctions créées
- [ ] ✅ 5 triggers créés
- [ ] ✅ 4 plans insérés
- [ ] ✅ Politiques RLS configurées

---

## 🎯 Résultat Attendu

**Après exécution des 2 fichiers SQL corrigés :**

✅ **Base de données complète et fonctionnelle**
- Tables : subscription_plans, subscriptions, payments
- Vues : Analytics et stats en temps réel
- Fonctions : Génération références, vérification quotas
- Triggers : MAJ automatique, notifications
- RLS : Sécurité par rôle

✅ **Frontend prêt à fonctionner**
- Page Finances avec 4 KPIs
- Vue d'ensemble avec graphiques
- Plans avec CRUD
- Abonnements avec filtres
- Paiements avec historique

✅ **Zéro erreur SQL**
- Scripts idempotents (réexécutables)
- Gestion des doublons
- Vérifications d'existence

---

**Prochaine action : Exécuter les 2 fichiers SQL dans Supabase !** 🚀

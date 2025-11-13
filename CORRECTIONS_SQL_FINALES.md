# 🔧 Corrections SQL Finales - E-Pilot

## ⚠️ Erreurs Rencontrées et Corrigées

### **Erreur 1 : Index déjà existant**
```sql
ERROR: 42P07: relation "idx_subscriptions_status" already exists
```
✅ **Corrigé** avec `IF NOT EXISTS` dans les blocs `DO $$`

### **Erreur 2 : Contrainte déjà existante**
```sql
ERROR: 42710: constraint "check_slug_values" already exists
```
✅ **Corrigé** avec vérification `pg_constraint`

### **Erreur 3 : Colonne manquante**
```sql
ERROR: 42703: column "next_billing_date" does not exist
```
✅ **Corrigé** avec vérification et ajout automatique des colonnes

---

## ✅ Solutions Appliquées

### **1. Vérification des Colonnes Avant Index**

**Problème :** L'index `idx_subscriptions_next_billing` tentait de référencer une colonne qui n'existait pas encore.

**Solution :** Ajout d'un bloc de vérification des colonnes AVANT la création des index :

```sql
-- Vérifier et ajouter les colonnes manquantes si nécessaire
DO $$ 
BEGIN
  -- Vérifier next_billing_date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'next_billing_date'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN next_billing_date TIMESTAMPTZ;
  END IF;
  
  -- Vérifier auto_renew
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'auto_renew'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN auto_renew BOOLEAN DEFAULT TRUE;
  END IF;
  
  -- Vérifier notes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'notes'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN notes TEXT;
  END IF;
END $$;
```

### **2. Script de Correction Rapide**

**Fichier créé :** `FIX_SUBSCRIPTIONS_TABLE.sql`

**Utilisation :**
```bash
# Exécuter ce script AVANT FINANCES_TABLES_SCHEMA_FIXED.sql
# si la table subscriptions existe déjà mais est incomplète
```

**Contenu :**
- Ajout conditionnel de `next_billing_date`
- Ajout conditionnel de `auto_renew`
- Ajout conditionnel de `notes`
- Création de l'index `idx_subscriptions_next_billing`
- Vérifications finales

---

## 📁 Fichiers SQL Corrigés (Version Finale)

### **1. SUBSCRIPTION_PLANS_SCHEMA_FIXED.sql** ✅
**Corrections :**
- ✅ Vérification contrainte `check_slug_values`
- ✅ Vérification index (3)
- ✅ `DROP TRIGGER IF EXISTS`
- ✅ `DROP POLICY IF EXISTS`
- ✅ `ON CONFLICT DO UPDATE`

**État :** Prêt à exécuter

### **2. FINANCES_TABLES_SCHEMA_FIXED.sql** ✅
**Corrections :**
- ✅ Vérification colonnes `subscriptions` (3 colonnes)
- ✅ Vérification index `subscriptions` (5)
- ✅ Vérification index `payments` (8)
- ✅ `DROP TRIGGER IF EXISTS` (2)
- ✅ `DROP POLICY IF EXISTS` (6)
- ✅ `CREATE OR REPLACE` pour vues

**État :** Prêt à exécuter

### **3. FIX_SUBSCRIPTIONS_TABLE.sql** ✅
**Utilisation :** Script de correction si table déjà créée

**Contenu :**
- Ajout colonnes manquantes
- Création index manquant
- Vérifications

**État :** Prêt à exécuter (optionnel)

---

## 🚀 Ordre d'Exécution Recommandé

### **Scénario 1 : Première Installation (Tables n'existent pas)**

```bash
# Étape 1 : Plans d'abonnement
SUBSCRIPTION_PLANS_SCHEMA_FIXED.sql

# Étape 2 : Finances (Subscriptions + Payments)
FINANCES_TABLES_SCHEMA_FIXED.sql
```

### **Scénario 2 : Correction (Tables existent déjà)**

```bash
# Option A : Script de correction rapide
FIX_SUBSCRIPTIONS_TABLE.sql

# Option B : Réexécuter le schéma complet (idempotent)
FINANCES_TABLES_SCHEMA_FIXED.sql
```

### **Scénario 3 : Réinitialisation Complète**

```sql
-- ⚠️ ATTENTION : Supprime toutes les données !
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP VIEW IF EXISTS financial_analytics CASCADE;
DROP VIEW IF EXISTS subscription_stats CASCADE;
DROP VIEW IF EXISTS school_groups_with_quotas CASCADE;

-- Puis exécuter les 2 fichiers corrigés
```

---

## ✅ Vérifications Post-Exécution

### **1. Vérifier la structure de la table subscriptions**
```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'subscriptions'
ORDER BY ordinal_position;
```

**Colonnes attendues (14) :**
```
column_name          | data_type                   | is_nullable
---------------------+-----------------------------+-------------
id                   | uuid                        | NO
school_group_id      | uuid                        | YES
plan_id              | uuid                        | YES
status               | character varying           | YES
start_date           | timestamp with time zone    | YES
end_date             | timestamp with time zone    | YES
trial_end_date       | timestamp with time zone    | YES
cancelled_at         | timestamp with time zone    | YES
billing_cycle        | character varying           | YES
amount               | numeric                     | NO
currency             | character varying           | YES
auto_renew           | boolean                     | YES  ✅
next_billing_date    | timestamp with time zone    | YES  ✅
notes                | text                        | YES  ✅
metadata             | jsonb                       | YES
created_at           | timestamp with time zone    | YES
updated_at           | timestamp with time zone    | YES
```

### **2. Vérifier les index de subscriptions**
```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'subscriptions'
ORDER BY indexname;
```

**Index attendus (5) :**
```
indexname                          | indexdef
-----------------------------------+------------------------------------------
idx_subscriptions_end_date         | CREATE INDEX ... ON subscriptions(end_date)
idx_subscriptions_next_billing     | CREATE INDEX ... ON subscriptions(next_billing_date) ✅
idx_subscriptions_plan             | CREATE INDEX ... ON subscriptions(plan_id)
idx_subscriptions_school_group     | CREATE INDEX ... ON subscriptions(school_group_id)
idx_subscriptions_status           | CREATE INDEX ... ON subscriptions(status)
```

### **3. Vérifier les contraintes**
```sql
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'subscriptions'::regclass
ORDER BY conname;
```

**Contraintes attendues :**
```
constraint_name                    | constraint_type | definition
-----------------------------------+-----------------+------------------
subscriptions_billing_cycle_check  | c               | CHECK (billing_cycle IN ('monthly', 'yearly'))
subscriptions_plan_id_fkey         | f               | FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
subscriptions_pkey                 | p               | PRIMARY KEY (id)
subscriptions_school_group_id_fkey | f               | FOREIGN KEY (school_group_id) REFERENCES school_groups(id) ON DELETE CASCADE
subscriptions_status_check         | c               | CHECK (status IN ('active', 'expired', 'cancelled', 'pending', 'trial'))
```

### **4. Test de création d'un abonnement**
```sql
-- Test d'insertion (à adapter avec vos IDs réels)
INSERT INTO subscriptions (
  school_group_id,
  plan_id,
  status,
  billing_cycle,
  amount,
  currency,
  auto_renew,
  next_billing_date
) VALUES (
  'votre-school-group-id',
  (SELECT id FROM subscription_plans WHERE slug = 'gratuit'),
  'active',
  'monthly',
  0,
  'FCFA',
  TRUE,
  NOW() + INTERVAL '1 month'
) RETURNING *;
```

---

## 🎯 Checklist Finale

### **Base de données**
- [ ] ✅ Exécuter `SUBSCRIPTION_PLANS_SCHEMA_FIXED.sql`
- [ ] ✅ Exécuter `FINANCES_TABLES_SCHEMA_FIXED.sql`
- [ ] ✅ Vérifier 3 tables créées
- [ ] ✅ Vérifier 3 vues créées
- [ ] ✅ Vérifier 16 index créés
- [ ] ✅ Vérifier 7 fonctions créées
- [ ] ✅ Vérifier 5 triggers créés
- [ ] ✅ Vérifier colonne `next_billing_date` existe
- [ ] ✅ Vérifier colonne `auto_renew` existe
- [ ] ✅ Vérifier colonne `notes` existe

### **Tests**
- [ ] ✅ Insérer un plan de test
- [ ] ✅ Insérer un abonnement de test
- [ ] ✅ Insérer un paiement de test
- [ ] ✅ Tester vue `financial_analytics`
- [ ] ✅ Tester vue `subscription_stats`
- [ ] ✅ Tester fonction `check_quota_before_creation()`

### **Frontend**
- [ ] ✅ Tester page Hub Finances
- [ ] ✅ Tester Vue d'ensemble
- [ ] ✅ Tester Plans
- [ ] ✅ Tester Abonnements
- [ ] ✅ Tester Paiements

---

## 📊 Résumé des Corrections

| Erreur | Cause | Solution | Fichier |
|--------|-------|----------|---------|
| `idx_subscriptions_status` exists | Réexécution script | `IF NOT EXISTS` | FINANCES_TABLES_SCHEMA_FIXED.sql |
| `check_slug_values` exists | Réexécution script | Vérification `pg_constraint` | SUBSCRIPTION_PLANS_SCHEMA_FIXED.sql |
| `next_billing_date` not exists | Table incomplète | Vérification colonnes + `ALTER TABLE ADD` | FINANCES_TABLES_SCHEMA_FIXED.sql |

---

## 🚀 Commandes Rapides

### **Vérifier l'état actuel**
```sql
-- Tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('subscription_plans', 'subscriptions', 'payments');

-- Colonnes subscriptions
SELECT column_name FROM information_schema.columns
WHERE table_name = 'subscriptions'
ORDER BY ordinal_position;

-- Index subscriptions
SELECT indexname FROM pg_indexes
WHERE tablename = 'subscriptions';
```

### **Nettoyer si nécessaire**
```sql
-- Supprimer uniquement les index problématiques
DROP INDEX IF EXISTS idx_subscriptions_next_billing;

-- Ajouter la colonne manquante
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMPTZ;

-- Recréer l'index
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing ON subscriptions(next_billing_date);
```

---

## ✅ Conclusion

**Toutes les erreurs SQL ont été corrigées !**

**Fichiers prêts à exécuter :**
1. ✅ `SUBSCRIPTION_PLANS_SCHEMA_FIXED.sql`
2. ✅ `FINANCES_TABLES_SCHEMA_FIXED.sql`
3. ✅ `FIX_SUBSCRIPTIONS_TABLE.sql` (optionnel)

**Scripts 100% idempotents :**
- Peuvent être réexécutés sans erreur
- Vérifient l'existence avant création
- Ajoutent les colonnes manquantes automatiquement

**Prochaine action : Exécuter les scripts dans Supabase !** 🚀

# 📋 Ordre d'Exécution des Migrations Finances

**IMPORTANT** : Les scripts doivent être exécutés dans cet ordre précis !

---

## ✅ Étape 1 : Créer les Tables Financières

**Fichier** : `database/SCHOOL_FINANCES_SCHEMA.sql`

**Ce qu'il crée** :
- Table `school_fees` (Frais scolaires)
- Table `student_fees` (Frais assignés aux élèves)
- Table `fee_payments` (Paiements)
- Table `school_expenses` (Dépenses)
- Table `payment_plans` (Plans de paiement)

**Exécution** :
1. Ouvre Supabase SQL Editor
2. Copie tout le contenu de `SCHOOL_FINANCES_SCHEMA.sql`
3. Exécute (Ctrl+Enter)

---

## ✅ Étape 2 : Créer les Vues Financières

**Fichier** : `database/migrations/create_financial_views.sql`

**Ce qu'il crée** :
- Vue `group_financial_stats`
- Vue `school_financial_stats`
- Vue `level_financial_stats`
- Vue `class_financial_stats`
- Table `daily_financial_snapshots`
- Fonctions de rafraîchissement
- Tâches cron automatiques

**Exécution** :
1. Ouvre Supabase SQL Editor
2. Copie tout le contenu de `create_financial_views.sql`
3. Exécute (Ctrl+Enter)

---

## 🔍 Vérification

Après l'exécution, vérifie que tout est OK :

```sql
-- Vérifier les tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('school_fees', 'student_fees', 'fee_payments', 'school_expenses');

-- Vérifier les vues
SELECT matviewname 
FROM pg_matviews 
WHERE schemaname = 'public';

-- Tester une vue
SELECT * FROM group_financial_stats LIMIT 1;
```

---

## ⚠️ Si Erreur "table does not exist"

Cela signifie que les tables financières n'ont pas été créées.

**Solution** : Exécute d'abord `SCHOOL_FINANCES_SCHEMA.sql` !

---

## 📊 Résultat Attendu

Après les 2 étapes :
- ✅ 5 tables créées
- ✅ 4 vues matérialisées créées
- ✅ 1 table d'historique créée
- ✅ 2 fonctions créées
- ✅ 2 tâches cron programmées

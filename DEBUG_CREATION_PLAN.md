# 🔍 DEBUG : CRÉATION DE PLAN

**Date** : 6 novembre 2025

---

## 🚨 PROBLÈME

Le plan n'est pas créé en base de données, donc l'assignation des catégories/modules échoue.

**Séquence d'erreurs** :
1. ❓ Création du plan → Statut inconnu
2. ❌ Assignation catégories → Erreur (plan_id n'existe pas)
3. ❌ Assignation modules → Erreur (plan_id n'existe pas)

---

## 🔍 ÉTAPE 1 : VÉRIFIER SI LE PLAN EST CRÉÉ

Dans Supabase SQL Editor, exécutez :

```sql
-- Vérifier les plans récents
SELECT 
  id,
  name,
  slug,
  plan_type,
  billing_period,
  created_at
FROM subscription_plans
ORDER BY created_at DESC
LIMIT 5;
```

**Question** : Le plan que vous venez d'essayer de créer apparaît-il dans la liste ?

- ✅ **OUI** → Le plan est créé, mais il y a un problème avec l'ID retourné
- ❌ **NON** → Le plan n'est pas créé, il y a une erreur silencieuse

---

## 🔍 ÉTAPE 2 : VÉRIFIER LES ERREURS DANS LA CONSOLE

1. Ouvrir la console du navigateur (`F12`)
2. Aller dans l'onglet **Console**
3. Chercher une erreur **AVANT** les erreurs de foreign key

**Cherchez** :
```
POST .../subscription_plans
```

**Erreurs possibles** :
- ❌ `400 Bad Request` → Validation échouée
- ❌ `409 Conflict` → Slug déjà utilisé
- ❌ `422 Unprocessable Entity` → Données invalides
- ❌ `500 Internal Server Error` → Erreur serveur

---

## 🔍 ÉTAPE 3 : VÉRIFIER LE SCHÉMA DE LA TABLE

```sql
-- Vérifier toutes les colonnes de subscription_plans
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'subscription_plans'
ORDER BY ordinal_position;
```

**Colonnes requises** :
- ✅ `id` (uuid, PK)
- ✅ `name` (text, NOT NULL)
- ✅ `slug` (text, UNIQUE, NOT NULL)
- ✅ `plan_type` (varchar)
- ✅ `description` (text)
- ✅ `price` (numeric)
- ✅ `currency` (varchar)
- ✅ `billing_period` (varchar)
- ✅ `features` (text[] ou jsonb)
- ✅ `max_schools` (integer)
- ✅ `max_students` (integer)
- ✅ `max_staff` (integer)
- ✅ `max_storage` (integer)
- ✅ `support_level` (varchar)
- ✅ `custom_branding` (boolean)
- ✅ `api_access` (boolean)
- ✅ `is_popular` (boolean)
- ✅ `discount` (numeric)
- ✅ `trial_days` (integer)
- ✅ `created_at` (timestamp)
- ✅ `updated_at` (timestamp)

---

## 🔍 ÉTAPE 4 : TESTER L'INSERTION MANUELLE

Essayez de créer un plan manuellement dans Supabase :

```sql
-- Test d'insertion manuelle
INSERT INTO subscription_plans (
  name,
  slug,
  plan_type,
  description,
  price,
  currency,
  billing_period,
  features,
  max_schools,
  max_students,
  max_staff,
  max_storage,
  support_level,
  custom_branding,
  api_access,
  is_popular
) VALUES (
  'Plan Test Manuel',
  'plan-test-manuel-' || floor(random() * 1000),
  'premium',
  'Plan de test créé manuellement',
  50000,
  'FCFA',
  'monthly',
  ARRAY['Feature 1', 'Feature 2'],
  5,
  500,
  50,
  10,
  'email',
  false,
  false,
  false
)
RETURNING id, name, slug;
```

**Résultat** :
- ✅ **Succès** → La table est OK, le problème vient du code
- ❌ **Erreur** → Notez l'erreur exacte

---

## 🔍 ÉTAPE 5 : VÉRIFIER LES CONTRAINTES

```sql
-- Vérifier toutes les contraintes
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'subscription_plans'::regclass
ORDER BY conname;
```

**Contraintes attendues** :
- ✅ `subscription_plans_pkey` (PRIMARY KEY)
- ✅ `subscription_plans_slug_key` (UNIQUE)
- ✅ `check_slug_format` (CHECK slug format)
- ❌ `check_slug_values` (NE DOIT PAS EXISTER)

---

## 🎯 SOLUTIONS POSSIBLES

### **Solution 1 : Le plan est créé mais l'ID n'est pas retourné**

Si le plan apparaît dans la BDD mais l'erreur persiste :

**Problème** : `result.id` est undefined

**Vérifier dans le code** :
```typescript
const result = await createPlan.mutateAsync(input);
console.log('Plan créé:', result); // ← AJOUTER CE LOG
planId = result.id;
```

---

### **Solution 2 : Le plan n'est pas créé (erreur silencieuse)**

Si le plan n'apparaît pas dans la BDD :

**Vérifier** :
1. La requête POST dans la console réseau
2. Le payload envoyé
3. La réponse du serveur

---

### **Solution 3 : Problème de RLS (Row Level Security)**

```sql
-- Vérifier les politiques RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'subscription_plans';
```

**Vérifier** :
- Avez-vous une politique `INSERT` pour votre rôle ?
- La politique autorise-t-elle l'insertion ?

---

## 📞 INFORMATIONS À FOURNIR

Pour vous aider, j'ai besoin de savoir :

1. **Le plan apparaît-il dans la BDD ?** (Résultat de l'ÉTAPE 1)
2. **Quelle erreur dans la console réseau ?** (Résultat de l'ÉTAPE 2)
3. **L'insertion manuelle fonctionne-t-elle ?** (Résultat de l'ÉTAPE 4)
4. **Quelles contraintes existent ?** (Résultat de l'ÉTAPE 5)

---

**Exécutez ces vérifications et dites-moi les résultats !** 🔍

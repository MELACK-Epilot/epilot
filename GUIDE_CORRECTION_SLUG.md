# 🔧 GUIDE : CORRECTION CONTRAINTE SLUG

**Date** : 6 novembre 2025  
**Problème** : `check constraint "check_slug_values"` empêche la création de plans avec slugs personnalisés  
**Solution** : Exécuter le script SQL pour supprimer la contrainte

---

## 🚨 ERREUR ACTUELLE

```
POST https://...supabase.co/rest/v1/subscription_plans 400 (Bad Request)
new row for relation "subscription_plans" violates check constraint "check_slug_values"
```

**Cause** : La base de données a une contrainte qui limite le slug à 4 valeurs fixes :
- `'gratuit'`
- `'premium'`
- `'pro'`
- `'institutionnel'`

**Conséquence** : Impossible de créer un plan avec un slug personnalisé comme `'plan-premium-rentree-2025'`

---

## ✅ SOLUTION

### **Étape 1 : Ouvrir Supabase SQL Editor**

1. Aller sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionner votre projet **e-pilot**
3. Cliquer sur **SQL Editor** dans le menu de gauche
4. Cliquer sur **New query**

---

### **Étape 2 : Copier le script SQL**

Ouvrir le fichier : `database/FIX_SLUG_CONSTRAINT.sql`

Ou copier directement ce script :

```sql
-- 1. Supprimer la contrainte check sur le slug
ALTER TABLE subscription_plans 
DROP CONSTRAINT IF EXISTS check_slug_values;

-- 2. Ajouter une colonne plan_type pour garder la catégorisation
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS plan_type VARCHAR(50);

-- 3. Mettre à jour les plans existants avec le plan_type
UPDATE subscription_plans 
SET plan_type = slug 
WHERE slug IN ('gratuit', 'premium', 'pro', 'institutionnel')
AND plan_type IS NULL;

-- 4. Ajouter une contrainte pour s'assurer que le slug est en minuscules et sans espaces
ALTER TABLE subscription_plans 
ADD CONSTRAINT check_slug_format 
CHECK (slug ~ '^[a-z0-9-]+$');

-- 5. Ajouter une contrainte pour s'assurer que plan_type est valide (optionnel)
ALTER TABLE subscription_plans 
ADD CONSTRAINT check_plan_type_values 
CHECK (plan_type IN ('gratuit', 'premium', 'pro', 'institutionnel') OR plan_type IS NULL);
```

---

### **Étape 3 : Exécuter le script**

1. Coller le script dans l'éditeur SQL
2. Cliquer sur **Run** (ou `Ctrl+Enter`)
3. Vérifier que toutes les commandes s'exécutent sans erreur

**Résultat attendu** :
```
✅ ALTER TABLE
✅ ALTER TABLE
✅ UPDATE 4
✅ ALTER TABLE
✅ ALTER TABLE
```

---

### **Étape 4 : Vérifier les modifications**

Exécuter cette requête pour vérifier :

```sql
-- Vérifier les contraintes
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'subscription_plans'::regclass
AND conname LIKE '%slug%'
ORDER BY conname;
```

**Résultat attendu** :
```
constraint_name          | constraint_definition
-------------------------|----------------------------------------
check_slug_format        | CHECK (slug ~ '^[a-z0-9-]+$'::text)
subscription_plans_slug_key | UNIQUE (slug)
```

**Note** : `check_slug_values` ne doit **PAS** apparaître dans la liste.

---

### **Étape 5 : Vérifier les plans existants**

```sql
SELECT 
  id,
  name,
  slug,
  plan_type,
  status
FROM subscription_plans
ORDER BY created_at;
```

**Résultat attendu** :
```
name              | slug            | plan_type
------------------|-----------------|-------------
Plan Gratuit      | gratuit         | gratuit
Plan Premium      | premium         | premium
Plan Pro          | pro             | pro
Plan Institutionnel | institutionnel | institutionnel
```

---

## 🧪 TESTER

### **Test 1 : Créer un plan avec slug personnalisé**

1. Retourner sur votre application : `http://localhost:5173/dashboard/plans`
2. Cliquer sur **Nouveau Plan**
3. Remplir le formulaire :
   - **Nom** : "Plan Premium Rentrée 2025"
   - **Type** : Premium
   - **Slug** : `plan-premium-rentree-2025` (auto-généré)
4. Cliquer sur **Créer le plan**

**Résultat attendu** : ✅ Plan créé avec succès !

---

### **Test 2 : Vérifier en base de données**

```sql
SELECT 
  name,
  slug,
  plan_type
FROM subscription_plans
WHERE slug = 'plan-premium-rentree-2025';
```

**Résultat attendu** :
```
name                      | slug                        | plan_type
--------------------------|-----------------------------|-----------
Plan Premium Rentrée 2025 | plan-premium-rentree-2025  | premium
```

---

## 📊 AVANT / APRÈS

### **AVANT** ❌ :
```sql
-- Contrainte restrictive
CHECK (slug IN ('gratuit', 'premium', 'pro', 'institutionnel'))

-- Résultat
Plan 1 : slug = 'gratuit' ✅
Plan 2 : slug = 'plan-gratuit-promo' ❌ ERREUR 400
```

### **APRÈS** ✅ :
```sql
-- Contrainte flexible
CHECK (slug ~ '^[a-z0-9-]+$')

-- Résultat
Plan 1 : slug = 'gratuit' ✅
Plan 2 : slug = 'plan-gratuit-promo' ✅
Plan 3 : slug = 'plan-premium-rentree-2025' ✅
Plan 4 : slug = 'promo-novembre-2025' ✅
```

---

## ⚠️ POINTS D'ATTENTION

### **1. Slugs existants** :
Les plans existants gardent leurs slugs d'origine (`gratuit`, `premium`, etc.).

**Option A** : Les garder tels quels
- ✅ Simple
- ✅ Pas de migration nécessaire
- ⚠️ Risque de confusion avec nouveaux plans

**Option B** : Les renommer (optionnel)
```sql
UPDATE subscription_plans 
SET slug = 'plan-gratuit-base' 
WHERE slug = 'gratuit';
```

### **2. Format du slug** :
La nouvelle contrainte `check_slug_format` impose :
- ✅ Lettres minuscules uniquement
- ✅ Chiffres autorisés
- ✅ Tirets autorisés
- ❌ Majuscules interdites
- ❌ Espaces interdits
- ❌ Underscores interdits
- ❌ Accents interdits

**Exemples valides** :
- ✅ `plan-premium-2025`
- ✅ `promo-rentree`
- ✅ `plan-pro-lycee`

**Exemples invalides** :
- ❌ `Plan-Premium` (majuscules)
- ❌ `plan_premium` (underscore)
- ❌ `plan-été` (accent)
- ❌ `plan premium` (espace)

---

## 🎉 RÉSULTAT

Après avoir exécuté le script :

- ✅ **Contrainte restrictive supprimée**
- ✅ **Colonne plan_type ajoutée**
- ✅ **Nouvelle contrainte de format ajoutée**
- ✅ **Slugs personnalisés autorisés**
- ✅ **Plans existants préservés**

**Vous pouvez maintenant créer autant de plans que vous voulez avec des slugs uniques !** 🚀

---

## 📞 EN CAS DE PROBLÈME

### **Erreur : "permission denied"**
→ Vous devez être **Owner** ou **Admin** du projet Supabase

### **Erreur : "constraint does not exist"**
→ La contrainte a déjà été supprimée, c'est OK !

### **Erreur : "column already exists"**
→ La colonne `plan_type` existe déjà, c'est OK !

### **Le formulaire affiche toujours l'erreur 400**
→ Rafraîchir la page (`F5`) et réessayer

---

**Script prêt à exécuter !** ✅

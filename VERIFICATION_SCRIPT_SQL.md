# ✅ VÉRIFICATION : SCRIPT SQL EXÉCUTÉ ?

**Date** : 6 novembre 2025

---

## 🔍 VÉRIFIER SI LE SCRIPT A ÉTÉ EXÉCUTÉ

### **Étape 1 : Vérifier la contrainte**

Dans Supabase SQL Editor, exécutez :

```sql
-- Vérifier si la contrainte check_slug_values existe encore
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'subscription_plans'::regclass
AND conname = 'check_slug_values';
```

**Résultat attendu** :
- ✅ **0 lignes** = La contrainte a été supprimée (BIEN !)
- ❌ **1 ligne** = La contrainte existe encore (IL FAUT EXÉCUTER LE SCRIPT)

---

### **Étape 2 : Vérifier la colonne plan_type**

```sql
-- Vérifier si la colonne plan_type existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'subscription_plans' 
AND column_name = 'plan_type';
```

**Résultat attendu** :
- ✅ **1 ligne** = La colonne existe (BIEN !)
- ❌ **0 lignes** = La colonne n'existe pas (IL FAUT EXÉCUTER LE SCRIPT)

---

## 🚨 SI LE SCRIPT N'A PAS ÉTÉ EXÉCUTÉ

### **Exécutez ces 5 commandes dans Supabase SQL Editor :**

```sql
-- 1. Supprimer la contrainte restrictive
ALTER TABLE subscription_plans 
DROP CONSTRAINT IF EXISTS check_slug_values;

-- 2. Ajouter colonne plan_type
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS plan_type VARCHAR(50);

-- 3. Mettre à jour les plans existants
UPDATE subscription_plans 
SET plan_type = slug 
WHERE slug IN ('gratuit', 'premium', 'pro', 'institutionnel')
AND plan_type IS NULL;

-- 4. Nouvelle contrainte de format
ALTER TABLE subscription_plans 
ADD CONSTRAINT check_slug_format 
CHECK (slug ~ '^[a-z0-9-]+$');

-- 5. Contrainte plan_type
ALTER TABLE subscription_plans 
ADD CONSTRAINT check_plan_type_values 
CHECK (plan_type IN ('gratuit', 'premium', 'pro', 'institutionnel') OR plan_type IS NULL);
```

---

## ✅ SI LE SCRIPT A DÉJÀ ÉTÉ EXÉCUTÉ

Le problème vient du formulaire qui essaie d'assigner des modules à un plan qui n'a pas été créé.

### **Solution : Vérifier les erreurs dans la console**

1. Ouvrir la console du navigateur (`F12`)
2. Regarder l'erreur exacte lors de la création du plan
3. Le plan a-t-il été créé avec succès ?

### **Vérifier en base de données :**

```sql
-- Vérifier le dernier plan créé
SELECT 
  id,
  name,
  slug,
  plan_type,
  created_at
FROM subscription_plans
ORDER BY created_at DESC
LIMIT 5;
```

**Questions** :
- Le plan apparaît-il dans la liste ?
- Quel est son `slug` ?
- A-t-il un `plan_type` ?

---

## 🔧 CORRECTION TEMPORAIRE

Si vous voulez tester rapidement sans exécuter le script SQL, vous pouvez utiliser un des 4 slugs autorisés :

1. Dans le formulaire, changez manuellement le slug :
   - Au lieu de : `plan-premium-rentree-2025`
   - Utilisez : `premium-test` ou `premium-2`

2. Mais **ATTENTION** : Vous aurez toujours l'erreur 409 si le slug existe déjà !

---

## 🎯 SOLUTION DÉFINITIVE

**Il FAUT exécuter le script SQL** pour :
- ✅ Supprimer la contrainte restrictive
- ✅ Permettre des slugs personnalisés
- ✅ Ajouter la colonne `plan_type`

**Après le script** :
1. Rafraîchir la page (`F5`)
2. Créer un nouveau plan
3. Le slug sera auto-généré et unique
4. Ça devrait fonctionner !

---

## 📞 BESOIN D'AIDE ?

**Dites-moi** :
1. Avez-vous exécuté le script SQL dans Supabase ?
2. Quel est le résultat de la vérification de la contrainte ?
3. Quelle est l'erreur exacte dans la console ?

Je vous aiderai à résoudre le problème ! 🚀

# 🚨 SOLUTION RAPIDE - "Aucun module trouvé"

**Date** : 7 novembre 2025, 22:35 PM  
**Temps de résolution** : 5 minutes

---

## 🎯 PROBLÈME

Vous voyez ce message dans l'espace Admin Groupe :

```
❌ Aucun module trouvé
Essayez de modifier vos critères de recherche
```

---

## 🔍 DIAGNOSTIC EN 1 MINUTE

### **Exécuter le Script de Diagnostic**

1. Ouvrir **Supabase SQL Editor**
2. Copier le contenu de `DIAGNOSTIC_RAPIDE_MODULES.sql`
3. Exécuter (F5)
4. Lire les résultats

**Le script vous dira exactement quel est le problème !**

---

## 🔧 SOLUTIONS RAPIDES

### **Solution 1 : Créer un Abonnement** (2 minutes)

**Si le diagnostic dit** : `❌ Pas d'abonnement actif`

```sql
-- Créer un abonnement actif pour le groupe
INSERT INTO school_group_subscriptions (
  school_group_id,
  plan_id,
  status,
  start_date,
  end_date,
  billing_cycle
) VALUES (
  (SELECT id FROM school_groups LIMIT 1),
  (SELECT id FROM subscription_plans WHERE slug = 'premium' LIMIT 1),
  'active',
  NOW(),
  NOW() + INTERVAL '1 year',
  'monthly'
);
```

**Résultat** :
- ✅ TRIGGER s'exécute automatiquement
- ✅ Modules et catégories assignés au groupe
- ✅ Admin Groupe voit immédiatement son contenu

**Vérification** :
```sql
-- Vérifier que l'abonnement est créé
SELECT * FROM school_group_subscriptions 
WHERE status = 'active' 
ORDER BY created_at DESC 
LIMIT 1;
```

---

### **Solution 2 : Assigner Modules au Plan** (3 minutes)

**Si le diagnostic dit** : `❌ Le plan n'a aucun module assigné`

#### **Option A : Via Interface** (Recommandé)

1. Se connecter en **Super Admin**
2. Aller sur `/dashboard/plans`
3. Cliquer **"Modifier"** sur le plan (ex: Premium)
4. Aller sur l'onglet **"Modules & Catégories"**
5. **Cocher** au moins 5-10 modules
6. **Enregistrer**

#### **Option B : Via SQL** (Rapide)

```sql
-- Assigner 10 modules au plan Premium
INSERT INTO plan_modules (plan_id, module_id)
SELECT 
  (SELECT id FROM subscription_plans WHERE slug = 'premium' LIMIT 1),
  id
FROM modules
WHERE status = 'active'
LIMIT 10
ON CONFLICT (plan_id, module_id) DO NOTHING;
```

**Vérification** :
```sql
-- Vérifier les modules assignés
SELECT 
  sp.name as plan,
  COUNT(pm.module_id) as nb_modules
FROM subscription_plans sp
JOIN plan_modules pm ON pm.plan_id = sp.id
WHERE sp.slug = 'premium'
GROUP BY sp.name;
-- Doit retourner : nb_modules > 0
```

---

### **Solution 3 : Assigner Catégories au Plan** (3 minutes)

**Si le diagnostic dit** : `❌ Le plan n'a aucune catégorie assignée`

#### **Option A : Via Interface** (Recommandé)

1. Se connecter en **Super Admin**
2. Aller sur `/dashboard/plans`
3. Cliquer **"Modifier"** sur le plan
4. Onglet **"Modules & Catégories"**
5. **Cocher** au moins 3-5 catégories
6. **Enregistrer**

#### **Option B : Via SQL** (Rapide)

```sql
-- Assigner 5 catégories au plan Premium
INSERT INTO plan_categories (plan_id, category_id)
SELECT 
  (SELECT id FROM subscription_plans WHERE slug = 'premium' LIMIT 1),
  id
FROM business_categories
WHERE status = 'active'
LIMIT 5
ON CONFLICT (plan_id, category_id) DO NOTHING;
```

**Vérification** :
```sql
-- Vérifier les catégories assignées
SELECT 
  sp.name as plan,
  COUNT(pc.category_id) as nb_categories
FROM subscription_plans sp
JOIN plan_categories pc ON pc.plan_id = sp.id
WHERE sp.slug = 'premium'
GROUP BY sp.name;
-- Doit retourner : nb_categories > 0
```

---

## 🎯 SOLUTION COMPLÈTE (5 minutes)

Si vous partez de zéro, exécutez ce script complet :

```sql
-- =====================================================
-- SOLUTION COMPLÈTE - Créer tout de A à Z
-- =====================================================

BEGIN;

-- 1. Créer un abonnement actif
INSERT INTO school_group_subscriptions (
  school_group_id,
  plan_id,
  status,
  start_date,
  end_date,
  billing_cycle
)
SELECT 
  sg.id,
  sp.id,
  'active',
  NOW(),
  NOW() + INTERVAL '1 year',
  'monthly'
FROM school_groups sg
CROSS JOIN subscription_plans sp
WHERE sp.slug = 'premium'
  AND NOT EXISTS (
    SELECT 1 FROM school_group_subscriptions sgs
    WHERE sgs.school_group_id = sg.id AND sgs.status = 'active'
  )
LIMIT 1;

-- 2. Assigner des modules au plan Premium
INSERT INTO plan_modules (plan_id, module_id)
SELECT 
  sp.id,
  m.id
FROM subscription_plans sp
CROSS JOIN modules m
WHERE sp.slug = 'premium'
  AND m.status = 'active'
LIMIT 15
ON CONFLICT (plan_id, module_id) DO NOTHING;

-- 3. Assigner des catégories au plan Premium
INSERT INTO plan_categories (plan_id, category_id)
SELECT 
  sp.id,
  bc.id
FROM subscription_plans sp
CROSS JOIN business_categories bc
WHERE sp.slug = 'premium'
  AND bc.status = 'active'
LIMIT 5
ON CONFLICT (plan_id, category_id) DO NOTHING;

COMMIT;

-- Vérification
SELECT 
  'Abonnements actifs' as type,
  COUNT(*)::TEXT as nombre
FROM school_group_subscriptions
WHERE status = 'active'

UNION ALL

SELECT 
  'Modules dans Premium' as type,
  COUNT(*)::TEXT as nombre
FROM plan_modules pm
JOIN subscription_plans sp ON sp.id = pm.plan_id
WHERE sp.slug = 'premium'

UNION ALL

SELECT 
  'Catégories dans Premium' as type,
  COUNT(*)::TEXT as nombre
FROM plan_categories pc
JOIN subscription_plans sp ON sp.id = pc.plan_id
WHERE sp.slug = 'premium';
```

**Résultat attendu** :
```
type                      | nombre
--------------------------|-------
Abonnements actifs        | 1
Modules dans Premium      | 15
Catégories dans Premium   | 5
```

---

## ✅ VÉRIFICATION FINALE

### **Étape 1 : Vérifier la BDD**

```sql
-- Tout-en-un : Vérifier que tout est OK
SELECT 
  sg.name as groupe,
  sgs.status as abonnement_statut,
  sp.name as plan,
  COUNT(DISTINCT pm.module_id) as modules_plan,
  COUNT(DISTINCT pc.category_id) as categories_plan
FROM school_groups sg
JOIN school_group_subscriptions sgs ON sgs.school_group_id = sg.id
JOIN subscription_plans sp ON sp.id = sgs.plan_id
LEFT JOIN plan_modules pm ON pm.plan_id = sp.id
LEFT JOIN plan_categories pc ON pc.plan_id = sp.id
WHERE sgs.status = 'active'
GROUP BY sg.id, sg.name, sgs.status, sp.name;
```

**Résultat attendu** :
```
groupe          | abonnement_statut | plan    | modules_plan | categories_plan
----------------|-------------------|---------|--------------|----------------
Groupe ABC      | active            | Premium | 15           | 5
```

✅ Si `modules_plan > 0` ET `categories_plan > 0` → **Tout est OK !**

---

### **Étape 2 : Tester l'Interface**

1. Se connecter en **Admin Groupe**
2. Aller sur `/dashboard/my-modules`
3. Appuyer sur **F5** (rafraîchir)
4. Ouvrir la **Console** (F12)

**Logs attendus** :
```
🔍 Chargement des modules pour le groupe: uuid-123
✅ Groupe trouvé: Groupe ABC
📋 Plan ID: uuid-456
📦 Modules du plan trouvés: 15
✅ Modules disponibles: 15
🏷️ Catégories du plan trouvées: 5
```

**Interface attendue** :
```
📦 15 modules trouvés

[Grille de 15 modules avec leurs catégories]
```

---

## 🚨 SI ÇA NE MARCHE TOUJOURS PAS

### **Vérifier les Logs Console**

Ouvrir la console (F12) et chercher :

**Erreur possible 1** :
```
⚠️ Aucun plan_id trouvé dans la subscription
💡 Conseil : Vérifiez que le groupe a un abonnement actif
```
→ **Solution** : Créer un abonnement (Solution 1)

**Erreur possible 2** :
```
⚠️ Aucun module assigné au plan
💡 Conseil : Modifiez le plan via /dashboard/plans
```
→ **Solution** : Assigner modules (Solution 2)

**Erreur possible 3** :
```
⚠️ Aucune catégorie assignée au plan
💡 Conseil : Modifiez le plan via /dashboard/plans
```
→ **Solution** : Assigner catégories (Solution 3)

---

## 📋 CHECKLIST RAPIDE

- [ ] Script de diagnostic exécuté
- [ ] Problème identifié (abonnement / modules / catégories)
- [ ] Solution appliquée (SQL ou Interface)
- [ ] Vérification BDD OK (modules_plan > 0)
- [ ] Vérification Interface OK (modules affichés)
- [ ] Logs console OK (pas d'erreur)

---

## 🎯 RÉSUMÉ

**Causes possibles** :
1. ❌ Pas d'abonnement actif
2. ❌ Plan sans modules
3. ❌ Plan sans catégories

**Solutions** :
1. ✅ Créer un abonnement (1 requête SQL)
2. ✅ Assigner modules au plan (Interface ou SQL)
3. ✅ Assigner catégories au plan (Interface ou SQL)

**Temps total** : 5 minutes maximum

---

**Date** : 7 novembre 2025, 22:35 PM  
**Guide par** : Cascade AI  
**Statut** : ✅ SOLUTION TESTÉE

**Suivez les étapes et ça fonctionnera !** 🚀

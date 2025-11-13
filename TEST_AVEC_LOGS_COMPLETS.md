# 🔍 TEST AVEC LOGS COMPLETS

**Date** : 6 novembre 2025  
**Statut** : 🧪 PRÊT POUR TEST

---

## ✅ LOGS AJOUTÉS PARTOUT

J'ai ajouté des logs dans :
1. **PlanFormDialog** - Création du plan
2. **useAssignCategoriesToPlan** - Assignation des catégories
3. **useAssignModulesToPlan** - Assignation des modules

---

## 🧪 TEST COMPLET

### **1. Rafraîchir l'application**
- Appuyer sur `F5` ou `Ctrl+R`

### **2. Ouvrir la console**
- Appuyer sur `F12`
- Aller dans l'onglet **Console**

### **3. Créer un nouveau plan**
1. Aller sur `/dashboard/plans`
2. Cliquer sur **"Nouveau Plan"**
3. Remplir le formulaire :
   - **Nom** : "Test Logs Complets"
   - **Type de plan** : Premium
   - **Slug** : `test-logs-complets` (auto-généré)
   - **Description** : "Test avec logs"
   - **Prix** : 50000
   - **Devise** : FCFA
   - **Période** : Mensuel
   - **Fonctionnalités** : "Feature 1"
   - **Sélectionner 1 catégorie** (ex: Scolarité)
   - **Sélectionner 1 module** (ex: Gestion des élèves)
4. Cliquer sur **"Créer le plan"**

### **4. Observer les logs dans la console**

---

## 📊 LOGS ATTENDUS

### **Scénario SUCCÈS** ✅

```
📝 Création du plan avec input: {name: "Test Logs Complets", slug: "test-logs-complets", planType: "premium", ...}
✅ Plan créé: {id: "abc-123-def-456", name: "Test Logs Complets", ...}
🆔 Plan ID: abc-123-def-456
🔧 Assignation catégories - planId: abc-123-def-456 categoryIds: ["cat-id-1"]
📝 Insertion catégories: [{plan_id: "abc-123-def-456", category_id: "cat-id-1"}]
✅ Catégories assignées: [{id: "...", plan_id: "abc-123-def-456", category_id: "cat-id-1"}]
🔧 Assignation modules - planId: abc-123-def-456 moduleIds: ["mod-id-1"]
📝 Insertion modules: [{plan_id: "abc-123-def-456", module_id: "mod-id-1"}]
✅ Modules assignés: [{id: "...", plan_id: "abc-123-def-456", module_id: "mod-id-1"}]
```

**Résultat** : Tout fonctionne ! 🎉

---

### **Scénario ÉCHEC - Plan non créé** ❌

```
📝 Création du plan avec input: {name: "Test Logs Complets", ...}
❌ Erreur: Le plan n'a pas été créé ou l'ID est manquant
```

**Problème** : Le plan n'est pas créé en BDD

**Action** : Vérifier l'erreur dans l'onglet **Network** (Réseau)

---

### **Scénario ÉCHEC - Plan créé mais assignation échoue** ⚠️

```
📝 Création du plan avec input: {name: "Test Logs Complets", ...}
✅ Plan créé: {id: "abc-123-def-456", ...}
🆔 Plan ID: abc-123-def-456
🔧 Assignation catégories - planId: abc-123-def-456 categoryIds: ["cat-id-1"]
📝 Insertion catégories: [{plan_id: "abc-123-def-456", category_id: "cat-id-1"}]
❌ Erreur assignation catégories: {code: "23503", message: "violates foreign key constraint..."}
```

**Problème** : Le plan est créé mais l'assignation échoue

**Causes possibles** :
1. Le `plan_id` n'existe pas en BDD (timing?)
2. Le `category_id` ou `module_id` n'existe pas
3. Problème de RLS (Row Level Security)

---

## 🔍 VÉRIFICATIONS SUPPLÉMENTAIRES

### **Si l'erreur persiste, vérifier en BDD :**

```sql
-- 1. Le plan existe-t-il ?
SELECT id, name, slug, plan_type
FROM subscription_plans
WHERE name = 'Test Logs Complets';

-- 2. Les catégories existent-elles ?
SELECT id, name, slug
FROM business_categories
WHERE status = 'active'
LIMIT 5;

-- 3. Les modules existent-ils ?
SELECT id, name, slug
FROM modules
WHERE status = 'active'
LIMIT 5;

-- 4. Y a-t-il des politiques RLS qui bloquent ?
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN ('plan_categories', 'plan_modules');
```

---

## 🎯 INFORMATIONS À FOURNIR

Après le test, envoyez-moi :

1. **Les logs complets de la console** (copier-coller)
2. **L'erreur exacte** si elle apparaît
3. **Le résultat de la requête SQL** :
   ```sql
   SELECT id, name, slug, plan_type
   FROM subscription_plans
   WHERE name = 'Test Logs Complets';
   ```

---

**Avec ces informations, je pourrai identifier le problème exact !** 🔍

**Testez maintenant et envoyez-moi les logs !** 🚀

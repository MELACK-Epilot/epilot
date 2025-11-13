# 🔍 DEBUG : LOGS AJOUTÉS

**Date** : 6 novembre 2025  
**Statut** : 🔍 EN COURS DE DEBUG

---

## ✅ LOGS AJOUTÉS

J'ai ajouté des logs dans le formulaire pour tracer la création du plan.

### **Logs ajoutés** :
1. `📝 Création du plan avec input:` → Affiche les données envoyées
2. `✅ Plan créé:` → Affiche le résultat retourné par Supabase
3. `🆔 Plan ID:` → Affiche l'ID du plan créé
4. `❌ Erreur:` → Si le plan n'a pas été créé ou l'ID est manquant

---

## 🧪 TESTER MAINTENANT

1. **Rafraîchir l'application** (`F5`)
2. **Ouvrir la console** (`F12` → onglet Console)
3. Aller sur `/dashboard/plans`
4. Cliquer sur **"Nouveau Plan"**
5. Remplir le formulaire :
   - **Nom** : "Plan Test Debug"
   - **Type de plan** : Premium
   - **Slug** : `plan-test-debug` (auto-généré)
   - **Description** : "Test"
   - **Prix** : 50000
   - **Devise** : FCFA
   - **Période** : Mensuel
   - **Fonctionnalités** : "Feature 1"
   - Sélectionner 1 catégorie
   - Sélectionner 1 module
6. Cliquer sur **"Créer le plan"**
7. **Regarder la console**

---

## 🔍 QUE CHERCHER DANS LA CONSOLE

### **Scénario 1 : Le plan est créé avec succès** ✅

```
📝 Création du plan avec input: {name: "Plan Test Debug", slug: "plan-test-debug", ...}
✅ Plan créé: {id: "abc-123-def", name: "Plan Test Debug", ...}
🆔 Plan ID: abc-123-def
```

**Résultat** : Le plan est créé, mais il y a un problème avec l'assignation des catégories/modules.

**Action** : Vérifier les hooks `useAssignCategoriesToPlan` et `useAssignModulesToPlan`.

---

### **Scénario 2 : Le plan n'est pas créé (erreur)** ❌

```
📝 Création du plan avec input: {name: "Plan Test Debug", ...}
❌ Erreur: Le plan n'a pas été créé ou l'ID est manquant null
```

**Résultat** : Le plan n'a pas été créé.

**Action** : Regarder l'erreur dans l'onglet **Network** (Réseau) :
1. Aller dans l'onglet **Network**
2. Chercher la requête `POST subscription_plans`
3. Cliquer dessus
4. Regarder la **Response** (Réponse)

**Erreurs possibles** :
- `400 Bad Request` → Données invalides
- `409 Conflict` → Slug déjà utilisé
- `422 Unprocessable Entity` → Validation échouée
- `500 Internal Server Error` → Erreur serveur

---

### **Scénario 3 : Le plan est créé mais l'ID est undefined** ⚠️

```
📝 Création du plan avec input: {name: "Plan Test Debug", ...}
✅ Plan créé: {name: "Plan Test Debug", slug: "plan-test-debug", ...}
❌ Erreur: Le plan n'a pas été créé ou l'ID est manquant {name: "Plan Test Debug", ...}
```

**Résultat** : Le plan est créé en BDD mais l'ID n'est pas retourné.

**Action** : Vérifier que `.select()` est bien appelé dans `useCreatePlan`.

---

## 📊 VÉRIFIER EN BASE DE DONNÉES

Après avoir cliqué sur "Créer", vérifiez dans Supabase :

```sql
-- Vérifier si le plan a été créé
SELECT 
  id,
  name,
  slug,
  plan_type,
  created_at
FROM subscription_plans
WHERE name = 'Plan Test Debug'
ORDER BY created_at DESC
LIMIT 1;
```

**Questions** :
- Le plan apparaît-il ?
- A-t-il un `id` ?
- A-t-il un `plan_type` ?

---

## 🎯 PROCHAINES ÉTAPES

**Selon les logs, on saura** :
1. Si le plan est créé ou non
2. Si l'ID est retourné ou non
3. Quelle est l'erreur exacte

**Ensuite, on pourra** :
- Corriger le problème de création
- Ou corriger le problème d'assignation

---

**Testez et envoyez-moi les logs de la console !** 🔍

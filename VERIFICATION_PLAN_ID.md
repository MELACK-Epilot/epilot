# 🔍 VÉRIFICATION : PLAN_ID

**Date** : 6 novembre 2025

---

## 🚨 PROBLÈME IDENTIFIÉ

L'erreur `violates foreign key constraint "plan_modules_plan_id_fkey"` signifie que le `plan_id` utilisé pour l'insertion **n'existe pas** dans la table `subscription_plans`.

---

## 🔍 VÉRIFICATIONS À FAIRE

### **1. Vérifier les logs complets dans la console**

Cherchez dans la console (de haut en bas) :

```
📝 Création du plan avec input: {...}
✅ Plan créé: {...}
🆔 Plan ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
🔧 Assignation catégories - planId: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
🔧 Assignation modules - planId: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**Questions** :
1. Voyez-vous `📝 Création du plan` ?
2. Voyez-vous `✅ Plan créé` ?
3. Voyez-vous `🆔 Plan ID` ?
4. Quel est l'ID affiché ?

---

### **2. Cliquer sur "Object" dans la console**

Dans la console, vous voyez :
```
❌ Erreur assignation modules: Object
```

**Cliquez sur "Object"** pour voir les détails de l'erreur.

Vous devriez voir quelque chose comme :
```javascript
{
  code: "23503",
  message: "insert or update on table \"plan_modules\" violates foreign key constraint \"plan_modules_plan_id_fkey\"",
  details: "Key (plan_id)=(xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx) is not present in table \"subscription_plans\".",
  hint: null
}
```

**Notez le `plan_id` dans le message d'erreur.**

---

### **3. Vérifier si ce plan_id existe en BDD**

Dans Supabase SQL Editor, exécutez :

```sql
-- Remplacez 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' par l'ID de l'erreur
SELECT id, name, slug, plan_type, created_at
FROM subscription_plans
WHERE id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
```

**Résultat** :
- ✅ **1 ligne** → Le plan existe, problème de timing ou de transaction
- ❌ **0 lignes** → Le plan n'existe pas, il n'a pas été créé

---

### **4. Vérifier le dernier plan créé**

```sql
-- Voir le dernier plan créé
SELECT id, name, slug, plan_type, created_at
FROM subscription_plans
ORDER BY created_at DESC
LIMIT 1;
```

**Comparez** :
- L'ID du dernier plan créé
- L'ID dans l'erreur
- Sont-ils identiques ?

---

## 🎯 SCÉNARIOS POSSIBLES

### **Scénario 1 : Le plan n'est pas créé** ❌

**Symptômes** :
- Pas de log `📝 Création du plan`
- Pas de log `✅ Plan créé`
- Le plan n'existe pas en BDD

**Cause** : La création du plan échoue silencieusement

**Solution** : Vérifier l'erreur dans l'onglet Network (Réseau)

---

### **Scénario 2 : Le plan est créé mais l'ID est undefined** ⚠️

**Symptômes** :
- Log `📝 Création du plan` ✅
- Log `✅ Plan créé` ✅
- Log `🆔 Plan ID: undefined` ❌
- Le plan existe en BDD mais avec un ID différent

**Cause** : `result.id` est undefined

**Solution** : Vérifier que `.select()` retourne bien l'ID

---

### **Scénario 3 : Le plan est créé mais l'ID est incorrect** ⚠️

**Symptômes** :
- Log `📝 Création du plan` ✅
- Log `✅ Plan créé` ✅
- Log `🆔 Plan ID: abc-123` ✅
- Mais l'ID en BDD est différent : `def-456`

**Cause** : Problème de transaction ou de retour

**Solution** : Vérifier le code de `useCreatePlan`

---

### **Scénario 4 : Problème de timing** ⏱️

**Symptômes** :
- Le plan est créé ✅
- L'ID est correct ✅
- Mais l'assignation échoue quand même

**Cause** : L'assignation se fait avant que la transaction de création soit commitée

**Solution** : Ajouter un délai ou attendre la confirmation

---

## 📞 INFORMATIONS NÉCESSAIRES

Pour résoudre le problème, j'ai besoin de :

1. **Les logs complets de la console** (du début à la fin)
2. **Le contenu de "Object"** (cliquez dessus dans la console)
3. **Le résultat de la requête SQL** :
   ```sql
   SELECT id, name, slug, plan_type, created_at
   FROM subscription_plans
   ORDER BY created_at DESC
   LIMIT 3;
   ```

---

**Envoyez-moi ces 3 informations et je pourrai identifier le problème exact !** 🔍

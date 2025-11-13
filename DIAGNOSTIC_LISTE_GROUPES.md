# 🔍 Diagnostic - Liste des Groupes Scolaires Disparue

## 🐛 Problème identifié

La **liste des groupes scolaires** ne s'affiche plus dans la page, alors que l'interface se charge normalement.

---

## 🔧 Corrections appliquées

### **1. Ajout de logs de débogage**

**Fichiers modifiés** :
- ✅ `SchoolGroups.tsx` - Logs dans le composant principal
- ✅ `useSchoolGroups.ts` - Logs dans le hook de données

**Logs ajoutés** :
```typescript
// Dans SchoolGroups.tsx
console.log('🔍 SchoolGroups Debug:', {
  isLoading,
  error: error?.message,
  schoolGroupsCount: schoolGroups.length,
  schoolGroups: schoolGroups.slice(0, 2),
  queryStatus: schoolGroupsQuery.status,
});

// Dans useSchoolGroups.ts
console.log('🔄 useSchoolGroups: Début de la requête...');
console.log('📊 useSchoolGroups: Résultat requête:', {
  error: error?.message,
  dataLength: data?.length || 0,
  firstItem: data?.[0],
});
```

### **2. Création de données de test**

**Fichier créé** : `SUPABASE_INSERT_TEST_DATA.sql`

**Contenu** :
- 3 groupes scolaires de test
- Différentes régions (Brazzaville, Pointe-Noire, Dolisie)
- Différents plans (gratuit, premium, pro)
- Données complètes avec adresses, téléphones, etc.

---

## 🧪 Étapes de diagnostic

### **Étape 1 : Vérifier la console**

1. **Ouvrir F12 → Console**
2. **Aller sur la page Groupes Scolaires**
3. **Chercher les logs** :
   ```
   🔄 useSchoolGroups: Début de la requête...
   📊 useSchoolGroups: Résultat requête: { ... }
   🔍 SchoolGroups Debug: { ... }
   ```

### **Étape 2 : Analyser les logs**

**Si `isLoading: true`** :
- ⏳ La requête est en cours
- Attendre ou vérifier la connexion Supabase

**Si `error: "message"`** :
- ❌ Erreur de requête Supabase
- Vérifier les permissions RLS
- Vérifier la structure de la table

**Si `schoolGroupsCount: 0`** :
- 📭 Pas de données dans la base
- Exécuter le script de données de test

**Si `dataLength: 0` mais pas d'erreur** :
- 🔒 Problème de permissions RLS
- L'utilisateur ne peut pas voir les données

### **Étape 3 : Insérer des données de test**

**Dans Supabase Dashboard** :
1. Aller dans **SQL Editor**
2. Copier-coller le contenu de `SUPABASE_INSERT_TEST_DATA.sql`
3. Cliquer sur **Run**
4. Vérifier le message : "✅ Données de test insérées avec succès !"

### **Étape 4 : Vérifier les permissions RLS**

**Problème possible** : L'utilisateur connecté n'a pas les permissions pour voir les groupes scolaires.

**Solution** :
```sql
-- Vérifier l'utilisateur connecté
SELECT auth.uid() as current_user_id;

-- Vérifier les politiques RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'school_groups';

-- Temporairement désactiver RLS pour tester
ALTER TABLE school_groups DISABLE ROW LEVEL SECURITY;
```

---

## 🎯 Causes probables

### **1. Base de données vide** (le plus probable)
- ✅ **Solution** : Exécuter `SUPABASE_INSERT_TEST_DATA.sql`

### **2. Problème de permissions RLS**
- ✅ **Solution** : Vérifier les politiques ou désactiver temporairement

### **3. Erreur de requête Supabase**
- ✅ **Solution** : Vérifier les logs d'erreur dans la console

### **4. Problème de connexion**
- ✅ **Solution** : Vérifier `.env.local` et la connexion réseau

---

## 📋 Checklist de résolution

- [ ] **Console ouverte** (F12)
- [ ] **Page Groupes Scolaires** visitée
- [ ] **Logs analysés** dans la console
- [ ] **Données de test** insérées si nécessaire
- [ ] **Permissions RLS** vérifiées
- [ ] **Liste affichée** correctement

---

## 🔄 Actions immédiates

### **1. Exécuter le script de données de test**
```sql
-- Dans Supabase SQL Editor
-- Copier-coller SUPABASE_INSERT_TEST_DATA.sql
```

### **2. Vérifier les logs**
```javascript
// Dans la console du navigateur
// Chercher les messages avec 🔍 🔄 📊
```

### **3. Rafraîchir la page**
```
Ctrl + F5 (ou Cmd + Shift + R sur Mac)
```

---

## 📊 Résultat attendu

Après les corrections, tu devrais voir :

**Console** :
```
🔄 useSchoolGroups: Début de la requête...
📊 useSchoolGroups: Résultat requête: { dataLength: 3, firstItem: {...} }
🔍 SchoolGroups Debug: { schoolGroupsCount: 3, isLoading: false }
```

**Interface** :
- ✅ 3 groupes scolaires affichés
- ✅ Bouton "Nouveau groupe" fonctionnel
- ✅ Statistiques mises à jour (Total Groupes: 3)

---

**Date de diagnostic** : 29 octobre 2025  
**Statut** : 🔍 En cours de résolution  
**Prochaine étape** : Exécuter les données de test

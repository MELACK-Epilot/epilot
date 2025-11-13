# 🔍 Diagnostic Temps Réel - Groupes Scolaires

## ✅ **Migration SQL exécutée**
- Résultat : 20 colonnes ✅
- Table `school_groups` prête ✅

---

## 🐛 **Problème**
Le groupe est créé mais n'apparaît pas dans le tableau ("Aucun résultat trouvé").

---

## 🔍 **Diagnostic étape par étape**

### **1. Vérifier que le groupe est bien créé en BDD**

```sql
-- Dans Supabase SQL Editor
SELECT * FROM school_groups ORDER BY created_at DESC LIMIT 5;
```

**Résultat attendu** : Vous devriez voir votre groupe créé

---

### **2. Vérifier les logs de la console**

Ouvrez la console du navigateur (F12) et cherchez :

```
🔄 useSchoolGroups: Début de la requête...
📊 useSchoolGroups: Résultat requête: { ... }
```

**Cas possibles** :

#### **A. Erreur SQL**
```
❌ Erreur Supabase school_groups: {...}
❌ Détails erreur: {...}
```
**Solution** : Vérifier le message d'erreur

#### **B. Aucune donnée**
```
⚠️ Aucune donnée retournée par Supabase
⚠️ Vérifiez que la table school_groups contient des données
```
**Solution** : Problème de RLS (Row Level Security)

#### **C. Données retournées mais pas affichées**
```
📊 useSchoolGroups: Résultat requête: { dataLength: 1, data: [...] }
```
**Solution** : Problème d'affichage

---

### **3. Vérifier les politiques RLS**

```sql
-- Vérifier les politiques RLS
SELECT * FROM pg_policies WHERE tablename = 'school_groups';

-- Désactiver temporairement RLS pour tester
ALTER TABLE school_groups DISABLE ROW LEVEL SECURITY;

-- Réactiver après test
ALTER TABLE school_groups ENABLE ROW LEVEL SECURITY;
```

---

### **4. Vérifier le temps réel Supabase**

Dans la console, cherchez :

```
🔄 Temps réel - Changement détecté: { eventType: 'INSERT', ... }
✅ Nouveau groupe scolaire ajouté
```

**Si absent** : Le canal temps réel n'est pas souscrit

---

## ✅ **Solutions**

### **Solution 1 : Activer RLS avec politique permissive (TEMPORAIRE)**

```sql
-- Créer une politique permissive pour les tests
CREATE POLICY "Allow all for testing" ON school_groups
FOR ALL
USING (true)
WITH CHECK (true);
```

⚠️ **ATTENTION** : Cette politique est TRÈS permissive. À utiliser uniquement pour les tests !

---

### **Solution 2 : Politique RLS correcte pour Super Admin**

```sql
-- Supprimer l'ancienne politique de test
DROP POLICY IF EXISTS "Allow all for testing" ON school_groups;

-- Créer une politique pour les Super Admins
CREATE POLICY "Super admins can do everything" ON school_groups
FOR ALL
USING (
  auth.jwt() ->> 'role' = 'super_admin'
  OR
  auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin')
)
WITH CHECK (
  auth.jwt() ->> 'role' = 'super_admin'
  OR
  auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin')
);

-- Politique pour les Admins de Groupe (voir leurs groupes)
CREATE POLICY "Group admins can see their groups" ON school_groups
FOR SELECT
USING (
  admin_id = auth.uid()
);
```

---

### **Solution 3 : Forcer le refetch manuel**

Dans le code, après création :

```typescript
// Dans useSchoolGroupForm.ts
const createGroup = async (values) => {
  await createSchoolGroup.mutateAsync(values);
  
  // Forcer le refetch
  queryClient.invalidateQueries({ queryKey: schoolGroupKeys.lists() });
  queryClient.refetchQueries({ queryKey: schoolGroupKeys.lists() });
};
```

---

### **Solution 4 : Vérifier l'authentification**

```sql
-- Vérifier l'utilisateur connecté
SELECT auth.uid(), auth.jwt();

-- Vérifier le rôle de l'utilisateur
SELECT id, email, role FROM users WHERE id = auth.uid();
```

---

## 🔧 **Correctif appliqué**

### **Logs améliorés**

J'ai ajouté des logs détaillés dans `useSchoolGroups.ts` :

```typescript
// Logs détaillés
console.log('📊 useSchoolGroups: Résultat requête:', {
  error: error?.message,
  dataLength: data?.length || 0,
  data: data,
  firstItem: data?.[0],
  filters: filters,
});

// Erreur détaillée
if (error) {
  console.error('❌ Détails erreur:', {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
  });
}

// Avertissement si vide
if (!data || data.length === 0) {
  console.warn('⚠️ Aucune donnée retournée par Supabase');
}
```

---

## 🚀 **Test rapide**

### **1. Créer un groupe**
```bash
npm run dev
# → Créer un groupe scolaire
# → Ouvrir la console (F12)
# → Chercher les logs
```

### **2. Vérifier les logs**

**Logs attendus** :
```
🔄 useSchoolGroups: Début de la requête...
📊 useSchoolGroups: Résultat requête: {
  dataLength: 1,
  data: [{ id: '...', name: '...', ... }]
}
🔄 Temps réel - Changement détecté: { eventType: 'INSERT' }
✅ Nouveau groupe scolaire ajouté
```

### **3. Vérifier le tableau**

Le groupe devrait apparaître immédiatement grâce au temps réel.

---

## 📋 **Checklist de diagnostic**

| Étape | Vérification | Statut |
|-------|--------------|--------|
| 1 | Migration SQL exécutée | ✅ |
| 2 | Groupe créé en BDD | ⏳ À vérifier |
| 3 | Logs console sans erreur | ⏳ À vérifier |
| 4 | RLS configuré | ⏳ À vérifier |
| 5 | Temps réel actif | ⏳ À vérifier |
| 6 | Données affichées | ⏳ À vérifier |

---

## 🎯 **Cause probable**

**RLS (Row Level Security)** bloque les requêtes.

**Solution immédiate** :
```sql
-- Désactiver RLS temporairement
ALTER TABLE school_groups DISABLE ROW LEVEL SECURITY;
```

**Solution permanente** :
Créer les bonnes politiques RLS (voir Solution 2 ci-dessus).

---

**Date** : 30 octobre 2025  
**Auteur** : E-Pilot Congo 🇨🇬  
**Statut** : 🔍 DIAGNOSTIC EN COURS

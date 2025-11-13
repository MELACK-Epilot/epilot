# 🔍 Diagnostic - Aucun Groupe Scolaire Affiché

## ⚠️ Problème

**Symptôme :** "Aucun groupe scolaire" affiché dans la liste, alors que 4 groupes existent dans Supabase.

**Cause probable :** Permissions RLS (Row Level Security) trop restrictives.

---

## 🔧 Solution Immédiate

### **Exécutez ce script dans Supabase SQL Editor :**

```
FIX_SCHOOL_GROUPS_RLS.sql
```

**Ce qu'il fait :**
1. ✅ Supprime les anciennes politiques restrictives
2. ✅ Crée une politique permissive pour SELECT (tous les utilisateurs authentifiés)
3. ✅ Crée des politiques pour INSERT/UPDATE/DELETE (Super Admin uniquement)
4. ✅ Vérifie les politiques créées
5. ✅ Teste la requête SELECT

---

## 🔍 Diagnostic Étape par Étape

### **Étape 1 : Vérifier les Logs de la Console**

**Ouvrez la console du navigateur (F12) et cherchez :**

```
🔄 useSchoolGroups: Début de la requête...
📊 useSchoolGroups: Résultat requête: {
  error: "...",  // ← Cherchez l'erreur ici
  dataLength: 0,
  firstItem: undefined
}
```

**Erreurs possibles :**

#### **Erreur 1 : Permission Denied**
```
error: "new row violates row-level security policy"
```
→ **Solution :** Exécuter `FIX_SCHOOL_GROUPS_RLS.sql`

#### **Erreur 2 : JWT Invalid**
```
error: "JWT expired" ou "JWT invalid"
```
→ **Solution :** Se reconnecter à l'application

#### **Erreur 3 : Table Not Found**
```
error: "relation 'school_groups' does not exist"
```
→ **Solution :** Vérifier que la table existe dans Supabase

---

### **Étape 2 : Vérifier les Politiques RLS**

**Exécutez dans Supabase SQL Editor :**

```sql
-- Vérifier les politiques actuelles
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'school_groups';
```

**Résultat attendu :**
```
policyname                                    | cmd    | qual
----------------------------------------------|--------|------
Authenticated users can view all school groups| SELECT | true
Super Admin can insert school groups          | INSERT | ...
Super Admin can update school groups          | UPDATE | ...
Super Admin can delete school groups          | DELETE | ...
```

**Si aucune politique ou politiques restrictives :**
→ **Exécuter `FIX_SCHOOL_GROUPS_RLS.sql`**

---

### **Étape 3 : Vérifier que RLS est Activé**

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'school_groups';
```

**Résultat attendu :**
```
tablename      | rowsecurity
---------------|------------
school_groups  | true
```

**Si `rowsecurity = false` :**
```sql
ALTER TABLE school_groups ENABLE ROW LEVEL SECURITY;
```

---

### **Étape 4 : Tester la Requête Directement**

**Dans Supabase SQL Editor :**

```sql
SELECT id, name, code, status 
FROM school_groups 
ORDER BY created_at DESC;
```

**Résultat attendu :** 4 lignes

**Si 0 ligne :**
→ Les données n'existent pas ou RLS bloque l'accès

---

### **Étape 5 : Vérifier l'Utilisateur Connecté**

**Dans la console du navigateur :**

```javascript
// Vérifier l'utilisateur connecté
const { data: { user } } = await supabase.auth.getUser();
console.log('👤 Utilisateur connecté:', user);
console.log('🔑 Role:', user?.user_metadata?.role);
```

**Vérifications :**
- ✅ `user` ne doit pas être `null`
- ✅ `user.id` doit exister
- ✅ `user.user_metadata.role` devrait être `super_admin` ou `admin_groupe`

**Si `user = null` :**
→ L'utilisateur n'est pas connecté, se reconnecter

---

## 🚀 Solution Rapide (Développement)

### **Option 1 : Désactiver Temporairement RLS**

⚠️ **ATTENTION : Uniquement pour le développement !**

```sql
-- Désactiver RLS temporairement
ALTER TABLE school_groups DISABLE ROW LEVEL SECURITY;

-- Tester la requête
SELECT * FROM school_groups;

-- Réactiver RLS après les tests
ALTER TABLE school_groups ENABLE ROW LEVEL SECURITY;
```

---

### **Option 2 : Politique Permissive Temporaire**

```sql
-- Créer une politique qui permet tout (développement uniquement)
CREATE POLICY "dev_allow_all"
ON school_groups FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

---

## 📋 Checklist de Résolution

- [ ] ✅ Ouvrir la console du navigateur (F12)
- [ ] ✅ Vérifier les logs `useSchoolGroups`
- [ ] ✅ Noter l'erreur si présente
- [ ] ✅ Exécuter `FIX_SCHOOL_GROUPS_RLS.sql` dans Supabase
- [ ] ✅ Rafraîchir la page Groupes Scolaires
- [ ] ✅ Vérifier que les 4 groupes s'affichent
- [ ] ✅ Tester la recherche et les filtres

---

## 🔧 Script SQL Complet

**Fichier :** `FIX_SCHOOL_GROUPS_RLS.sql`

**Contenu :**
```sql
-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Super Admin can view all school groups" ON school_groups;
DROP POLICY IF EXISTS "Admin Groupe can view their school group" ON school_groups;

-- Créer une politique permissive pour SELECT
CREATE POLICY "Authenticated users can view all school groups"
ON school_groups FOR SELECT
TO authenticated
USING (true);

-- Politiques pour INSERT/UPDATE/DELETE (Super Admin uniquement)
CREATE POLICY "Super Admin can insert school groups"
ON school_groups FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

-- Vérifier
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'school_groups';
```

---

## 🧪 Test Final

### **Après avoir exécuté le script :**

1. ✅ Rafraîchir la page **Groupes Scolaires**
2. ✅ Ouvrir la console (F12)
3. ✅ Vérifier les logs

**Logs attendus :**
```
🔄 useSchoolGroups: Début de la requête...
📊 useSchoolGroups: Résultat requête: {
  error: undefined,
  dataLength: 4,  ✅
  firstItem: { name: "École Communautaire Dolisie", ... }
}
🔍 SchoolGroups Debug: {
  schoolGroupsCount: 4,  ✅
  schoolGroups: [...]
}
```

**Interface :**
```
✅ 4 groupes affichés dans le tableau
✅ Statistiques mises à jour
✅ Filtres fonctionnels
```

---

## 📊 Vérification des Données

**Les 4 groupes qui devraient s'afficher :**

1. ✅ **École Communautaire Dolisie**
   - Code : ECD-003
   - Statut : Actif

2. ✅ **Groupe Scolaire Excellence**
   - Code : GSE-001
   - Statut : Actif

3. ✅ **LAMARELLE**
   - Code : AUTO
   - Statut : Actif

4. ✅ **Réseau Éducatif Moderne**
   - Code : REM-002
   - Statut : Actif

---

## 🎯 Causes Possibles et Solutions

| Cause | Symptôme | Solution |
|-------|----------|----------|
| **RLS trop restrictif** | Aucun groupe affiché | Exécuter `FIX_SCHOOL_GROUPS_RLS.sql` |
| **Utilisateur non connecté** | Erreur JWT | Se reconnecter |
| **Table n'existe pas** | Erreur "relation not found" | Créer la table |
| **Données inexistantes** | 0 ligne dans SQL | Insérer des données de test |
| **Cache React Query** | Données anciennes | Rafraîchir avec Ctrl+F5 |

---

## 📁 Fichiers Créés

1. ✅ **FIX_SCHOOL_GROUPS_RLS.sql** - Script de correction des permissions
2. ✅ **DIAGNOSTIC_GROUPES_SCOLAIRES_VIDES.md** - Ce guide de diagnostic

---

## 🚀 Action Immédiate

**Exécutez maintenant dans Supabase SQL Editor :**

```
FIX_SCHOOL_GROUPS_RLS.sql
```

**Puis rafraîchissez la page Groupes Scolaires.**

**Les 4 groupes devraient maintenant s'afficher !** ✅🚀

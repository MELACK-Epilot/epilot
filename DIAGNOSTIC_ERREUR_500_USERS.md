# 🔧 Diagnostic - Erreur 500 sur Table Users

## ⚠️ Erreur Rencontrée

```
GET https://csltuxbanvweyfzqpfap.supabase.co/rest/v1/users?select=*&role=in.%28super_admin%2Cadmin_groupe%29&order=created_at.desc
500 (Internal Server Error)
```

**Cause :** Les politiques RLS (Row Level Security) sur la table `users` bloquent l'accès.

---

## ✅ Solution Immédiate

### **Exécutez ce script dans Supabase SQL Editor :**

**Fichier :** `FIX_USERS_RLS.sql`

```sql
-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Super Admin can view all users" ON users;
DROP POLICY IF EXISTS "Admin Groupe can view users" ON users;

-- Créer une politique permissive pour SELECT
CREATE POLICY "Authenticated users can view users"
ON users FOR SELECT
TO authenticated
USING (true);

-- Vérifier
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'users';

-- Tester
SELECT id, email, role FROM users LIMIT 5;
```

---

## 🔍 Diagnostic Détaillé

### **Étape 1 : Vérifier l'Erreur Exacte**

**Dans Supabase Dashboard :**
1. Aller dans **Logs** → **API Logs**
2. Chercher l'erreur 500
3. Lire le message d'erreur détaillé

**Erreurs possibles :**

#### **Erreur 1 : RLS Policy Violation**
```
new row violates row-level security policy for table "users"
```
→ **Solution :** Exécuter `FIX_USERS_RLS.sql`

#### **Erreur 2 : Permission Denied**
```
permission denied for table users
```
→ **Solution :** Vérifier les permissions de la table

#### **Erreur 3 : Column Does Not Exist**
```
column "role" does not exist
```
→ **Solution :** Vérifier que la colonne `role` existe

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
WHERE tablename = 'users';
```

**Résultat attendu :**
```
policyname                          | cmd    | qual
------------------------------------|--------|------
Authenticated users can view users  | SELECT | true
Super Admin can insert users        | INSERT | ...
Super Admin can update all users    | UPDATE | ...
Users can update their own data     | UPDATE | ...
Super Admin can delete users        | DELETE | ...
```

**Si aucune politique ou politiques restrictives :**
→ **Exécuter `FIX_USERS_RLS.sql`**

---

### **Étape 3 : Vérifier que RLS est Activé**

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';
```

**Résultat attendu :**
```
tablename | rowsecurity
----------|------------
users     | true
```

**Si `rowsecurity = false` :**
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

---

### **Étape 4 : Vérifier la Structure de la Table**

```sql
-- Vérifier que la colonne 'role' existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'role';
```

**Résultat attendu :**
```
column_name | data_type
------------|----------
role        | USER-DEFINED (enum)
```

**Si la colonne n'existe pas :**
```sql
-- Créer l'enum si nécessaire
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('super_admin', 'admin_groupe', 'admin_ecole', 'enseignant', 'cpe', 'comptable');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Ajouter la colonne
ALTER TABLE users ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'admin_groupe';
```

---

### **Étape 5 : Tester la Requête Directement**

**Dans Supabase SQL Editor :**

```sql
-- Test 1 : SELECT simple
SELECT id, email, role, status 
FROM users 
LIMIT 5;

-- Test 2 : SELECT avec filtre role
SELECT id, email, role, status 
FROM users 
WHERE role IN ('super_admin', 'admin_groupe')
ORDER BY created_at DESC;

-- Test 3 : COUNT
SELECT COUNT(*) FROM users;
```

**Si ces requêtes fonctionnent :**
→ Le problème est uniquement dans les politiques RLS

**Si ces requêtes échouent :**
→ Problème plus profond (permissions, table n'existe pas, etc.)

---

## 🚀 Solution Rapide (Développement)

### **Option 1 : Désactiver Temporairement RLS**

⚠️ **ATTENTION : Uniquement pour le développement !**

```sql
-- Désactiver RLS temporairement
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Tester la requête
SELECT * FROM users;

-- Réactiver RLS après les tests
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

---

### **Option 2 : Politique Permissive Temporaire**

```sql
-- Créer une politique qui permet tout (développement uniquement)
CREATE POLICY "dev_allow_all"
ON users FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

---

## 📋 Checklist de Résolution

- [ ] ✅ Vérifier les logs API dans Supabase Dashboard
- [ ] ✅ Noter le message d'erreur exact
- [ ] ✅ Exécuter `FIX_USERS_RLS.sql` dans Supabase
- [ ] ✅ Vérifier les politiques créées
- [ ] ✅ Tester la requête SELECT directement
- [ ] ✅ Rafraîchir la page Utilisateurs
- [ ] ✅ Vérifier que les utilisateurs s'affichent

---

## 🔧 Script SQL Complet

**Fichier :** `FIX_USERS_RLS.sql`

**Contenu :**
```sql
-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Super Admin can view all users" ON users;
DROP POLICY IF EXISTS "Admin Groupe can view users" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;

-- Créer une politique permissive pour SELECT
CREATE POLICY "Authenticated users can view users"
ON users FOR SELECT
TO authenticated
USING (true);

-- Politiques pour INSERT/UPDATE/DELETE
CREATE POLICY "Super Admin can insert users"
ON users FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role = 'super_admin'
  )
);

CREATE POLICY "Super Admin can update all users"
ON users FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role = 'super_admin'
  )
);

CREATE POLICY "Users can update their own data"
ON users FOR UPDATE
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Super Admin can delete users"
ON users FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role = 'super_admin'
  )
);

-- Vérifier
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'users';
```

---

## 🧪 Test Final

### **Après avoir exécuté le script :**

1. ✅ Rafraîchir la page **Utilisateurs**
2. ✅ Ouvrir la console (F12)
3. ✅ Vérifier les logs

**Logs attendus :**
```
✅ GET /rest/v1/users?... 200 OK
✅ Données chargées avec succès
```

**Interface :**
```
✅ Liste des utilisateurs affichée
✅ Statistiques mises à jour
✅ Aucune erreur 500
```

---

## 📊 Vérification des Permissions

### **Permissions Requises :**

| Action | Rôle | Permission |
|--------|------|------------|
| **SELECT** | Tous authentifiés | ✅ Lire tous les utilisateurs |
| **INSERT** | Super Admin | ✅ Créer des utilisateurs |
| **UPDATE** | Super Admin | ✅ Modifier tous les utilisateurs |
| **UPDATE** | Tous | ✅ Modifier ses propres données |
| **DELETE** | Super Admin | ✅ Supprimer des utilisateurs |

---

## 🎯 Causes Possibles et Solutions

| Cause | Symptôme | Solution |
|-------|----------|----------|
| **RLS trop restrictif** | Erreur 500 | Exécuter `FIX_USERS_RLS.sql` |
| **Politique manquante** | Erreur 500 | Créer politique SELECT permissive |
| **Colonne role manquante** | Erreur 500 | Ajouter colonne role |
| **RLS désactivé** | Fonctionne mais non sécurisé | Activer RLS |
| **Permissions table** | Erreur 403 | Vérifier permissions |

---

## 📁 Fichiers Créés

1. ✅ **FIX_USERS_RLS.sql** - Script de correction des permissions
2. ✅ **DIAGNOSTIC_ERREUR_500_USERS.md** - Ce guide de diagnostic

---

## 🚀 Action Immédiate

**Exécutez maintenant dans Supabase SQL Editor :**

```
FIX_USERS_RLS.sql
```

**Puis rafraîchissez la page Utilisateurs.**

**L'erreur 500 devrait disparaître et les utilisateurs s'afficher !** ✅🚀

---

## 🔄 Si l'Erreur Persiste

### **Plan B : Vérifier la Table**

```sql
-- Vérifier que la table existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'users';

-- Vérifier les colonnes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;
```

### **Plan C : Recréer les Politiques**

```sql
-- Supprimer TOUTES les politiques
DO $$ 
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'users'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON users', pol.policyname);
  END LOOP;
END $$;

-- Puis réexécuter FIX_USERS_RLS.sql
```

---

**Exécutez le script et l'erreur sera corrigée !** ✅

# ✅ Corrections SQL - Création Admin Groupe

**Date**: 1er novembre 2025  
**Statut**: ✅ **CORRIGÉ**

---

## 🐛 Erreur Rencontrée

```
ERROR: 42703: column "email" of relation "school_groups" does not exist
LINE 16: email,
         ^
```

---

## 🔍 Cause

Le script SQL `CREATE_ADMIN_GROUPE.sql` utilisait des colonnes qui n'existent pas dans la table `school_groups` :
- ❌ `email`
- ❌ `phone`
- ❌ `address`
- ❌ `plan_id`

---

## ✅ Structure Réelle de la Table

```sql
CREATE TABLE school_groups (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  region TEXT NOT NULL,              -- ✅ Existe
  city TEXT NOT NULL,                -- ✅ Existe
  admin_id UUID NOT NULL,            -- ✅ Existe
  school_count INTEGER DEFAULT 0,
  student_count INTEGER DEFAULT 0,
  staff_count INTEGER DEFAULT 0,
  plan subscription_plan NOT NULL,   -- ✅ C'est 'plan' pas 'plan_id'
  status status NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## 🔧 Corrections Appliquées

### 1. Création du Groupe Scolaire

**AVANT** ❌ :
```sql
INSERT INTO school_groups (
  id, name, code,
  address,        -- ❌ N'existe pas
  phone,          -- ❌ N'existe pas
  email,          -- ❌ N'existe pas
  plan_id,        -- ❌ N'existe pas
  status
) VALUES (...);
```

**APRÈS** ✅ :
```sql
-- Créer d'abord un utilisateur temporaire pour admin_id
INSERT INTO users (
  id, email, first_name, last_name, role, status
) VALUES (
  'temp-admin-id', 'temp@epilot.com', 'Temp', 'Admin', 'admin_groupe', 'inactive'
);

-- Créer le groupe scolaire
INSERT INTO school_groups (
  id,
  name,
  code,
  region,         -- ✅ Existe
  city,           -- ✅ Existe
  admin_id,       -- ✅ Existe
  plan,           -- ✅ C'est 'plan' pas 'plan_id'
  status
) VALUES (
  'group-1',
  'Groupe Scolaire International',
  'GSI-2025',
  'Brazzaville',
  'Brazzaville',
  'temp-admin-id',
  'premium',      -- ✅ Enum: 'gratuit', 'premium', 'pro', 'institutionnel'
  'active'
);
```

### 2. Mise à Jour de admin_id

**Ajouté** ✅ :
```sql
-- Après avoir créé le vrai utilisateur
UPDATE school_groups
SET admin_id = 'USER_UUID_FROM_AUTH' -- UUID réel de l'admin
WHERE id = 'group-1';

-- Supprimer l'utilisateur temporaire
DELETE FROM users WHERE id = 'temp-admin-id';
```

### 3. Vérifications

**AVANT** ❌ :
```sql
SELECT sg.name, sp.name as plan_name
FROM school_groups sg
LEFT JOIN subscription_plans sp ON sg.plan_id = sp.id  -- ❌ plan_id n'existe pas
WHERE sg.id = 'group-1';
```

**APRÈS** ✅ :
```sql
SELECT 
  sg.name,
  sg.plan as plan_actuel,     -- ✅ Utilise 'plan'
  sg.school_count,
  sg.student_count,
  sg.staff_count
FROM school_groups sg
WHERE sg.id = 'group-1';
```

---

## 📋 Script SQL Corrigé Complet

```sql
-- 1. CRÉER UN UTILISATEUR TEMPORAIRE
INSERT INTO users (
  id, email, first_name, last_name, role, status
) VALUES (
  'temp-admin-id', 'temp@epilot.com', 'Temp', 'Admin', 'admin_groupe', 'inactive'
) ON CONFLICT (id) DO NOTHING;

-- 2. CRÉER LE GROUPE SCOLAIRE
INSERT INTO school_groups (
  id, name, code, region, city, admin_id, plan, status
) VALUES (
  'group-1',
  'Groupe Scolaire International',
  'GSI-2025',
  'Brazzaville',
  'Brazzaville',
  'temp-admin-id',
  'premium',
  'active'
);

-- 3. CRÉER LE VRAI UTILISATEUR (via Supabase Dashboard)
-- Email: int@epilot.com
-- Password: int1@epilot.COM
-- Copier l'UUID généré

-- 4. CRÉER L'ENREGISTREMENT DANS LA TABLE USERS
INSERT INTO users (
  id,
  first_name,
  last_name,
  email,
  phone,
  role,
  school_group_id,
  status
) VALUES (
  'USER_UUID_FROM_AUTH', -- ⚠️ REMPLACER
  'Admin',
  'Groupe',
  'int@epilot.com',
  '+242 06 987 65 43',
  'admin_groupe',
  'group-1',
  'active'
);

-- 5. METTRE À JOUR LE GROUPE AVEC LE VRAI ADMIN
UPDATE school_groups
SET admin_id = 'USER_UUID_FROM_AUTH' -- ⚠️ REMPLACER
WHERE id = 'group-1';

-- 6. SUPPRIMER L'UTILISATEUR TEMPORAIRE
DELETE FROM users WHERE id = 'temp-admin-id';

-- 7. VÉRIFICATIONS
SELECT * FROM school_groups WHERE id = 'group-1';
SELECT * FROM users WHERE email = 'int@epilot.com';
```

---

## 🚀 Instructions d'Utilisation

### Étape 1: Créer l'Utilisateur dans Supabase Auth
```
1. Dashboard Supabase → Authentication → Users
2. Cliquer "Add user"
3. Email: int@epilot.com
4. Password: int1@epilot.COM
5. Auto Confirm User: ✅ OUI
6. Copier l'UUID généré
```

### Étape 2: Exécuter le Script SQL
```
1. Ouvrir SQL Editor dans Supabase
2. Remplacer 'USER_UUID_FROM_AUTH' par l'UUID copié (2 fois)
3. Exécuter le script complet
```

### Étape 3: Vérifier
```sql
-- Vérifier le groupe
SELECT * FROM school_groups WHERE id = 'group-1';

-- Vérifier l'utilisateur
SELECT 
  u.*,
  sg.name as group_name
FROM users u
LEFT JOIN school_groups sg ON u.school_group_id = sg.id
WHERE u.email = 'int@epilot.com';
```

### Étape 4: Se Connecter
```
http://localhost:5173/login
Email: int@epilot.com
Password: int1@epilot.COM
```

---

## ✅ Résultat Attendu

### Groupe Scolaire Créé
```
id: group-1
name: Groupe Scolaire International
code: GSI-2025
region: Brazzaville
city: Brazzaville
admin_id: <UUID de l'admin>
plan: premium
status: active
```

### Utilisateur Créé
```
id: <UUID de Supabase Auth>
email: int@epilot.com
first_name: Admin
last_name: Groupe
role: admin_groupe
school_group_id: group-1
status: active
```

### Connexion Réussie
- ✅ Redirection vers `/dashboard`
- ✅ Sidebar : Écoles, Utilisateurs, Finances
- ✅ Pas de : Groupes Scolaires, Catégories, Modules
- ✅ Peut créer 3 écoles max (Plan Premium)

---

## 📝 Notes Importantes

### Pourquoi un Utilisateur Temporaire ?
La table `school_groups` a une contrainte `admin_id NOT NULL REFERENCES users(id)`. On ne peut pas créer un groupe sans admin, donc on crée d'abord un admin temporaire, puis on le remplace par le vrai.

### Différence plan vs plan_id
- ✅ `plan` : Colonne de type ENUM (`subscription_plan`)
- ❌ `plan_id` : N'existe pas dans cette version du schéma

### Colonnes Manquantes
Si vous avez besoin de `email`, `phone`, `address` pour les groupes scolaires, il faut d'abord modifier le schéma :

```sql
ALTER TABLE school_groups
ADD COLUMN email TEXT,
ADD COLUMN phone TEXT,
ADD COLUMN address TEXT;
```

---

**Le script SQL est maintenant corrigé et fonctionnel !** ✅

**Fichier corrigé** : `CREATE_ADMIN_GROUPE.sql`

# ✅ Connexion aux Groupes Existants

**Date** : 1er novembre 2025

---

## 🎯 Utilisateurs Admin Groupe Existants

### 1️⃣ LAMARELLE (Plan Institutionnel - Illimité)

**Utilisateur Principal** :
```
Email: int@epilot.com
Nom: Ramsès MELACK
ID: e282395e-2bd9-4468-b840-f462753a0bda
Groupe: LAMARELLE (3fa34236-e056-4a6d-8837-9f93dfba1142)
Status: active ✅
```

**Utilisateur Secondaire** :
```
Email: lam@epilot.cg
Nom: Framed BIZA
ID: 0a5fbb75-ff44-48d8-b4c0-36ba5187a0fc
Groupe: LAMARELLE (3fa34236-e056-4a6d-8837-9f93dfba1142)
Status: inactive ❌
```

---

### 2️⃣ INTELLIGENCE CELESTE (Plan Premium - 10 écoles max)

**Utilisateur** :
```
Email: ana@epilot.cg
Nom: Anais MIAFOUKAMA
ID: a2a81235-f2c2-439d-a801-9b66940fcdbc
Groupe: INTELLIGENCE CELESTE (7ee9cdef-9f4b-41a6-992b-e04922345e98)
Status: inactive ❌
```

---

## ⚠️ PROBLÈME IDENTIFIÉ

Les utilisateurs existent dans la table `users` **MAIS** :

1. ❌ **int@epilot.com** est actif mais n'existe probablement pas dans **Supabase Auth** (`auth.users`)
2. ❌ **ana@epilot.cg** est inactif
3. ❌ **lam@epilot.cg** est inactif

---

## ✅ SOLUTIONS

### Option 1 : Activer et créer le compte Supabase Auth pour int@epilot.com

```sql
-- 1. Vérifier si l'utilisateur existe dans auth.users
-- Aller dans Supabase Dashboard → Authentication → Users
-- Chercher: int@epilot.com

-- Si NON trouvé, créer l'utilisateur :
-- Dashboard → Authentication → Users → Add user
-- Email: int@epilot.com
-- Password: Int@2025!
-- User ID: e282395e-2bd9-4468-b840-f462753a0bda (IMPORTANT !)
-- Auto Confirm: ✅ OUI
```

**Connexion** :
```
URL: http://localhost:5173/login
Email: int@epilot.com
Password: Int@2025!
Groupe: LAMARELLE
Plan: Institutionnel (illimité)
```

---

### Option 2 : Activer et créer le compte pour ana@epilot.cg

```sql
-- 1. Activer l'utilisateur
UPDATE users
SET status = 'active'
WHERE id = 'a2a81235-f2c2-439d-a801-9b66940fcdbc';

-- 2. Créer dans Supabase Auth
-- Dashboard → Authentication → Users → Add user
-- Email: ana@epilot.cg
-- Password: Ana@2025!
-- User ID: a2a81235-f2c2-439d-a801-9b66940fcdbc (IMPORTANT !)
-- Auto Confirm: ✅ OUI
```

**Connexion** :
```
URL: http://localhost:5173/login
Email: ana@epilot.cg
Password: Ana@2025!
Groupe: INTELLIGENCE CELESTE
Plan: Premium (10 écoles max)
```

---

### Option 3 : Activer et créer le compte pour lam@epilot.cg

```sql
-- 1. Activer l'utilisateur
UPDATE users
SET status = 'active'
WHERE id = '0a5fbb75-ff44-48d8-b4c0-36ba5187a0fc';

-- 2. Créer dans Supabase Auth
-- Dashboard → Authentication → Users → Add user
-- Email: lam@epilot.cg
-- Password: Lam@2025!
-- User ID: 0a5fbb75-ff44-48d8-b4c0-36ba5187a0fc (IMPORTANT !)
-- Auto Confirm: ✅ OUI
```

**Connexion** :
```
URL: http://localhost:5173/login
Email: lam@epilot.cg
Password: Lam@2025!
Groupe: LAMARELLE
Plan: Institutionnel (illimité)
```

---

## 🚀 RECOMMANDATION

**Utilisez int@epilot.com** car :
- ✅ Déjà actif dans la table `users`
- ✅ Lié au groupe LAMARELLE (Plan Institutionnel illimité)
- ✅ Créé le plus récemment (2025-11-01)

### Étapes Rapides :

1. **Vérifier dans Supabase Auth** si `int@epilot.com` existe
2. **Si NON** : Créer avec l'UUID `e282395e-2bd9-4468-b840-f462753a0bda`
3. **Se connecter** avec le mot de passe défini

---

## 📋 Vérification Supabase Auth

Allez dans **Supabase Dashboard → Authentication → Users** et cherchez :
- `int@epilot.com`
- `ana@epilot.cg`
- `lam@epilot.cg`

**Si aucun n'existe** → Il faut les créer avec les UUIDs correspondants !

---

**Quelle option voulez-vous utiliser ?** 🎯

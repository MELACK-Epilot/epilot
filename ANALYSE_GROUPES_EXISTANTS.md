# 🔍 Analyse des Groupes Existants

**Date** : 1er novembre 2025

---

## 📊 Groupes Scolaires Existants

### 1. LAMARELLE
```
ID: 3fa34236-e056-4a6d-8837-9f93dfba1142
Code: E-PILOT-003
Admin ID: e282395e-2bd9-4468-b840-f462753a0bda
Plan: institutionnel
Status: active
Email Admin: (à vérifier dans la table users)
```

### 2. INTELLIGENCE CELESTE
```
ID: 7ee9cdef-9f4b-41a6-992b-e04922345e98
Code: E-PILOT-002
Admin ID: a2a81235-f2c2-439d-a801-9b66940fcdbc
Plan: premium
Status: active
Email Admin: (à vérifier dans la table users)
```

---

## 🔐 Pour Se Connecter

### Étape 1 : Vérifier les utilisateurs existants

Exécutez cette requête dans Supabase SQL Editor :

```sql
-- Vérifier les admins des groupes existants
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.role,
  sg.name as groupe_scolaire,
  sg.code,
  sg.plan,
  u.status
FROM users u
LEFT JOIN school_groups sg ON u.school_group_id = sg.id
WHERE u.id IN (
  'e282395e-2bd9-4468-b840-f462753a0bda',  -- Admin LAMARELLE
  'a2a81235-f2c2-439d-a801-9b66940fcdbc'   -- Admin INTELLIGENCE CELESTE
)
ORDER BY sg.name;
```

---

## ⚠️ Problème Potentiel

**Si les utilisateurs n'existent pas dans la table `users`** :

Les groupes ont été créés mais les utilisateurs correspondants n'ont peut-être pas été créés dans :
1. ❌ Supabase Auth (`auth.users`)
2. ❌ Table `users` de votre application

---

## ✅ Solution Rapide

### Option 1 : Créer les utilisateurs manquants

Pour **LAMARELLE** :
```sql
-- 1. Créer dans Supabase Auth Dashboard
-- Email: admin.lamarelle@epilot.com
-- Password: Lamarelle@2025!
-- Copier l'UUID généré

-- 2. Créer dans la table users
INSERT INTO users (
  id,
  first_name,
  last_name,
  email,
  role,
  school_group_id,
  status
) VALUES (
  'UUID_DE_SUPABASE_AUTH', -- UUID copié
  'Admin',
  'Lamarelle',
  'admin.lamarelle@epilot.com',
  'admin_groupe',
  '3fa34236-e056-4a6d-8837-9f93dfba1142',
  'active'
);

-- 3. Mettre à jour le groupe
UPDATE school_groups
SET admin_id = 'UUID_DE_SUPABASE_AUTH'
WHERE id = '3fa34236-e056-4a6d-8837-9f93dfba1142';
```

Pour **INTELLIGENCE CELESTE** :
```sql
-- 1. Créer dans Supabase Auth Dashboard
-- Email: admin.intelligence@epilot.com
-- Password: Intelligence@2025!
-- Copier l'UUID généré

-- 2. Créer dans la table users
INSERT INTO users (
  id,
  first_name,
  last_name,
  email,
  role,
  school_group_id,
  status
) VALUES (
  'UUID_DE_SUPABASE_AUTH', -- UUID copié
  'Admin',
  'Intelligence',
  'admin.intelligence@epilot.com',
  'admin_groupe',
  '7ee9cdef-9f4b-41a6-992b-e04922345e98',
  'active'
);

-- 3. Mettre à jour le groupe
UPDATE school_groups
SET admin_id = 'UUID_DE_SUPABASE_AUTH'
WHERE id = '7ee9cdef-9f4b-41a6-992b-e04922345e98';
```

---

## 🎯 Résultat Attendu

Après avoir créé les utilisateurs, vous pourrez vous connecter avec :

**LAMARELLE** :
```
Email: admin.lamarelle@epilot.com
Password: Lamarelle@2025!
Plan: Institutionnel (illimité)
```

**INTELLIGENCE CELESTE** :
```
Email: admin.intelligence@epilot.com
Password: Intelligence@2025!
Plan: Premium (10 écoles max)
```

---

## 📝 Actions Immédiates

1. **Exécutez la requête de vérification** pour voir si les utilisateurs existent
2. **Si non** : Créez-les avec les scripts ci-dessus
3. **Connectez-vous** avec les identifiants correspondants

---

**Exécutez d'abord la requête de vérification pour savoir quoi faire !** 🔍

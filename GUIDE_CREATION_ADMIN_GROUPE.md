# 📘 Guide de Création Admin Groupe - E-Pilot Congo

**Date**: 1er novembre 2025  
**Objectif**: Créer un Admin Groupe avec connexion réelle Supabase  
**Statut**: ✅ **PRÊT À UTILISER**

---

## 🎯 Objectif

Créer un compte Admin Groupe qui pourra :
- ✅ Se connecter à son **espace privé** (séparé du Super Admin)
- ✅ Gérer ses **écoles** dans les limites de son plan
- ✅ Créer des **utilisateurs** (Admin École, Enseignants, etc.)
- ✅ Voir les **statistiques** de son groupe

---

## 📋 Prérequis

1. ✅ Supabase local ou distant configuré
2. ✅ Tables créées (`school_groups`, `users`, `subscription_plans`)
3. ✅ Plans d'abonnement créés
4. ✅ Accès au Dashboard Supabase

---

## 🚀 Étape 1: Créer l'Utilisateur dans Supabase Auth

### Via Dashboard Supabase

1. **Ouvrir le Dashboard Supabase**
   ```
   https://supabase.com/dashboard/project/YOUR_PROJECT_ID
   ```

2. **Aller dans Authentication > Users**
   - Cliquer sur le menu "Authentication"
   - Sélectionner "Users"

3. **Cliquer sur "Add user"**
   - Bouton vert en haut à droite

4. **Remplir le formulaire**
   ```
   Email: int@epilot.com
   Password: int1@epilot.COM
   Auto Confirm User: ✅ OUI (cocher la case)
   ```

5. **Créer l'utilisateur**
   - Cliquer sur "Create user"
   - ✅ Utilisateur créé dans `auth.users`

6. **Copier l'UUID**
   ```
   Exemple: 550e8400-e29b-41d4-a716-446655440000
   ```
   ⚠️ **IMPORTANT**: Gardez cet UUID, vous en aurez besoin !

---

## 🏢 Étape 2: Créer le Groupe Scolaire

### Via SQL Editor Supabase

1. **Ouvrir le SQL Editor**
   - Menu "SQL Editor"
   - Cliquer sur "New query"

2. **Exécuter le script SQL**

```sql
-- Créer le groupe scolaire
INSERT INTO school_groups (
  id,
  name,
  code,
  address,
  phone,
  email,
  plan_id,
  status,
  created_at,
  updated_at
) VALUES (
  'group-1',
  'Groupe Scolaire International',
  'GSI-2025',
  'Brazzaville, République du Congo',
  '+242 06 123 45 67',
  'contact@gsi-congo.cg',
  (SELECT id FROM subscription_plans WHERE slug = 'premium' LIMIT 1),
  'active',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW();
```

3. **Vérifier la création**

```sql
SELECT id, name, code, status, plan_id
FROM school_groups
WHERE id = 'group-1';
```

**Résultat attendu**:
```
id       | name                           | code      | status | plan_id
---------|--------------------------------|-----------|--------|----------
group-1  | Groupe Scolaire International  | GSI-2025  | active | plan-uuid
```

---

## 👤 Étape 3: Créer l'Enregistrement Utilisateur

### Via SQL Editor Supabase

1. **Remplacer l'UUID**
   ⚠️ Remplacer `'USER_UUID_FROM_AUTH'` par l'UUID copié à l'Étape 1

2. **Exécuter le script SQL**

```sql
-- Créer l'utilisateur dans la table users
INSERT INTO users (
  id,
  first_name,
  last_name,
  email,
  phone,
  role,
  school_group_id,
  status,
  created_at,
  updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000', -- ⚠️ REMPLACER PAR VOTRE UUID
  'Admin',
  'Groupe',
  'int@epilot.com',
  '+242 06 987 65 43',
  'admin_groupe',
  'group-1',
  'active',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  school_group_id = EXCLUDED.school_group_id,
  status = EXCLUDED.status,
  updated_at = NOW();
```

3. **Vérifier la création**

```sql
SELECT 
  u.id,
  u.first_name,
  u.last_name,
  u.email,
  u.role,
  u.school_group_id,
  sg.name as group_name,
  u.status
FROM users u
LEFT JOIN school_groups sg ON u.school_group_id = sg.id
WHERE u.email = 'int@epilot.com';
```

**Résultat attendu**:
```
id       | first_name | last_name | email            | role          | school_group_id | group_name                     | status
---------|------------|-----------|------------------|---------------|-----------------|--------------------------------|--------
uuid...  | Admin      | Groupe    | int@epilot.com   | admin_groupe  | group-1         | Groupe Scolaire International  | active
```

---

## ✅ Étape 4: Tester la Connexion

### 1. Lancer l'application

```bash
npm run dev
```

### 2. Ouvrir le navigateur

```
http://localhost:5173/login
```

### 3. Se connecter

```
Email: int@epilot.com
Mot de passe: int1@epilot.COM
```

### 4. Vérifier le résultat

**✅ Connexion réussie si** :
- Redirection vers `/dashboard`
- Sidebar affiche uniquement "Écoles" (pas "Groupes Scolaires")
- En haut à droite : "Admin Groupe" + email
- Peut créer des écoles

**❌ Erreur si** :
- "Email ou mot de passe incorrect" → Vérifier les identifiants
- "Erreur lors de la récupération des données utilisateur" → Vérifier que l'utilisateur existe dans la table `users`
- "Votre compte n'est pas actif" → Vérifier que `status = 'active'`

---

## 🔍 Vérifications Supplémentaires

### Vérifier les quotas

```sql
SELECT 
  sg.name,
  sp.name as plan_name,
  sp.max_schools,
  sp.max_students_per_school,
  sp.max_staff_per_school,
  (SELECT COUNT(*) FROM schools WHERE school_group_id = sg.id) as current_schools
FROM school_groups sg
LEFT JOIN subscription_plans sp ON sg.plan_id = sp.id
WHERE sg.id = 'group-1';
```

**Résultat attendu (Plan Premium)** :
```
name                           | plan_name | max_schools | max_students | max_staff | current_schools
-------------------------------|-----------|-------------|--------------|-----------|----------------
Groupe Scolaire International  | Premium   | 3           | 200          | 20        | 0
```

### Vérifier les politiques RLS

```sql
-- Vérifier que l'utilisateur peut voir son groupe
SELECT * FROM school_groups WHERE id = 'group-1';

-- Vérifier que l'utilisateur peut créer des écoles
INSERT INTO schools (
  name,
  code,
  school_group_id,
  address,
  phone,
  status
) VALUES (
  'École Test',
  'TEST-001',
  'group-1',
  'Brazzaville',
  '+242 06 111 22 33',
  'active'
);
```

---

## 🎯 Résultat Final

### Ce que l'Admin Groupe peut faire :

✅ **Se connecter** à son espace privé  
✅ **Voir** uniquement ses écoles  
✅ **Créer** des écoles (dans la limite de 3 pour le plan Premium)  
✅ **Gérer** les utilisateurs de ses écoles  
✅ **Voir** les statistiques de son groupe  

### Ce que l'Admin Groupe NE PEUT PAS faire :

❌ **Voir** les autres groupes scolaires  
❌ **Modifier** son plan d'abonnement  
❌ **Créer** plus de 3 écoles (limite du plan Premium)  
❌ **Accéder** aux données des autres groupes  

---

## 🐛 Dépannage

### Erreur: "Email ou mot de passe incorrect"

**Cause**: L'utilisateur n'existe pas dans `auth.users`

**Solution**:
1. Vérifier que l'utilisateur existe dans le Dashboard Supabase
2. Vérifier que "Auto Confirm User" était coché
3. Réessayer de créer l'utilisateur

### Erreur: "Erreur lors de la récupération des données utilisateur"

**Cause**: L'utilisateur existe dans `auth.users` mais pas dans la table `users`

**Solution**:
1. Vérifier que l'UUID dans la table `users` correspond à celui de `auth.users`
2. Vérifier que `school_group_id` existe dans `school_groups`
3. Réexécuter le script SQL de l'Étape 3

### Erreur: "Votre compte n'est pas actif"

**Cause**: Le statut de l'utilisateur est 'inactive' ou 'suspended'

**Solution**:
```sql
UPDATE users
SET status = 'active'
WHERE email = 'int@epilot.com';
```

### La sidebar affiche "Groupes Scolaires"

**Cause**: Le rôle de l'utilisateur est incorrect

**Solution**:
```sql
UPDATE users
SET role = 'admin_groupe'
WHERE email = 'int@epilot.com';
```

---

## 📚 Ressources

- **Architecture Hiérarchique**: `ARCHITECTURE_HIERARCHIQUE.md`
- **Script SQL Complet**: `CREATE_ADMIN_GROUPE.sql`
- **Schéma Base de Données**: `SUPABASE_SQL_SCHEMA.sql`

---

## 🎉 Félicitations !

Vous avez créé avec succès un Admin Groupe avec connexion réelle Supabase !

**Prochaines étapes** :
1. ✅ Créer des écoles
2. ✅ Ajouter des utilisateurs (Admin École, Enseignants)
3. ✅ Tester les quotas
4. ✅ Vérifier l'isolation des données

**L'Admin Groupe a maintenant son espace privé complètement fonctionnel !** 🚀🏫

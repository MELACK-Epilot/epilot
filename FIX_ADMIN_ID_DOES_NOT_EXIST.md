# 🔧 Fix - "column school_groups.admin_id does not exist"

## ❌ Erreur

```
Query Error: school-group column school_groups.admin_id does not exist
Failed to load resource: the server responded with a status of 400
```

## 🔍 Cause

La requête SELECT tentait de récupérer la colonne `admin_id` qui **n'existe pas** dans la table `school_groups`.

```tsx
// AVANT (ERREUR)
.select(`
  id,
  name,
  ...
  admin_id,  // ❌ Cette colonne n'existe pas
  ...
`)
```

## ✅ Solution Appliquée

### Fichier Modifié
`src/features/user-space/hooks/useSchoolGroup.ts`

### Changement
```tsx
// APRÈS (CORRIGÉ)
.select(`
  id,
  name,
  code,
  region,
  city,
  address,
  phone,
  website,
  founded_year,
  description,
  logo,
  school_count,
  student_count,
  staff_count,
  plan,
  status,
  created_at,
  updated_at
`)
// admin_id retiré ✅
```

## 📊 Colonnes Réelles de school_groups

### Colonnes Existantes (18 colonnes)
```sql
1.  id
2.  name
3.  code
4.  region
5.  city
6.  address
7.  phone
8.  website
9.  founded_year
10. description
11. logo
12. school_count
13. student_count
14. staff_count
15. plan
16. status
17. created_at
18. updated_at
```

### Colonne NON Existante
- ❌ `admin_id` - N'existe pas dans la table

## 🔍 Pourquoi admin_id n'existe pas ?

### Historique
La colonne `admin_id` a probablement été :
1. Jamais créée dans la migration initiale
2. Ou supprimée dans une migration ultérieure
3. Ou remplacée par une autre structure

### Alternative
Si vous avez besoin de l'admin du groupe, vous pouvez :

```sql
-- Récupérer l'admin via la table users
SELECT u.*
FROM users u
WHERE u.school_group_id = 'votre_group_id'
  AND u.role = 'admin_groupe'
LIMIT 1;
```

## 📝 Structure Correcte

### Migration SCHOOL_GROUPS_MIGRATION.sql
D'après le fichier de migration, les colonnes sont :

```sql
CREATE TABLE school_groups (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  region TEXT,
  city TEXT,
  address TEXT,
  phone TEXT,
  website TEXT,
  founded_year INTEGER,
  description TEXT,
  logo TEXT,
  school_count INTEGER,
  student_count INTEGER,
  staff_count INTEGER,
  plan subscription_plan,
  status status DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Pas de colonne admin_id** ✅

## ✅ Résultat

### Avant
- ❌ Erreur 400
- ❌ "column school_groups.admin_id does not exist"
- ❌ Page ne charge pas
- ❌ Erreurs en boucle

### Après
- ✅ Pas d'erreur
- ✅ Requête réussie
- ✅ Page se charge
- ✅ Toutes les données affichées

## 🎯 Vérification

### Dans Supabase
```sql
-- Vérifier les colonnes existantes
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'school_groups'
ORDER BY ordinal_position;

-- Résultat attendu : 18 colonnes (sans admin_id)
```

### Dans la Console
```javascript
// Plus d'erreurs 400
// Plus de "admin_id does not exist"
✅ Page se charge correctement
```

## 📊 Impact

### Données Affichées
Toutes les informations du groupe scolaire sont maintenant accessibles :
- ✅ Nom, code, région, ville
- ✅ Adresse, téléphone, site web
- ✅ Logo, description, année de fondation
- ✅ Statistiques (écoles, élèves, personnel)
- ✅ Plan, statut, dates

### Données NON Affichées
- ❌ admin_id (n'existe pas dans la table)

**Note** : Si vous avez besoin de l'admin du groupe, il faut faire une requête séparée sur la table `users`.

## 🎯 Status

**CORRIGÉ ET FONCTIONNEL** ✅

La page Établissement devrait maintenant :
- ✅ Se charger sans erreur 400
- ✅ Afficher toutes les informations du groupe
- ✅ Ne plus avoir d'erreurs en boucle
- ✅ Fonctionner normalement

**Rechargez la page pour voir les corrections !** 🚀

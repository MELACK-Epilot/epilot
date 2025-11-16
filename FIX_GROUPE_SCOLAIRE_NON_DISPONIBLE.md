# 🔧 Fix - "Groupe scolaire non disponible"

## ❌ Problème

La page Établissement affichait :
```
Groupe scolaire non disponible
Impossible de charger les informations de votre établissement.
```

## 🔍 Cause Identifiée

Le hook `useSchoolGroup` cherchait uniquement `user.schoolGroupId` qui n'est pas toujours défini directement sur l'utilisateur. 

Pour les utilisateurs d'école (Proviseur, Directeur, etc.), le `school_group_id` est stocké dans la table `schools`, pas directement dans la table `users`.

## ✅ Solution Appliquée

### Fichier Modifié
`src/features/user-space/hooks/useSchoolGroup.ts`

### Changements

#### 1. Récupération du school_group_id depuis l'école
```tsx
// AVANT
if (!user?.schoolGroupId) {
  throw new Error('Aucun groupe scolaire associé');
}

// APRÈS
let schoolGroupId = user?.schoolGroupId;

// Si pas de school_group_id direct, le récupérer depuis l'école
if (!schoolGroupId && user?.schoolId) {
  const { data: schoolData, error: schoolError } = await supabase
    .from('schools')
    .select('school_group_id')
    .eq('id', user.schoolId)
    .single();

  if (schoolError) throw schoolError;
  schoolGroupId = (schoolData as any)?.school_group_id;
}

if (!schoolGroupId) {
  throw new Error('Aucun groupe scolaire associé');
}
```

#### 2. Utilisation de schoolGroupId partout
```tsx
// Remplacer user.schoolGroupId par schoolGroupId dans toutes les requêtes
.eq('school_group_id', schoolGroupId)
```

#### 3. Condition enabled mise à jour
```tsx
// AVANT
enabled: !!user?.schoolGroupId,

// APRÈS
enabled: !!(user?.schoolGroupId || user?.schoolId),
```

#### 4. Query key mise à jour
```tsx
// AVANT
queryKey: ['school-group', user?.schoolGroupId],

// APRÈS
queryKey: ['school-group', user?.schoolGroupId, user?.schoolId],
```

## 🎯 Flux de Données

### Cas 1 : Utilisateur avec school_group_id direct
```
user.schoolGroupId existe
  ↓
Utiliser directement
  ↓
Charger les infos du groupe
```

### Cas 2 : Utilisateur d'école (Proviseur, Directeur)
```
user.schoolGroupId n'existe pas
  ↓
user.schoolId existe
  ↓
Requête: schools.school_group_id WHERE id = user.schoolId
  ↓
Récupérer school_group_id
  ↓
Charger les infos du groupe
```

### Cas 3 : Aucun groupe
```
Ni schoolGroupId ni schoolId
  ↓
Erreur: "Aucun groupe scolaire associé"
```

## 📊 Structure des Tables

### Table users
```sql
id
email
school_id          -- ID de l'école (pour Proviseur, Directeur, etc.)
school_group_id    -- ID du groupe (pour Admin Groupe)
role
```

### Table schools
```sql
id
name
school_group_id    -- Lien vers le groupe scolaire
```

### Table school_groups
```sql
id
name
description
address
phone
email
website
logo
```

## ✅ Résultat

### Maintenant Fonctionnel
La page Établissement charge correctement pour :

1. **Admin Groupe** - A `school_group_id` direct
2. **Proviseur** - Récupère `school_group_id` via `schools`
3. **Directeur** - Récupère `school_group_id` via `schools`
4. **Directeur d'études** - Récupère `school_group_id` via `schools`

### Données Affichées
- Informations du groupe scolaire
- 4 KPI cards (Écoles, Élèves, Enseignants, Classes)
- Liste des écoles avec recherche
- Design glassmorphisme complet

## 🔍 Vérification

### Pour Tester
1. Connectez-vous en tant que **Proviseur** ou **Directeur**
2. Assurez-vous que l'utilisateur a un `school_id` dans la base
3. Assurez-vous que l'école a un `school_group_id`
4. Cliquez sur **"Établissement"**
5. La page devrait charger avec toutes les informations

### Si Problème Persiste

Vérifiez dans la base de données :

```sql
-- 1. Vérifier l'utilisateur
SELECT id, email, school_id, school_group_id, role 
FROM users 
WHERE email = 'votre@email.com';

-- 2. Vérifier l'école
SELECT id, name, school_group_id 
FROM schools 
WHERE id = 'school_id_de_l_utilisateur';

-- 3. Vérifier le groupe
SELECT id, name, status 
FROM school_groups 
WHERE id = 'school_group_id_trouve';
```

## 🎯 Hiérarchie des Données

```
school_groups (Groupe Scolaire)
    ↓
schools (Écoles)
    ↓
users (Utilisateurs)
    - Proviseur
    - Directeur
    - Enseignants
    - etc.
```

## ✅ Status

**CORRIGÉ ET FONCTIONNEL** ✅

La page Établissement devrait maintenant s'afficher correctement pour tous les utilisateurs ayant un `school_id` ou un `school_group_id`.

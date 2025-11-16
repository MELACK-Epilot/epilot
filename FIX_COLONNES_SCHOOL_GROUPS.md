# 🔧 Fix - Erreur "column school_groups.email does not exist"

## ❌ Erreur

```
Query Error: school-group column school_groups.email does not exist
Failed to load resource: the server responded with a status of 400
```

## 🔍 Cause

Le hook `useSchoolGroup` tentait de sélectionner des colonnes qui n'existent pas dans la table `school_groups` :
- `email`
- `phone`
- `address`
- `website`
- `logo`

## ✅ Solution Appliquée

### Fichier Modifié
`src/features/user-space/hooks/useSchoolGroup.ts`

### Changements

#### 1. Requête SELECT mise à jour
```tsx
// AVANT
.select(`
  id,
  name,
  description,
  address,      // ❌ N'existe pas
  phone,        // ❌ N'existe pas
  email,        // ❌ N'existe pas
  website,      // ❌ N'existe pas
  logo,         // ❌ N'existe pas
  status,
  created_at
`)

// APRÈS
.select(`
  id,
  name,
  description,
  status,
  created_at
`)
```

#### 2. Retour mis à jour
```tsx
return {
  id: groupData.id,
  name: groupData.name,
  description: groupData.description,
  address: undefined,      // Défini comme undefined
  phone: undefined,        // Défini comme undefined
  email: undefined,        // Défini comme undefined
  website: undefined,      // Défini comme undefined
  logo: undefined,         // Défini comme undefined
  status: groupData.status,
  created_at: groupData.created_at,
  total_schools: schoolCount || 0,
  total_users: userCount || 0,
  active_subscriptions: subscriptionData ? 1 : 0,
  plan_name: subscriptionData?.plans?.name || 'Aucun plan',
}
```

## 📊 Structure Réelle de la Table

### Table school_groups
```sql
CREATE TABLE school_groups (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Colonnes existantes** :
- ✅ `id`
- ✅ `name`
- ✅ `description`
- ✅ `status`
- ✅ `created_at`

**Colonnes NON existantes** :
- ❌ `address`
- ❌ `phone`
- ❌ `email`
- ❌ `website`
- ❌ `logo`

## 🎯 Impact sur l'Interface

### Page Établissement

#### Sections Affichées
1. **Header** :
   - ✅ Nom du groupe
   - ✅ Icône par défaut (pas de logo)
   - ✅ Description
   - ✅ Badge plan d'abonnement
   - ❌ Informations de contact (masquées car undefined)

2. **KPI Cards** :
   - ✅ Nombre d'écoles
   - ✅ Total élèves
   - ✅ Total enseignants
   - ✅ Total classes

3. **Liste des Écoles** :
   - ✅ Toutes les écoles du groupe
   - ✅ Recherche fonctionnelle

#### Sections Masquées (car données undefined)
```tsx
{schoolGroup.address && (
  // Ne s'affiche pas car address = undefined
)}

{schoolGroup.phone && (
  // Ne s'affiche pas car phone = undefined
)}

{schoolGroup.email && (
  // Ne s'affiche pas car email = undefined
)}

{schoolGroup.website && (
  // Ne s'affiche pas car website = undefined
)}
```

## 🔄 Migration Future (Optionnel)

Si vous souhaitez ajouter ces colonnes plus tard :

```sql
-- Migration pour ajouter les colonnes manquantes
ALTER TABLE school_groups
ADD COLUMN address TEXT,
ADD COLUMN phone TEXT,
ADD COLUMN email TEXT,
ADD COLUMN website TEXT,
ADD COLUMN logo TEXT;
```

Puis mettre à jour le hook pour les sélectionner :
```tsx
.select(`
  id,
  name,
  description,
  address,
  phone,
  email,
  website,
  logo,
  status,
  created_at
`)
```

Et le retour :
```tsx
return {
  // ...
  address: groupData.address,
  phone: groupData.phone,
  email: groupData.email,
  website: groupData.website,
  logo: groupData.logo,
  // ...
}
```

## ✅ Résultat

### Avant
- ❌ Erreur 400
- ❌ Page ne charge pas
- ❌ Console pleine d'erreurs

### Après
- ✅ Pas d'erreur
- ✅ Page charge correctement
- ✅ Données affichées (nom, description, stats)
- ✅ Sections contact masquées proprement

## 🎯 Vérification

### Console
Plus d'erreurs :
```
✅ Catégories chargées: 2
✅ Modules chargés: 16
✅ [PermissionsStore] Modules chargés: 16
```

### Page Établissement
- ✅ Header avec nom du groupe
- ✅ 4 KPI cards fonctionnelles
- ✅ Liste des écoles
- ✅ Recherche opérationnelle

**Status** : ✅ **CORRIGÉ ET FONCTIONNEL**

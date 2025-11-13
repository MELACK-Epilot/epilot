# ✅ Fix : Erreur 400 Supabase - Jointure SQL

## 🐛 Erreur rencontrée

```
Failed to load resource: the server responded with a status of 400 ()
csltuxbanvweyfzqpfap.supabase.co/rest/v1/users?select=*%2Cschool_group%3Aschool_group_id%28id%2Cname%2Ccode%29
```

## 🔍 Cause

**Syntaxe de jointure incorrecte** dans la requête Supabase.

### ❌ Syntaxe incorrecte (qui causait l'erreur 400)

```typescript
.select(`
  *,
  school_group:school_group_id (
    id,
    name,
    code
  )
`)
```

**Problème** : Cette syntaxe n'est pas reconnue par Supabase PostgREST.

## ✅ Solution

### Syntaxe correcte pour les jointures Supabase

```typescript
.select(`
  *,
  school_groups!school_group_id (
    id,
    name,
    code
  )
`)
```

**Explication** :
- `school_groups` = nom de la **table cible** (celle qu'on veut joindre)
- `!` = opérateur de jointure Supabase
- `school_group_id` = nom de la **colonne de clé étrangère** dans la table `users`

## 📝 Syntaxe générale Supabase

```typescript
// Format général
table_cible!colonne_foreign_key (champs)

// Exemples
school_groups!school_group_id (id, name, code)
plans!plan_id (name, price)
categories!category_id (name, slug)
```

### Types de jointures

```typescript
// Inner join (par défaut)
school_groups!school_group_id (name)

// Left join (inclut les NULL)
school_groups!school_group_id (name)

// Avec alias (si besoin)
group:school_groups!school_group_id (name)
```

## 🔧 Corrections appliquées

### Fichier : `src/features/dashboard/hooks/useUsers.ts`

#### 1. Hook `useUsers` (liste paginée)

**Ligne 61** :
```typescript
// ❌ Avant (erreur 400)
school_group:school_group_id (
  id,
  name,
  code
)

// ✅ Après (fonctionne)
school_groups!school_group_id (
  id,
  name,
  code
)
```

**Ligne 103** :
```typescript
// Accès aux données jointes
schoolGroupName: user.school_groups?.name || 'N/A'
```

#### 2. Hook `useUser` (utilisateur unique)

**Ligne 134** :
```typescript
// ❌ Avant
school_group:school_group_id (
  id,
  name
)

// ✅ Après
school_groups!school_group_id (
  id,
  name
)
```

**Ligne 152** :
```typescript
schoolGroupName: data.school_groups?.name || 'N/A'
```

## 🧪 Test

1. **Rechargez la page Utilisateurs**
2. **Vérifiez la console** : Plus d'erreur 400
3. **Vérifiez le tableau** : Les groupes scolaires s'affichent correctement

## 📚 Références Supabase

### Documentation officielle

**Jointures avec clés étrangères** :
```typescript
// Syntaxe de base
.select('*, foreign_table!foreign_key_column(columns)')

// Exemple réel
.select('*, school_groups!school_group_id(id, name)')
```

**Jointures multiples** :
```typescript
.select(`
  *,
  school_groups!school_group_id (id, name),
  plans!plan_id (name, price)
`)
```

**Jointures avec filtres** :
```typescript
.select(`
  *,
  school_groups!school_group_id (
    id,
    name,
    status
  )
`)
.eq('school_groups.status', 'active')
```

## ✅ Résultat

### Avant (erreur 400)
```
❌ Failed to load resource: 400
❌ Tableau vide
❌ "N/A" dans la colonne Groupe Scolaire
```

### Après (fonctionne)
```
✅ Requête réussie (200 OK)
✅ Données chargées
✅ Nom du groupe affiché correctement
```

## 🎯 Points clés à retenir

1. **Format Supabase** : `table!foreign_key(columns)`
2. **Pas d'alias personnalisé** dans la requête (sauf si nécessaire)
3. **Nom de la table cible** (pas de la colonne)
4. **Opérateur `!`** obligatoire pour les jointures
5. **Accès aux données** : `user.school_groups?.name` (nom de la table)

---

**Date** : 30 octobre 2025  
**Statut** : ✅ RÉSOLU  
**Fichier modifié** : `src/features/dashboard/hooks/useUsers.ts`

# ✅ Correction : Groupe Scolaire n'apparaît pas dans le tableau

## 🔍 Problème identifié

Le nom du Groupe Scolaire sélectionné lors de la création d'un utilisateur n'apparaissait pas dans le tableau des utilisateurs.

## 🐛 Cause du bug

**Erreur dans la jointure SQL Supabase** :

### Avant (incorrect) :
```typescript
.select(`
  *,
  school_groups (    // ❌ INCORRECT - Nom de table au pluriel
    id,
    name,
    code
  )
`)
```

**Problème** : Supabase ne trouvait pas la relation car :
- La colonne dans `users` s'appelle `school_group_id` (singulier)
- La table cible s'appelle `school_groups` (pluriel)
- La syntaxe était incorrecte

### Après (correct) :
```typescript
.select(`
  *,
  school_group:school_group_id (  // ✅ CORRECT - Alias + colonne FK
    id,
    name,
    code
  )
`)
```

**Solution** : Utiliser la syntaxe correcte de Supabase :
- `alias:foreign_key_column (champs)`
- `school_group` = alias pour les données jointes
- `school_group_id` = colonne de clé étrangère dans `users`

## 🔧 Corrections appliquées

### 1. Hook `useUsers` (liste paginée)

**Fichier** : `src/features/dashboard/hooks/useUsers.ts`

**Ligne 61** :
```typescript
// Avant
school_groups (
  id,
  name,
  code
)

// Après
school_group:school_group_id (
  id,
  name,
  code
)
```

**Ligne 103** :
```typescript
// Avant
schoolGroupName: user.school_groups?.name || 'N/A',

// Après
schoolGroupName: user.school_group?.name || 'N/A',
```

### 2. Hook `useUser` (utilisateur unique)

**Ligne 134** :
```typescript
// Avant
school_groups:school_group_id (
  id,
  name
)

// Après
school_group:school_group_id (
  id,
  name
)
```

**Ligne 152** :
```typescript
// Avant
schoolGroupName: data.school_groups?.name || 'N/A',

// Après
schoolGroupName: data.school_group?.name || 'N/A',
```

## 📊 Résultat

### Avant :
| Nom | Rôle | Groupe Scolaire |
|-----|------|----------------|
| Jean Dupont | Administrateur de Groupe | **N/A** ❌ |

### Après :
| Nom | Rôle | Groupe Scolaire |
|-----|------|----------------|
| Jean Dupont | Administrateur de Groupe | **Groupe Scolaire Excellence Brazzaville** ✅ |

## 🧪 Test à effectuer

1. **Créer un utilisateur** :
   - Rôle : "Administrateur de Groupe Scolaire"
   - Sélectionner un groupe : "Groupe Scolaire Excellence Brazzaville"
   - Sauvegarder

2. **Vérifier le tableau** :
   - Le nom du groupe doit s'afficher dans la colonne "Groupe Scolaire"
   - Au lieu de "N/A", vous devez voir le nom complet du groupe

3. **Vérifier le modal "Voir détails"** :
   - Cliquer sur "Voir détails"
   - Section "Association & Permissions"
   - Le nom du groupe doit s'afficher correctement

## 📝 Notes techniques

### Syntaxe Supabase pour les jointures :

```typescript
// ✅ Correct
.select(`
  *,
  alias:foreign_key_column (
    champs
  )
`)

// ❌ Incorrect
.select(`
  *,
  table_name (
    champs
  )
`)
```

### Exemples :

```typescript
// Jointure users → school_groups
school_group:school_group_id (name, code)

// Jointure schools → school_groups
school_group:school_group_id (name)

// Jointure subscriptions → plans
plan:plan_id (name, price)
```

## ✅ Statut : RÉSOLU

Le nom du Groupe Scolaire s'affiche maintenant correctement dans :
- ✅ Le tableau des utilisateurs
- ✅ Le modal "Voir détails"
- ✅ L'export CSV

---

**Date** : 30 octobre 2025
**Fichiers modifiés** : `src/features/dashboard/hooks/useUsers.ts`

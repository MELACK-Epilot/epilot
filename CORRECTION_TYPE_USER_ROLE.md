# Correction Type UserRole - DashboardOverview.tsx

## 🐛 Problème Identifié

**Erreur TypeScript:**
```
This comparison appears to be unintentional because the types 'UserRole | undefined' and '"admin_groupe"' have no overlap.
```

**Ligne concernée:** `DashboardOverview.tsx:30`
```typescript
if (user?.role === 'admin_groupe') {
```

## 🔍 Cause Racine

Il y avait **deux définitions conflictuelles** du type `UserRole`:

### 1. ❌ Type Obsolète (auth.types.ts)
```typescript
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  GROUP_ADMIN = 'group_admin',    // ❌ Mauvaise valeur
  SCHOOL_ADMIN = 'school_admin',  // ❌ N'existe pas
  // ...
}
```

### 2. ✅ Type Correct (roles.ts)
```typescript
export const ADMIN_ROLES = [
  'super_admin',
  'admin_groupe',  // ✅ Valeur correcte
] as const;

export type Role = typeof ALL_ROLES[number];
```

## ✅ Solution Appliquée

### Étape 1: Corriger le type User
**Fichier:** `src/features/auth/types/auth.types.ts`

```typescript
// AVANT
import type { Role } from '@/config/roles';

export interface User {
  // ...
  role: UserRole; // ❌ Enum obsolète
}

// APRÈS
import type { Role } from '@/config/roles';

export interface User {
  // ...
  role: Role; // ✅ Type correct depuis roles.ts
}
```

### Étape 2: Vérifier DashboardOverview.tsx
Le code fonctionne maintenant correctement:

```typescript
const { user } = useAuth();

// ✅ TypeScript reconnaît maintenant 'admin_groupe' comme valeur valide
if (user?.role === 'admin_groupe') {
  return <GroupDashboard />;
}
```

## 📋 Fichiers Modifiés

1. **`src/features/auth/types/auth.types.ts`**
   - Ajout import `Role` depuis `@/config/roles`
   - Changement `role: UserRole` → `role: Role`

2. **`src/features/dashboard/pages/DashboardOverview.tsx`**
   - Aucune modification nécessaire (le type est propagé automatiquement)

## 🎯 Règle à Respecter

**Source Unique de Vérité pour les Rôles:**
- ✅ **Utiliser:** `@/config/roles.ts` (type `Role`)
- ❌ **Ne PAS utiliser:** `auth.types.ts` (enum `UserRole` obsolète)

## 🔄 Migration Recommandée

L'enum `UserRole` dans `auth.types.ts` est **obsolète** et devrait être supprimé pour éviter toute confusion future:

```typescript
// À SUPPRIMER (lignes 73-82)
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  GROUP_ADMIN = 'group_admin',
  SCHOOL_ADMIN = 'school_admin',
  TEACHER = 'teacher',
  CPE = 'cpe',
  ACCOUNTANT = 'accountant',
  LIBRARIAN = 'librarian',
  SUPERVISOR = 'supervisor',
}
```

**Raison:** Le fichier `roles.ts` est la source unique de vérité avec:
- Tous les rôles à jour
- Valeurs correctes (`admin_groupe` pas `group_admin`)
- Fonctions utilitaires (`isAdminRole`, `getRoleLabel`, etc.)

## ✅ Résultat

- ✅ Erreur TypeScript corrigée
- ✅ Type `User.role` cohérent avec la base de données
- ✅ Comparaison `user?.role === 'admin_groupe'` fonctionne
- ✅ Pas de breaking changes dans le code existant

## 📚 Références

- **Source unique rôles:** `src/config/roles.ts`
- **Type User:** `src/features/auth/types/auth.types.ts`
- **Store Auth:** `src/features/auth/store/auth.store.ts`

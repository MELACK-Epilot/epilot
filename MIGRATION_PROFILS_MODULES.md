# Migration Système Profils & Modules

## Résumé des Modifications

### ✅ Fichiers Créés

| Fichier | Description |
|---------|-------------|
| `database/migrations/021_unified_profile_modules_system.sql` | Table `access_profile_modules` + Triggers auto-sync |
| `database/migrations/022_seed_profile_modules.sql` | Données initiales (modules par profil) |
| `database/migrations/023_migrate_existing_users_to_profiles.sql` | Migration utilisateurs existants |
| `src/features/dashboard/hooks/useProfileStats.ts` | Stats temps réel par profil |
| `src/hooks/useUserModulesWithPermissions.ts` | Modules utilisateur avec permissions |
| `src/hooks/usePermissions.ts` | Hook unifié permissions |
| `src/contexts/UserProfilePermissionsContext.tsx` | Context temps réel |
| `src/components/PermissionGuard.tsx` | Composant de garde UI |
| `src/features/dashboard/components/permissions/ProfileModulesManager.tsx` | UI gestion modules/profils |

### ✅ Fichiers Modifiés

| Fichier | Modification |
|---------|--------------|
| `src/features/dashboard/hooks/useProfilesView.ts` | Utilise `useProfileStats` au lieu de `useRoleStats` |
| `src/features/dashboard/components/permissions/ProfilesPermissionsView.tsx` | Passe `profileStats` et `modulesCounts` |
| `src/features/dashboard/components/permissions/profiles-list/ProfilesGridView.tsx` | Accepte nouvelles props |
| `src/features/dashboard/components/permissions/profiles-list/ProfilesListView.tsx` | Accepte nouvelles props |
| `src/features/dashboard/components/permissions/profiles-list/ProfileCard.tsx` | Affiche `moduleCount` temps réel |
| `src/features/dashboard/components/permissions/profiles-list/ProfileRow.tsx` | Affiche `moduleCount` temps réel |
| `src/contexts/UserPermissionsProvider.tsx` | Intègre `UserProfilePermissionsProvider` |

## 🚀 Étapes pour Appliquer

### 1. Appliquer les migrations SQL

```bash
# Dans Supabase Dashboard > SQL Editor, exécuter dans l'ordre:

# 1. Créer la table et les triggers
database/migrations/021_unified_profile_modules_system.sql

# 2. Peupler les modules par profil
database/migrations/022_seed_profile_modules.sql

# 3. Migrer les utilisateurs existants
database/migrations/023_migrate_existing_users_to_profiles.sql
```

### 2. Vérifier les données

```sql
-- Vérifier les profils et leurs modules
SELECT 
    ap.code,
    ap.name_fr,
    COUNT(apm.module_id) AS modules_count
FROM access_profiles ap
LEFT JOIN access_profile_modules apm ON apm.access_profile_code = ap.code
GROUP BY ap.code, ap.name_fr
ORDER BY modules_count DESC;

-- Vérifier les utilisateurs migrés
SELECT 
    access_profile_code,
    COUNT(*) AS user_count
FROM users
WHERE access_profile_code IS NOT NULL
GROUP BY access_profile_code;
```

### 3. Tester le temps réel

1. Ouvrir la page Permissions & Modules
2. Les badges "X util." doivent afficher le nombre correct
3. Assigner un profil à un utilisateur
4. Le badge doit se mettre à jour automatiquement

## Architecture Finale

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPER ADMIN                              │
│  • Crée les profils (access_profiles)                       │
│  • Configure les modules par profil (access_profile_modules)│
│  • Les modules disponibles = TOUS les modules système       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN GROUPE                             │
│  • Voit les profils avec stats temps réel                   │
│  • Assigne un profil à un utilisateur                       │
│  • Les modules disponibles = modules du PLAN du groupe      │
│  • TRIGGER: user_modules auto-peuplé                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    UTILISATEUR                              │
│  • Voit ses modules via useUserModulesWithPermissions       │
│  • Permissions héritées du profil (read/write/delete)       │
│  • Mise à jour temps réel via Supabase Realtime             │
└─────────────────────────────────────────────────────────────┘
```

## Logique des Modules Disponibles

### Pour le Super Admin
```typescript
// useProfileForm.ts
const isSuperAdmin = user?.role === 'super_admin';
const categories = isSuperAdmin ? allCategories : groupCategories;
// → Voit TOUS les modules du système
```

### Pour l'Admin Groupe
```typescript
// useGroupAvailableModules.ts
// → Filtre les modules selon le plan du groupe via plan_modules
const { data: groupCategories } = useGroupAvailableModules();
// → Voit uniquement les modules inclus dans son plan
```

## Temps Réel

### Stats des profils (badges "X util.")
```typescript
// useProfileStats.ts
// Écoute: users.access_profile_code + access_profile_modules
// Invalidation automatique du cache React Query
```

### Modules utilisateur
```typescript
// useUserModulesWithPermissions.ts
// Écoute: user_modules + users.access_profile_code
// Notification toast quand les modules changent
```

## Points Importants

1. **Les modules disponibles pour configurer un profil dépendent du plan**
   - Super Admin → Tous les modules
   - Admin Groupe → Modules du plan uniquement

2. **Les badges sont en temps réel**
   - Comptent par `access_profile_code` (pas par `role`)
   - Se mettent à jour automatiquement

3. **La migration est automatique**
   - Les utilisateurs existants reçoivent un profil basé sur leur rôle
   - Les modules sont synchronisés via le trigger

4. **Le trigger gère tout**
   - Quand `access_profile_code` change → modules auto-assignés
   - Quand `access_profile_modules` change → tous les utilisateurs resync

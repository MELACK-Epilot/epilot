# Architecture Profils & Modules E-Pilot

## ⚠️ IMPORTANT: Séparation des Responsabilités

```
┌─────────────────────────────────────────────────────────────┐
│ SUPER ADMIN E-PILOT (Plateforme)                           │
│    • Crée les Groupes Scolaires                             │
│    • Crée les Catégories Métiers (9 catégories)            │
│    • Crée les Modules Pédagogiques (47 modules)            │
│    • Définit les Plans d'abonnement                         │
│    • Assigne modules/catégories aux PLANS (plan_modules)   │
│    ❌ NE GÈRE PAS les profils d'accès des utilisateurs     │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ plan_modules, plan_categories
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ ADMIN DE GROUPE SCOLAIRE                                    │
│    • Voit modules/catégories selon son PLAN                │
│    • Crée les Écoles                                        │
│    • Crée les Utilisateurs                                  │
│    ✅ Crée les PROFILS D'ACCÈS pour son groupe             │
│    ✅ Configure quels modules dans chaque profil           │
│    ✅ Assigne les profils aux utilisateurs                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ UTILISATEUR                                                 │
│    • Voit ses modules via son profil                       │
│    • Permissions héritées du profil                        │
└─────────────────────────────────────────────────────────────┘
```

## Vue d'Ensemble Technique

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SUPER ADMIN E-PILOT                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │ access_profiles │  │     modules     │  │ subscription_   │             │
│  │ (6 profils)     │  │ (47 modules)    │  │ plans (4 plans) │             │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘             │
│           │                    │                    │                       │
│           └────────────────────┼────────────────────┘                       │
│                                │                                            │
│                    ┌───────────▼───────────┐                               │
│                    │ access_profile_modules │  ← NOUVEAU                   │
│                    │ (profil → modules)     │                               │
│                    └───────────────────────┘                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                 │
                                 │ TRIGGER: sync_user_modules_from_profile()
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ADMIN DE GROUPE                                      │
│                                                                             │
│  1. Crée un utilisateur (enseignant, comptable, etc.)                      │
│  2. Assigne un profil via users.access_profile_code                        │
│  3. ⚡ AUTOMATIQUE: Les modules du profil sont assignés                     │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │                        user_modules                              │       │
│  │  ┌──────────┬───────────┬──────────┬──────────┬───────────────┐ │       │
│  │  │ user_id  │ module_id │ can_read │ can_write│ assigned_by_  │ │       │
│  │  │          │           │          │          │ profile       │ │       │
│  │  ├──────────┼───────────┼──────────┼──────────┼───────────────┤ │       │
│  │  │ user_123 │ mod_notes │ true     │ true     │ enseignant    │ │       │
│  │  │ user_123 │ mod_abs   │ true     │ false    │ enseignant    │ │       │
│  │  │ user_456 │ mod_fin   │ true     │ true     │ comptable     │ │       │
│  │  └──────────┴───────────┴──────────┴──────────┴───────────────┘ │       │
│  └─────────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────────┘
                                 │
                                 │ Supabase Realtime
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           UTILISATEUR                                       │
│                                                                             │
│  • Se connecte à son école                                                  │
│  • Voit UNIQUEMENT les modules de son profil                               │
│  • Permissions granulaires (read/write/delete/export)                      │
│  • Mise à jour en TEMPS RÉEL si le profil change                           │
│                                                                             │
│  Hook: useUserModulesWithPermissions()                                     │
│  Context: UserProfilePermissionsProvider                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Tables Clés

### 1. `access_profiles` (Existante)
Définit les profils d'accès avec permissions par domaine.

```sql
CREATE TABLE access_profiles (
  id UUID PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,  -- 'chef_etablissement', 'comptable', etc.
  name_fr VARCHAR(100) NOT NULL,
  permissions JSONB NOT NULL,        -- Permissions par domaine (JSON)
  is_active BOOLEAN DEFAULT true
);
```

### 2. `access_profile_modules` (NOUVELLE)
Lie les profils aux modules avec permissions granulaires.

```sql
CREATE TABLE access_profile_modules (
  id UUID PRIMARY KEY,
  access_profile_code VARCHAR(50) NOT NULL,
  module_id UUID NOT NULL,
  can_read BOOLEAN DEFAULT true,
  can_write BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  can_export BOOLEAN DEFAULT false,
  UNIQUE(access_profile_code, module_id)
);
```

### 3. `user_modules` (Mise à jour)
Assignation des modules aux utilisateurs avec origine.

```sql
ALTER TABLE user_modules ADD COLUMN assigned_by_profile VARCHAR(50);
ALTER TABLE user_modules ADD COLUMN can_read BOOLEAN DEFAULT true;
ALTER TABLE user_modules ADD COLUMN can_write BOOLEAN DEFAULT false;
ALTER TABLE user_modules ADD COLUMN can_delete BOOLEAN DEFAULT false;
ALTER TABLE user_modules ADD COLUMN can_export BOOLEAN DEFAULT false;
```

## Triggers Automatiques

### `trigger_sync_modules_on_profile_change`
Quand `users.access_profile_code` change :
1. Supprime les modules de l'ancien profil
2. Ajoute les modules du nouveau profil
3. Préserve les modules assignés manuellement

### `trigger_resync_on_profile_modules_change`
Quand `access_profile_modules` change :
1. Resynchronise TOUS les utilisateurs du profil concerné
2. Garantit la cohérence des données

## Hooks Frontend

### `useUserModulesWithPermissions`
```typescript
const { 
  modules,           // Liste des modules avec permissions
  hasModule,         // Vérifie si un module est accessible
  canOnModule,       // Vérifie une permission (read/write/delete/export)
  modulesByCategory, // Modules groupés par catégorie
  refresh            // Force le rafraîchissement
} = useUserModulesWithPermissions();
```

### `useProfilePermissions`
```typescript
const {
  profile,           // Profil complet
  hasPermission,     // Vérifie permission par domaine
  canAccessDomain,   // Vérifie accès à un domaine
  getScope,          // Récupère le scope (own/school/group)
} = useProfilePermissions();
```

### `usePermissions` (Unifié)
```typescript
const {
  can,               // Vérifie permission (domaine + action)
  canAccess,         // Vérifie accès à un domaine
  isAdmin,           // Est-ce un admin ?
  profileName,       // Nom du profil
} = usePermissions();
```

## Composants UI

### `ProfileModulesManager`
Interface pour le Super Admin pour configurer les modules par profil.

### `PermissionGuard`
Composant de garde pour protéger les sections de l'UI.

```tsx
<PermissionGuard domain="finances" action="write">
  <FinanceEditForm />
</PermissionGuard>
```

## Workflow Complet

```
1. SUPER ADMIN
   └── Crée profil "Comptable" dans access_profiles
   └── Configure modules dans access_profile_modules
       └── Module "Finances" → can_read: true, can_write: true
       └── Module "Statistiques" → can_read: true, can_write: false

2. ADMIN GROUPE
   └── Crée utilisateur "Jean Dupont"
   └── Assigne profil "Comptable" (users.access_profile_code = 'comptable')
   └── ⚡ TRIGGER: user_modules est automatiquement peuplé

3. UTILISATEUR (Jean Dupont)
   └── Se connecte
   └── useUserModulesWithPermissions() charge ses modules
   └── Voit uniquement: Finances, Statistiques
   └── Peut modifier Finances, consulter Statistiques

4. MODIFICATION PROFIL (par Super Admin)
   └── Ajoute module "Rapports" au profil "Comptable"
   └── ⚡ TRIGGER: Tous les comptables reçoivent le module
   └── Jean Dupont voit "Rapports" en temps réel (Supabase Realtime)
```

## Fichiers Créés

### Migrations SQL
- `database/migrations/021_unified_profile_modules_system.sql`
- `database/migrations/022_seed_profile_modules.sql`

### Hooks
- `src/hooks/useUserModulesWithPermissions.ts`
- `src/hooks/usePermissions.ts`

### Contexts
- `src/contexts/UserProfilePermissionsContext.tsx`
- `src/contexts/UserPermissionsProvider.tsx` (mis à jour)

### Composants
- `src/features/dashboard/components/permissions/ProfileModulesManager.tsx`
- `src/components/PermissionGuard.tsx`

## Performance

- **Indexes** sur `access_profile_code` et `module_id`
- **Triggers SECURITY DEFINER** pour éviter les problèmes RLS
- **React Query** avec `staleTime: 5min` pour le cache
- **Supabase Realtime** pour les mises à jour instantanées
- **Virtualisation** pour les listes de 900+ utilisateurs

## Sécurité

- **RLS** activé sur toutes les tables
- **Super Admin** seul peut modifier `access_profile_modules`
- **Admin Groupe** peut assigner des profils aux utilisateurs de son groupe
- **Utilisateurs** ne voient que leurs propres modules

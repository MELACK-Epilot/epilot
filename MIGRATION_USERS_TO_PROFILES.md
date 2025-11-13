# 🔄 Migration users → profiles

**Date** : 1er novembre 2025  
**Priorité** : 🔴 CRITIQUE  
**Impact** : Toute l'application

---

## 🎯 Problème Identifié

L'application utilise actuellement la table `users` mais la vraie table est `profiles` !

### Structure profiles
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  name TEXT,
  avatar_url TEXT,
  role TEXT, -- 'admin_groupe', 'SUPER_ADMIN'
  is_active BOOLEAN,
  phone TEXT,
  address TEXT,
  birth_date DATE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Données actuelles
```
- admin@epilot.cg → SUPER_ADMIN
- int@epilot.com → admin_groupe
- lam@epilot.cg → admin_groupe
- ana@epilot.cg → admin_groupe
```

---

## ✅ Avantages de profiles

### 1. **Meilleure Pratique Supabase**
- `auth.users` → Authentification
- `public.profiles` → Données métier
- Séparation des responsabilités

### 2. **Structure Plus Simple**
- Pas de `first_name` / `last_name` séparés
- `full_name` directement
- `avatar_url` au lieu de `avatar`
- `is_active` au lieu de `status`

### 3. **React 19 Best Practice**
- Un seul type `Profile` au lieu de `User`
- Moins de transformations de données
- Code plus simple et maintenable

---

## 🔧 Modifications à Appliquer

### 1. **Type Profile** (Nouveau)

**Fichier** : `src/features/auth/types/auth.types.ts`

```typescript
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  name: string;
  avatar_url?: string;
  role: 'SUPER_ADMIN' | 'admin_groupe' | 'admin_ecole';
  is_active: boolean;
  phone?: string;
  address?: string;
  birth_date?: string;
  created_at: string;
  updated_at: string;
  // Ajouts pour Admin Groupe
  school_group_id?: string;
  school_group_name?: string;
  school_group_logo?: string;
}
```

---

### 2. **Hook useLogin** (Adapter)

**Fichier** : `src/features/auth/hooks/useLogin.ts`

```typescript
// AVANT - Table users
const { data: userData } = await supabase
  .from('users')
  .select(`
    *,
    school_groups!users_school_group_id_fkey(name, logo)
  `)
  .eq('id', authData.user.id)
  .single();

// APRÈS - Table profiles
const { data: profileData } = await supabase
  .from('profiles')
  .select(`
    *,
    school_groups!profiles_school_group_id_fkey(name, logo)
  `)
  .eq('id', authData.user.id)
  .single();

// Construction du profil
const profile = {
  id: profileData.id,
  email: profileData.email,
  fullName: profileData.full_name,
  name: profileData.name,
  avatar: profileData.avatar_url,
  role: profileData.role.toLowerCase(), // 'SUPER_ADMIN' → 'super_admin'
  isActive: profileData.is_active,
  phone: profileData.phone,
  schoolGroupId: profileData.school_group_id,
  schoolGroupName: profileData.school_groups?.name,
  schoolGroupLogo: profileData.school_groups?.logo,
  createdAt: profileData.created_at,
  updatedAt: profileData.updated_at,
};
```

---

### 3. **Store Zustand** (Adapter)

**Fichier** : `src/features/auth/store/auth.store.ts`

```typescript
// Renommer User → Profile
export interface AuthState {
  profile: Profile | null; // Au lieu de user
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthActions {
  setProfile: (profile: Profile) => void; // Au lieu de setUser
  // ...
}
```

---

### 4. **Hook useAuth** (Adapter)

**Fichier** : `src/features/auth/store/auth.store.ts`

```typescript
// Export pour compatibilité
export const useAuth = () => {
  const store = useAuthStore();
  return {
    user: store.profile, // Alias pour compatibilité
    profile: store.profile,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    logout: store.logout,
  };
};
```

---

### 5. **Tous les Hooks de Données** (Adapter)

#### useDashboardStats
```typescript
// AVANT
const { data } = await supabase.from('users').select('*');

// APRÈS
const { data } = await supabase.from('profiles').select('*');
```

#### useUsers → useProfiles
```typescript
export const useProfiles = (filters?: ProfileFilters) => {
  return useQuery({
    queryKey: ['profiles', filters],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select(`
          *,
          school_groups!profiles_school_group_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (filters?.schoolGroupId) {
        query = query.eq('school_group_id', filters.schoolGroupId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data;
    },
  });
};
```

---

### 6. **Composants** (Adapter)

#### DashboardLayout
```typescript
// AVANT
const { user } = useAuth();
<p>{user?.firstName} {user?.lastName}</p>

// APRÈS
const { profile } = useAuth();
<p>{profile?.full_name}</p>
```

#### WelcomeCard
```typescript
// AVANT
<h1>Bonjour, {user?.firstName} 👋</h1>
<img src={user?.avatar} />

// APRÈS
<h1>Bonjour, {profile?.name} 👋</h1>
<img src={profile?.avatar_url} />
```

---

## 📋 Checklist Migration

### Types
- [ ] Créer type `Profile`
- [ ] Remplacer `User` par `Profile`
- [ ] Adapter les interfaces

### Auth
- [ ] Adapter `useLogin`
- [ ] Adapter `auth.store.ts`
- [ ] Tester la connexion

### Hooks
- [ ] Adapter `useDashboardStats`
- [ ] Renommer `useUsers` → `useProfiles`
- [ ] Adapter `useSchools`
- [ ] Adapter tous les hooks

### Composants
- [ ] Adapter `DashboardLayout`
- [ ] Adapter `WelcomeCard`
- [ ] Adapter `Profile.tsx`
- [ ] Adapter tous les composants

### Pages
- [ ] Adapter `Users.tsx` → `Profiles.tsx`
- [ ] Adapter `Schools.tsx`
- [ ] Adapter toutes les pages

---

## 🎯 Mapping Champs

| users (ancien) | profiles (nouveau) |
|----------------|-------------------|
| first_name | name |
| last_name | (supprimé) |
| email | email |
| avatar | avatar_url |
| role | role (en majuscules) |
| status | is_active |
| phone | phone |
| school_group_id | school_group_id |
| created_at | created_at |
| updated_at | updated_at |

---

## 🔄 Ordre de Migration

### Phase 1 : Types et Auth (30 min)
1. Créer type `Profile`
2. Adapter `auth.types.ts`
3. Adapter `useLogin`
4. Adapter `auth.store.ts`
5. Tester la connexion

### Phase 2 : Hooks (1h)
6. Adapter `useDashboardStats`
7. Renommer `useUsers` → `useProfiles`
8. Adapter tous les hooks de données

### Phase 3 : Composants (1h)
9. Adapter `DashboardLayout`
10. Adapter `WelcomeCard`
11. Adapter tous les composants

### Phase 4 : Pages (1h)
12. Adapter `Users.tsx`
13. Adapter toutes les pages
14. Tests complets

---

## ✅ Avantages de la Migration

### Code Plus Simple
```typescript
// AVANT
const fullName = `${user.firstName} ${user.lastName}`;

// APRÈS
const fullName = profile.full_name;
```

### Moins de Transformations
```typescript
// AVANT
const user = {
  firstName: data.first_name,
  lastName: data.last_name,
  avatar: data.avatar,
  // ...
};

// APRÈS
const profile = data; // Direct !
```

### Meilleure Performance
- Moins de transformations
- Moins de code
- Plus rapide

---

## 🚀 React 19 Best Practices

### 1. **useMemo pour Computed Values**
```typescript
const displayName = useMemo(() => 
  profile?.full_name || profile?.name || 'Utilisateur',
  [profile]
);
```

### 2. **useCallback pour Actions**
```typescript
const updateProfile = useCallback(async (data: Partial<Profile>) => {
  await supabase
    .from('profiles')
    .update(data)
    .eq('id', profile?.id);
}, [profile?.id]);
```

### 3. **Custom Hook**
```typescript
export const useProfile = () => {
  const { profile } = useAuth();
  
  const displayName = useMemo(() => 
    profile?.full_name || profile?.name,
    [profile]
  );
  
  const isAdmin = useMemo(() => 
    profile?.role === 'SUPER_ADMIN',
    [profile?.role]
  );
  
  return { profile, displayName, isAdmin };
};
```

---

**Migration vers profiles : Meilleure pratique Supabase + React 19 !** 🚀

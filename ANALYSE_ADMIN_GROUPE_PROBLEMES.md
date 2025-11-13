# 🚨 ANALYSE PROBLÈMES ADMIN GROUPE - DIAGNOSTIC COMPLET

**Date** : 4 Novembre 2025 22h45  
**Utilisateur** : Admin Groupe (ana@epilot.cg)  
**Problèmes** : Page Écoles redirige + Dashboard incohérent

---

## 🔍 PROBLÈMES IDENTIFIÉS

### Problème 1 : Page Écoles Redirige vers Dashboard ❌

**Symptôme** :
```
Admin Groupe clique sur "Écoles"
    ↓
Redirection immédiate vers /dashboard
    ↓
Page Écoles ne s'affiche jamais
```

**Cause** :
```typescript
// App.tsx ligne 104-108
<Route path="schools" element={
  <ProtectedRoute roles={['admin_groupe']}>  // ✅ Rôle correct
    <Schools />
  </ProtectedRoute>
} />
```

**Diagnostic** : Le rôle est correct, donc le problème vient probablement de `RoleBasedRedirect` ou `ProtectedRoute`.

---

### Problème 2 : Dashboard Incohérent pour Admin Groupe ❌

**Symptôme** :
```
Dashboard affiche :
- "Groupes Scolaires" au lieu de "Écoles"
- Stats globales au lieu de stats du groupe
- Pas adapté pour gérer 1 à 300 écoles
```

**Cause 1 : Mauvaise Table BDD**
```typescript
// useDashboardStats.ts ligne 20
let profilesQuery = supabase.from('profiles')  // ❌ Table n'existe PAS
  .select('id', { count: 'exact', head: true })
  .eq('is_active', true);
```

**Table correcte** : `users` (pas `profiles`)

---

**Cause 2 : Stats Incohérentes**
```typescript
// useDashboardStats.ts ligne 19-21
let schoolGroupsQuery = supabase.from('school_groups')...  // ❌ Pour Admin Groupe
let profilesQuery = supabase.from('profiles')...
let subscriptionsQuery = supabase.from('subscriptions')...
```

**Pour Admin Groupe, il faut** :
- ✅ Nombre d'ÉCOLES (pas groupes)
- ✅ Nombre d'ÉLÈVES
- ✅ Nombre d'ENSEIGNANTS/PERSONNEL
- ✅ Stats par école

---

**Cause 3 : Labels Incorrects**
```typescript
// DashboardOverview.tsx ligne 48
groupsLabel: 'Écoles',  // ✅ Label correct
```

Mais les données viennent de `school_groups` au lieu de `schools` !

---

## 📊 STRUCTURE BDD CORRECTE

### Tables Existantes

```sql
-- 1. school_groups (Groupes Scolaires)
CREATE TABLE school_groups (
  id UUID PRIMARY KEY,
  name TEXT,
  logo TEXT,
  status TEXT,
  created_at TIMESTAMP
);

-- 2. schools (Écoles)
CREATE TABLE schools (
  id UUID PRIMARY KEY,
  name TEXT,
  school_group_id UUID REFERENCES school_groups(id),  -- ✅ Lien avec groupe
  student_count INTEGER DEFAULT 0,
  staff_count INTEGER DEFAULT 0,
  status TEXT,
  created_at TIMESTAMP
);

-- 3. users (Utilisateurs)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT,
  school_group_id UUID REFERENCES school_groups(id),  -- ✅ Groupe
  school_id UUID REFERENCES schools(id),               -- ✅ École
  status TEXT,
  created_at TIMESTAMP
);
```

---

## ✅ CORRECTIONS À APPLIQUER

### Correction 1 : Créer Hook Dédié Admin Groupe

**Nouveau fichier** : `src/features/dashboard/hooks/useAdminGroupStats.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/store/auth.store';

interface AdminGroupStats {
  totalSchools: number;
  totalStudents: number;
  totalStaff: number;
  activeSchools: number;
  trends: {
    schools: number;
    students: number;
    staff: number;
  };
}

const fetchAdminGroupStats = async (schoolGroupId: string): Promise<AdminGroupStats> => {
  try {
    // 1. Compter les écoles du groupe
    const { count: totalSchools } = await supabase
      .from('schools')
      .select('id', { count: 'exact', head: true })
      .eq('school_group_id', schoolGroupId);

    // 2. Compter les écoles actives
    const { count: activeSchools } = await supabase
      .from('schools')
      .select('id', { count: 'exact', head: true })
      .eq('school_group_id', schoolGroupId)
      .eq('status', 'active');

    // 3. Somme des élèves
    const { data: schoolsData } = await supabase
      .from('schools')
      .select('student_count, staff_count')
      .eq('school_group_id', schoolGroupId);

    const totalStudents = schoolsData?.reduce((sum, s) => sum + (s.student_count || 0), 0) || 0;
    const totalStaff = schoolsData?.reduce((sum, s) => sum + (s.staff_count || 0), 0) || 0;

    // 4. Calculer tendances (mois dernier)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const { count: lastMonthSchools } = await supabase
      .from('schools')
      .select('id', { count: 'exact', head: true })
      .eq('school_group_id', schoolGroupId)
      .lt('created_at', lastMonth.toISOString());

    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      totalSchools: totalSchools || 0,
      totalStudents,
      totalStaff,
      activeSchools: activeSchools || 0,
      trends: {
        schools: calculateTrend(totalSchools || 0, lastMonthSchools || 0),
        students: 0, // TODO: Calculer depuis historique
        staff: 0,    // TODO: Calculer depuis historique
      },
    };
  } catch (error) {
    console.error('Erreur stats admin groupe:', error);
    throw error;
  }
};

export const useAdminGroupStats = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['admin-group-stats', user?.schoolGroupId],
    queryFn: () => fetchAdminGroupStats(user?.schoolGroupId!),
    enabled: !!user?.schoolGroupId && user?.role === 'admin_groupe',
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
};
```

---

### Correction 2 : Corriger useDashboardStats

**Fichier** : `src/features/dashboard/hooks/useDashboardStats.ts`

**Changements** :
1. Remplacer `profiles` par `users`
2. Ajouter logique pour Admin Groupe (écoles au lieu de groupes)

```typescript
const fetchDashboardStats = async (userRole?: string, schoolGroupId?: string): Promise<DashboardStats> => {
  try {
    const isSuperAdmin = userRole === 'super_admin';
    const isAdminGroupe = userRole === 'admin_groupe';
    
    if (isAdminGroupe && schoolGroupId) {
      // ✅ STATS ADMIN GROUPE : Écoles, Élèves, Personnel
      const { count: totalSchools } = await supabase
        .from('schools')
        .select('id', { count: 'exact', head: true })
        .eq('school_group_id', schoolGroupId);

      const { data: schoolsData } = await supabase
        .from('schools')
        .select('student_count, staff_count')
        .eq('school_group_id', schoolGroupId);

      const totalStudents = schoolsData?.reduce((sum, s) => sum + (s.student_count || 0), 0) || 0;
      const totalStaff = schoolsData?.reduce((sum, s) => sum + (s.staff_count || 0), 0) || 0;

      const { count: activeUsers } = await supabase
        .from('users')  // ✅ Pas 'profiles'
        .select('id', { count: 'exact', head: true })
        .eq('school_group_id', schoolGroupId)
        .eq('status', 'active');

      return {
        totalSchoolGroups: totalSchools || 0,  // Réutiliser le champ pour écoles
        activeUsers: activeUsers || 0,
        estimatedMRR: 0,  // Pas de MRR pour admin groupe
        criticalSubscriptions: 0,
        trends: {
          schoolGroups: 0,
          users: 0,
          mrr: 0,
          subscriptions: 0,
        },
      };
    }
    
    // ✅ STATS SUPER ADMIN : Groupes, Utilisateurs, MRR
    let schoolGroupsQuery = supabase.from('school_groups').select('id', { count: 'exact', head: true });
    let usersQuery = supabase.from('users')  // ✅ Pas 'profiles'
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active');
    
    // ... reste du code
  }
};
```

---

### Correction 3 : Dashboard Adapté Admin Groupe

**Fichier** : `src/features/dashboard/pages/DashboardOverview.tsx`

**Widgets Admin Groupe** :

```typescript
// Widgets pour Admin Groupe
const adminGroupeWidgets = [
  {
    id: 'schools',
    title: 'Écoles',
    value: stats?.totalSchools || 0,
    icon: School,
    trend: stats?.trends?.schools || 0,
    color: 'from-[#2A9D8F] to-[#1d7a6f]',
  },
  {
    id: 'students',
    title: 'Élèves',
    value: stats?.totalStudents || 0,
    icon: UsersIcon,
    trend: stats?.trends?.students || 0,
    color: 'from-[#1D3557] to-[#0f1f33]',
  },
  {
    id: 'staff',
    title: 'Personnel',
    value: stats?.totalStaff || 0,
    icon: UsersIcon,
    trend: stats?.trends?.staff || 0,
    color: 'from-[#E9C46A] to-[#d4a84a]',
  },
  {
    id: 'active-schools',
    title: 'Écoles Actives',
    value: stats?.activeSchools || 0,
    icon: TrendingUp,
    trend: 0,
    color: 'from-[#E63946] to-[#c72f3a]',
  },
];
```

---

### Correction 4 : Vérifier RoleBasedRedirect

**Problème potentiel** : RoleBasedRedirect redirige depuis `/dashboard/schools`

**Solution** : Exclure les sous-routes du dashboard

```typescript
// RoleBasedRedirect.tsx
if (isUser && currentPath.startsWith('/dashboard') && !currentPath.includes('/dashboard/')) {
  // Rediriger uniquement si c'est /dashboard exact, pas /dashboard/schools
  navigate('/user', { replace: true });
}
```

---

## 🎯 PLAN D'ACTION

### Étape 1 : Corriger useDashboardStats (PRIORITÉ 1)

- [ ] Remplacer `profiles` par `users`
- [ ] Ajouter logique Admin Groupe (écoles, élèves, personnel)
- [ ] Tester requêtes SQL

---

### Étape 2 : Créer useAdminGroupStats (PRIORITÉ 1)

- [ ] Créer fichier `useAdminGroupStats.ts`
- [ ] Implémenter requêtes pour écoles
- [ ] Calculer stats élèves et personnel
- [ ] Calculer tendances

---

### Étape 3 : Adapter DashboardOverview (PRIORITÉ 2)

- [ ] Détecter rôle Admin Groupe
- [ ] Afficher widgets adaptés (Écoles, Élèves, Personnel)
- [ ] Utiliser useAdminGroupStats au lieu de useDashboardStats

---

### Étape 4 : Corriger RoleBasedRedirect (PRIORITÉ 1)

- [ ] Exclure sous-routes `/dashboard/*`
- [ ] Tester navigation vers `/dashboard/schools`
- [ ] Vérifier pas de redirection intempestive

---

### Étape 5 : Ajouter Graphiques Admin Groupe (PRIORITÉ 3)

- [ ] Graphique répartition élèves par école
- [ ] Graphique évolution inscriptions
- [ ] Top 5 écoles par effectif
- [ ] Carte des écoles (si coordonnées GPS)

---

## 📋 CHECKLIST FINALE

### Tests Admin Groupe

- [ ] Se connecter en tant que ana@epilot.cg
- [ ] Vérifier dashboard affiche écoles (pas groupes)
- [ ] Vérifier stats cohérentes (écoles, élèves, personnel)
- [ ] Cliquer sur "Écoles" → Page s'affiche
- [ ] Vérifier liste des écoles du groupe
- [ ] Créer une nouvelle école
- [ ] Modifier une école
- [ ] Supprimer une école

---

### Tests Super Admin

- [ ] Se connecter en tant que admin@epilot.cg
- [ ] Vérifier dashboard affiche groupes
- [ ] Vérifier stats globales (MRR, abonnements)
- [ ] Pas d'accès direct aux écoles

---

## 🚀 PROCHAINE ÉTAPE

Je vais maintenant appliquer ces corrections dans l'ordre de priorité.

**Commençons par la correction 4 (RoleBasedRedirect) puis la correction 2 (useDashboardStats).**

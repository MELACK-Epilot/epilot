# 🔌 CONNEXION AUX DONNÉES RÉELLES - GUIDE COMPLET

## ✅ Ce qui a été créé

### 1️⃣ Hooks personnalisés pour React Query

J'ai créé 3 hooks puissants qui gèrent toutes les opérations CRUD avec Supabase :

#### **useSchools** (`src/features/user-space/hooks/useSchools.ts`)
- ✅ Récupération de toutes les écoles du groupe
- ✅ Récupération d'une école spécifique
- ✅ Création d'une nouvelle école
- ✅ Mise à jour d'une école
- ✅ Suppression d'une école
- ✅ Statistiques globales (total écoles, élèves, personnel, classes)
- ✅ Enrichissement automatique avec le nombre de classes

#### **useStaff** (`src/features/user-space/hooks/useStaff.ts`)
- ✅ Récupération de tout le personnel
- ✅ Filtrage par école ou groupe scolaire
- ✅ Création d'un nouveau membre (avec compte Supabase Auth)
- ✅ Mise à jour d'un membre
- ✅ Suppression d'un membre
- ✅ Statistiques (total, actifs, inactifs, par rôle)

#### **useClasses** (`src/features/user-space/hooks/useClasses.ts`)
- ✅ Récupération de toutes les classes
- ✅ Filtrage par école
- ✅ Création d'une nouvelle classe
- ✅ Mise à jour d'une classe
- ✅ Suppression d'une classe
- ✅ Statistiques (total, élèves, capacité, présence, moyennes)
- ✅ Enrichissement avec statistiques de performance

### 2️⃣ Configuration React Query

**Fichier**: `src/lib/queryClient.ts`
- ✅ Configuration optimisée pour le caching
- ✅ Gestion automatique des refetch
- ✅ Retry policy configurée

---

## 🚀 ÉTAPES D'INSTALLATION

### Étape 1: Installer React Query

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

### Étape 2: Configurer le QueryClientProvider

Dans votre `src/main.tsx` ou `src/App.tsx` :

```tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/queryClient';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Votre application */}
      <YourRoutes />
      
      {/* DevTools pour le développement */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### Étape 3: Créer les tables manquantes dans Supabase

Exécutez ces migrations SQL dans votre base de données Supabase :

```sql
-- Table classes (si elle n'existe pas)
CREATE TABLE IF NOT EXISTS classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  level VARCHAR(50) NOT NULL,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  room VARCHAR(50),
  capacity INTEGER DEFAULT 40,
  student_count INTEGER DEFAULT 0,
  schedule TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON classes(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_level ON classes(level);

-- Ajouter logo_url à la table schools (si manquant)
ALTER TABLE schools ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Ajouter classes_count calculé (optionnel, pour performance)
ALTER TABLE schools ADD COLUMN IF NOT EXISTS classes_count INTEGER DEFAULT 0;

-- Fonction pour calculer les statistiques de classe
CREATE OR REPLACE FUNCTION get_class_statistics(class_id UUID)
RETURNS TABLE (
  average NUMERIC,
  attendance NUMERIC,
  subjects_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(AVG(grades.value), 0) as average,
    COALESCE(AVG(attendance.rate), 0) as attendance,
    COUNT(DISTINCT subjects.id) as subjects_count
  FROM classes c
  LEFT JOIN grades ON grades.class_id = c.id
  LEFT JOIN attendance ON attendance.class_id = c.id
  LEFT JOIN subjects ON subjects.class_id = c.id
  WHERE c.id = class_id
  GROUP BY c.id;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_classes_updated_at
    BEFORE UPDATE ON classes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### Étape 4: Configurer les RLS (Row Level Security)

```sql
-- Activer RLS sur la table classes
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Policy pour les admins de groupe (peuvent tout voir de leur groupe)
CREATE POLICY "Admin groupe can view all classes"
  ON classes FOR SELECT
  USING (
    school_id IN (
      SELECT id FROM schools 
      WHERE school_group_id = (
        SELECT school_group_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Policy pour créer des classes
CREATE POLICY "Admin groupe can create classes"
  ON classes FOR INSERT
  WITH CHECK (
    school_id IN (
      SELECT id FROM schools 
      WHERE school_group_id = (
        SELECT school_group_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Policy pour mettre à jour
CREATE POLICY "Admin groupe can update classes"
  ON classes FOR UPDATE
  USING (
    school_id IN (
      SELECT id FROM schools 
      WHERE school_group_id = (
        SELECT school_group_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Policy pour supprimer
CREATE POLICY "Admin groupe can delete classes"
  ON classes FOR DELETE
  USING (
    school_id IN (
      SELECT id FROM schools 
      WHERE school_group_id = (
        SELECT school_group_id FROM users WHERE id = auth.uid()
      )
    )
  );
```

---

## 📝 UTILISATION DANS LES COMPOSANTS

### Exemple 1: StaffManagementPage avec données réelles

```tsx
import { useStaff } from '@/features/user-space/hooks';
import { Skeleton } from '@/components/ui/skeleton';

export const StaffManagementPage = () => {
  const { 
    staff, 
    isLoading, 
    error, 
    stats,
    createStaff,
    updateStaff,
    deleteStaff,
    isCreating,
    isUpdating,
    isDeleting
  } = useStaff();

  // Gestion du chargement
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    );
  }

  // Gestion des erreurs
  if (error) {
    return (
      <div className="text-center p-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold">Erreur de chargement</h3>
        <p className="text-gray-600">{error.message}</p>
      </div>
    );
  }

  // Créer un nouveau membre
  const handleCreate = () => {
    createStaff({
      email: 'nouveau@ecole.cm',
      first_name: 'Jean',
      last_name: 'Dupont',
      role: 'enseignant',
      phone: '+237 6XX XX XX XX',
      status: 'active',
    });
  };

  // Mettre à jour un membre
  const handleUpdate = (id: string) => {
    updateStaff({
      id,
      status: 'inactive',
    });
  };

  // Supprimer un membre
  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) {
      deleteStaff(id);
    }
  };

  return (
    <div>
      {/* Statistiques */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="p-6">
          <div className="text-3xl font-bold">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Personnel</div>
        </Card>
        <Card className="p-6">
          <div className="text-3xl font-bold text-green-600">{stats.active}</div>
          <div className="text-sm text-gray-600">Actifs</div>
        </Card>
        {/* ... autres stats */}
      </div>

      {/* Liste du personnel */}
      <div className="grid grid-cols-3 gap-4">
        {staff.map((member) => (
          <Card key={member.id} className="p-6">
            <h3 className="font-bold">{member.first_name} {member.last_name}</h3>
            <p className="text-sm text-gray-600">{member.role}</p>
            <p className="text-sm text-gray-500">{member.email}</p>
            
            <div className="flex gap-2 mt-4">
              <Button 
                onClick={() => handleUpdate(member.id)}
                disabled={isUpdating}
              >
                Modifier
              </Button>
              <Button 
                onClick={() => handleDelete(member.id)}
                variant="destructive"
                disabled={isDeleting}
              >
                Supprimer
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Bouton créer */}
      <Button 
        onClick={handleCreate}
        disabled={isCreating}
        className="mt-6"
      >
        {isCreating ? 'Création...' : 'Ajouter un membre'}
      </Button>
    </div>
  );
};
```

### Exemple 2: ClassesManagementPage avec données réelles

```tsx
import { useClasses } from '@/features/user-space/hooks';

export const ClassesManagementPage = () => {
  const { 
    classes, 
    isLoading, 
    stats,
    createClass,
    updateClass,
    deleteClass 
  } = useClasses();

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      {/* Statistiques */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard title="Classes" value={stats.total} />
        <StatCard title="Élèves" value={stats.totalStudents} />
        <StatCard title="Présence" value={`${stats.averageAttendance}%`} />
        <StatCard title="Moyenne" value={stats.averageGrade} />
      </div>

      {/* Liste des classes */}
      <div className="grid grid-cols-3 gap-4">
        {classes.map((classData) => (
          <ClassCard 
            key={classData.id} 
            classData={classData}
            onUpdate={(updates) => updateClass({ id: classData.id, ...updates })}
            onDelete={() => deleteClass(classData.id)}
          />
        ))}
      </div>
    </div>
  );
};
```

### Exemple 3: SchoolCard avec données réelles

```tsx
import { useSchools } from '@/features/user-space/hooks';

export const EstablishmentPage = () => {
  const { schools, isLoading, stats } = useSchools();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div>
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KPI title="Écoles" value={stats?.totalSchools || 0} />
        <KPI title="Élèves" value={stats?.totalStudents || 0} />
        <KPI title="Personnel" value={stats?.totalStaff || 0} />
        <KPI title="Classes" value={stats?.totalClasses || 0} />
      </div>

      {/* Grille d'écoles */}
      <div className="grid grid-cols-3 gap-4">
        {schools.map((school) => (
          <SchoolCard key={school.id} school={school} />
        ))}
      </div>
    </div>
  );
};
```

---

## 🎨 MODERNISATION DES COMPOSANTS

### Composants à mettre à jour

1. **StaffManagementPage.tsx** - Remplacer les données mockées par `useStaff()`
2. **ClassesManagementPage.tsx** - Remplacer les données mockées par `useClasses()`
3. **SchoolCard.tsx** - Utiliser les vraies données de `School`
4. **EstablishmentPage.tsx** - Utiliser `useSchools()`

### Pattern de chargement moderne

```tsx
// État de chargement avec Skeleton
{isLoading && (
  <div className="grid grid-cols-3 gap-4">
    {[...Array(6)].map((_, i) => (
      <Skeleton key={i} className="h-64 rounded-xl" />
    ))}
  </div>
)}

// État d'erreur
{error && (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Erreur</AlertTitle>
    <AlertDescription>{error.message}</AlertDescription>
  </Alert>
)}

// État vide
{!isLoading && !error && data.length === 0 && (
  <EmptyState 
    icon={Users}
    title="Aucune donnée"
    description="Commencez par ajouter des éléments"
  />
)}

// Données
{!isLoading && !error && data.length > 0 && (
  <DataGrid data={data} />
)}
```

---

## 🔄 SYNCHRONISATION EN TEMPS RÉEL

### Activer les subscriptions Supabase

```tsx
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

export const useRealtimeSchools = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('schools-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'schools',
        },
        () => {
          // Invalider le cache pour recharger les données
          queryClient.invalidateQueries({ queryKey: ['schools'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};

// Utilisation dans un composant
export const EstablishmentPage = () => {
  const { schools, isLoading } = useSchools();
  useRealtimeSchools(); // Active la synchronisation en temps réel

  // ... reste du code
};
```

---

## 📊 OPTIMISATIONS AVANCÉES

### 1. Pagination

```tsx
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
  queryKey: ['staff'],
  queryFn: async ({ pageParam = 0 }) => {
    const from = pageParam * 10;
    const to = from + 9;
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .range(from, to);
    
    if (error) throw error;
    return data;
  },
  getNextPageParam: (lastPage, pages) => {
    return lastPage.length === 10 ? pages.length : undefined;
  },
});
```

### 2. Recherche avec Debounce

```tsx
import { useDeferredValue } from 'react';

const [searchQuery, setSearchQuery] = useState('');
const deferredSearch = useDeferredValue(searchQuery);

const { data: filteredStaff } = useQuery({
  queryKey: ['staff', 'search', deferredSearch],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('first_name', `%${deferredSearch}%`);
    
    if (error) throw error;
    return data;
  },
  enabled: deferredSearch.length > 2,
});
```

### 3. Optimistic Updates

```tsx
const updateStaffMutation = useMutation({
  mutationFn: async (updates) => {
    // Appel API
  },
  onMutate: async (newData) => {
    // Annuler les requêtes en cours
    await queryClient.cancelQueries({ queryKey: ['staff'] });

    // Sauvegarder les données actuelles
    const previousData = queryClient.getQueryData(['staff']);

    // Mettre à jour optimistiquement
    queryClient.setQueryData(['staff'], (old) => {
      return old.map(item => 
        item.id === newData.id ? { ...item, ...newData } : item
      );
    });

    return { previousData };
  },
  onError: (err, newData, context) => {
    // Restaurer en cas d'erreur
    queryClient.setQueryData(['staff'], context.previousData);
  },
  onSettled: () => {
    // Revalider après
    queryClient.invalidateQueries({ queryKey: ['staff'] });
  },
});
```

---

## ✅ CHECKLIST DE MIGRATION

- [ ] Installer `@tanstack/react-query`
- [ ] Configurer le `QueryClientProvider`
- [ ] Créer les tables manquantes dans Supabase
- [ ] Configurer les RLS policies
- [ ] Remplacer les données mockées dans `StaffManagementPage`
- [ ] Remplacer les données mockées dans `ClassesManagementPage`
- [ ] Remplacer les données mockées dans `SchoolReportsPage`
- [ ] Remplacer les données mockées dans `AdvancedStatsPage`
- [ ] Mettre à jour `SchoolCard` pour utiliser les vraies données
- [ ] Tester toutes les opérations CRUD
- [ ] Ajouter la gestion des erreurs partout
- [ ] Ajouter les états de chargement
- [ ] Tester les permissions RLS
- [ ] Activer les subscriptions temps réel (optionnel)
- [ ] Optimiser avec pagination si nécessaire

---

## 🎉 RÉSULTAT FINAL

Après avoir suivi ce guide, vous aurez :

✅ **Tous les composants connectés aux données réelles**
✅ **Gestion automatique du cache avec React Query**
✅ **Opérations CRUD complètes (Create, Read, Update, Delete)**
✅ **Gestion des erreurs et états de chargement**
✅ **Statistiques en temps réel**
✅ **Performance optimisée**
✅ **Code maintenable et scalable**

**Vos composants sont maintenant prêts pour la production ! 🚀**

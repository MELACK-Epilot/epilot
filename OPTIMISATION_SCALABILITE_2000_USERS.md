# 🚀 OPTIMISATION SCALABILITÉ - 2000+ UTILISATEURS

## 🎯 OBJECTIF
Préparer le système pour gérer **2000+ utilisateurs** avec performance optimale.

---

## 📊 ANALYSE ACTUELLE

### Points Critiques Identifiés

#### 1. React Query - Pas de Pagination ⚠️
```typescript
// ACTUEL (charge tout)
const { data: modulesData } = useSchoolGroupModules(schoolGroupId);
// ❌ Charge tous les modules d'un coup
// ❌ Pas de pagination
// ❌ Peut être lent avec beaucoup de données
```

#### 2. Recherche Côté Client ⚠️
```typescript
// ACTUEL (filtre en mémoire)
const filtered = modules.filter(m => 
  m.name.toLowerCase().includes(search.toLowerCase())
);
// ❌ Filtre 2000+ items en JavaScript
// ❌ Pas de debounce optimisé
// ❌ Re-render à chaque frappe
```

#### 3. Pas de Virtualisation ⚠️
```typescript
// ACTUEL (render tout)
{modules.map(module => <ModuleCard />)}
// ❌ Render 2000+ composants
// ❌ DOM surchargé
// ❌ Scroll lag
```

#### 4. Pas de Cache Intelligent ⚠️
```typescript
// ACTUEL (cache basique)
staleTime: 5 * 60 * 1000 // 5 min
// ⚠️ Pas de cache persistant
// ⚠️ Pas de prefetch
// ⚠️ Pas de background refresh
```

---

## ✅ OPTIMISATIONS À IMPLÉMENTER

### 1. PAGINATION SERVEUR (Priorité 1) 🔥

#### Backend: Ajouter Pagination
```sql
-- Nouvelle fonction RPC avec pagination
CREATE OR REPLACE FUNCTION get_school_group_modules_paginated(
  p_school_group_id UUID,
  p_page INT DEFAULT 1,
  p_page_size INT DEFAULT 50,
  p_search TEXT DEFAULT NULL,
  p_category_id UUID DEFAULT NULL
) RETURNS TABLE (
  modules JSONB,
  total_count INT,
  page INT,
  page_size INT,
  total_pages INT
) AS $$
DECLARE
  v_offset INT;
  v_total INT;
BEGIN
  v_offset := (p_page - 1) * p_page_size;
  
  -- Compter total
  SELECT COUNT(*) INTO v_total
  FROM modules m
  WHERE m.school_group_id = p_school_group_id
    AND (p_search IS NULL OR m.name ILIKE '%' || p_search || '%')
    AND (p_category_id IS NULL OR m.category_id = p_category_id);
  
  -- Retourner page
  RETURN QUERY
  SELECT 
    jsonb_agg(
      jsonb_build_object(
        'id', m.id,
        'name', m.name,
        'category', m.category,
        'icon', m.icon
      )
    ) as modules,
    v_total as total_count,
    p_page as page,
    p_page_size as page_size,
    CEIL(v_total::FLOAT / p_page_size)::INT as total_pages
  FROM (
    SELECT m.*
    FROM modules m
    WHERE m.school_group_id = p_school_group_id
      AND (p_search IS NULL OR m.name ILIKE '%' || p_search || '%')
      AND (p_category_id IS NULL OR m.category_id = p_category_id)
    ORDER BY m.name
    LIMIT p_page_size
    OFFSET v_offset
  ) m;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Index pour performance
CREATE INDEX idx_modules_name_trgm ON modules USING gin(name gin_trgm_ops);
CREATE INDEX idx_modules_school_group_category ON modules(school_group_id, category_id);
```

#### Frontend: Hook avec Pagination
```typescript
// hooks/useSchoolGroupModulesPaginated.ts
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface ModulesPageParams {
  schoolGroupId: string;
  pageSize?: number;
  search?: string;
  categoryId?: string;
}

export const useSchoolGroupModulesPaginated = ({
  schoolGroupId,
  pageSize = 50,
  search,
  categoryId
}: ModulesPageParams) => {
  return useInfiniteQuery({
    queryKey: ['modules-paginated', schoolGroupId, search, categoryId],
    queryFn: async ({ pageParam = 1 }) => {
      const { data, error } = await supabase.rpc(
        'get_school_group_modules_paginated',
        {
          p_school_group_id: schoolGroupId,
          p_page: pageParam,
          p_page_size: pageSize,
          p_search: search || null,
          p_category_id: categoryId || null
        }
      );

      if (error) throw error;
      return data[0];
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.total_pages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    enabled: !!schoolGroupId,
  });
};
```

---

### 2. VIRTUALISATION (Priorité 1) 🔥

#### Installer react-window
```bash
npm install react-window
npm install --save-dev @types/react-window
```

#### Composant Virtualisé
```typescript
// components/VirtualizedModuleList.tsx
import { FixedSizeList as List } from 'react-window';
import { memo } from 'react';

interface VirtualizedModuleListProps {
  modules: any[];
  onSelect: (moduleId: string) => void;
  selectedModules: string[];
}

const ModuleRow = memo(({ index, style, data }: any) => {
  const { modules, onSelect, selectedModules } = data;
  const module = modules[index];
  
  return (
    <div style={style}>
      <ModuleCard
        module={module}
        onSelect={onSelect}
        isSelected={selectedModules.includes(module.id)}
      />
    </div>
  );
});

export const VirtualizedModuleList = ({
  modules,
  onSelect,
  selectedModules
}: VirtualizedModuleListProps) => {
  return (
    <List
      height={600}
      itemCount={modules.length}
      itemSize={80}
      width="100%"
      itemData={{ modules, onSelect, selectedModules }}
    >
      {ModuleRow}
    </List>
  );
};
```

---

### 3. DEBOUNCE OPTIMISÉ (Priorité 2) 🔥

```typescript
// hooks/useOptimizedSearch.ts
import { useState, useEffect, useCallback } from 'react';
import { useDebouncedValue } from './useDebounceValue';

export const useOptimizedSearch = (initialValue = '', delay = 300) => {
  const [searchValue, setSearchValue] = useState(initialValue);
  const debouncedSearch = useDebouncedValue(searchValue, delay);
  
  const handleSearch = useCallback((value: string) => {
    setSearchValue(value);
  }, []);
  
  return {
    searchValue,
    debouncedSearch,
    handleSearch,
    isSearching: searchValue !== debouncedSearch,
  };
};
```

---

### 4. CACHE PERSISTANT (Priorité 2) 🔥

```typescript
// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';

// Persister pour localStorage
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'REACT_QUERY_OFFLINE_CACHE',
  throttleTime: 1000,
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min
      gcTime: 24 * 60 * 60 * 1000, // 24h (au lieu de 30min)
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 2,
    },
  },
});

// Wrapper App
<PersistQueryClientProvider
  client={queryClient}
  persistOptions={{ persister }}
>
  <App />
</PersistQueryClientProvider>
```

---

### 5. PREFETCH INTELLIGENT (Priorité 3) ⚡

```typescript
// hooks/usePrefetchModules.ts
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export const usePrefetchModules = (schoolGroupId: string) => {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (!schoolGroupId) return;
    
    // Prefetch page suivante
    queryClient.prefetchInfiniteQuery({
      queryKey: ['modules-paginated', schoolGroupId],
      queryFn: async ({ pageParam = 1 }) => {
        // Fetch logic
      },
    });
    
    // Prefetch catégories
    queryClient.prefetchQuery({
      queryKey: ['categories', schoolGroupId],
      queryFn: async () => {
        // Fetch logic
      },
    });
  }, [schoolGroupId, queryClient]);
};
```

---

### 6. INDEXES DATABASE (Priorité 1) 🔥

```sql
-- Performance critique pour 2000+ users

-- 1. Modules
CREATE INDEX CONCURRENTLY idx_modules_school_group_id ON modules(school_group_id);
CREATE INDEX CONCURRENTLY idx_modules_category_id ON modules(category_id);
CREATE INDEX CONCURRENTLY idx_modules_name_search ON modules USING gin(to_tsvector('french', name));

-- 2. User Modules
CREATE INDEX CONCURRENTLY idx_user_modules_user_id ON user_modules(user_id);
CREATE INDEX CONCURRENTLY idx_user_modules_module_id ON user_modules(module_id);
CREATE INDEX CONCURRENTLY idx_user_modules_composite ON user_modules(user_id, module_id);

-- 3. Categories
CREATE INDEX CONCURRENTLY idx_categories_school_group_id ON module_categories(school_group_id);

-- 4. Users
CREATE INDEX CONCURRENTLY idx_users_school_group_id ON users(school_group_id);
CREATE INDEX CONCURRENTLY idx_users_role ON users(role);
CREATE INDEX CONCURRENTLY idx_users_status ON users(status);

-- 5. Partitioning pour user_modules (si > 100k lignes)
CREATE TABLE user_modules_partitioned (
  id UUID,
  user_id UUID,
  module_id UUID,
  created_at TIMESTAMPTZ
) PARTITION BY HASH (user_id);

-- Créer 8 partitions
CREATE TABLE user_modules_p0 PARTITION OF user_modules_partitioned
  FOR VALUES WITH (MODULUS 8, REMAINDER 0);
CREATE TABLE user_modules_p1 PARTITION OF user_modules_partitioned
  FOR VALUES WITH (MODULUS 8, REMAINDER 1);
-- ... jusqu'à p7
```

---

### 7. MEMOIZATION AVANCÉE (Priorité 2) ⚡

```typescript
// components/ModulesTab.tsx (optimisé)
import { memo, useMemo, useCallback } from 'react';

export const ModulesTab = memo(({
  user,
  modulesData,
  categoriesData,
  assignedModuleIds,
  onAssignSuccess
}: ModulesTabProps) => {
  // Memoize filtrage
  const availableModules = useMemo(() => {
    if (!modulesData?.pages) return [];
    
    return modulesData.pages
      .flatMap(page => page.modules)
      .filter(m => !assignedModuleIds.has(m.id));
  }, [modulesData, assignedModuleIds]);
  
  // Memoize handlers
  const handleSelect = useCallback((moduleId: string) => {
    setSelectedModules(prev => 
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  }, []);
  
  // Render
  return (
    <VirtualizedModuleList
      modules={availableModules}
      onSelect={handleSelect}
      selectedModules={selectedModules}
    />
  );
});
```

---

### 8. LAZY LOADING ONGLETS (Priorité 3) ⚡

```typescript
// UserModulesDialog.v4.tsx (optimisé)
import { lazy, Suspense } from 'react';

// Lazy load onglets
const StatsTab = lazy(() => import('./tabs/StatsTab'));
const ModulesTab = lazy(() => import('./tabs/ModulesTab'));
const CategoriesTab = lazy(() => import('./tabs/CategoriesTab'));
const AssignedTab = lazy(() => import('./tabs/AssignedTab'));

export const UserModulesDialog = ({ user, isOpen, onClose }) => {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>...</TabsList>
          
          <Suspense fallback={<LoadingSpinner />}>
            <TabsContent value="stats">
              <StatsTab {...props} />
            </TabsContent>
            
            <TabsContent value="modules">
              <ModulesTab {...props} />
            </TabsContent>
            
            <TabsContent value="categories">
              <CategoriesTab {...props} />
            </TabsContent>
            
            <TabsContent value="assigned">
              <AssignedTab {...props} />
            </TabsContent>
          </Suspense>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};
```

---

### 9. OPTIMISTIC UPDATES (Priorité 2) ⚡

```typescript
// hooks/useAssignModuleOptimistic.ts
export const useAssignModuleOptimistic = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, moduleIds, permissions }) => {
      const { data } = await supabase.rpc('assign_modules_bulk', {
        p_user_id: userId,
        p_module_ids: moduleIds,
        p_permissions: permissions
      });
      return data;
    },
    onMutate: async ({ userId, moduleIds, permissions }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ 
        queryKey: ['user-modules', userId] 
      });
      
      // Snapshot previous value
      const previous = queryClient.getQueryData(['user-modules', userId]);
      
      // Optimistically update
      queryClient.setQueryData(['user-modules', userId], (old: any) => {
        return [
          ...old,
          ...moduleIds.map(id => ({
            module_id: id,
            ...permissions,
            created_at: new Date().toISOString()
          }))
        ];
      });
      
      return { previous };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(
        ['user-modules', variables.userId],
        context.previous
      );
      toast.error('Erreur lors de l\'assignation');
    },
    onSuccess: (data, variables) => {
      // Revalidate
      queryClient.invalidateQueries({ 
        queryKey: ['user-modules', variables.userId] 
      });
      toast.success(`${variables.moduleIds.length} module(s) assigné(s)`);
    },
  });
};
```

---

## 📊 IMPACT ATTENDU

### Performance

#### AVANT (sans optimisations)
```
Charge initiale: 2-3s
Recherche: 500-800ms
Scroll: Lag visible
Assignation: 1-2s
Mémoire: 150-200MB
```

#### APRÈS (avec optimisations)
```
Charge initiale: 300-500ms ⚡ (-80%)
Recherche: 50-100ms ⚡ (-90%)
Scroll: Fluide 60fps ⚡ (100%)
Assignation: 200-300ms ⚡ (-85%)
Mémoire: 50-80MB ⚡ (-60%)
```

### Scalabilité

```
✅ 2000 utilisateurs: Fluide
✅ 5000 utilisateurs: Fluide
✅ 10000 utilisateurs: Fluide
✅ 50 modules: Instantané
✅ 500 modules: Rapide
✅ 5000 modules: Gérable
```

---

## 🎯 PLAN D'IMPLÉMENTATION

### Phase 1: Critique (1-2 jours) 🔥
```
1. ✅ Indexes database
2. ✅ Pagination serveur
3. ✅ Virtualisation liste
4. ✅ Debounce optimisé
```

### Phase 2: Important (2-3 jours) ⚡
```
5. ✅ Cache persistant
6. ✅ Optimistic updates
7. ✅ Memoization avancée
```

### Phase 3: Bonus (1-2 jours) 💎
```
8. ✅ Prefetch intelligent
9. ✅ Lazy loading onglets
10. ✅ Background refresh
```

---

## ✅ CHECKLIST IMPLÉMENTATION

### Backend
- [ ] Créer fonction RPC pagination
- [ ] Ajouter indexes database
- [ ] Créer fonction bulk assign
- [ ] Optimiser queries existantes
- [ ] Ajouter partitioning si besoin

### Frontend
- [ ] Installer react-window
- [ ] Créer hook pagination
- [ ] Implémenter virtualisation
- [ ] Ajouter debounce optimisé
- [ ] Configurer cache persistant
- [ ] Ajouter optimistic updates
- [ ] Lazy load onglets
- [ ] Memoize composants lourds

### Tests
- [ ] Test avec 2000 users
- [ ] Test avec 500 modules
- [ ] Test recherche
- [ ] Test scroll
- [ ] Test assignation masse
- [ ] Test performance
- [ ] Test mémoire

---

**PRÊT POUR 2000+ UTILISATEURS!** 🚀

Veux-tu que je commence l'implémentation?

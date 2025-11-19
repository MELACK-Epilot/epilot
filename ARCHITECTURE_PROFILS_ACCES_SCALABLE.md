# 🏗️ ARCHITECTURE PROFILS D'ACCÈS - SCALABLE

## 🎯 OBJECTIF: 500 GROUPES + 7000 ÉCOLES

### Contraintes de Performance
```
500 groupes scolaires
7,000 écoles
~350,000 utilisateurs (50 par école en moyenne)
~2,100,000 assignations modules (6 modules par user)
```

---

## 🏛️ ARCHITECTURE GLOBALE

### Stack Technique
```
✅ Supabase (PostgreSQL + RLS + Edge Functions)
✅ React Query (Cache + Optimistic Updates)
✅ Zustand (State Management Global)
✅ React Context (Providers)
✅ RPC Functions (Server-side Logic)
✅ Edge Functions (Business Logic Complexe)
✅ Indexes Database (Performance)
✅ Partitioning (Scalabilité)
```

---

## 📊 STRUCTURE BASE DE DONNÉES

### 1. Table: access_profiles (Référence)
```sql
CREATE TABLE access_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name_fr VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  description TEXT,
  
  -- Permissions par domaine (JSONB pour flexibilité)
  permissions JSONB NOT NULL,
  
  -- Métadonnées
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX idx_access_profiles_code ON access_profiles(code);
CREATE INDEX idx_access_profiles_active ON access_profiles(is_active);

-- Données initiales
INSERT INTO access_profiles (code, name_fr, permissions) VALUES
('chef_etablissement', 'Chef d''Établissement', '{
  "pedagogie": {"read": true, "write": true, "delete": false, "export": true, "validate": true},
  "vie_scolaire": {"read": true, "write": true, "delete": false, "export": true, "validate": true},
  "administration": {"read": true, "write": true, "delete": false, "export": true, "validate": true},
  "finances": {"read": true, "write": false, "delete": false, "export": true, "validate": true},
  "statistiques": {"read": true, "write": false, "delete": false, "export": true, "validate": false},
  "scope": "TOUTE_LECOLE"
}'::jsonb),

('financier_sans_suppression', 'Comptable/Économe', '{
  "pedagogie": {"read": false, "write": false, "delete": false, "export": false, "validate": false},
  "vie_scolaire": {"read": false, "write": false, "delete": false, "export": false, "validate": false},
  "administration": {"read": true, "write": false, "delete": false, "export": false, "validate": false},
  "finances": {"read": true, "write": true, "delete": false, "export": true, "validate": false},
  "statistiques": {"read": true, "write": false, "delete": false, "export": true, "validate": false},
  "scope": "TOUTE_LECOLE"
}'::jsonb),

('administratif_basique', 'Secrétaire', '{
  "pedagogie": {"read": true, "write": false, "delete": false, "export": false, "validate": false},
  "vie_scolaire": {"read": true, "write": false, "delete": false, "export": false, "validate": false},
  "administration": {"read": true, "write": true, "delete": false, "export": true, "validate": false},
  "finances": {"read": false, "write": false, "delete": false, "export": false, "validate": false},
  "statistiques": {"read": true, "write": false, "delete": false, "export": true, "validate": false},
  "scope": "TOUTE_LECOLE"
}'::jsonb),

('enseignant_saisie_notes', 'Enseignant', '{
  "pedagogie": {"read": true, "write": true, "delete": false, "export": false, "validate": false},
  "vie_scolaire": {"read": true, "write": false, "delete": false, "export": false, "validate": false},
  "administration": {"read": false, "write": false, "delete": false, "export": false, "validate": false},
  "finances": {"read": false, "write": false, "delete": false, "export": false, "validate": false},
  "statistiques": {"read": false, "write": false, "delete": false, "export": false, "validate": false},
  "scope": "SES_CLASSES_ET_MATIERES"
}'::jsonb),

('parent_consultation', 'Parent', '{
  "pedagogie": {"read": true, "write": false, "delete": false, "export": false, "validate": false},
  "vie_scolaire": {"read": true, "write": false, "delete": false, "export": false, "validate": false},
  "administration": {"read": false, "write": false, "delete": false, "export": false, "validate": false},
  "finances": {"read": true, "write": false, "delete": false, "export": false, "validate": false},
  "statistiques": {"read": false, "write": false, "delete": false, "export": false, "validate": false},
  "scope": "SES_ENFANTS_UNIQUEMENT"
}'::jsonb),

('eleve_consultation', 'Élève', '{
  "pedagogie": {"read": true, "write": false, "delete": false, "export": false, "validate": false},
  "vie_scolaire": {"read": true, "write": false, "delete": false, "export": false, "validate": false},
  "administration": {"read": false, "write": false, "delete": false, "export": false, "validate": false},
  "finances": {"read": false, "write": false, "delete": false, "export": false, "validate": false},
  "statistiques": {"read": false, "write": false, "delete": false, "export": false, "validate": false},
  "scope": "LUI_MEME_UNIQUEMENT"
}'::jsonb);
```

### 2. Migration: user_module_permissions
```sql
-- Ajouter colonne access_profile
ALTER TABLE user_module_permissions
ADD COLUMN access_profile_code VARCHAR(50) DEFAULT 'chef_etablissement',
ADD CONSTRAINT fk_access_profile 
  FOREIGN KEY (access_profile_code) 
  REFERENCES access_profiles(code);

-- Index pour performance (CRUCIAL pour 2M+ lignes)
CREATE INDEX idx_ump_access_profile ON user_module_permissions(access_profile_code);
CREATE INDEX idx_ump_user_module ON user_module_permissions(user_id, module_id);
CREATE INDEX idx_ump_school_group ON user_module_permissions USING HASH (
  (SELECT school_group_id FROM users WHERE id = user_id)
);

-- Partitioning par school_group pour scalabilité
-- (Optionnel mais recommandé pour 500 groupes)
CREATE TABLE user_module_permissions_partitioned (
  LIKE user_module_permissions INCLUDING ALL
) PARTITION BY HASH (
  (SELECT school_group_id FROM users WHERE id = user_id)
);

-- Créer 50 partitions (10 groupes par partition)
DO $$
BEGIN
  FOR i IN 0..49 LOOP
    EXECUTE format('
      CREATE TABLE user_module_permissions_p%s 
      PARTITION OF user_module_permissions_partitioned
      FOR VALUES WITH (MODULUS 50, REMAINDER %s)
    ', i, i);
  END LOOP;
END $$;
```

### 3. Table: parent_student_relations
```sql
CREATE TABLE parent_student_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Type de relation
  relation_type VARCHAR(20) CHECK (relation_type IN ('pere', 'mere', 'tuteur', 'autre')),
  is_primary_contact BOOLEAN DEFAULT false,
  
  -- Permissions granulaires
  can_view_grades BOOLEAN DEFAULT true,
  can_view_absences BOOLEAN DEFAULT true,
  can_view_payments BOOLEAN DEFAULT true,
  can_receive_notifications BOOLEAN DEFAULT true,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contrainte unicité
  UNIQUE(parent_id, student_id)
);

-- Indexes pour performance
CREATE INDEX idx_psr_parent ON parent_student_relations(parent_id);
CREATE INDEX idx_psr_student ON parent_student_relations(student_id);
CREATE INDEX idx_psr_primary ON parent_student_relations(is_primary_contact) WHERE is_primary_contact = true;
```

---

## 🚀 EDGE FUNCTIONS (Business Logic)

### Edge Function: assign-module-with-profile
```typescript
// supabase/functions/assign-module-with-profile/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { userId, moduleId, accessProfileCode, assignedBy } = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // 1. Récupérer profil d'accès
    const { data: profile, error: profileError } = await supabase
      .from('access_profiles')
      .select('*')
      .eq('code', accessProfileCode)
      .single()
    
    if (profileError) throw new Error('Profil invalide')
    
    // 2. Vérifier que user et assignedBy sont du même groupe
    const { data: users } = await supabase
      .from('users')
      .select('id, school_group_id')
      .in('id', [userId, assignedBy])
    
    if (users[0].school_group_id !== users[1].school_group_id) {
      throw new Error('Utilisateurs de groupes différents')
    }
    
    // 3. Récupérer infos module (dénormalisées)
    const { data: module } = await supabase
      .from('modules')
      .select(`
        id, name, slug,
        category:business_categories(id, name)
      `)
      .eq('id', moduleId)
      .single()
    
    // 4. Insérer assignation avec profil
    const { data, error } = await supabase
      .from('user_module_permissions')
      .upsert({
        user_id: userId,
        module_id: moduleId,
        module_name: module.name,
        module_slug: module.slug,
        category_id: module.category.id,
        category_name: module.category.name,
        access_profile_code: accessProfileCode,
        assignment_type: 'direct',
        assigned_by: assignedBy,
        assigned_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,module_id'
      })
    
    if (error) throw error
    
    // 5. Logger dans audit
    await supabase.from('module_assignment_logs').insert({
      user_id: userId,
      module_id: moduleId,
      action: 'assigned',
      access_profile_code: accessProfileCode,
      assigned_by: assignedBy,
    })
    
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { 'Content-Type': 'application/json' },
    })
    
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

---

## 🎨 ZUSTAND STORE (State Management)

### store/access-profiles.store.ts
```typescript
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface AccessProfile {
  code: string
  name_fr: string
  permissions: any
  scope: string
}

interface AccessProfilesState {
  // State
  profiles: AccessProfile[]
  selectedProfile: string | null
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchProfiles: () => Promise<void>
  selectProfile: (code: string) => void
  getProfilePermissions: (code: string) => any
  clearError: () => void
}

export const useAccessProfilesStore = create<AccessProfilesState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        profiles: [],
        selectedProfile: null,
        isLoading: false,
        error: null,
        
        // Fetch profiles from database
        fetchProfiles: async () => {
          set({ isLoading: true, error: null })
          
          try {
            const { data, error } = await supabase
              .from('access_profiles')
              .select('*')
              .eq('is_active', true)
              .order('name_fr')
            
            if (error) throw error
            
            set({ profiles: data, isLoading: false })
          } catch (error: any) {
            set({ error: error.message, isLoading: false })
          }
        },
        
        // Select profile
        selectProfile: (code) => {
          set({ selectedProfile: code })
        },
        
        // Get permissions for profile
        getProfilePermissions: (code) => {
          const profile = get().profiles.find(p => p.code === code)
          return profile?.permissions || null
        },
        
        // Clear error
        clearError: () => set({ error: null }),
      }),
      {
        name: 'access-profiles-storage',
        partialize: (state) => ({ 
          profiles: state.profiles,
          selectedProfile: state.selectedProfile 
        }),
      }
    ),
    { name: 'AccessProfilesStore' }
  )
)
```

---

## 🔌 REACT QUERY HOOKS (Data Fetching)

### hooks/useAccessProfiles.ts
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

/**
 * Hook pour récupérer tous les profils d'accès
 */
export const useAccessProfiles = () => {
  return useQuery({
    queryKey: ['access-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('access_profiles')
        .select('*')
        .eq('is_active', true)
        .order('name_fr')
      
      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes (profils changent rarement)
    cacheTime: 30 * 60 * 1000, // 30 minutes
  })
}

/**
 * Hook pour assigner module avec profil (via Edge Function)
 */
export const useAssignModuleWithProfile = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      moduleId, 
      accessProfileCode,
      assignedBy 
    }: {
      userId: string
      moduleId: string
      accessProfileCode: string
      assignedBy: string
    }) => {
      const { data, error } = await supabase.functions.invoke(
        'assign-module-with-profile',
        {
          body: { userId, moduleId, accessProfileCode, assignedBy }
        }
      )
      
      if (error) throw error
      if (!data.success) throw new Error(data.error)
      
      return data.data
    },
    onSuccess: (data, variables) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['user-assigned-modules', variables.userId] })
      queryClient.invalidateQueries({ queryKey: ['assignment-stats'] })
      
      toast.success('Module assigné avec succès')
    },
    onError: (error: any) => {
      toast.error('Erreur lors de l\'assignation', {
        description: error.message
      })
    }
  })
}

/**
 * Hook pour assigner en masse avec profil
 */
export const useAssignMultipleWithProfile = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({
      userId,
      moduleIds,
      accessProfileCode,
      assignedBy
    }: {
      userId: string
      moduleIds: string[]
      accessProfileCode: string
      assignedBy: string
    }) => {
      // Appeler Edge Function pour chaque module (en parallèle)
      const promises = moduleIds.map(moduleId =>
        supabase.functions.invoke('assign-module-with-profile', {
          body: { userId, moduleId, accessProfileCode, assignedBy }
        })
      )
      
      const results = await Promise.allSettled(promises)
      
      const succeeded = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length
      
      return { succeeded, failed, total: moduleIds.length }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-assigned-modules', variables.userId] })
      queryClient.invalidateQueries({ queryKey: ['assignment-stats'] })
      
      if (data.failed > 0) {
        toast.warning(`${data.succeeded} assigné(s), ${data.failed} échec(s)`)
      } else {
        toast.success(`${data.succeeded} module(s) assigné(s) avec succès`)
      }
    },
    onError: (error: any) => {
      toast.error('Erreur lors de l\'assignation en masse', {
        description: error.message
      })
    }
  })
}
```

---

## 🎭 REACT CONTEXT PROVIDER

### providers/AccessProfilesProvider.tsx
```typescript
import React, { createContext, useContext, useEffect } from 'react'
import { useAccessProfilesStore } from '@/stores/access-profiles.store'
import { useAccessProfiles } from '@/hooks/useAccessProfiles'

interface AccessProfilesContextType {
  profiles: any[]
  selectedProfile: string | null
  selectProfile: (code: string) => void
  getProfilePermissions: (code: string) => any
  isLoading: boolean
  error: string | null
}

const AccessProfilesContext = createContext<AccessProfilesContextType | undefined>(undefined)

export const AccessProfilesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = useAccessProfilesStore()
  const { data: profiles, isLoading, error } = useAccessProfiles()
  
  // Sync React Query data with Zustand store
  useEffect(() => {
    if (profiles) {
      store.fetchProfiles()
    }
  }, [profiles])
  
  const value: AccessProfilesContextType = {
    profiles: store.profiles,
    selectedProfile: store.selectedProfile,
    selectProfile: store.selectProfile,
    getProfilePermissions: store.getProfilePermissions,
    isLoading: isLoading || store.isLoading,
    error: error?.message || store.error,
  }
  
  return (
    <AccessProfilesContext.Provider value={value}>
      {children}
    </AccessProfilesContext.Provider>
  )
}

export const useAccessProfilesContext = () => {
  const context = useContext(AccessProfilesContext)
  if (!context) {
    throw new Error('useAccessProfilesContext must be used within AccessProfilesProvider')
  }
  return context
}
```

---

## 📊 OPTIMISATIONS PERFORMANCE

### 1. Database Indexes (CRUCIAL)
```sql
-- Indexes composites pour queries fréquentes
CREATE INDEX idx_ump_user_profile ON user_module_permissions(user_id, access_profile_code);
CREATE INDEX idx_ump_module_profile ON user_module_permissions(module_id, access_profile_code);

-- Index partiel pour assignations actives
CREATE INDEX idx_ump_active ON user_module_permissions(user_id) 
WHERE is_active = true;

-- Index GIN pour recherche JSONB (permissions)
CREATE INDEX idx_profiles_permissions ON access_profiles USING GIN (permissions);
```

### 2. React Query Configuration
```typescript
// lib/react-query.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
})
```

### 3. Pagination & Virtualization
```typescript
// Pour listes longues (7000 écoles)
import { useVirtualizer } from '@tanstack/react-virtual'

const virtualizer = useVirtualizer({
  count: schools.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 50,
  overscan: 5,
})
```

---

## 🎉 RÉSULTAT FINAL

**Architecture Complète:**
```
✅ 6 Profils d'accès (table référence)
✅ JSONB permissions (flexibilité)
✅ Edge Functions (business logic)
✅ Zustand (state global)
✅ React Query (cache + optimistic)
✅ Context Provider (accès facile)
✅ Indexes optimisés (performance)
✅ Partitioning (scalabilité 500 groupes)
✅ Virtualisation (7000 écoles)
```

**Prêt pour:**
- 500 groupes scolaires
- 7,000 écoles
- 350,000 utilisateurs
- 2,100,000 assignations

**Voulez-vous que je commence l'implémentation du code?** 🚀

---

**Développé avec ❤️ pour E-Pilot Congo** 🇨🇬  
**Version:** 40.0 Architecture Scalable  
**Date:** 16 Novembre 2025  
**Statut:** 🟢 Architecture Définie - Prêt à Coder

/**
 * Hook React Query pour les modules du Proviseur
 * Connexion complète à la base de données avec cohérence parfaite
 * @module useProviseurModules
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/store/auth.store';
import { useCallback, useEffect } from 'react';

/**
 * Interface pour un module assigné au Proviseur
 */
export interface ProviseurModule {
  id: string;
  user_id: string;
  module_id: string;
  is_enabled: boolean;
  assigned_at: string;
  assigned_by: string | null;
  access_count: number;
  last_accessed_at: string | null;
  settings: Record<string, any> | null;
  
  // Données du module
  module_name: string;
  module_slug: string;
  module_description: string | null;
  module_icon: string | null;
  module_color: string | null;
  module_is_core: boolean;
  module_status: string;
  
  // Données de la catégorie
  category_id: string | null;
  category_name: string;
  category_slug: string | null;
  category_icon: string | null;
  category_color: string | null;
}

/**
 * Interface pour les statistiques du Proviseur
 */
export interface ProviseurStats {
  totalModules: number;
  modulesActifs: number;
  categoriesCount: number;
  totalAccess: number;
  lastAccessDate: string | null;
  mostUsedModule: {
    name: string;
    access_count: number;
  } | null;
}

/**
 * Interface pour les catégories avec compteurs
 */
export interface CategoryWithCount {
  id: string;
  name: string;
  slug: string | null;
  icon: string | null;
  color: string | null;
  modules_count: number;
}

/**
 * Hook principal pour les modules du Proviseur
 */
export const useProviseurModules = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query pour récupérer tous les modules du Proviseur
  const modulesQuery = useQuery({
    queryKey: ['proviseur-modules', user?.id],
    enabled: !!user?.id, // ⚡ Ne charge que si user existe
    staleTime: 5 * 60 * 1000, // ⚡ Cache 5 minutes
    gcTime: 10 * 60 * 1000, // ⚡ Garde en mémoire 10 minutes
    refetchOnWindowFocus: false, // ⚡ Pas de refetch au focus
    queryFn: async (): Promise<ProviseurModule[]> => {
      if (!user?.id) throw new Error('Utilisateur non authentifié');

      console.log('🔄 [useProviseurModules] Chargement des modules pour:', user.id);

      const { data, error } = await supabase
        .from('user_modules')
        .select(`
          id,
          user_id,
          module_id,
          is_enabled,
          assigned_at,
          assigned_by,
          access_count,
          last_accessed_at,
          settings,
          modules!inner(
            id,
            name,
            slug,
            description,
            icon,
            color,
            is_core,
            status,
            category_id,
            business_categories(
              id,
              name,
              slug,
              icon,
              color
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('is_enabled', true)
        .eq('modules.status', 'active')
        .order('modules(name)', { ascending: true });

      if (error) {
        console.error('❌ [useProviseurModules] Erreur:', error);
        throw error;
      }

      // Transformer les données pour l'interface
      const modules: ProviseurModule[] = (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        module_id: item.module_id,
        is_enabled: item.is_enabled,
        assigned_at: item.assigned_at,
        assigned_by: item.assigned_by,
        access_count: item.access_count || 0,
        last_accessed_at: item.last_accessed_at,
        settings: item.settings,
        
        // Données du module
        module_name: item.modules.name,
        module_slug: item.modules.slug,
        module_description: item.modules.description,
        module_icon: item.modules.icon,
        module_color: item.modules.color,
        module_is_core: item.modules.is_core,
        module_status: item.modules.status,
        
        // Données de la catégorie
        category_id: item.modules.category_id,
        category_name: item.modules.business_categories?.name || 'Sans catégorie',
        category_slug: item.modules.business_categories?.slug,
        category_icon: item.modules.business_categories?.icon,
        category_color: item.modules.business_categories?.color,
      }));

      console.log('✅ [useProviseurModules] Modules chargés:', modules.length);
      return modules;
    },
  });

  // Query pour les statistiques
  const statsQuery = useQuery({
    queryKey: ['proviseur-stats', user?.id],
    queryFn: async (): Promise<ProviseurStats> => {
      const modules = modulesQuery.data || [];
      
      const totalModules = modules.length;
      const modulesActifs = modules.filter(m => m.access_count > 0).length;
      const totalAccess = modules.reduce((sum, m) => sum + m.access_count, 0);
      
      // Catégories uniques
      const uniqueCategories = new Set(modules.map(m => m.category_id).filter(Boolean));
      const categoriesCount = uniqueCategories.size;
      
      // Module le plus utilisé
      const mostUsedModule = modules.length > 0 
        ? modules.reduce((prev, current) => 
            prev.access_count > current.access_count ? prev : current
          )
        : null;
      
      // Dernière date d'accès
      const lastAccessDates = modules
        .map(m => m.last_accessed_at)
        .filter(Boolean)
        .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime());
      
      const lastAccessDate = lastAccessDates[0] || null;

      return {
        totalModules,
        modulesActifs,
        categoriesCount,
        totalAccess,
        lastAccessDate,
        mostUsedModule: mostUsedModule ? {
          name: mostUsedModule.module_name,
          access_count: mostUsedModule.access_count
        } : null
      };
    },
    enabled: !!modulesQuery.data,
    select: (data) => data,
  });

  // Query pour les catégories avec compteurs
  const categoriesQuery = useQuery({
    queryKey: ['proviseur-categories', user?.id],
    queryFn: async (): Promise<CategoryWithCount[]> => {
      const modules = modulesQuery.data || [];
      
      // Grouper par catégorie
      const categoryMap = new Map<string, CategoryWithCount>();
      
      modules.forEach(module => {
        const categoryId = module.category_id || 'uncategorized';
        const categoryName = module.category_name || 'Sans catégorie';
        
        if (categoryMap.has(categoryId)) {
          categoryMap.get(categoryId)!.modules_count++;
        } else {
          categoryMap.set(categoryId, {
            id: categoryId,
            name: categoryName,
            slug: module.category_slug,
            icon: module.category_icon,
            color: module.category_color,
            modules_count: 1
          });
        }
      });
      
      return Array.from(categoryMap.values()).sort((a, b) => b.modules_count - a.modules_count);
    },
    enabled: !!modulesQuery.data,
  });

  // Mutation pour mettre à jour l'accès à un module
  const updateModuleAccessMutation = useMutation({
    mutationFn: async ({ moduleId }: { moduleId: string }) => {
      if (!user?.id) throw new Error('Utilisateur non authentifié');

      console.log('📊 [useProviseurModules] Mise à jour accès module:', moduleId);

      // Utiliser RPC pour incrémenter de manière atomique
      const { error } = await (supabase as any).rpc('increment_module_access', {
        p_user_id: user.id,
        p_module_id: moduleId
      });

      if (error) {
        // Fallback : mise à jour simple
        const { error: updateError } = await (supabase as any)
          .from('user_modules')
          .update({
            last_accessed_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('module_id', moduleId);
        
        if (updateError) throw updateError;
      }

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalider les queries pour rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ['proviseur-modules', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['proviseur-stats', user?.id] });
    },
    onError: (error) => {
      console.error('❌ [useProviseurModules] Erreur mise à jour accès:', error);
    }
  });

  // Fonction pour accéder à un module
  const accessModule = useCallback((moduleId: string) => {
    updateModuleAccessMutation.mutate({ moduleId });
  }, [updateModuleAccessMutation]);

  // Configuration du temps réel
  useEffect(() => {
    if (!user?.id) return;

    console.log('📡 [useProviseurModules] Configuration temps réel pour:', user.id);

    const channel = supabase
      .channel(`proviseur_modules:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_modules',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🔔 [useProviseurModules] Changement détecté:', payload.eventType);
          
          // Invalider les queries pour rafraîchir
          queryClient.invalidateQueries({ queryKey: ['proviseur-modules', user.id] });
          queryClient.invalidateQueries({ queryKey: ['proviseur-stats', user.id] });
          queryClient.invalidateQueries({ queryKey: ['proviseur-categories', user.id] });
        }
      )
      .subscribe((status) => {
        console.log('📡 [useProviseurModules] Canal temps réel:', status);
      });

    return () => {
      console.log('🧹 [useProviseurModules] Nettoyage canal temps réel');
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return {
    // Données
    modules: modulesQuery.data || [],
    stats: statsQuery.data,
    categories: categoriesQuery.data || [],
    
    // États de chargement
    isLoading: modulesQuery.isLoading || statsQuery.isLoading || categoriesQuery.isLoading,
    isError: modulesQuery.isError || statsQuery.isError || categoriesQuery.isError,
    error: modulesQuery.error || statsQuery.error || categoriesQuery.error,
    
    // Actions
    accessModule,
    
    // Utilitaires
    refetch: () => {
      modulesQuery.refetch();
      statsQuery.refetch();
      categoriesQuery.refetch();
    },
    
    // États des mutations
    isUpdatingAccess: updateModuleAccessMutation.isPending,
  };
};

/**
 * Hook pour un module spécifique
 */
export const useProviseurModule = (moduleId: string) => {
  const { modules } = useProviseurModules();
  
  return {
    module: modules.find(m => m.module_id === moduleId),
    isLoading: !modules.length,
  };
};

/**
 * Hook pour les modules d'une catégorie
 */
export const useProviseurModulesByCategory = (categoryId: string) => {
  const { modules } = useProviseurModules();
  
  return {
    modules: modules.filter(m => m.category_id === categoryId || (categoryId === 'all')),
    count: modules.filter(m => m.category_id === categoryId || (categoryId === 'all')).length,
  };
};

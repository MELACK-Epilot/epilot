/**
 * Hooks réactifs pour modules et catégories
 * Intégration complète avec le système d'abonnement temps réel
 * Conforme React 19 + TanStack Query v5
 */

import { useMemo, useTransition, useOptimistic } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSubscriptionStore, subscriptionSelectors } from '@/stores/subscription.store';
import { supabase } from '@/lib/supabase';
import type { ModuleAccess } from '@/stores/subscription.store';

/**
 * Types pour les hooks réactifs
 */
export interface ReactiveModule {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  category_id: string;
  category_name: string;
  is_enabled: boolean;
  is_accessible: boolean; // Basé sur l'abonnement
  plan_required: string;
  status: 'active' | 'inactive';
}

export interface ReactiveCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  modules_count: number;
  accessible_modules_count: number;
  is_accessible: boolean;
  modules: ReactiveModule[];
}

/**
 * Hook principal pour les modules réactifs
 * Se synchronise automatiquement avec les changements d'abonnement
 */
export const useReactiveModules = (schoolGroupId?: string) => {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  
  // État du store d'abonnement
  const currentPlan = useSubscriptionStore(subscriptionSelectors.currentPlan);
  const moduleAccess = useSubscriptionStore(subscriptionSelectors.moduleAccess);
  const isStoreLoading = useSubscriptionStore(subscriptionSelectors.isLoading);
  const hasModuleAccess = useSubscriptionStore((state) => state.hasModuleAccess);

  /**
   * Query pour récupérer tous les modules avec cache intelligent
   */
  const modulesQuery = useQuery({
    queryKey: ['reactive-modules', schoolGroupId, currentPlan?.id],
    queryFn: async () => {
      if (!schoolGroupId) throw new Error('School group ID required');

      console.log('🔄 Chargement modules réactifs pour:', schoolGroupId);

      // Récupérer les modules assignés au groupe via group_module_configs
      const { data: groupModules, error } = await supabase
        .from('group_module_configs')
        .select(`
          module_id,
          is_enabled,
          modules!inner(
            id,
            name,
            slug,
            description,
            icon,
            color,
            status,
            category_id,
            business_categories!inner(
              id,
              name,
              slug,
              color
            )
          )
        `)
        .eq('school_group_id', schoolGroupId)
        .eq('modules.status', 'active');

      if (error) throw error;

      // Transformer en modules réactifs
      const reactiveModules: ReactiveModule[] = (groupModules || []).map((gm: any) => {
        const module = gm.modules;
        const category = module.business_categories;
        
        return {
          id: module.id,
          name: module.name,
          slug: module.slug,
          description: module.description,
          icon: module.icon || '📦',
          color: module.color || '#2A9D8F',
          category_id: category.id,
          category_name: category.name,
          is_enabled: gm.is_enabled,
          is_accessible: hasModuleAccess(module.id),
          plan_required: currentPlan?.slug || 'gratuit',
          status: module.status,
        };
      });

      console.log('✅ Modules réactifs chargés:', reactiveModules.length);
      return reactiveModules;
    },
    enabled: !!schoolGroupId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes (anciennement cacheTime)
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  /**
   * État optimiste pour les changements de plan
   */
  const [optimisticModules, setOptimisticModules] = useOptimistic(
    modulesQuery.data || [],
    (currentModules, newPlanSlug: string) => {
      // Simuler l'effet du changement de plan
      return currentModules.map(module => ({
        ...module,
        is_accessible: shouldModuleBeAccessible(module, newPlanSlug),
        plan_required: newPlanSlug,
      }));
    }
  );

  /**
   * Fonction pour changer de plan avec optimistic updates
   */
  const changePlan = async (newPlanId: string, newPlanSlug: string) => {
    startTransition(() => {
      // Mise à jour optimiste immédiate
      setOptimisticModules(newPlanSlug);
    });

    try {
      // Mise à jour réelle via le store
      await useSubscriptionStore.getState().updateSubscriptionPlan(newPlanId, queryClient);
    } catch (error) {
      console.error('❌ Erreur changement de plan:', error);
      // L'état optimiste sera automatiquement revert par React
      throw error;
    }
  };

  /**
   * Modules filtrés et triés
   */
  const processedModules = useMemo(() => {
    const modules = optimisticModules;
    
    return {
      all: modules,
      accessible: modules.filter(m => m.is_accessible),
      enabled: modules.filter(m => m.is_enabled),
      byCategory: groupModulesByCategory(modules),
    };
  }, [optimisticModules]);

  return {
    // Données
    modules: processedModules,
    rawModules: modulesQuery.data || [],
    
    // États
    isLoading: modulesQuery.isLoading || isStoreLoading,
    isPending,
    error: modulesQuery.error,
    
    // Actions
    changePlan,
    refetch: modulesQuery.refetch,
    
    // Métadonnées
    lastUpdated: modulesQuery.dataUpdatedAt,
    isFetching: modulesQuery.isFetching,
  };
};

/**
 * Hook pour les catégories réactives
 */
export const useReactiveCategories = (schoolGroupId?: string) => {
  const { modules } = useReactiveModules(schoolGroupId);
  
  const categories = useMemo(() => {
    const categoryMap = new Map<string, ReactiveCategory>();
    
    modules.all.forEach(module => {
      const categoryId = module.category_id;
      
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          id: categoryId,
          name: module.category_name,
          slug: module.category_name.toLowerCase().replace(/\s+/g, '-'),
          description: `Catégorie ${module.category_name}`,
          icon: '📂',
          color: module.color,
          modules_count: 0,
          accessible_modules_count: 0,
          is_accessible: false,
          modules: [],
        });
      }
      
      const category = categoryMap.get(categoryId)!;
      category.modules.push(module);
      category.modules_count++;
      
      if (module.is_accessible) {
        category.accessible_modules_count++;
      }
      
      category.is_accessible = category.accessible_modules_count > 0;
    });
    
    return Array.from(categoryMap.values());
  }, [modules.all]);

  return {
    categories,
    accessibleCategories: categories.filter(c => c.is_accessible),
    totalCategories: categories.length,
  };
};

/**
 * Hook pour vérifier l'accès à un module spécifique
 */
export const useModuleAccess = (moduleId: string) => {
  const hasAccess = useSubscriptionStore((state) => state.hasModuleAccess(moduleId));
  const currentPlan = useSubscriptionStore(subscriptionSelectors.currentPlan);
  
  return {
    hasAccess,
    planRequired: currentPlan?.slug || 'gratuit',
    planName: currentPlan?.name || 'Plan Gratuit',
  };
};

/**
 * Hook pour les statistiques d'abonnement
 */
export const useSubscriptionStats = (schoolGroupId?: string) => {
  const { modules } = useReactiveModules(schoolGroupId);
  const { categories } = useReactiveCategories(schoolGroupId);
  
  return useMemo(() => ({
    totalModules: modules.all.length,
    accessibleModules: modules.accessible.length,
    enabledModules: modules.enabled.length,
    totalCategories: categories.length,
    accessibleCategories: categories.filter(c => c.is_accessible).length,
    accessPercentage: modules.all.length > 0 
      ? Math.round((modules.accessible.length / modules.all.length) * 100)
      : 0,
  }), [modules, categories]);
};

/**
 * Utilitaires
 */
function shouldModuleBeAccessible(module: ReactiveModule, planSlug: string): boolean {
  // Logique de vérification d'accès basée sur le plan
  const planHierarchy = {
    gratuit: 1,
    premium: 2,
    pro: 3,
    institutionnel: 4,
  };
  
  const currentLevel = planHierarchy[planSlug as keyof typeof planHierarchy] || 1;
  const requiredLevel = planHierarchy[module.plan_required as keyof typeof planHierarchy] || 1;
  
  return currentLevel >= requiredLevel;
}

function groupModulesByCategory(modules: ReactiveModule[]): Record<string, ReactiveModule[]> {
  return modules.reduce((acc, module) => {
    const categoryId = module.category_id;
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(module);
    return acc;
  }, {} as Record<string, ReactiveModule[]>);
}

/**
 * Hook optimisé pour la gestion des modules
 * Combine Zustand store + React Query pour performance maximale
 * @module useModules
 */

import { useQuery } from '@tanstack/react-query';
import { useModulesStore } from '@/stores/modules.store';
import { useSchoolGroupId } from '@/providers/AppContextProvider';
import { supabase } from '@/lib/supabase';

/**
 * Hook principal pour accéder aux modules
 * Utilise le store Zustand avec fallback sur React Query
 */
export function useModules() {
  const schoolGroupId = useSchoolGroupId();
  
  // 1. Essayer d'abord le store Zustand (plus rapide)
  const storeModules = useModulesStore((state) => state.modules);
  const storeLoading = useModulesStore((state) => state.loading);
  const storeError = useModulesStore((state) => state.error);
  
  // 2. Fallback sur React Query si le store est vide
  const { data: queryModules, isLoading: queryLoading } = useQuery({
    queryKey: ['modules', schoolGroupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: storeModules.length === 0 && !!schoolGroupId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // 3. Retourner les données du store ou de React Query
  return {
    modules: storeModules.length > 0 ? storeModules : (queryModules || []),
    loading: storeLoading || queryLoading,
    error: storeError,
  };
}

/**
 * Hook pour obtenir un module par slug
 */
export function useModule(slug: string) {
  const getModuleBySlug = useModulesStore((state) => state.getModuleBySlug);
  const module = getModuleBySlug(slug);

  // Fallback sur React Query si non trouvé dans le store
  const { data: queryModule } = useQuery({
    queryKey: ['module', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !module && !!slug,
    staleTime: 5 * 60 * 1000,
  });

  return module || queryModule;
}

/**
 * Hook pour obtenir les modules par catégorie
 */
export function useModulesByCategory(categoryId: string) {
  const getModulesByCategory = useModulesStore((state) => state.getModulesByCategory);
  const modules = getModulesByCategory(categoryId);

  return {
    modules,
    count: modules.length,
  };
}

/**
 * Hook pour obtenir les catégories
 */
export function useCategories() {
  const categories = useModulesStore((state) => state.categories);
  const loading = useModulesStore((state) => state.loading);
  const error = useModulesStore((state) => state.error);

  return {
    categories,
    loading,
    error,
  };
}

/**
 * Hook pour obtenir une catégorie par slug
 */
export function useCategory(slug: string) {
  const getCategoryBySlug = useModulesStore((state) => state.getCategoryBySlug);
  return getCategoryBySlug(slug);
}

/**
 * Hook pour les statistiques des modules
 */
export function useModulesStats() {
  const modules = useModulesStore((state) => state.modules);
  const categories = useModulesStore((state) => state.categories);

  return {
    totalModules: modules.length,
    totalCategories: categories.length,
    modulesByCategory: categories.map((cat) => ({
      category: cat,
      count: modules.filter((m) => m.category_id === cat.id).length,
    })),
  };
}

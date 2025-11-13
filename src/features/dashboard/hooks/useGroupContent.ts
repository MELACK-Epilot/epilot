/**
 * Hook pour récupérer les modules et catégories assignés à un groupe scolaire
 * Utilisé par l'Admin Groupe pour voir son contenu disponible
 * @module useGroupContent
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/store/auth.store';

export interface GroupModule {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  is_core: boolean;
  is_premium: boolean;
  category_id?: string;
  is_enabled: boolean;
  enabled_at?: string;
  disabled_at?: string;
}

export interface GroupCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  is_enabled: boolean;
  enabled_at?: string;
  disabled_at?: string;
}

export interface GroupContent {
  modules: GroupModule[];
  categories: GroupCategory[];
  activeModulesCount: number;
  activeCategoriesCount: number;
  totalModulesCount: number;
  totalCategoriesCount: number;
}

/**
 * Hook pour récupérer les modules assignés au groupe de l'utilisateur
 */
export const useGroupModules = () => {
  const { user } = useAuth();
  const schoolGroupId = user?.school_group_id;

  return useQuery({
    queryKey: ['group-modules', schoolGroupId],
    queryFn: async (): Promise<GroupModule[]> => {
      if (!schoolGroupId) {
        console.warn('⚠️ useGroupModules: Aucun school_group_id trouvé');
        return [];
      }

      const { data, error } = await supabase
        .from('group_module_configs')
        .select(`
          is_enabled,
          enabled_at,
          disabled_at,
          modules!inner(
            id,
            name,
            slug,
            description,
            icon,
            color,
            is_core,
            is_premium,
            category_id
          )
        `)
        .eq('school_group_id', schoolGroupId)
        .order('is_enabled', { ascending: false });

      if (error) {
        console.error('❌ Erreur récupération modules groupe:', error);
        throw error;
      }

      const modules = (data || []).map((item: any) => ({
        ...item.modules,
        is_enabled: item.is_enabled,
        enabled_at: item.enabled_at,
        disabled_at: item.disabled_at,
      }));

      console.log('📦 Modules du groupe récupérés:', {
        total: modules.length,
        actifs: modules.filter((m: GroupModule) => m.is_enabled).length,
        inactifs: modules.filter((m: GroupModule) => !m.is_enabled).length,
      });

      return modules;
    },
    enabled: !!schoolGroupId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook pour récupérer les catégories assignées au groupe de l'utilisateur
 */
export const useGroupCategories = () => {
  const { user } = useAuth();
  const schoolGroupId = user?.school_group_id;

  return useQuery({
    queryKey: ['group-categories', schoolGroupId],
    queryFn: async (): Promise<GroupCategory[]> => {
      if (!schoolGroupId) {
        console.warn('⚠️ useGroupCategories: Aucun school_group_id trouvé');
        return [];
      }

      const { data, error } = await supabase
        .from('group_business_categories')
        .select(`
          is_enabled,
          enabled_at,
          disabled_at,
          business_categories!inner(
            id,
            name,
            slug,
            description,
            icon,
            color
          )
        `)
        .eq('school_group_id', schoolGroupId)
        .order('is_enabled', { ascending: false });

      if (error) {
        console.error('❌ Erreur récupération catégories groupe:', error);
        throw error;
      }

      const categories = (data || []).map((item: any) => ({
        ...item.business_categories,
        is_enabled: item.is_enabled,
        enabled_at: item.enabled_at,
        disabled_at: item.disabled_at,
      }));

      console.log('📂 Catégories du groupe récupérées:', {
        total: categories.length,
        actives: categories.filter((c: GroupCategory) => c.is_enabled).length,
        inactives: categories.filter((c: GroupCategory) => !c.is_enabled).length,
      });

      return categories;
    },
    enabled: !!schoolGroupId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook pour récupérer tout le contenu du groupe (modules + catégories)
 */
export const useGroupContent = () => {
  const { data: modules = [], isLoading: modulesLoading } = useGroupModules();
  const { data: categories = [], isLoading: categoriesLoading } = useGroupCategories();

  const content: GroupContent = {
    modules,
    categories,
    activeModulesCount: modules.filter(m => m.is_enabled).length,
    activeCategoriesCount: categories.filter(c => c.is_enabled).length,
    totalModulesCount: modules.length,
    totalCategoriesCount: categories.length,
  };

  return {
    data: content,
    isLoading: modulesLoading || categoriesLoading,
    modules,
    categories,
  };
};

/**
 * Hook pour récupérer uniquement les modules actifs
 */
export const useActiveGroupModules = () => {
  const { data: modules = [] } = useGroupModules();
  return modules.filter(m => m.is_enabled);
};

/**
 * Hook pour récupérer uniquement les catégories actives
 */
export const useActiveGroupCategories = () => {
  const { data: categories = [] } = useGroupCategories();
  return categories.filter(c => c.is_enabled);
};

/**
 * Hook pour vérifier si un module spécifique est disponible et actif
 */
export const useHasModule = (moduleSlug: string) => {
  const { data: modules = [] } = useGroupModules();
  return modules.some(m => m.slug === moduleSlug && m.is_enabled);
};

/**
 * Hook pour vérifier si une catégorie spécifique est disponible et active
 */
export const useHasCategory = (categorySlug: string) => {
  const { data: categories = [] } = useGroupCategories();
  return categories.some(c => c.slug === categorySlug && c.is_enabled);
};

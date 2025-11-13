/**
 * Hook pour récupérer les modules assignés à un utilisateur
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { UserModule } from '../types/module.types';

export const useUserModules = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['user-modules', userId],
    queryFn: async (): Promise<UserModule[]> => {
      if (!userId) throw new Error('User ID requis');

      const { data, error } = await supabase
        .from('user_modules')
        .select(`
          *,
          module:modules(*)
        `)
        .eq('user_id', userId)
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook pour récupérer les catégories assignées à un utilisateur
 */
export const useUserCategories = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['user-categories', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID requis');

      const { data, error } = await supabase
        .from('user_categories')
        .select(`
          *,
          category:business_categories(*)
        `)
        .eq('user_id', userId)
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

/**
 * Hook pour vérifier si un utilisateur a accès à un module
 */
export const useHasModuleAccess = (moduleSlug: string) => {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
  });

  const { data: userModules } = useUserModules(user?.id);

  return {
    hasAccess: userModules?.some(um => um.module?.slug === moduleSlug) || false,
    isLoading: !userModules,
  };
};

/**
 * Hook pour vérifier si un utilisateur a accès à une catégorie
 */
export const useHasCategoryAccess = (categorySlug: string) => {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
  });

  const { data: userCategories } = useUserCategories(user?.id);

  return {
    hasAccess: userCategories?.some(uc => uc.category?.slug === categorySlug) || false,
    isLoading: !userCategories,
  };
};

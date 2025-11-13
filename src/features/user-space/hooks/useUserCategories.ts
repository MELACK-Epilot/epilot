/**
 * Hook pour récupérer les catégories disponibles pour l'utilisateur
 * React 19 Best Practices
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from './useCurrentUser';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  status: string;
  module_count?: number;
}

export const useUserCategories = () => {
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: ['user-categories', user?.schoolGroupId],
    queryFn: async () => {
      if (!user?.schoolGroupId) {
        throw new Error('Utilisateur non associé à un groupe scolaire');
      }

      // Récupérer toutes les catégories actives
      const { data: categories, error: categoriesError } = await supabase
        .from('business_categories')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (categoriesError) {
        console.error('Erreur récupération catégories:', categoriesError);
        throw categoriesError;
      }

      // Compter les modules par catégorie
      const categoriesWithCount = await Promise.all(
        (categories || []).map(async (category) => {
          const { count } = await supabase
            .from('modules')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id)
            .eq('status', 'active');

          return {
            ...category,
            module_count: count || 0,
          } as Category;
        })
      );

      return categoriesWithCount;
    },
    enabled: !!user?.schoolGroupId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};

/**
 * Hook pour récupérer les modules d'une catégorie spécifique
 */
export const useCategoryModules = (categoryId?: string) => {
  return useQuery({
    queryKey: ['category-modules', categoryId],
    queryFn: async () => {
      if (!categoryId) throw new Error('Category ID requis');

      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('category_id', categoryId)
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000,
  });
};

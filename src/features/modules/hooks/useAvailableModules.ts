/**
 * Hooks pour récupérer les modules disponibles selon le plan
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Module, BusinessCategory } from '../types/module.types';

/**
 * Hook pour récupérer tous les modules actifs
 */
export const useModules = () => {
  return useQuery({
    queryKey: ['modules'],
    queryFn: async (): Promise<Module[]> => {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('status', 'active')
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook pour récupérer toutes les catégories actives
 */
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<BusinessCategory[]> => {
      const { data, error } = await supabase
        .from('business_categories')
        .select('*')
        .eq('status', 'active')
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * Hook pour récupérer les modules d'une catégorie
 */
export const useModulesByCategory = (categoryId: string | undefined) => {
  return useQuery({
    queryKey: ['modules-by-category', categoryId],
    queryFn: async (): Promise<Module[]> => {
      if (!categoryId) throw new Error('Category ID requis');

      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('category_id', categoryId)
        .eq('status', 'active')
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!categoryId,
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * Hook pour récupérer les modules disponibles selon le plan d'un groupe
 */
export const useAvailableModulesByPlan = (planId: string | undefined) => {
  return useQuery({
    queryKey: ['available-modules', planId],
    queryFn: async (): Promise<Module[]> => {
      if (!planId) throw new Error('Plan ID requis');

      const { data, error } = await supabase
        .from('plan_modules')
        .select(`
          module:modules(*)
        `)
        .eq('plan_id', planId);

      if (error) throw error;
      return data?.map(pm => pm.module).filter(Boolean) || [];
    },
    enabled: !!planId,
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * Hook pour récupérer les catégories disponibles selon le plan d'un groupe
 */
export const useAvailableCategoriesByPlan = (planId: string | undefined) => {
  return useQuery({
    queryKey: ['available-categories', planId],
    queryFn: async (): Promise<BusinessCategory[]> => {
      if (!planId) throw new Error('Plan ID requis');

      const { data, error } = await supabase
        .from('plan_categories')
        .select(`
          category:business_categories(*)
        `)
        .eq('plan_id', planId);

      if (error) throw error;
      return data?.map(pc => pc.category).filter(Boolean) || [];
    },
    enabled: !!planId,
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * Hook pour récupérer les modules avec leur statut d'assignation pour un utilisateur
 */
export const useModulesWithAssignment = (userId: string | undefined, planId: string | undefined) => {
  const { data: availableModules } = useAvailableModulesByPlan(planId);
  const { data: userModules } = useQuery({
    queryKey: ['user-modules', userId],
  });

  return useQuery({
    queryKey: ['modules-with-assignment', userId, planId],
    queryFn: async () => {
      if (!availableModules) return [];

      return availableModules.map(module => ({
        ...module,
        isAssigned: userModules?.some(um => um.module_id === module.id) || false,
        assignedAt: userModules?.find(um => um.module_id === module.id)?.assigned_at,
      }));
    },
    enabled: !!availableModules && !!userId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook pour récupérer un module par son slug
 */
export const useModuleBySlug = (slug: string | undefined) => {
  return useQuery({
    queryKey: ['module', slug],
    queryFn: async (): Promise<Module | null> => {
      if (!slug) throw new Error('Module slug requis');

      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * Hook pour récupérer une catégorie par son slug
 */
export const useCategoryBySlug = (slug: string | undefined) => {
  return useQuery({
    queryKey: ['category', slug],
    queryFn: async (): Promise<BusinessCategory | null> => {
      if (!slug) throw new Error('Category slug requis');

      const { data, error } = await supabase
        .from('business_categories')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
  });
};

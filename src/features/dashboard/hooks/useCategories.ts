/**
 * Hook pour gérer les catégories métiers
 * @module useCategories
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...categoryKeys.lists(), filters] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
};

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  description: string;
  status: 'active' | 'inactive';
  moduleCount?: number;
  createdAt: string;
  updatedAt: string;
}

export const useCategories = (filters?: { query?: string; status?: string }) => {
  return useQuery({
    queryKey: categoryKeys.list(filters || {}),
    queryFn: async () => {
      // Récupérer les catégories avec le nombre de modules
      let query = supabase
        .from('business_categories')
        .select(`
          *,
          modules:modules(count)
        `)
        .order('name', { ascending: true });

      if (filters?.query) {
        query = query.or(`name.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
      }

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        color: cat.color,
        description: cat.description,
        status: cat.status,
        moduleCount: cat.modules?.[0]?.count || 0,
        createdAt: cat.created_at,
        updatedAt: cat.updated_at,
      })) as Category[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'moduleCount'>) => {
      const { data, error } = await supabase
        .from('business_categories')
        .insert({
          name: input.name,
          slug: input.slug,
          icon: input.icon,
          color: input.color,
          description: input.description,
          status: input.status,
          // Nouveaux champs
          order_index: input.order_index ?? 0,
          is_visible: input.is_visible ?? true,
          school_levels: input.school_levels || [],
          max_modules: input.max_modules || null,
          cover_image: input.cover_image || null,
          keywords: input.keywords || [],
          owner_id: input.owner_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Partial<Category> & { id: string }) => {
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from('business_categories')
        .update({
          name: updates.name,
          slug: updates.slug,
          icon: updates.icon,
          color: updates.color,
          description: updates.description,
          status: updates.status,
          // Nouveaux champs
          order_index: updates.order_index,
          is_visible: updates.is_visible,
          school_levels: updates.school_levels,
          max_modules: updates.max_modules,
          cover_image: updates.cover_image,
          keywords: updates.keywords,
          owner_id: updates.owner_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.detail(variables.id) });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('business_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
  });
};

export const useCategoryStats = () => {
  return useQuery({
    queryKey: ['category-stats'],
    queryFn: async () => {
      const { count: total, error: totalError } = await supabase
        .from('business_categories')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;

      const { count: active, error: activeError } = await supabase
        .from('business_categories')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (activeError) throw activeError;

      // Récupérer le nombre total de modules
      const { count: totalModules, error: modulesError } = await supabase
        .from('modules')
        .select('*', { count: 'exact', head: true });

      if (modulesError) throw modulesError;

      return {
        total: total || 0,
        active: active || 0,
        inactive: (total || 0) - (active || 0),
        totalModules: totalModules || 0,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Hook pour récupérer les modules d'une catégorie
export const useCategoryModules = (categoryId: string) => {
  return useQuery({
    queryKey: ['category-modules', categoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('category_id', categoryId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000,
  });
};

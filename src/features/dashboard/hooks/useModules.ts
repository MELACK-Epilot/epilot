/**
 * Hook pour gérer les modules
 * @module useModules
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const moduleKeys = {
  all: ['modules'] as const,
  lists: () => [...moduleKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...moduleKeys.lists(), filters] as const,
};

interface Module {
  id: string;
  name: string;
  slug: string;
  description: string;
  version: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  requiredPlan: string;
  status: 'active' | 'inactive' | 'beta' | 'deprecated';
  isPremium: boolean;
  isCore: boolean;
  features?: string[];
  adoptionRate?: number;
  createdAt: string;
}

export const useModules = (filters?: { query?: string; status?: string }) => {
  return useQuery({
    queryKey: moduleKeys.list(filters || {}),
    queryFn: async () => {
      let query = supabase
        .from('modules')
        .select(`
          *,
          business_categories!modules_category_id_fkey(
            id,
            name,
            color
          )
        `)
        .order('order_index', { ascending: true })
        .order('name', { ascending: true });

      if (filters?.query) {
        query = query.or(`name.ilike.%${filters.query}%,slug.ilike.%${filters.query}%`);
      }

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((mod: any) => ({
        id: mod.id,
        name: mod.name,
        slug: mod.slug,
        description: mod.description || '',
        version: mod.version || '1.0.0',
        categoryId: mod.category_id,
        categoryName: mod.business_categories?.name || 'Non catégorisé',
        categoryColor: mod.business_categories?.color || '#1D3557',
        requiredPlan: mod.required_plan || 'gratuit',
        status: mod.status || 'active',
        isPremium: mod.is_premium || false,
        isCore: mod.is_core || false,
        features: mod.features || [],
        adoptionRate: mod.adoption_rate || 0,
        createdAt: mod.created_at,
      })) as Module[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useModuleStats = () => {
  return useQuery({
    queryKey: ['module-stats'],
    queryFn: async () => {
      const { count: total, error: totalError } = await supabase
        .from('modules')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;

      const { count: active, error: activeError } = await supabase
        .from('modules')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (activeError) throw activeError;

      const { count: inactive, error: inactiveError } = await supabase
        .from('modules')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'inactive');

      if (inactiveError) throw inactiveError;

      const { count: beta, error: betaError } = await supabase
        .from('modules')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'beta');

      if (betaError) throw betaError;

      const { count: premium, error: premiumError } = await supabase
        .from('modules')
        .select('*', { count: 'exact', head: true })
        .eq('is_premium', true);

      if (premiumError) throw premiumError;

      const { count: core, error: coreError } = await supabase
        .from('modules')
        .select('*', { count: 'exact', head: true })
        .eq('is_core', true);

      if (coreError) throw coreError;

      return {
        total: total || 0,
        active: active || 0,
        inactive: inactive || 0,
        beta: beta || 0,
        premium: premium || 0,
        core: core || 0,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<Module, 'id' | 'createdAt' | 'categoryName' | 'categoryColor' | 'features' | 'adoptionRate'>) => {
      // Validation catégorie obligatoire
      if (!input.categoryId) {
        throw new Error('La catégorie est obligatoire');
      }

      const { data, error } = await supabase
        .from('modules')
        .insert({
          name: input.name,
          slug: input.slug,
          description: input.description,
          version: input.version || '1.0.0',
          category_id: input.categoryId,
          required_plan: input.requiredPlan || 'gratuit',
          status: input.status || 'active',
          is_premium: input.isPremium || false,
          is_core: input.isCore || false,
          order_index: 0,
        })
        .select(`
          *,
          business_categories!modules_category_id_fkey(
            id,
            name,
            color
          )
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moduleKeys.all });
      queryClient.invalidateQueries({ queryKey: ['module-stats'] });
    },
  });
};

export const useUpdateModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Partial<Module> & { id: string }) => {
      const { id, ...updates } = input;
      
      // Validation catégorie obligatoire
      if (updates.categoryId !== undefined && !updates.categoryId) {
        throw new Error('La catégorie est obligatoire');
      }

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.slug !== undefined) updateData.slug = updates.slug;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.version !== undefined) updateData.version = updates.version;
      if (updates.categoryId !== undefined) updateData.category_id = updates.categoryId;
      if (updates.requiredPlan !== undefined) updateData.required_plan = updates.requiredPlan;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.isPremium !== undefined) updateData.is_premium = updates.isPremium;
      if (updates.isCore !== undefined) updateData.is_core = updates.isCore;

      const { data, error } = await supabase
        .from('modules')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          business_categories!modules_category_id_fkey(
            id,
            name,
            color
          )
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moduleKeys.all });
      queryClient.invalidateQueries({ queryKey: ['module-stats'] });
    },
  });
};

export const useDeleteModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moduleKeys.all });
      queryClient.invalidateQueries({ queryKey: ['module-stats'] });
    },
  });
};

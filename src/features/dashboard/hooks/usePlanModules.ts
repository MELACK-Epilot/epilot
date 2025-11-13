/**
 * Hooks pour gérer les modules assignés aux plans
 * @module usePlanModules
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const planModuleKeys = {
  all: ['plan-modules'] as const,
  byPlan: (planId: string) => [...planModuleKeys.all, 'plan', planId] as const,
};

export const planCategoryKeys = {
  all: ['plan-categories'] as const,
  byPlan: (planId: string) => [...planCategoryKeys.all, 'plan', planId] as const,
};

/**
 * Récupérer les modules d'un plan
 */
export const usePlanModules = (planId?: string) => {
  return useQuery({
    queryKey: planModuleKeys.byPlan(planId || ''),
    queryFn: async () => {
      if (!planId) return [];

      const { data, error } = await supabase
        .from('plan_modules')
        .select(`
          id,
          module:modules (
            id,
            name,
            slug,
            icon,
            color,
            description,
            category_id,
            required_plan,
            is_core,
            is_premium,
            order_index
          )
        `)
        .eq('plan_id', planId);

      if (error) throw error;

      return (data || []).map((pm: any) => pm.module).filter(Boolean);
    },
    enabled: !!planId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Récupérer les catégories d'un plan
 */
export const usePlanCategories = (planId?: string) => {
  return useQuery({
    queryKey: planCategoryKeys.byPlan(planId || ''),
    queryFn: async () => {
      if (!planId) return [];

      const { data, error } = await supabase
        .from('plan_categories')
        .select(`
          id,
          category:business_categories (
            id,
            name,
            slug,
            icon,
            color,
            description,
            required_plan,
            is_core,
            order_index
          )
        `)
        .eq('plan_id', planId);

      if (error) throw error;

      return (data || []).map((pc: any) => pc.category).filter(Boolean);
    },
    enabled: !!planId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Assigner des modules à un plan
 */
export const useAssignModulesToPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ planId, moduleIds }: { planId: string; moduleIds: string[] }) => {
      console.log('🔧 Assignation modules - planId:', planId, 'moduleIds:', moduleIds);
      
      // Supprimer les anciennes assignations
      await supabase.from('plan_modules').delete().eq('plan_id', planId);

      // Insérer les nouvelles assignations
      if (moduleIds.length > 0) {
        const insertData = moduleIds.map(moduleId => ({ plan_id: planId, module_id: moduleId }));
        console.log('📝 Insertion modules:', insertData);
        
        const { data, error } = await supabase
          .from('plan_modules')
          .insert(insertData)
          .select();

        if (error) {
          console.error('❌ Erreur assignation modules:', error);
          throw error;
        }
        
        console.log('✅ Modules assignés:', data);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: planModuleKeys.byPlan(variables.planId) });
    },
  });
};

/**
 * Assigner des catégories à un plan
 */
export const useAssignCategoriesToPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ planId, categoryIds }: { planId: string; categoryIds: string[] }) => {
      console.log('🔧 Assignation catégories - planId:', planId, 'categoryIds:', categoryIds);
      
      // Supprimer les anciennes assignations
      await supabase.from('plan_categories').delete().eq('plan_id', planId);

      // Insérer les nouvelles assignations
      if (categoryIds.length > 0) {
        const insertData = categoryIds.map(categoryId => ({ plan_id: planId, category_id: categoryId }));
        console.log('📝 Insertion catégories:', insertData);
        
        const { data, error } = await supabase
          .from('plan_categories')
          .insert(insertData)
          .select();

        if (error) {
          console.error('❌ Erreur assignation catégories:', error);
          throw error;
        }
        
        console.log('✅ Catégories assignées:', data);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: planCategoryKeys.byPlan(variables.planId) });
    },
  });
};

/**
 * Récupérer tous les modules disponibles (SANS filtrage par plan pour plus de flexibilité)
 */
export const useAvailableModulesByPlan = (planSlug: 'gratuit' | 'premium' | 'pro' | 'institutionnel') => {
  return useQuery({
    queryKey: ['available-modules', 'all'], // Tous les modules
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modules')
        .select(`
          *,
          category:business_categories (
            id,
            name,
            slug,
            icon,
            color
          )
        `)
        .eq('status', 'active')
        .order('order_index', { ascending: true });

      if (error) throw error;

      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Récupérer toutes les catégories disponibles (SANS filtrage par plan pour flexibilité totale)
 */
export const useAvailableCategoriesByPlan = (planSlug: 'gratuit' | 'premium' | 'pro' | 'institutionnel') => {
  return useQuery({
    queryKey: ['available-categories', 'all'], // Toutes les catégories
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_categories')
        .select('*')
        .eq('status', 'active')
        .order('order_index', { ascending: true });

      if (error) throw error;

      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

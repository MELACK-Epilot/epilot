/**
 * Hooks pour assigner/retirer des modules et catégories
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import type { 
  AssignModuleParams, 
  UnassignModuleParams,
  AssignCategoryParams,
  UnassignCategoryParams 
} from '../types/module.types';

/**
 * Hook pour assigner un module à un utilisateur
 */
export const useAssignModule = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, moduleId }: AssignModuleParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('user_modules')
        .insert({
          user_id: userId,
          module_id: moduleId,
          assigned_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['user-modules', variables.userId] });

      // Snapshot previous value
      const previousModules = queryClient.getQueryData(['user-modules', variables.userId]);

      // Optimistically update
      queryClient.setQueryData(['user-modules', variables.userId], (old: any) => {
        if (!old) return old;
        return [...old, { 
          user_id: variables.userId, 
          module_id: variables.moduleId,
          assigned_at: new Date().toISOString(),
        }];
      });

      return { previousModules };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousModules) {
        queryClient.setQueryData(['user-modules', variables.userId], context.previousModules);
      }
      
      toast({
        title: 'Erreur',
        description: 'Impossible d\'assigner le module',
        variant: 'destructive',
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-modules', variables.userId] });
      
      toast({
        title: 'Module assigné',
        description: 'Le module a été assigné avec succès',
      });
    },
  });
};

/**
 * Hook pour retirer un module à un utilisateur
 */
export const useUnassignModule = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, moduleId }: UnassignModuleParams) => {
      const { error } = await supabase
        .from('user_modules')
        .delete()
        .eq('user_id', userId)
        .eq('module_id', moduleId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-modules', variables.userId] });
      
      toast({
        title: 'Module retiré',
        description: 'Le module a été retiré avec succès',
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible de retirer le module',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour assigner une catégorie à un utilisateur
 */
export const useAssignCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, categoryId }: AssignCategoryParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('user_categories')
        .insert({
          user_id: userId,
          category_id: categoryId,
          assigned_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-categories', variables.userId] });
      
      toast({
        title: 'Catégorie assignée',
        description: 'La catégorie a été assignée avec succès',
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'assigner la catégorie',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour retirer une catégorie à un utilisateur
 */
export const useUnassignCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, categoryId }: UnassignCategoryParams) => {
      const { error } = await supabase
        .from('user_categories')
        .delete()
        .eq('user_id', userId)
        .eq('category_id', categoryId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-categories', variables.userId] });
      
      toast({
        title: 'Catégorie retirée',
        description: 'La catégorie a été retirée avec succès',
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible de retirer la catégorie',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour assigner plusieurs modules en masse
 */
export const useBulkAssignModules = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, moduleIds }: { userId: string; moduleIds: string[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const inserts = moduleIds.map(moduleId => ({
        user_id: userId,
        module_id: moduleId,
        assigned_by: user?.id,
      }));

      const { data, error } = await supabase
        .from('user_modules')
        .insert(inserts)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-modules', variables.userId] });
      
      toast({
        title: 'Modules assignés',
        description: `${variables.moduleIds.length} modules ont été assignés avec succès`,
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'assigner les modules',
        variant: 'destructive',
      });
    },
  });
};

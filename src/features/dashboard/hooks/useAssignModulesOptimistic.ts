/**
 * Hook Optimistic Updates pour Assignation Modules
 * Update UI immédiatement, rollback si erreur
 * UX instantanée pour 2000+ utilisateurs
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface AssignModulesParams {
  userId: string;
  moduleIds: string[];
  permissions: {
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
    canExport: boolean;
  };
}

interface AssignCategoryParams {
  userId: string;
  categoryId: string;
  permissions: {
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
    canExport: boolean;
  };
}

/**
 * Hook pour assigner modules avec optimistic update
 * UI update instantanément, rollback si erreur
 */
export const useAssignModulesOptimistic = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, moduleIds, permissions }: AssignModulesParams) => {
      // Appel RPC bulk assign (à créer)
      const { data, error } = await supabase.rpc('assign_modules_bulk', {
        p_user_id: userId,
        p_module_ids: moduleIds,
        p_permissions: permissions
      });
      
      if (error) throw error;
      return data;
    },
    
    // OPTIMISTIC UPDATE
    onMutate: async ({ userId, moduleIds, permissions }) => {
      // 1. Cancel outgoing queries
      await queryClient.cancelQueries({ 
        queryKey: ['user-assigned-modules', userId] 
      });
      await queryClient.cancelQueries({ 
        queryKey: ['user-module-stats', userId] 
      });
      
      // 2. Snapshot previous values
      const previousAssigned = queryClient.getQueryData(['user-assigned-modules', userId]);
      const previousStats = queryClient.getQueryData(['user-module-stats', userId]);
      
      // 3. Optimistically update assigned modules
      queryClient.setQueryData(['user-assigned-modules', userId], (old: any) => {
        const newModules = moduleIds.map(moduleId => ({
          id: `temp-${moduleId}`,
          user_id: userId,
          module_id: moduleId,
          ...permissions,
          created_at: new Date().toISOString(),
          _optimistic: true // Flag pour identifier updates optimistes
        }));
        
        return [...(old || []), ...newModules];
      });
      
      // 4. Optimistically update stats
      queryClient.setQueryData(['user-module-stats', userId], (old: any) => {
        if (!old) return old;
        
        return {
          ...old,
          assignedModules: (old.assignedModules || 0) + moduleIds.length,
          availableModules: (old.availableModules || 0) - moduleIds.length,
          progressPercentage: Math.round(
            ((old.assignedModules + moduleIds.length) / old.totalModules) * 100
          )
        };
      });
      
      // Return context for rollback
      return { previousAssigned, previousStats };
    },
    
    // ROLLBACK ON ERROR
    onError: (err, variables, context) => {
      // Restore previous values
      if (context?.previousAssigned) {
        queryClient.setQueryData(
          ['user-assigned-modules', variables.userId],
          context.previousAssigned
        );
      }
      if (context?.previousStats) {
        queryClient.setQueryData(
          ['user-module-stats', variables.userId],
          context.previousStats
        );
      }
      
      toast.error('Erreur lors de l\'assignation des modules');
      console.error('❌ Assign error:', err);
    },
    
    // REVALIDATE ON SUCCESS
    onSuccess: (data, variables) => {
      // Invalidate to fetch real data
      queryClient.invalidateQueries({ 
        queryKey: ['user-assigned-modules', variables.userId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['user-module-stats', variables.userId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['user-module-stats-optimized', variables.userId] 
      });
      
      toast.success(`${variables.moduleIds.length} module(s) assigné(s) avec succès`);
    },
    
    // ALWAYS (success or error)
    onSettled: (data, error, variables) => {
      // Ensure queries are fresh
      queryClient.invalidateQueries({ 
        queryKey: ['user-assigned-modules', variables.userId] 
      });
    }
  });
};

/**
 * Hook pour retirer module avec optimistic update
 */
export const useRemoveModuleOptimistic = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, moduleId }: { userId: string; moduleId: string }) => {
      const { error } = await supabase
        .from('user_module_permissions')
        .delete()
        .eq('user_id', userId)
        .eq('module_id', moduleId);
      
      if (error) throw error;
    },
    
    onMutate: async ({ userId, moduleId }) => {
      await queryClient.cancelQueries({ 
        queryKey: ['user-assigned-modules', userId] 
      });
      
      const previousAssigned = queryClient.getQueryData(['user-assigned-modules', userId]);
      const previousStats = queryClient.getQueryData(['user-module-stats', userId]);
      
      // Remove from list
      queryClient.setQueryData(['user-assigned-modules', userId], (old: any) => {
        return (old || []).filter((m: any) => m.module_id !== moduleId);
      });
      
      // Update stats
      queryClient.setQueryData(['user-module-stats', userId], (old: any) => {
        if (!old) return old;
        
        return {
          ...old,
          assignedModules: Math.max(0, (old.assignedModules || 0) - 1),
          availableModules: (old.availableModules || 0) + 1,
          progressPercentage: Math.round(
            (Math.max(0, old.assignedModules - 1) / old.totalModules) * 100
          )
        };
      });
      
      return { previousAssigned, previousStats };
    },
    
    onError: (err, variables, context) => {
      if (context?.previousAssigned) {
        queryClient.setQueryData(
          ['user-assigned-modules', variables.userId],
          context.previousAssigned
        );
      }
      if (context?.previousStats) {
        queryClient.setQueryData(
          ['user-module-stats', variables.userId],
          context.previousStats
        );
      }
      
      toast.error('Erreur lors du retrait du module');
    },
    
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['user-assigned-modules', variables.userId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['user-module-stats', variables.userId] 
      });
      
      toast.success('Module retiré avec succès');
    }
  });
};

/**
 * Hook pour update permissions avec optimistic update
 */
export const useUpdatePermissionsOptimistic = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      moduleId, 
      permissions 
    }: { 
      userId: string; 
      moduleId: string; 
      permissions: any 
    }) => {
      const { error } = await supabase
        .from('user_module_permissions')
        .update(permissions)
        .eq('user_id', userId)
        .eq('module_id', moduleId);
      
      if (error) throw error;
    },
    
    onMutate: async ({ userId, moduleId, permissions }) => {
      await queryClient.cancelQueries({ 
        queryKey: ['user-assigned-modules', userId] 
      });
      
      const previousAssigned = queryClient.getQueryData(['user-assigned-modules', userId]);
      
      // Update permissions in list
      queryClient.setQueryData(['user-assigned-modules', userId], (old: any) => {
        return (old || []).map((m: any) => 
          m.module_id === moduleId 
            ? { ...m, ...permissions }
            : m
        );
      });
      
      return { previousAssigned };
    },
    
    onError: (err, variables, context) => {
      if (context?.previousAssigned) {
        queryClient.setQueryData(
          ['user-assigned-modules', variables.userId],
          context.previousAssigned
        );
      }
      
      toast.error('Erreur lors de la mise à jour des permissions');
    },
    
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['user-assigned-modules', variables.userId] 
      });
      
      toast.success('Permissions mises à jour');
    }
  });
};

/**
 * Hook pour assigner catégorie avec optimistic update
 */
export const useAssignCategoryOptimistic = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, categoryId, permissions }: AssignCategoryParams) => {
      const { data, error } = await supabase.rpc('assign_category_with_profile', {
        p_user_id: userId,
        p_category_id: categoryId,
        p_permissions: permissions
      });
      
      if (error) throw error;
      return data;
    },
    
    onMutate: async ({ userId }) => {
      await queryClient.cancelQueries({ 
        queryKey: ['user-assigned-modules', userId] 
      });
      await queryClient.cancelQueries({ 
        queryKey: ['user-module-stats', userId] 
      });
      
      const previousAssigned = queryClient.getQueryData(['user-assigned-modules', userId]);
      const previousStats = queryClient.getQueryData(['user-module-stats', userId]);
      
      // Note: On ne peut pas prédire exactement quels modules seront assignés
      // Donc on affiche juste un toast "en cours" et on revalide après
      
      return { previousAssigned, previousStats };
    },
    
    onError: (err, variables, context) => {
      if (context?.previousAssigned) {
        queryClient.setQueryData(
          ['user-assigned-modules', variables.userId],
          context.previousAssigned
        );
      }
      if (context?.previousStats) {
        queryClient.setQueryData(
          ['user-module-stats', variables.userId],
          context.previousStats
        );
      }
      
      toast.error('Erreur lors de l\'assignation de la catégorie');
    },
    
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['user-assigned-modules', variables.userId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['user-module-stats', variables.userId] 
      });
      
      toast.success('Catégorie assignée avec succès');
    }
  });
};

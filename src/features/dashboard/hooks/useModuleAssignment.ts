/**
 * Hooks pour l'assignation de modules avec les fonctions RPC
 * Utilise les fonctions Postgres créées pour validation stricte
 * @module useModuleAssignment
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface ModulePermissions {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canExport: boolean;
}

/**
 * Hook pour assigner un module à un utilisateur (via RPC)
 */
export const useAssignModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      moduleId,
      permissions = { canRead: true, canWrite: false, canDelete: false, canExport: false },
    }: {
      userId: string;
      moduleId: string;
      permissions?: ModulePermissions;
    }) => {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');

      const { data, error } = await (supabase as any).rpc('assign_module_to_user', {
        p_user_id: userId,
        p_module_id: moduleId,
        p_assigned_by: currentUser.user.id,
        p_can_read: permissions.canRead,
        p_can_write: permissions.canWrite,
        p_can_delete: permissions.canDelete,
        p_can_export: permissions.canExport,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; message?: string };
      if (!result.success) {
        throw new Error(result.message || result.error || 'Erreur lors de l\'assignation');
      }

      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-assigned-modules', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['assignment-stats'] });
    },
  });
};

/**
 * Hook pour assigner une catégorie entière (via RPC)
 */
export const useAssignCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      categoryId,
      permissions = { canRead: true, canWrite: false, canDelete: false, canExport: false },
    }: {
      userId: string;
      categoryId: string;
      permissions?: ModulePermissions;
    }) => {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');

      const { data, error } = await (supabase as any).rpc('assign_category_to_user', {
        p_user_id: userId,
        p_category_id: categoryId,
        p_assigned_by: currentUser.user.id,
        p_can_read: permissions.canRead,
        p_can_write: permissions.canWrite,
        p_can_delete: permissions.canDelete,
        p_can_export: permissions.canExport,
      });

      if (error) throw error;

      const result = data as { 
        success: boolean; 
        assigned: number;
        skipped: number;
        error?: string; 
        message?: string;
      };
      
      if (!result.success) {
        throw new Error(result.message || result.error || 'Erreur lors de l\'assignation');
      }

      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-assigned-modules', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['assignment-stats'] });
    },
  });
};

/**
 * Hook pour assigner plusieurs modules (bulk)
 */
export const useBulkAssignModules = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      moduleIds,
      permissions = { canRead: true, canWrite: false, canDelete: false, canExport: false },
    }: {
      userId: string;
      moduleIds: string[];
      permissions?: ModulePermissions;
    }) => {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');

      let assigned = 0;
      let failed = 0;
      const errors: string[] = [];

      // Assigner chaque module séquentiellement
      for (const moduleId of moduleIds) {
        try {
          const { data, error } = await (supabase as any).rpc('assign_module_to_user', {
            p_user_id: userId,
            p_module_id: moduleId,
            p_assigned_by: currentUser.user.id,
            p_can_read: permissions.canRead,
            p_can_write: permissions.canWrite,
            p_can_delete: permissions.canDelete,
            p_can_export: permissions.canExport,
          });

          if (error) throw error;

          const result = data as { success: boolean; error?: string; message?: string };
          if (result.success) {
            assigned++;
          } else {
            failed++;
            errors.push(result.message || result.error || 'Erreur inconnue');
          }
        } catch (error: any) {
          failed++;
          errors.push(error.message);
        }
      }

      return {
        assigned,
        failed,
        errors,
        total: moduleIds.length,
      };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-assigned-modules', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['assignment-stats'] });
    },
  });
};

/**
 * Hook pour révoquer un module (via RPC)
 */
export const useRevokeModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      moduleId,
    }: {
      userId: string;
      moduleId: string;
    }) => {
      const { data, error } = await (supabase as any).rpc('revoke_module_from_user', {
        p_user_id: userId,
        p_module_id: moduleId,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; message?: string };
      if (!result.success) {
        throw new Error(result.message || result.error || 'Erreur lors de la révocation');
      }

      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-assigned-modules', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['assignment-stats'] });
    },
  });
};

/**
 * Hook pour mettre à jour les permissions (via RPC)
 */
export const useUpdatePermissions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      moduleId,
      permissions,
    }: {
      userId: string;
      moduleId: string;
      permissions: ModulePermissions;
    }) => {
      const { data, error } = await (supabase as any).rpc('update_module_permissions', {
        p_user_id: userId,
        p_module_id: moduleId,
        p_can_read: permissions.canRead,
        p_can_write: permissions.canWrite,
        p_can_delete: permissions.canDelete,
        p_can_export: permissions.canExport,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; message?: string };
      if (!result.success) {
        throw new Error(result.message || result.error || 'Erreur lors de la mise à jour');
      }

      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-assigned-modules', variables.userId] });
    },
  });
};

/**
 * Hooks pour gérer l'affectation des modules aux utilisateurs
 * Système flexible permettant à l'admin de groupe d'assigner librement les modules
 * @module useUserAssignedModules
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Type pour un module assigné avec permissions
 */
export interface AssignedModule {
  user_id: string;
  module_id: string;
  module_name: string;
  module_slug: string;
  category_id: string;
  category_name: string;
  assignment_type: 'direct' | 'category';
  can_read: boolean;
  can_write: boolean;
  can_delete: boolean;
  can_export: boolean;
  assigned_by: string;
  assigned_at: string;
  valid_until: string | null;
}

/**
 * Hook pour récupérer les modules assignés à un utilisateur
 */
export const useUserAssignedModules = (userId?: string) => {
  return useQuery({
    queryKey: ['user-assigned-modules', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID required');

      const { data, error } = await supabase
        .from('user_module_permissions')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      return (data || []) as AssignedModule[];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook pour assigner un module à un utilisateur
 */
export const useAssignModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      moduleId,
      permissions = { canRead: true, canWrite: false, canDelete: false, canExport: false },
      validUntil = null,
      notes = null,
    }: {
      userId: string;
      moduleId: string;
      permissions?: {
        canRead: boolean;
        canWrite: boolean;
        canDelete: boolean;
        canExport: boolean;
      };
      validUntil?: string | null;
      notes?: string | null;
    }) => {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('assign_module_to_user', {
        p_user_id: userId,
        p_module_id: moduleId,
        p_assigned_by: currentUser.user.id,
        p_can_read: permissions.canRead,
        p_can_write: permissions.canWrite,
        p_can_delete: permissions.canDelete,
        p_can_export: permissions.canExport,
        p_valid_until: validUntil,
        p_notes: notes,
      });

      if (error) throw error;
      
      // Vérifier le résultat de la fonction
      const result = data as { success: boolean; error?: string; message?: string };
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de l\'affectation');
      }
      
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-assigned-modules', variables.userId] });
    },
  });
};

/**
 * Hook pour révoquer un module d'un utilisateur
 */
export const useRevokeModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, moduleId }: { userId: string; moduleId: string }) => {
      const { data, error } = await supabase.rpc('revoke_module_from_user', {
        p_user_id: userId,
        p_module_id: moduleId,
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; message?: string };
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la révocation');
      }
      
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-assigned-modules', variables.userId] });
    },
  });
};

/**
 * Hook pour assigner plusieurs modules en masse
 */
export const useAssignMultipleModules = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      moduleIds,
      permissions,
    }: {
      userId: string;
      moduleIds: string[];
      permissions: {
        canRead: boolean;
        canWrite: boolean;
        canDelete: boolean;
        canExport: boolean;
      };
    }) => {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');

      console.log('🔄 Assignation de', moduleIds.length, 'modules à l\'utilisateur', userId);

      // Récupérer les informations des modules
      const { data: modules, error: modulesError } = await supabase
        .from('modules')
        .select('id, name, slug, category_id, business_categories!inner(id, name)')
        .in('id', moduleIds);

      if (modulesError) {
        console.error('❌ Erreur récupération modules:', modulesError);
        throw modulesError;
      }

      if (!modules || modules.length === 0) {
        throw new Error('Aucun module trouvé');
      }

      console.log('📦 Modules récupérés:', modules.length);

      // Préparer les données pour l'insertion
      const assignmentsData = modules.map((module: any) => ({
        user_id: userId,
        module_id: module.id,
        module_name: module.name,
        module_slug: module.slug,
        category_id: module.category_id,
        category_name: module.business_categories?.name || 'Sans catégorie',
        assignment_type: 'direct',
        can_read: permissions.canRead,
        can_write: permissions.canWrite,
        can_delete: permissions.canDelete,
        can_export: permissions.canExport,
        assigned_by: currentUser.user.id,
        assigned_at: new Date().toISOString(),
      }));

      // Insérer avec upsert pour éviter les doublons
      const { data, error } = await (supabase as any)
        .from('user_module_permissions')
        .upsert(assignmentsData, {
          onConflict: 'user_id,module_id',
          ignoreDuplicates: false,
        })
        .select();

      if (error) {
        console.error('❌ Erreur insertion permissions:', error);
        throw error;
      }

      console.log('✅ Permissions insérées:', data?.length || 0);

      return {
        success: true,
        total: moduleIds.length,
        assigned: data?.length || 0,
        failed: moduleIds.length - (data?.length || 0),
      };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-assigned-modules', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['assignment-stats'] });
    },
  });
};

/**
 * Hook pour assigner une catégorie complète à un utilisateur
 */
export const useAssignCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      categoryId,
      permissions = { canRead: true, canWrite: false, canDelete: false, canExport: false },
      validUntil = null,
      notes = null,
    }: {
      userId: string;
      categoryId: string;
      permissions?: {
        canRead: boolean;
        canWrite: boolean;
        canDelete: boolean;
        canExport: boolean;
      };
      validUntil?: string | null;
      notes?: string | null;
    }) => {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_assigned_categories')
        .insert({
          user_id: userId,
          category_id: categoryId,
          assigned_by: currentUser.user.id,
          default_can_read: permissions.canRead,
          default_can_write: permissions.canWrite,
          default_can_delete: permissions.canDelete,
          default_can_export: permissions.canExport,
          valid_until: validUntil,
          notes: notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-assigned-modules', variables.userId] });
    },
  });
};

/**
 * Hook pour récupérer les statistiques d'affectation d'un utilisateur
 */
export const useUserAssignmentStats = (userId?: string) => {
  return useQuery({
    queryKey: ['user-assignment-stats', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID required');

      const { data, error } = await supabase
        .from('user_module_permissions')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      const modules = data || [];
      
      return {
        totalModules: modules.length,
        directAssignments: modules.filter((m) => m.assignment_type === 'direct').length,
        categoryAssignments: modules.filter((m) => m.assignment_type === 'category').length,
        readOnly: modules.filter((m) => m.can_read && !m.can_write).length,
        fullAccess: modules.filter((m) => m.can_read && m.can_write && m.can_delete).length,
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
};

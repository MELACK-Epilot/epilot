/**
 * Hooks pour la gestion complète des modules utilisateurs
 * Utilise les fonctions RPC pour validation stricte
 * @module useModuleManagement
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

/**
 * Hook pour retirer un module d'un utilisateur (via RPC)
 */
export const useRemoveUserModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, moduleId }: { userId: string; moduleId: string }) => {
      const { data, error } = await (supabase as any).rpc('revoke_module_from_user', {
        p_user_id: userId,
        p_module_id: moduleId,
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; message?: string };
      if (!result.success) {
        throw new Error(result.error || result.message || 'Erreur lors de la révocation');
      }

      return { userId, moduleId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-assigned-modules', data.userId] });
      queryClient.invalidateQueries({ queryKey: ['assignment-stats'] });
      toast.success('Module retiré avec succès');
    },
    onError: (error: any) => {
      toast.error('Erreur lors du retrait du module', {
        description: error.message
      });
    }
  });
};

// Alias pour compatibilité
export const useRevokeModule = useRemoveUserModule;

/**
 * Hook pour modifier les permissions d'un module (via RPC)
 */
export const useUpdateModulePermissions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      moduleId, 
      permissions 
    }: { 
      userId: string; 
      moduleId: string; 
      permissions: {
        canRead: boolean;
        canWrite: boolean;
        canDelete: boolean;
        canExport: boolean;
      }
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
        throw new Error(result.error || result.message || 'Erreur lors de la mise à jour');
      }

      return { userId, moduleId, permissions };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-assigned-modules', data.userId] });
      toast.success('Permissions mises à jour');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la mise à jour', {
        description: error.message
      });
    }
  });
};

/**
 * Hook pour assignation en masse (via RPC)
 */
export const useBulkAssignModules = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      moduleIds, 
      permissions
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

      let assigned = 0;
      let failed = 0;
      const errors: string[] = [];

      // Assigner chaque module via RPC
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
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-assigned-modules', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['assignment-stats'] });
      
      if (data.failed > 0) {
        toast.warning(`${data.assigned} assigné(s), ${data.failed} échec(s)`);
      } else {
        toast.success(`${data.assigned} module(s) assigné(s) avec succès`);
      }
    },
    onError: (error: any) => {
      toast.error('Erreur lors de l\'assignation en masse', {
        description: error.message
      });
    }
  });
};

/**
 * Hook pour exporter les permissions (retourne les données brutes)
 */
export const useExportPermissions = () => {
  return async (schoolGroupId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_module_permissions')
        .select(`
          *,
          user:users!inner(first_name, last_name, email, role, school_group_id),
          module:modules(name, slug, category:business_categories(name))
        `)
        .eq('user.school_group_id', schoolGroupId);

      if (error) throw error;

      // Générer CSV
      const csv = generateCSV(data);
      downloadFile(csv, `permissions-export-${new Date().toISOString().split('T')[0]}.csv`);
      
      return data;
    } catch (error: any) {
      throw error;
    }
  };
};

/**
 * Hook pour récupérer les données d'export formatées
 */
export const useFetchExportData = () => {
  return async (schoolGroupId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_module_permissions')
        .select(`
          *,
          user:users!inner(first_name, last_name, email, role, school_group_id),
          module:modules(name, slug, category:business_categories(name))
        `)
        .eq('user.school_group_id', schoolGroupId);

      if (error) throw error;

      // Formater pour export
      return (data || []).map((item: any) => ({
        userName: `${item.user?.first_name || ''} ${item.user?.last_name || ''}`.trim(),
        email: item.user?.email || '',
        role: item.user?.role || '',
        moduleName: item.module?.name || '',
        categoryName: item.module?.category?.name || '',
        canRead: item.can_read,
        canWrite: item.can_write,
        canDelete: item.can_delete,
        canExport: item.can_export,
        assignedAt: new Date(item.assigned_at).toLocaleDateString('fr-FR'),
      }));
    } catch (error: any) {
      throw error;
    }
  };
};

/**
 * Générer CSV à partir des données
 */
function generateCSV(data: any[]): string {
  if (!data || data.length === 0) {
    return 'Aucune donnée à exporter';
  }

  // Headers
  const headers = [
    'Utilisateur',
    'Email',
    'Rôle',
    'Module',
    'Catégorie',
    'Lecture',
    'Écriture',
    'Suppression',
    'Export',
    'Assigné le'
  ];

  // Rows
  const rows = data.map(item => [
    `${item.user?.first_name || ''} ${item.user?.last_name || ''}`,
    item.user?.email || '',
    item.user?.role || '',
    item.module?.name || '',
    item.module?.category?.name || '',
    item.can_read ? 'Oui' : 'Non',
    item.can_write ? 'Oui' : 'Non',
    item.can_delete ? 'Oui' : 'Non',
    item.can_export ? 'Oui' : 'Non',
    new Date(item.assigned_at).toLocaleDateString('fr-FR')
  ]);

  // Combiner
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
}

/**
 * Télécharger fichier
 */
function downloadFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Hook React Query optimisé pour récupérer les modules selon le rôle utilisateur
 * Système intelligent avec cache et permissions granulaires
 * 
 * @module useRoleBasedModules
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/features/user-space/hooks/useCurrentUser';
import { usePermissionsStore } from '@/stores/permissions.store';
import type { AssignedModule } from '@/stores/permissions.store';

/**
 * Clés de cache pour React Query
 */
export const moduleKeys = {
  all: ['modules'] as const,
  byUser: (userId: string) => [...moduleKeys.all, 'user', userId] as const,
  byRole: (role: string) => [...moduleKeys.all, 'role', role] as const,
  byGroup: (groupId: string) => [...moduleKeys.all, 'group', groupId] as const,
  permissions: (userId: string) => [...moduleKeys.all, 'permissions', userId] as const,
};

/**
 * Hook principal pour récupérer les modules assignés à l'utilisateur
 */
export const useUserAssignedModules = () => {
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: moduleKeys.byUser(user?.id || ''),
    queryFn: async (): Promise<AssignedModule[]> => {
      if (!user?.id) {
        throw new Error('Utilisateur non connecté');
      }

      console.log('🔄 [useUserAssignedModules] Chargement pour:', user.id);

      // Récupérer les modules via user_module_permissions
      const { data, error } = await supabase
        .from('user_module_permissions')
        .select(`
          *,
          modules!inner(
            id,
            name,
            slug,
            description,
            icon,
            color,
            category_id,
            version,
            status,
            required_plan,
            is_core,
            business_categories!inner(
              id,
              name,
              slug,
              icon,
              color
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('modules.status', 'active')
        .order('modules(name)', { ascending: true });

      if (error) {
        console.error('❌ [useUserAssignedModules] Erreur:', error);
        throw error;
      }

      // Transformer les données
      const assignedModules: AssignedModule[] = (data || []).map((um: any) => ({
        id: um.modules.id,
        name: um.modules.name,
        slug: um.modules.slug,
        description: um.modules.description,
        icon: um.modules.icon,
        color: um.modules.color,
        categoryId: um.modules.category_id,
        categoryName: um.modules.business_categories?.name || 'Sans catégorie',
        categorySlug: um.modules.business_categories?.slug || '',
        isCore: um.modules.is_core,
        version: um.modules.version,
        status: um.modules.status,
        requiredPlan: um.modules.required_plan,
        permissions: {
          moduleId: um.module_id,
          moduleSlug: um.module_slug,
          moduleName: um.module_name,
          canRead: um.can_read,
          canWrite: um.can_write,
          canDelete: um.can_delete,
          canExport: um.can_export,
          canManage: um.can_manage || false,
          assignedAt: um.assigned_at,
          assignedBy: um.assigned_by,
          validUntil: um.valid_until,
          isEnabled: true,
        },
        lastAccessedAt: um.last_accessed_at,
        accessCount: um.access_count || 0,
      }));

      console.log('✅ [useUserAssignedModules] Modules chargés:', assignedModules.length);
      return assignedModules;
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    onSuccess: (data) => {
      // Mettre à jour le store Zustand
      const store = usePermissionsStore.getState();
      if (data && data.length > 0) {
        const modulePermissions = data.reduce((acc, module) => ({
          ...acc,
          [module.slug]: module.permissions
        }), {});
        
        store.updateUserRole({
          role: user?.role || '',
          schoolGroupId: user?.schoolGroupId,
          schoolId: user?.schoolId,
          permissions: {
            canManageUsers: false,
            canManageModules: false,
            canManageSchools: false,
            canManageFinances: false,
            canViewReports: false,
            canExportData: false,
            academic: {
              canManageClasses: false,
              canManageStudents: false,
              canManageGrades: false,
              canManageSchedule: false,
            },
            administrative: {
              canManageStaff: false,
              canManagePayroll: false,
              canManageInventory: false,
              canManageDocuments: false,
            },
            financial: {
              canViewBudget: false,
              canManageBudget: false,
              canViewPayments: false,
              canManagePayments: false,
            },
          },
        });
      }
    },
  });
};

/**
 * Hook pour récupérer les modules disponibles selon le plan du groupe
 */
export const useAvailableModulesByGroup = (schoolGroupId?: string) => {
  return useQuery({
    queryKey: moduleKeys.byGroup(schoolGroupId || ''),
    queryFn: async () => {
      if (!schoolGroupId) {
        throw new Error('ID du groupe scolaire requis');
      }

      console.log('🔄 [useAvailableModulesByGroup] Chargement pour groupe:', schoolGroupId);

      // Récupérer les modules disponibles via group_module_configs
      const { data, error } = await supabase
        .from('group_module_configs')
        .select(`
          is_enabled,
          modules!inner(
            id,
            name,
            slug,
            description,
            icon,
            color,
            category_id,
            version,
            status,
            required_plan,
            is_core,
            business_categories!inner(
              id,
              name,
              slug,
              icon,
              color
            )
          )
        `)
        .eq('school_group_id', schoolGroupId)
        .eq('modules.status', 'active')
        .order('modules(name)', { ascending: true });

      if (error) {
        console.error('❌ [useAvailableModulesByGroup] Erreur:', error);
        throw error;
      }

      const modules = (data || [])
        .filter(item => item.modules && item.is_enabled)
        .map(item => ({
          ...item.modules,
          isEnabled: item.is_enabled,
        }));

      console.log('✅ [useAvailableModulesByGroup] Modules disponibles:', modules.length);
      return modules;
    },
    enabled: !!schoolGroupId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook pour vérifier si un utilisateur a accès à un module spécifique
 */
export const useHasModule = (moduleSlug: string) => {
  const { data: modules } = useUserAssignedModules();
  
  return {
    hasAccess: modules?.some(m => m.slug === moduleSlug && m.permissions.isEnabled) || false,
    module: modules?.find(m => m.slug === moduleSlug),
    canRead: modules?.find(m => m.slug === moduleSlug)?.permissions.canRead || false,
    canWrite: modules?.find(m => m.slug === moduleSlug)?.permissions.canWrite || false,
    canDelete: modules?.find(m => m.slug === moduleSlug)?.permissions.canDelete || false,
    canExport: modules?.find(m => m.slug === moduleSlug)?.permissions.canExport || false,
  };
};

/**
 * Hook pour vérifier plusieurs modules à la fois
 */
export const useHasModules = (moduleSlugs: string[]) => {
  const { data: modules } = useUserAssignedModules();
  
  return moduleSlugs.reduce((acc, slug) => {
    const module = modules?.find(m => m.slug === slug);
    return {
      ...acc,
      [slug]: {
        hasAccess: module?.permissions.isEnabled || false,
        module,
        canRead: module?.permissions.canRead || false,
        canWrite: module?.permissions.canWrite || false,
        canDelete: module?.permissions.canDelete || false,
        canExport: module?.permissions.canExport || false,
      }
    };
  }, {} as Record<string, {
    hasAccess: boolean;
    module?: AssignedModule;
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
    canExport: boolean;
  }>);
};

/**
 * Hook pour récupérer les statistiques des modules utilisateur
 */
export const useUserModuleStats = () => {
  const { data: modules, isLoading } = useUserAssignedModules();
  
  const stats = {
    totalModules: modules?.length || 0,
    enabledModules: modules?.filter(m => m.permissions.isEnabled).length || 0,
    readOnlyModules: modules?.filter(m => 
      m.permissions.canRead && !m.permissions.canWrite && !m.permissions.canDelete
    ).length || 0,
    fullAccessModules: modules?.filter(m => 
      m.permissions.canRead && m.permissions.canWrite && m.permissions.canDelete
    ).length || 0,
    coreModules: modules?.filter(m => m.isCore).length || 0,
    lastAccessedModule: modules?.reduce((latest, current) => {
      if (!latest || !current.lastAccessedAt) return latest;
      return new Date(current.lastAccessedAt) > new Date(latest.lastAccessedAt || 0) 
        ? current : latest;
    }, undefined as AssignedModule | undefined),
  };

  return { stats, isLoading };
};

/**
 * Hook pour invalider le cache des modules
 */
export const useInvalidateModules = () => {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();

  return {
    invalidateUserModules: () => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: moduleKeys.byUser(user.id) });
      }
    },
    invalidateGroupModules: (groupId: string) => {
      queryClient.invalidateQueries({ queryKey: moduleKeys.byGroup(groupId) });
    },
    invalidateAllModules: () => {
      queryClient.invalidateQueries({ queryKey: moduleKeys.all });
    },
  };
};

/**
 * Hook pour précharger les modules (optimisation)
 */
export const usePrefetchModules = () => {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();

  const prefetchUserModules = async (userId: string) => {
    await queryClient.prefetchQuery({
      queryKey: moduleKeys.byUser(userId),
      staleTime: 2 * 60 * 1000,
    });
  };

  const prefetchGroupModules = async (groupId: string) => {
    await queryClient.prefetchQuery({
      queryKey: moduleKeys.byGroup(groupId),
      staleTime: 5 * 60 * 1000,
    });
  };

  return {
    prefetchUserModules,
    prefetchGroupModules,
    prefetchCurrentUser: () => {
      if (user?.id) {
        prefetchUserModules(user.id);
      }
      if (user?.schoolGroupId) {
        prefetchGroupModules(user.schoolGroupId);
      }
    },
  };
};

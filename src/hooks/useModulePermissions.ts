/**
 * Hooks simplifiés pour les permissions de modules
 * Utilise le store Zustand centralisé
 * 
 * @module useModulePermissions
 */

import { usePermissionsStore } from '@/stores/permissions.store';
import { useCurrentUser } from '@/features/user-space/hooks/useCurrentUser';
import { useEffect } from 'react';

/**
 * Hook principal pour les modules utilisateur
 */
export const useUserModules = () => {
  const { data: user } = useCurrentUser();
  const {
    assignedModules,
    isLoading,
    isInitialized,
    error,
    initialize,
    reset,
  } = usePermissionsStore();

  // Auto-initialisation
  useEffect(() => {
    if (user?.id && !isInitialized) {
      initialize(user.id);
    } else if (!user?.id && isInitialized) {
      reset();
    }
  }, [user?.id, isInitialized, initialize, reset]);

  return {
    modules: assignedModules,
    isLoading,
    error,
    isInitialized,
  };
};

/**
 * Hook pour vérifier l'accès à un module
 */
export const useHasModuleAccess = (moduleSlug: string) => {
  const { hasModule, canAccessModule, getModuleBySlug } = usePermissionsStore();
  
  const module = getModuleBySlug(moduleSlug);
  
  return {
    hasAccess: hasModule(moduleSlug),
    canRead: canAccessModule(moduleSlug, 'read'),
    canWrite: canAccessModule(moduleSlug, 'write'),
    canDelete: canAccessModule(moduleSlug, 'delete'),
    canExport: canAccessModule(moduleSlug, 'export'),
    module,
  };
};

/**
 * Hook pour vérifier plusieurs modules
 */
export const useMultipleModulesAccess = (moduleSlugs: string[]) => {
  const { hasModules } = usePermissionsStore();
  
  return hasModules(moduleSlugs);
};

/**
 * Hook pour les statistiques des modules
 */
export const useModulesStats = () => {
  const { getPermissionsSummary } = usePermissionsStore();
  
  return getPermissionsSummary();
};

/**
 * Hook pour tracker l'accès aux modules
 */
export const useModuleTracker = () => {
  const { trackModuleAccess } = usePermissionsStore();
  
  return {
    track: trackModuleAccess,
    trackAndExecute: async (moduleSlug: string, callback: () => void) => {
      await trackModuleAccess(moduleSlug);
      callback();
    },
  };
};

/**
 * Hook pour rafraîchir les modules
 */
export const useRefreshUserModules = () => {
  const { refreshModules } = usePermissionsStore();
  
  return refreshModules;
};

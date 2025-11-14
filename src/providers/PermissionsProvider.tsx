/**
 * Provider unifié pour la gestion des permissions et modules
 * Remplace l'ancien système avec une architecture plus robuste
 * Intégration Zustand + React Query + Context
 * 
 * @module PermissionsProvider
 */

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/features/user-space/hooks/useCurrentUser';
import { usePermissionsStore } from '@/stores/permissions.store';
import type { AssignedModule } from '@/stores/permissions.store';

/**
 * Interface du contexte
 */
interface PermissionsContextValue {
  // État
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  
  // Modules
  modules: AssignedModule[];
  
  // Fonctions utilitaires
  hasModule: (slug: string) => boolean;
  hasModules: (slugs: string[]) => Record<string, boolean>;
  canAccessModule: (slug: string, action: 'read' | 'write' | 'delete' | 'export') => boolean;
  getModuleBySlug: (slug: string) => AssignedModule | undefined;
  getModulesByCategory: (categoryId: string) => AssignedModule[];
  
  // Actions
  refreshModules: () => Promise<void>;
  trackModuleAccess: (slug: string) => Promise<void>;
  
  // Statistiques
  getPermissionsSummary: () => {
    totalModules: number;
    enabledModules: number;
    readOnlyModules: number;
    fullAccessModules: number;
    categoriesCount: number;
  };
}

/**
 * Contexte des permissions
 */
const PermissionsContext = createContext<PermissionsContextValue | undefined>(undefined);

/**
 * Props du Provider
 */
interface PermissionsProviderProps {
  children: ReactNode;
}

/**
 * Provider unifié des permissions
 */
export const PermissionsProvider: React.FC<PermissionsProviderProps> = ({ children }) => {
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const queryClient = useQueryClient();
  
  // Store Zustand
  const {
    isLoading,
    isInitialized,
    error,
    assignedModules,
    initialize,
    reset,
    hasModule,
    hasModules,
    canAccessModule,
    getModuleBySlug,
    getModulesByCategory,
    refreshModules,
    trackModuleAccess,
    getPermissionsSummary,
  } = usePermissionsStore();

  /**
   * Initialiser le store quand l'utilisateur est chargé
   */
  useEffect(() => {
    if (user?.id && !isInitialized) {
      console.log('🚀 [PermissionsProvider] Initialisation pour:', user.id);
      initialize(user.id);
    } else if (!user?.id && isInitialized) {
      console.log('🔄 [PermissionsProvider] Reset - utilisateur déconnecté');
      reset();
    }
  }, [user?.id, isInitialized, initialize, reset]);

  /**
   * Nettoyer lors du démontage
   */
  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  /**
   * Valeur du contexte
   */
  const contextValue: PermissionsContextValue = {
    // État
    isLoading: userLoading || isLoading,
    isInitialized,
    error,
    
    // Modules
    modules: assignedModules,
    
    // Fonctions utilitaires
    hasModule,
    hasModules,
    canAccessModule,
    getModuleBySlug,
    getModulesByCategory,
    
    // Actions
    refreshModules,
    trackModuleAccess,
    
    // Statistiques
    getPermissionsSummary,
  };

  return (
    <PermissionsContext.Provider value={contextValue}>
      {children}
    </PermissionsContext.Provider>
  );
};

/**
 * Hook pour utiliser le contexte des permissions
 */
export const usePermissions = (): PermissionsContextValue => {
  const context = useContext(PermissionsContext);
  
  if (context === undefined) {
    throw new Error('usePermissions must be used within PermissionsProvider');
  }
  
  return context;
};

/**
 * Hook simplifié pour vérifier un module
 */
export const useHasModule = (slug: string): boolean => {
  const { hasModule } = usePermissions();
  return hasModule(slug);
};

/**
 * Hook simplifié pour vérifier plusieurs modules
 */
export const useHasModules = (slugs: string[]): Record<string, boolean> => {
  const { hasModules } = usePermissions();
  return hasModules(slugs);
};

/**
 * Hook pour vérifier une permission spécifique
 */
export const useCanAccessModule = (slug: string, action: 'read' | 'write' | 'delete' | 'export'): boolean => {
  const { canAccessModule } = usePermissions();
  return canAccessModule(slug, action);
};

/**
 * Hook pour récupérer un module spécifique
 */
export const useModule = (slug: string): AssignedModule | undefined => {
  const { getModuleBySlug } = usePermissions();
  return getModuleBySlug(slug);
};

/**
 * Hook pour récupérer les modules par catégorie
 */
export const useModulesByCategory = (categoryId: string): AssignedModule[] => {
  const { getModulesByCategory } = usePermissions();
  return getModulesByCategory(categoryId);
};

/**
 * Hook pour les statistiques des permissions
 */
export const usePermissionsStats = () => {
  const { getPermissionsSummary, isLoading } = usePermissions();
  return {
    stats: getPermissionsSummary(),
    isLoading,
  };
};

/**
 * Hook pour tracker l'accès aux modules
 */
export const useTrackModuleAccess = () => {
  const { trackModuleAccess } = usePermissions();
  
  return {
    trackAccess: trackModuleAccess,
    trackAndNavigate: async (slug: string, navigateFn: () => void) => {
      await trackModuleAccess(slug);
      navigateFn();
    },
  };
};

/**
 * Hook pour rafraîchir les modules
 */
export const useRefreshModules = () => {
  const { refreshModules } = usePermissions();
  return refreshModules;
};

/**
 * HOC pour protéger les composants avec des permissions
 */
export const withModulePermission = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredModule: string,
  requiredAction: 'read' | 'write' | 'delete' | 'export' = 'read'
) => {
  const WithPermissionComponent: React.FC<P> = (props) => {
    const canAccess = useCanAccessModule(requiredModule, requiredAction);
    
    if (!canAccess) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-gray-400 mb-2">🔒</div>
            <p className="text-gray-600">Accès non autorisé</p>
            <p className="text-sm text-gray-500">
              Vous n'avez pas les permissions nécessaires pour accéder à ce module.
            </p>
          </div>
        </div>
      );
    }
    
    return <WrappedComponent {...props} />;
  };
  
  WithPermissionComponent.displayName = `withModulePermission(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithPermissionComponent;
};

/**
 * Composant pour afficher conditionnellement selon les permissions
 */
interface ConditionalRenderProps {
  module: string;
  action?: 'read' | 'write' | 'delete' | 'export';
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const ConditionalRender: React.FC<ConditionalRenderProps> = ({
  module,
  action = 'read',
  fallback = null,
  children,
}) => {
  const canAccess = useCanAccessModule(module, action);
  
  return canAccess ? <>{children}</> : <>{fallback}</>;
};

/**
 * Hook pour les modules par rôle (compatibilité avec l'ancien système)
 */
export const useUserModulesContext = () => {
  const permissions = usePermissions();
  
  return {
    modules: permissions.modules,
    isLoading: permissions.isLoading,
    error: permissions.error ? new Error(permissions.error) : null,
    hasModule: permissions.hasModule,
    hasModules: permissions.hasModules,
    getModuleBySlug: permissions.getModuleBySlug,
    getModulesByCategory: permissions.getModulesByCategory,
    refreshModules: permissions.refreshModules,
    trackModuleAccess: permissions.trackModuleAccess,
  };
};

/**
 * Hooks de compatibilité avec l'ancien système
 */
export const useHasModuleRT = (slug: string): boolean => {
  return useHasModule(slug);
};

export const useHasModulesRT = (slugs: string[]): Record<string, boolean> => {
  return useHasModules(slugs);
};

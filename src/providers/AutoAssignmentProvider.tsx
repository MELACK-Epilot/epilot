/**
 * Provider automatique pour l'assignation de modules
 * Système temps réel qui se synchronise automatiquement
 * @module AutoAssignmentProvider
 */

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuth } from '@/features/auth/store/auth.store';
import { useAutoSyncAssignmentStore } from '@/stores/autoSyncAssignment.store';
import type { 
  UserWithModulesSimple, 
  AvailableModuleSimple,
  AssignedModuleSimple 
} from '@/stores/autoSyncAssignment.store';

/**
 * Interface du contexte automatique
 */
interface AutoAssignmentContextValue {
  // Données synchronisées automatiquement
  users: UserWithModulesSimple[];
  availableModules: AvailableModuleSimple[];
  
  // États
  isLoading: boolean;
  error: string | null;
  lastSyncAt: string | null;
  
  // Actions simples
  assignModule: (userId: string, moduleId: string) => Promise<void>;
  revokeModule: (userId: string, moduleId: string) => Promise<void>;
  
  // Utilitaires
  getUserById: (userId: string) => UserWithModulesSimple | undefined;
  getModuleById: (moduleId: string) => AvailableModuleSimple | undefined;
  getUsersWithModule: (moduleId: string) => UserWithModulesSimple[];
  getAssignmentStats: () => {
    totalUsers: number;
    totalModules: number;
    totalAssignments: number;
    usersWithModules: number;
  };
}

/**
 * Contexte
 */
const AutoAssignmentContext = createContext<AutoAssignmentContextValue | undefined>(undefined);

/**
 * Props du Provider
 */
interface AutoAssignmentProviderProps {
  children: ReactNode;
}

/**
 * Provider automatique
 */
export const AutoAssignmentProvider = ({ children }: AutoAssignmentProviderProps) => {
  const { user } = useAuth();
  
  // Store auto-sync
  const {
    users,
    availableModules,
    isLoading,
    error,
    lastSyncAt,
    initialize,
    assignModuleToUser,
    revokeModuleFromUser,
    getUserById,
    getModuleById,
    getUsersWithModule,
    cleanup
  } = useAutoSyncAssignmentStore();

  // Auto-initialisation
  useEffect(() => {
    if (user?.schoolGroupId && user?.role?.toString() === 'admin_groupe') {
      console.log('🚀 [AutoAssignment] Auto-initialisation pour:', user.schoolGroupId);
      
      // Initialiser le système automatique
      initialize(user.schoolGroupId);
      
      // Nettoyage automatique
      return () => {
        console.log('🧹 [AutoAssignment] Auto-nettoyage');
        cleanup();
      };
    }
  }, [user?.schoolGroupId, user?.role, initialize, cleanup]);

  /**
   * Assigner un module (action simplifiée)
   */
  const assignModule = async (userId: string, moduleId: string) => {
    try {
      await assignModuleToUser(userId, moduleId);
      console.log('✅ [AutoAssignment] Module assigné avec succès');
    } catch (error: any) {
      console.error('❌ [AutoAssignment] Erreur assignation:', error);
      throw error;
    }
  };

  /**
   * Révoquer un module (action simplifiée)
   */
  const revokeModule = async (userId: string, moduleId: string) => {
    try {
      await revokeModuleFromUser(userId, moduleId);
      console.log('✅ [AutoAssignment] Module révoqué avec succès');
    } catch (error: any) {
      console.error('❌ [AutoAssignment] Erreur révocation:', error);
      throw error;
    }
  };

  /**
   * Statistiques automatiques
   */
  const getAssignmentStats = () => {
    const totalUsers = users.length;
    const totalModules = availableModules.length;
    const totalAssignments = users.reduce((sum, user) => sum + user.assignedModulesCount, 0);
    const usersWithModules = users.filter(user => user.assignedModulesCount > 0).length;
    
    return {
      totalUsers,
      totalModules,
      totalAssignments,
      usersWithModules,
    };
  };

  // Valeur du contexte
  const contextValue: AutoAssignmentContextValue = {
    // Données
    users,
    availableModules,
    
    // États
    isLoading,
    error,
    lastSyncAt,
    
    // Actions
    assignModule,
    revokeModule,
    
    // Utilitaires
    getUserById,
    getModuleById,
    getUsersWithModule,
    getAssignmentStats,
  };

  return (
    <AutoAssignmentContext.Provider value={contextValue}>
      {children}
    </AutoAssignmentContext.Provider>
  );
};

/**
 * Hook pour utiliser l'assignation automatique
 */
export const useAutoAssignment = () => {
  const context = useContext(AutoAssignmentContext);
  
  if (context === undefined) {
    throw new Error('useAutoAssignment must be used within an AutoAssignmentProvider');
  }
  
  return context;
};

/**
 * Hook compatible avec l'ancien système
 */
export const useUserAssignedModulesAuto = (userId?: string) => {
  const { users, isLoading, error } = useAutoAssignment();

  const data = users.find(u => u.id === userId)?.assignedModules || [];

  return {
    data,
    isLoading,
    error: error ? new Error(error) : null,
  };
};

/**
 * Hook pour assigner des modules (compatible)
 */
export const useAssignModuleAuto = () => {
  const { assignModule, isLoading } = useAutoAssignment();

  return {
    mutateAsync: async ({ userId, moduleId }: { userId: string; moduleId: string }) => {
      await assignModule(userId, moduleId);
      return { success: true };
    },
    isPending: isLoading,
  };
};

/**
 * Hook pour les modules disponibles (compatible)
 */
export const useAvailableModulesAuto = (schoolGroupId?: string) => {
  const { availableModules, isLoading, error } = useAutoAssignment();

  const data = {
    availableModules: availableModules.map(module => ({
      ...module,
      category: {
        id: module.category_id,
        name: module.category_name,
        slug: module.category_name.toLowerCase().replace(/\s+/g, '-'),
        color: '#2A9D8F',
      }
    })),
    totalModules: availableModules.length,
  };

  return {
    data: schoolGroupId ? data : { availableModules: [], totalModules: 0 },
    isLoading,
    error: error ? new Error(error) : null,
  };
};

/**
 * Hook pour les utilisateurs (compatible)
 */
export const useUsersAuto = ({ schoolGroupId }: { schoolGroupId?: string }) => {
  const { users, isLoading, error } = useAutoAssignment();

  const data = {
    users: users.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      schoolName: '', // Valeur par défaut
      status: 'active' as const,
      assignedModulesCount: user.assignedModulesCount,
      lastModuleAssignedAt: user.assignedModules.length > 0 
        ? user.assignedModules[0].assigned_at 
        : undefined,
      createdAt: new Date().toISOString(),
    }))
  };

  return {
    data: schoolGroupId ? data : { users: [] },
    isLoading,
    error: error ? new Error(error) : null,
    refetch: () => Promise.resolve(),
  };
};

/**
 * Hook pour les statistiques (compatible)
 */
export const useAssignmentStatsAuto = (schoolGroupId?: string) => {
  const { getAssignmentStats, isLoading, lastSyncAt } = useAutoAssignment();

  const data = schoolGroupId ? {
    ...getAssignmentStats(),
    lastAssignmentDate: lastSyncAt,
  } : null;

  return {
    data,
    isLoading,
  };
};

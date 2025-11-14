/**
 * Provider pour la gestion cohérente de l'assignation de modules par l'Admin Groupe
 * Utilise le store Zustand unifié et la table user_modules
 * @module AdminGroupAssignmentProvider
 */

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuth } from '@/features/auth/store/auth.store';
import { useAdminGroupAssignmentStore } from '@/stores/adminGroupAssignment.store';
import type { 
  AssignableModule, 
  UserWithModules, 
  AssignmentPermissions 
} from '@/stores/adminGroupAssignment.store';

/**
 * Interface du contexte
 */
interface AdminGroupAssignmentContextValue {
  // Données
  availableModules: AssignableModule[];
  users: UserWithModules[];
  selectedUser: UserWithModules | null;
  
  // États
  isLoadingModules: boolean;
  isLoadingUsers: boolean;
  isAssigning: boolean;
  error: string | null;
  
  // Filtres
  searchQuery: string;
  selectedCategory: string;
  selectedRole: string;
  
  // Actions
  loadData: () => Promise<void>;
  assignModulesToUser: (userId: string, moduleIds: string[], permissions: AssignmentPermissions) => Promise<void>;
  assignCategoryToUser: (userId: string, categoryId: string, permissions: AssignmentPermissions) => Promise<void>;
  revokeModuleFromUser: (userId: string, moduleId: string) => Promise<void>;
  setSelectedUser: (user: UserWithModules | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (categoryId: string) => void;
  setSelectedRole: (role: string) => void;
  
  // Utilitaires
  getUserById: (userId: string) => UserWithModules | undefined;
  getModuleById: (moduleId: string) => AssignableModule | undefined;
  getModulesByCategory: (categoryId: string) => AssignableModule[];
  getCategories: () => Array<{ id: string; name: string; slug: string; moduleCount: number }>;
  getUsersWithModule: (moduleId: string) => UserWithModules[];
  getAssignmentStats: () => {
    totalUsers: number;
    totalModules: number;
    totalAssignments: number;
    usersWithModules: number;
    averageModulesPerUser: number;
  };
}

/**
 * Contexte
 */
const AdminGroupAssignmentContext = createContext<AdminGroupAssignmentContextValue | undefined>(undefined);

/**
 * Props du Provider
 */
interface AdminGroupAssignmentProviderProps {
  children: ReactNode;
}

/**
 * Provider principal
 */
export const AdminGroupAssignmentProvider = ({ children }: AdminGroupAssignmentProviderProps) => {
  const { user } = useAuth();
  
  // Store Zustand
  const {
    availableModules,
    users,
    selectedUser,
    isLoadingModules,
    isLoadingUsers,
    isAssigning,
    error,
    searchQuery,
    selectedCategory,
    selectedRole,
    loadAvailableModules,
    loadUsers,
    assignModulesToUser,
    assignCategoryToUser,
    revokeModuleFromUser,
    setSelectedUser,
    setSearchQuery,
    setSelectedCategory,
    setSelectedRole,
    setupRealtimeSubscription,
    cleanup
  } = useAdminGroupAssignmentStore();

  // Initialisation et nettoyage
  useEffect(() => {
    if (user?.schoolGroupId && user?.role === 'admin_groupe') {
      console.log('🚀 [AdminAssignmentProvider] Initialisation pour groupe:', user.schoolGroupId);
      
      // Charger les données initiales
      loadData();
      
      // Configurer le temps réel
      setupRealtimeSubscription(user.schoolGroupId);
      
      // Nettoyage à la déconnexion
      return () => {
        console.log('🧹 [AdminAssignmentProvider] Nettoyage');
        cleanup();
      };
    }
  }, [user?.schoolGroupId, user?.role]);

  /**
   * Charger toutes les données
   */
  const loadData = async () => {
    if (!user?.schoolGroupId) return;
    
    try {
      console.log('🔄 [AdminAssignmentProvider] Chargement des données...');
      
      // Charger en parallèle pour optimiser les performances
      await Promise.all([
        loadAvailableModules(user.schoolGroupId),
        loadUsers(user.schoolGroupId)
      ]);
      
      console.log('✅ [AdminAssignmentProvider] Données chargées');
    } catch (error) {
      console.error('❌ [AdminAssignmentProvider] Erreur chargement:', error);
    }
  };

  /**
   * Obtenir un utilisateur par ID
   */
  const getUserById = (userId: string): UserWithModules | undefined => {
    return users.find(u => u.id === userId);
  };

  /**
   * Obtenir un module par ID
   */
  const getModuleById = (moduleId: string): AssignableModule | undefined => {
    return availableModules.find(m => m.id === moduleId);
  };

  /**
   * Obtenir les modules d'une catégorie
   */
  const getModulesByCategory = (categoryId: string): AssignableModule[] => {
    return availableModules.filter(m => m.category_id === categoryId);
  };

  /**
   * Obtenir la liste des catégories avec compteurs
   */
  const getCategories = () => {
    const categoriesMap = new Map<string, { id: string; name: string; slug: string; moduleCount: number }>();
    
    availableModules.forEach(module => {
      const categoryId = module.category_id;
      if (!categoriesMap.has(categoryId)) {
        categoriesMap.set(categoryId, {
          id: categoryId,
          name: module.category_name,
          slug: module.category_slug,
          moduleCount: 0
        });
      }
      const category = categoriesMap.get(categoryId)!;
      category.moduleCount++;
    });
    
    return Array.from(categoriesMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  };

  /**
   * Obtenir les utilisateurs qui ont un module spécifique
   */
  const getUsersWithModule = (moduleId: string): UserWithModules[] => {
    return users.filter(user => 
      user.assignedModules.some(assignment => assignment.module_id === moduleId)
    );
  };

  /**
   * Obtenir les statistiques d'assignation
   */
  const getAssignmentStats = () => {
    const totalUsers = users.length;
    const totalModules = availableModules.length;
    const totalAssignments = users.reduce((sum, user) => sum + user.assignedModulesCount, 0);
    const usersWithModules = users.filter(user => user.assignedModulesCount > 0).length;
    const averageModulesPerUser = totalUsers > 0 ? totalAssignments / totalUsers : 0;
    
    return {
      totalUsers,
      totalModules,
      totalAssignments,
      usersWithModules,
      averageModulesPerUser: Math.round(averageModulesPerUser * 100) / 100
    };
  };

  // Valeur du contexte
  const contextValue: AdminGroupAssignmentContextValue = {
    // Données
    availableModules,
    users,
    selectedUser,
    
    // États
    isLoadingModules,
    isLoadingUsers,
    isAssigning,
    error,
    
    // Filtres
    searchQuery,
    selectedCategory,
    selectedRole,
    
    // Actions
    loadData,
    assignModulesToUser,
    assignCategoryToUser,
    revokeModuleFromUser,
    setSelectedUser,
    setSearchQuery,
    setSelectedCategory,
    setSelectedRole,
    
    // Utilitaires
    getUserById,
    getModuleById,
    getModulesByCategory,
    getCategories,
    getUsersWithModule,
    getAssignmentStats
  };

  return (
    <AdminGroupAssignmentContext.Provider value={contextValue}>
      {children}
    </AdminGroupAssignmentContext.Provider>
  );
};

/**
 * Hook pour utiliser le contexte d'assignation
 */
export const useAdminGroupAssignment = () => {
  const context = useContext(AdminGroupAssignmentContext);
  
  if (context === undefined) {
    throw new Error('useAdminGroupAssignment must be used within an AdminGroupAssignmentProvider');
  }
  
  return context;
};

/**
 * Hook pour les actions d'assignation avec gestion d'erreurs
 */
export const useAssignmentActions = () => {
  const { 
    assignModulesToUser, 
    assignCategoryToUser, 
    revokeModuleFromUser,
    isAssigning,
    error 
  } = useAdminGroupAssignment();

  /**
   * Assigner des modules avec gestion d'erreurs
   */
  const assignModules = async (
    userId: string, 
    moduleIds: string[], 
    permissions: AssignmentPermissions
  ) => {
    try {
      await assignModulesToUser(userId, moduleIds, permissions);
      return { success: true, error: null };
    } catch (error: any) {
      console.error('❌ Erreur assignation modules:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Assigner une catégorie avec gestion d'erreurs
   */
  const assignCategory = async (
    userId: string, 
    categoryId: string, 
    permissions: AssignmentPermissions
  ) => {
    try {
      await assignCategoryToUser(userId, categoryId, permissions);
      return { success: true, error: null };
    } catch (error: any) {
      console.error('❌ Erreur assignation catégorie:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Révoquer un module avec gestion d'erreurs
   */
  const revokeModule = async (userId: string, moduleId: string) => {
    try {
      await revokeModuleFromUser(userId, moduleId);
      return { success: true, error: null };
    } catch (error: any) {
      console.error('❌ Erreur révocation module:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    assignModules,
    assignCategory,
    revokeModule,
    isAssigning,
    error
  };
};

/**
 * Hook pour les filtres et recherche
 */
export const useAssignmentFilters = () => {
  const {
    searchQuery,
    selectedCategory,
    selectedRole,
    setSearchQuery,
    setSelectedCategory,
    setSelectedRole,
    users,
    availableModules,
    getCategories
  } = useAdminGroupAssignment();

  /**
   * Filtrer les utilisateurs selon les critères
   */
  const filteredUsers = users.filter(user => {
    // Filtre recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchName = `${user.firstName} ${user.lastName}`.toLowerCase().includes(query);
      const matchEmail = user.email.toLowerCase().includes(query);
      if (!matchName && !matchEmail) return false;
    }

    // Filtre rôle
    if (selectedRole !== 'all' && user.role !== selectedRole) {
      return false;
    }

    return true;
  });

  /**
   * Filtrer les modules selon la catégorie
   */
  const filteredModules = selectedCategory === 'all' 
    ? availableModules 
    : availableModules.filter(m => m.category_id === selectedCategory);

  /**
   * Obtenir les rôles disponibles
   */
  const availableRoles = Array.from(new Set(users.map(u => u.role))).sort();

  return {
    searchQuery,
    selectedCategory,
    selectedRole,
    setSearchQuery,
    setSelectedCategory,
    setSelectedRole,
    filteredUsers,
    filteredModules,
    availableRoles,
    categories: getCategories()
  };
};

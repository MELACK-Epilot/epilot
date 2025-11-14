/**
 * Hooks de compatibilité pour l'assignation de modules par l'Admin Groupe
 * Remplace les anciens hooks avec une interface compatible
 * Utilise le nouveau système unifié basé sur user_modules
 * @module useAdminGroupAssignmentCompat
 */

import { useMemo } from 'react';
import { useAdminGroupAssignment, useAssignmentActions, useAssignmentFilters } from '@/providers/AdminGroupAssignmentProvider';
import type { AssignmentPermissions } from '@/stores/adminGroupAssignment.store';

/**
 * Hook compatible pour récupérer les modules assignés à un utilisateur
 * Remplace useUserAssignedModules
 */
export const useUserAssignedModulesCompat = (userId?: string) => {
  const { users, isLoadingUsers, error } = useAdminGroupAssignment();

  const data = useMemo(() => {
    if (!userId) return [];
    
    const user = users.find(u => u.id === userId);
    return user?.assignedModules || [];
  }, [users, userId]);

  return {
    data,
    isLoading: isLoadingUsers,
    error: error ? new Error(error) : null,
  };
};

/**
 * Hook compatible pour assigner plusieurs modules
 * Remplace useAssignMultipleModules
 */
export const useAssignMultipleModulesCompat = () => {
  const { assignModules, isAssigning } = useAssignmentActions();

  return {
    mutateAsync: async ({
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
      const assignmentPermissions: AssignmentPermissions = {
        canRead: permissions.canRead,
        canWrite: permissions.canWrite,
        canDelete: permissions.canDelete,
        canExport: permissions.canExport,
      };

      const result = await assignModules(userId, moduleIds, assignmentPermissions);
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de l\'assignation');
      }

      return {
        success: true,
        total: moduleIds.length,
        assigned: moduleIds.length,
        failed: 0,
      };
    },
    isPending: isAssigning,
  };
};

/**
 * Hook compatible pour assigner une catégorie
 * Remplace useAssignCategory
 */
export const useAssignCategoryCompat = () => {
  const { assignCategory, isAssigning } = useAssignmentActions();

  return {
    mutateAsync: async ({
      userId,
      categoryId,
      permissions,
    }: {
      userId: string;
      categoryId: string;
      permissions: AssignmentPermissions;
    }) => {
      const result = await assignCategory(userId, categoryId, permissions);
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de l\'assignation de la catégorie');
      }

      return { success: true };
    },
    isPending: isAssigning,
  };
};

/**
 * Hook compatible pour récupérer les modules du groupe scolaire
 * Remplace useSchoolGroupModules
 */
export const useSchoolGroupModulesCompat = (schoolGroupId?: string) => {
  const { availableModules, isLoadingModules, error } = useAdminGroupAssignment();

  const data = useMemo(() => {
    if (!schoolGroupId || !availableModules.length) {
      return {
        schoolGroup: null,
        availableModules: [],
        totalModules: 0,
      };
    }

    return {
      schoolGroup: { id: schoolGroupId },
      availableModules: availableModules.map(module => ({
        ...module,
        category: {
          id: module.category_id,
          name: module.category_name,
          slug: module.category_slug,
          color: module.color,
        }
      })),
      totalModules: availableModules.length,
    };
  }, [availableModules, schoolGroupId]);

  return {
    data,
    isLoading: isLoadingModules,
    error: error ? new Error(error) : null,
  };
};

/**
 * Hook compatible pour récupérer les catégories du groupe scolaire
 * Remplace useSchoolGroupCategories
 */
export const useSchoolGroupCategoriesCompat = (schoolGroupId?: string) => {
  const { getCategories, isLoadingModules, error } = useAdminGroupAssignment();

  const data = useMemo(() => {
    if (!schoolGroupId) {
      return {
        categories: [],
        totalCategories: 0,
      };
    }

    const categories = getCategories().map(category => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: `${category.moduleCount} module${category.moduleCount > 1 ? 's' : ''}`,
      moduleCount: category.moduleCount,
    }));

    return {
      categories,
      totalCategories: categories.length,
    };
  }, [getCategories, schoolGroupId]);

  return {
    data,
    isLoading: isLoadingModules,
    error: error ? new Error(error) : null,
  };
};

/**
 * Hook pour les statistiques d'assignation
 * Nouveau hook basé sur les vraies données
 */
export const useAssignmentStatsCompat = (schoolGroupId?: string) => {
  const { getAssignmentStats, users, isLoadingUsers } = useAdminGroupAssignment();

  const data = useMemo(() => {
    if (!schoolGroupId) return null;

    const stats = getAssignmentStats();
    
    // Calculer la date de dernière assignation
    let lastAssignmentDate: string | null = null;
    users.forEach(user => {
      if (user.lastModuleAssignedAt) {
        if (!lastAssignmentDate || user.lastModuleAssignedAt > lastAssignmentDate) {
          lastAssignmentDate = user.lastModuleAssignedAt;
        }
      }
    });

    return {
      ...stats,
      lastAssignmentDate,
    };
  }, [getAssignmentStats, users, schoolGroupId]);

  return {
    data,
    isLoading: isLoadingUsers,
  };
};

/**
 * Hook pour les utilisateurs avec modules
 * Compatible avec l'interface existante
 */
export const useUsersCompat = ({ schoolGroupId }: { schoolGroupId?: string }) => {
  const { users, isLoadingUsers, error } = useAdminGroupAssignment();

  const data = useMemo(() => {
    if (!schoolGroupId) {
      return { users: [] };
    }

    const formattedUsers = users.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      schoolName: user.schoolName,
      status: 'active' as const, // Valeur par défaut
      assignedModulesCount: user.assignedModulesCount,
      lastModuleAssignedAt: user.lastModuleAssignedAt,
      createdAt: new Date().toISOString(), // Valeur par défaut
    }));

    return { users: formattedUsers };
  }, [users, schoolGroupId]);

  return {
    data,
    isLoading: isLoadingUsers,
    error: error ? new Error(error) : null,
    refetch: () => Promise.resolve(), // Fonction vide pour compatibilité
  };
};

/**
 * Hook pour révoquer un module
 * Nouveau hook pour la révocation
 */
export const useRevokeModuleCompat = () => {
  const { revokeModule, isAssigning } = useAssignmentActions();

  return {
    mutateAsync: async ({ userId, moduleId }: { userId: string; moduleId: string }) => {
      const result = await revokeModule(userId, moduleId);
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la révocation');
      }

      return { success: true };
    },
    isPending: isAssigning,
  };
};

/**
 * Hook pour les filtres et recherche
 * Nouveau hook pour la gestion des filtres
 */
export const useAssignmentFiltersCompat = () => {
  const { 
    searchQuery, 
    selectedCategory, 
    selectedRole,
    setSearchQuery, 
    setSelectedCategory, 
    setSelectedRole,
    filteredUsers,
    filteredModules,
    availableRoles,
    categories 
  } = useAssignmentFilters();

  return {
    // États des filtres
    searchQuery,
    selectedCategory,
    selectedRole,
    
    // Actions de filtrage
    setSearchQuery,
    setSelectedCategory,
    setSelectedRole,
    
    // Données filtrées
    filteredUsers,
    filteredModules,
    availableRoles,
    categories,
    
    // Utilitaires
    clearFilters: () => {
      setSearchQuery('');
      setSelectedCategory('all');
      setSelectedRole('all');
    },
    
    hasActiveFilters: searchQuery !== '' || selectedCategory !== 'all' || selectedRole !== 'all',
  };
};

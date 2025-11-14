/**
 * Hook simple et robuste pour l'assignation de modules
 * Sans erreurs TypeScript, compatible avec l'existant
 * @module useAssignmentSimple
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/store/auth.store';

/**
 * Interface simple pour un module assigné
 */
export interface SimpleAssignedModule {
  id: string;
  user_id: string;
  module_id: string;
  module_name: string;
  module_slug: string;
  is_enabled: boolean;
  assigned_at: string;
  category_name: string;
}

/**
 * Interface simple pour un utilisateur
 */
export interface SimpleUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  assignedModules: SimpleAssignedModule[];
  assignedModulesCount: number;
}

/**
 * Interface simple pour un module disponible
 */
export interface SimpleAvailableModule {
  id: string;
  name: string;
  slug: string;
  description: string;
  category_id: string;
  category_name: string;
}

/**
 * Hook principal pour l'assignation simple
 */
export const useAssignmentSimple = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [availableModules, setAvailableModules] = useState<SimpleAvailableModule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Charger les utilisateurs avec leurs modules
   */
  const loadUsers = useCallback(async () => {
    if (!user?.schoolGroupId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Récupérer les utilisateurs
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, role')
        .eq('school_group_id', user.schoolGroupId)
        .neq('role', 'super_admin');

      if (usersError) throw usersError;

      // Récupérer toutes les assignations
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('user_modules')
        .select(`
          id,
          user_id,
          module_id,
          is_enabled,
          assigned_at,
          modules(name, slug, business_categories(name))
        `)
        .eq('is_enabled', true);

      if (assignmentsError) throw assignmentsError;

      // Grouper par utilisateur
      const usersList: SimpleUser[] = (usersData || []).map((userData: any) => {
        const userAssignments = (assignmentsData || [])
          .filter((assignment: any) => assignment.user_id === userData.id)
          .map((assignment: any) => ({
            id: assignment.id,
            user_id: assignment.user_id,
            module_id: assignment.module_id,
            module_name: assignment.modules?.name || 'Module',
            module_slug: assignment.modules?.slug || '',
            is_enabled: assignment.is_enabled,
            assigned_at: assignment.assigned_at,
            category_name: assignment.modules?.business_categories?.name || 'Général',
          }));

        return {
          id: userData.id,
          firstName: userData.first_name || '',
          lastName: userData.last_name || '',
          email: userData.email || '',
          role: userData.role || '',
          assignedModules: userAssignments,
          assignedModulesCount: userAssignments.length,
        };
      });

      setUsers(usersList);

    } catch (err: any) {
      setError(err.message);
      console.error('Erreur chargement users:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.schoolGroupId]);

  /**
   * Charger les modules disponibles
   */
  const loadAvailableModules = useCallback(async () => {
    if (!user?.schoolGroupId) return;

    try {
      const { data: modulesData, error } = await supabase
        .from('group_module_configs')
        .select(`
          modules(
            id,
            name,
            slug,
            description,
            category_id,
            business_categories(name)
          )
        `)
        .eq('school_group_id', user.schoolGroupId)
        .eq('is_enabled', true);

      if (error) throw error;

      const modulesList: SimpleAvailableModule[] = (modulesData || [])
        .filter((item: any) => item.modules)
        .map((item: any) => ({
          id: item.modules.id,
          name: item.modules.name,
          slug: item.modules.slug,
          description: item.modules.description || '',
          category_id: item.modules.category_id,
          category_name: item.modules.business_categories?.name || 'Général',
        }));

      setAvailableModules(modulesList);

    } catch (err: any) {
      setError(err.message);
      console.error('Erreur chargement modules:', err);
    }
  }, [user?.schoolGroupId]);

  /**
   * Assigner un module à un utilisateur
   */
  const assignModule = async (userId: string, moduleId: string) => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Non authentifié');

      const { error } = await (supabase as any)
        .from('user_modules')
        .upsert({
          user_id: userId,
          module_id: moduleId,
          is_enabled: true,
          assigned_at: new Date().toISOString(),
          assigned_by: currentUser.user.id,
          access_count: 0
        });

      if (error) throw error;

      // Recharger les données
      await loadUsers();
      
      return { success: true };

    } catch (err: any) {
      console.error('Erreur assignation:', err);
      throw err;
    }
  };

  /**
   * Révoquer un module d'un utilisateur
   */
  const revokeModule = async (userId: string, moduleId: string) => {
    try {
      const { error } = await supabase
        .from('user_modules')
        .delete()
        .eq('user_id', userId)
        .eq('module_id', moduleId);

      if (error) throw error;

      // Recharger les données
      await loadUsers();
      
      return { success: true };

    } catch (err: any) {
      console.error('Erreur révocation:', err);
      throw err;
    }
  };

  /**
   * Configuration temps réel
   */
  useEffect(() => {
    if (!user?.schoolGroupId) return;

    // Charger les données initiales
    loadUsers();
    loadAvailableModules();

    // Configurer le temps réel
    const channel = supabase
      .channel(`assignment_simple:${user.schoolGroupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_modules',
        },
        () => {
          console.log('🔔 Changement détecté, rechargement...');
          loadUsers();
        }
      )
      .subscribe();

    // Nettoyage
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.schoolGroupId, loadUsers, loadAvailableModules]);

  return {
    users,
    availableModules,
    isLoading,
    error,
    assignModule,
    revokeModule,
    refresh: () => {
      loadUsers();
      loadAvailableModules();
    }
  };
};

/**
 * Hook compatible pour les modules assignés d'un utilisateur
 */
export const useUserAssignedModulesSimple = (userId?: string) => {
  const { users, isLoading, error } = useAssignmentSimple();

  const data = users.find(u => u.id === userId)?.assignedModules || [];

  return {
    data,
    isLoading,
    error: error ? new Error(error) : null,
  };
};

/**
 * Hook compatible pour assigner des modules
 */
export const useAssignMultipleModulesSimple = () => {
  const { assignModule, isLoading } = useAssignmentSimple();

  return {
    mutateAsync: async ({
      userId,
      moduleIds,
    }: {
      userId: string;
      moduleIds: string[];
    }) => {
      // Assigner tous les modules
      for (const moduleId of moduleIds) {
        await assignModule(userId, moduleId);
      }

      return {
        success: true,
        total: moduleIds.length,
        assigned: moduleIds.length,
        failed: 0,
      };
    },
    isPending: isLoading,
  };
};

/**
 * Hook compatible pour les modules du groupe
 */
export const useSchoolGroupModulesSimple = (schoolGroupId?: string) => {
  const { availableModules, isLoading, error } = useAssignmentSimple();

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

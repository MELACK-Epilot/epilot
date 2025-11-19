/**
 * Hook pour récupérer les statistiques des modules
 * Inclut répartition par catégorie, KPIs, analytics
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface CategoryStat {
  id: string;
  name: string;
  icon: string;
  color: string;
  totalModules: number;
  assignedModules: number;
}

interface ModuleStats {
  totalModules: number;
  assignedModules: number;
  availableModules: number;
  assignmentPercentage: number;
  categoriesStats: CategoryStat[];
}

/**
 * Hook pour récupérer les stats de modules d'un utilisateur
 */
export const useUserModuleStats = (userId?: string) => {
  return useQuery({
    queryKey: ['user-module-stats', userId],
    queryFn: async (): Promise<ModuleStats> => {
      if (!userId) {
        return {
          totalModules: 0,
          assignedModules: 0,
          availableModules: 0,
          assignmentPercentage: 0,
          categoriesStats: [],
        };
      }

      // 1. Récupérer l'utilisateur pour avoir son school_group_id
      const { data: user } = await supabase
        .from('users')
        .select('school_group_id')
        .eq('id', userId)
        .single();

      if (!user || !(user as any).school_group_id) {
        throw new Error('Utilisateur sans groupe scolaire');
      }

      const schoolGroupId = (user as any).school_group_id;

      // 2. Récupérer les modules disponibles pour le groupe
      const { data: availableModules } = await supabase
        .from('school_group_modules')
        .select(`
          module_id,
          modules (
            id,
            name,
            category_id,
            module_categories (
              id,
              name,
              icon,
              color
            )
          )
        `)
        .eq('school_group_id', schoolGroupId)
        .eq('is_active', true);

      // 3. Récupérer les modules assignés à l'utilisateur
      const { data: assignedModules } = await supabase
        .from('user_modules')
        .select(`
          module_id,
          modules (
            id,
            name,
            category_id
          )
        `)
        .eq('user_id', userId);

      // 4. Récupérer toutes les catégories
      const { data: categories } = await supabase
        .from('module_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      // 5. Calculer les stats
      const totalModules = availableModules?.length || 0;
      const assignedCount = assignedModules?.length || 0;
      const availableCount = totalModules - assignedCount;
      const assignmentPercentage = totalModules > 0 
        ? (assignedCount / totalModules) * 100 
        : 0;

      // 6. Calculer les stats par catégorie
      const categoriesStats: CategoryStat[] = (categories || []).map((category: any) => {
        const categoryModules = availableModules?.filter(
          (am: any) => am.modules?.category_id === category.id
        ) || [];
        
        const categoryAssigned = assignedModules?.filter(
          (am: any) => am.modules?.category_id === category.id
        ) || [];

        return {
          id: category.id,
          name: category.name,
          icon: category.icon || '📦',
          color: category.color || '#2A9D8F',
          totalModules: categoryModules.length,
          assignedModules: categoryAssigned.length,
        };
      });

      return {
        totalModules,
        assignedModules: assignedCount,
        availableModules: availableCount,
        assignmentPercentage,
        categoriesStats,
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

/**
 * Hook pour récupérer les modules les plus utilisés (analytics)
 */
export const useMostUsedModules = (schoolGroupId?: string, limit: number = 10) => {
  return useQuery({
    queryKey: ['most-used-modules', schoolGroupId, limit],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_most_used_modules', {
        p_school_group_id: schoolGroupId || null,
        p_limit: limit,
      });

      if (error) throw error;
      return data || [];
    },
    enabled: !!schoolGroupId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook pour récupérer les modules inactifs (analytics)
 */
export const useInactiveUserModules = (
  schoolGroupId?: string, 
  daysThreshold: number = 30
) => {
  return useQuery({
    queryKey: ['inactive-user-modules', schoolGroupId, daysThreshold],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_inactive_user_modules', {
        p_school_group_id: schoolGroupId || null,
        p_days_threshold: daysThreshold,
      });

      if (error) throw error;
      return data || [];
    },
    enabled: !!schoolGroupId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

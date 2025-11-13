/**
 * Hook pour récupérer l'historique des assignations de modules
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { AssignmentHistory } from '../types/assign-modules.types';

export const useAssignmentHistory = (userId?: string, limit: number = 50) => {
  return useQuery({
    queryKey: ['assignment-history', userId, limit],
    queryFn: async (): Promise<AssignmentHistory[]> => {
      let query = supabase
        .from('module_assignment_history')
        .select(`
          *,
          user:users!user_id(first_name, last_name),
          module:modules!module_id(name),
          performed_by_user:users!performed_by(first_name, last_name)
        `)
        .order('performed_at', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erreur historique:', error);
        return [];
      }

      return (data || []).map((item: any) => ({
        id: item.id,
        userId: item.user_id,
        userName: `${item.user?.first_name} ${item.user?.last_name}`,
        moduleId: item.module_id,
        moduleName: item.module?.name || 'Module supprimé',
        action: item.action,
        performedBy: item.performed_by,
        performedByName: `${item.performed_by_user?.first_name} ${item.performed_by_user?.last_name}`,
        performedAt: item.performed_at,
        details: item.details,
      }));
    },
    enabled: true,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useUserModulesCount = (userId: string) => {
  return useQuery({
    queryKey: ['user-modules-count', userId],
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from('user_module_permissions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        console.error('Erreur comptage modules:', error);
        return 0;
      }

      return count || 0;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
};

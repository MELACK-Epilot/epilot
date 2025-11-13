/**
 * Hook pour récupérer les statistiques d'assignation réelles
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const useAssignmentStats = (schoolGroupId?: string) => {
  return useQuery({
    queryKey: ['assignment-stats', schoolGroupId],
    queryFn: async () => {
      if (!schoolGroupId) {
        return {
          totalPermissions: 0,
          usersWithModules: 0,
          lastAssignmentDate: null,
        };
      }

      // 1. Récupérer les IDs des utilisateurs du groupe
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id')
        .eq('school_group_id', schoolGroupId);

      if (usersError) {
        console.error('Erreur récupération users:', usersError);
        return {
          totalPermissions: 0,
          usersWithModules: 0,
          lastAssignmentDate: null,
        };
      }

      const userIds = (usersData || []).map((u: any) => u.id);

      if (userIds.length === 0) {
        return {
          totalPermissions: 0,
          usersWithModules: 0,
          lastAssignmentDate: null,
        };
      }

      // 2. Récupérer les permissions pour ces utilisateurs
      const { data: permissionsData, error: permissionsError } = await (supabase as any)
        .from('user_module_permissions')
        .select('user_id, assigned_at')
        .in('user_id', userIds);

      if (permissionsError) {
        console.error('Erreur récupération permissions:', permissionsError);
        return {
          totalPermissions: 0,
          usersWithModules: 0,
          lastAssignmentDate: null,
        };
      }

      console.log('📊 Stats assignation:', {
        totalUsers: userIds.length,
        totalPermissions: permissionsData?.length || 0,
        usersWithModules: new Set((permissionsData || []).map((p: any) => p.user_id)).size
      });

      // 2. Compter les utilisateurs uniques avec des modules
      const uniqueUsers = new Set(
        (permissionsData || []).map((p: any) => p.user_id)
      );

      // 3. Trouver la dernière date d'assignation
      const lastAssignment = (permissionsData || [])
        .map((p: any) => p.assigned_at)
        .filter(Boolean)
        .sort()
        .reverse()[0];

      return {
        totalPermissions: permissionsData?.length || 0,
        usersWithModules: uniqueUsers.size,
        lastAssignmentDate: lastAssignment || null,
      };
    },
    enabled: !!schoolGroupId,
    staleTime: 30 * 1000, // 30 secondes
  });
};

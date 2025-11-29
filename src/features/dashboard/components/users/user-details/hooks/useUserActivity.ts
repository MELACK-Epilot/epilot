/**
 * Hook pour récupérer l'activité d'un utilisateur
 * @module user-details/hooks/useUserActivity
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ActivityLog } from '../types';

export const useUserActivity = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['user-activity', userId],
    queryFn: async (): Promise<ActivityLog[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.warn('Activity logs not available:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
};

/**
 * Hook pour les objectifs et benchmarks financiers
 * Utilise la vue financial_objectives_benchmarks
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/store/auth.store';

export interface ObjectivesBenchmarks {
  school_group_id: string;
  school_group_name: string;
  current_revenue: number;
  monthly_target: number;
  annual_target: number;
  monthly_achievement_rate: number;
  sector_benchmark: number;
  benchmark_position: number;
}

export const useObjectivesBenchmarks = () => {
  const { user } = useAuth();
  
  return useQuery<ObjectivesBenchmarks | null>({
    queryKey: ['objectives-benchmarks', user?.schoolGroupId],
    queryFn: async (): Promise<ObjectivesBenchmarks | null> => {
      if (!user?.schoolGroupId) {
        return null;
      }

      try {
        const { data, error } = await supabase
          .from('financial_objectives_benchmarks')
          .select('*')
          .eq('school_group_id', user.schoolGroupId)
          .single();

        if (error) {
          console.error('Erreur financial_objectives_benchmarks:', error);
          return null;
        }

        if (!data) {
          return null;
        }

        return {
          school_group_id: data.school_group_id,
          school_group_name: data.school_group_name,
          current_revenue: Number(data.current_revenue) || 0,
          monthly_target: Number(data.monthly_target) || 0,
          annual_target: Number(data.annual_target) || 0,
          monthly_achievement_rate: Number(data.monthly_achievement_rate) || 0,
          sector_benchmark: Number(data.sector_benchmark) || 0,
          benchmark_position: Number(data.benchmark_position) || 100,
        };
      } catch (error) {
        console.error('Erreur useObjectivesBenchmarks:', error);
        return null;
      }
    },
    enabled: !!user?.schoolGroupId && user?.role === 'admin_groupe',
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
};

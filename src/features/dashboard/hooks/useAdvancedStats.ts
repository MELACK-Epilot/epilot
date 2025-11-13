/**
 * Hook pour les statistiques avancées
 * Utilise la vue advanced_financial_stats
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/store/auth.store';

export interface AdvancedStats {
  school_group_id: string;
  school_group_name: string;
  total_schools: number;
  revenue_per_school: number;
  monthly_growth_rate: number;
  current_month_revenue: number;
  previous_month_revenue: number;
  global_recovery_rate: number;
  completed_payments: number;
  total_expected_payments: number;
  overdue_to_revenue_ratio: number;
  total_overdue: number;
  total_revenue: number;
  overdue_count: number;
  completed_count: number;
  last_updated: string;
}

export const useAdvancedStats = () => {
  const { user } = useAuth();
  
  return useQuery<AdvancedStats | null>({
    queryKey: ['advanced-stats', user?.schoolGroupId],
    queryFn: async (): Promise<AdvancedStats | null> => {
      if (!user?.schoolGroupId) {
        return null;
      }

      try {
        const { data, error } = await supabase
          .from('advanced_financial_stats')
          .select('*')
          .eq('school_group_id', user.schoolGroupId)
          .single();

        if (error) {
          console.error('Erreur advanced_financial_stats:', error);
          return null;
        }

        if (!data) {
          return null;
        }

        return {
          school_group_id: data.school_group_id,
          school_group_name: data.school_group_name,
          total_schools: Number(data.total_schools) || 0,
          revenue_per_school: Number(data.revenue_per_school) || 0,
          monthly_growth_rate: Number(data.monthly_growth_rate) || 0,
          current_month_revenue: Number(data.current_month_revenue) || 0,
          previous_month_revenue: Number(data.previous_month_revenue) || 0,
          global_recovery_rate: Number(data.global_recovery_rate) || 0,
          completed_payments: Number(data.completed_payments) || 0,
          total_expected_payments: Number(data.total_expected_payments) || 0,
          overdue_to_revenue_ratio: Number(data.overdue_to_revenue_ratio) || 0,
          total_overdue: Number(data.total_overdue) || 0,
          total_revenue: Number(data.total_revenue) || 0,
          overdue_count: Number(data.overdue_count) || 0,
          completed_count: Number(data.completed_count) || 0,
          last_updated: data.last_updated,
        };
      } catch (error) {
        console.error('Erreur useAdvancedStats:', error);
        return null;
      }
    },
    enabled: !!user?.schoolGroupId && user?.role === 'admin_groupe',
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
};

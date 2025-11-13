/**
 * Hook pour récupérer le Top 3 des écoles par revenus
 * Utilise la vue top_schools_by_revenue
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/store/auth.store';

export interface TopSchool {
  school_id: string;
  school_name: string;
  school_code: string;
  total_revenue: number;
  monthly_revenue: number;
  total_expenses: number;
  net_profit: number;
  profit_margin: number;
  total_payments: number;
  completed_payments: number;
  recovery_rate: number;
}

export const useTopSchoolsByRevenue = (limit: number = 3) => {
  const { user } = useAuth();
  
  return useQuery<TopSchool[]>({
    queryKey: ['top-schools-revenue', user?.schoolGroupId, limit],
    queryFn: async (): Promise<TopSchool[]> => {
      if (!user?.schoolGroupId) {
        return [];
      }

      try {
        const { data, error } = await supabase
          .from('top_schools_by_revenue')
          .select('*')
          .eq('school_group_id', user.schoolGroupId)
          .limit(limit);

        if (error) {
          console.error('Erreur top_schools_by_revenue:', error);
          return [];
        }

        return (data || []).map(school => ({
          school_id: school.school_id,
          school_name: school.school_name,
          school_code: school.school_code,
          total_revenue: Number(school.total_revenue) || 0,
          monthly_revenue: Number(school.monthly_revenue) || 0,
          total_expenses: Number(school.total_expenses) || 0,
          net_profit: Number(school.net_profit) || 0,
          profit_margin: Number(school.profit_margin) || 0,
          total_payments: Number(school.total_payments) || 0,
          completed_payments: Number(school.completed_payments) || 0,
          recovery_rate: Number(school.recovery_rate) || 0,
        }));
      } catch (error) {
        console.error('Erreur useTopSchoolsByRevenue:', error);
        return [];
      }
    },
    enabled: !!user?.schoolGroupId && user?.role === 'admin_groupe',
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
};

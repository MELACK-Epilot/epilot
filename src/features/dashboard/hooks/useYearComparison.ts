/**
 * Hook pour la comparaison année N vs N-1
 * Utilise la vue financial_year_comparison
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/store/auth.store';

export interface YearComparison {
  school_group_id: string;
  school_group_name: string;
  current_revenue: number;
  previous_revenue: number;
  revenue_growth: number;
  current_expenses: number;
  previous_expenses: number;
  expenses_growth: number;
  current_profit: number;
  previous_profit: number;
  profit_growth: number;
  total_schools: number;
  current_payments: number;
  previous_payments: number;
}

export const useYearComparison = () => {
  const { user } = useAuth();
  
  return useQuery<YearComparison | null>({
    queryKey: ['year-comparison', user?.schoolGroupId],
    queryFn: async (): Promise<YearComparison | null> => {
      if (!user?.schoolGroupId) {
        return null;
      }

      try {
        const { data, error } = await supabase
          .from('financial_year_comparison')
          .select('*')
          .eq('school_group_id', user.schoolGroupId)
          .single();

        if (error) {
          console.error('Erreur financial_year_comparison:', error);
          return null;
        }

        if (!data) {
          return null;
        }

        return {
          school_group_id: data.school_group_id,
          school_group_name: data.school_group_name,
          current_revenue: Number(data.current_revenue) || 0,
          previous_revenue: Number(data.previous_revenue) || 0,
          revenue_growth: Number(data.revenue_growth) || 0,
          current_expenses: Number(data.current_expenses) || 0,
          previous_expenses: Number(data.previous_expenses) || 0,
          expenses_growth: Number(data.expenses_growth) || 0,
          current_profit: Number(data.current_profit) || 0,
          previous_profit: Number(data.previous_profit) || 0,
          profit_growth: Number(data.profit_growth) || 0,
          total_schools: Number(data.total_schools) || 0,
          current_payments: Number(data.current_payments) || 0,
          previous_payments: Number(data.previous_payments) || 0,
        };
      } catch (error) {
        console.error('Erreur useYearComparison:', error);
        return null;
      }
    },
    enabled: !!user?.schoolGroupId && user?.role === 'admin_groupe',
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
};

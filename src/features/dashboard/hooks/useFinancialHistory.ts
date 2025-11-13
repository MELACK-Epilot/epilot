/**
 * Hook pour récupérer l'historique financier
 * Utilisé pour les graphiques d'évolution
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/store/auth.store';
import { subMonths, format } from 'date-fns';

export interface MonthlyFinancialData {
  month: string;
  monthLabel: string;
  revenue: number;
  expenses: number;
  profit: number;
  margin: number;
}

/**
 * Hook pour récupérer l'historique mensuel du groupe
 */
export const useMonthlyFinancialHistory = (months: number = 12) => {
  const { user } = useAuth();

  return useQuery<MonthlyFinancialData[]>({
    queryKey: ['monthly-financial-history', user?.schoolGroupId, months],
    queryFn: async () => {
      if (!user?.schoolGroupId) return [];

      const startDate = subMonths(new Date(), months);

      const { data, error } = await supabase
        .from('daily_financial_snapshots')
        .select('*')
        .eq('school_group_id', user.schoolGroupId)
        .is('school_id', null) // Seulement niveau groupe
        .gte('snapshot_date', startDate.toISOString().split('T')[0])
        .order('snapshot_date');

      if (error) throw error;

      // Grouper par mois
      const monthlyData: Record<string, { revenue: number; expenses: number; count: number }> = {};

      (data || []).forEach((snapshot: any) => {
        const monthKey = format(new Date(snapshot.snapshot_date), 'yyyy-MM');
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { revenue: 0, expenses: 0, count: 0 };
        }

        monthlyData[monthKey].revenue += Number(snapshot.total_revenue) || 0;
        monthlyData[monthKey].expenses += Number(snapshot.total_expenses) || 0;
        monthlyData[monthKey].count += 1;
      });

      // Convertir en tableau
      return Object.entries(monthlyData).map(([month, data]) => {
        const profit = data.revenue - data.expenses;
        const margin = data.revenue > 0 ? (profit / data.revenue) * 100 : 0;

        return {
          month,
          monthLabel: format(new Date(month + '-01'), 'MMM yyyy'),
          revenue: data.revenue / data.count, // Moyenne du mois
          expenses: data.expenses / data.count,
          profit,
          margin,
        };
      }).sort((a, b) => a.month.localeCompare(b.month));
    },
    enabled: !!user?.schoolGroupId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook pour récupérer l'historique d'une école
 */
export const useSchoolMonthlyHistory = (schoolId: string, months: number = 12) => {
  return useQuery<MonthlyFinancialData[]>({
    queryKey: ['school-monthly-history', schoolId, months],
    queryFn: async () => {
      const startDate = subMonths(new Date(), months);

      const { data, error } = await supabase
        .from('daily_financial_snapshots')
        .select('*')
        .eq('school_id', schoolId)
        .gte('snapshot_date', startDate.toISOString().split('T')[0])
        .order('snapshot_date');

      if (error) throw error;

      const monthlyData: Record<string, { revenue: number; expenses: number; count: number }> = {};

      (data || []).forEach((snapshot: any) => {
        const monthKey = format(new Date(snapshot.snapshot_date), 'yyyy-MM');
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { revenue: 0, expenses: 0, count: 0 };
        }

        monthlyData[monthKey].revenue += Number(snapshot.total_revenue) || 0;
        monthlyData[monthKey].expenses += Number(snapshot.total_expenses) || 0;
        monthlyData[monthKey].count += 1;
      });

      return Object.entries(monthlyData).map(([month, data]) => {
        const profit = data.revenue - data.expenses;
        const margin = data.revenue > 0 ? (profit / data.revenue) * 100 : 0;

        return {
          month,
          monthLabel: format(new Date(month + '-01'), 'MMM yyyy'),
          revenue: data.revenue / data.count,
          expenses: data.expenses / data.count,
          profit,
          margin,
        };
      }).sort((a, b) => a.month.localeCompare(b.month));
    },
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  });
};

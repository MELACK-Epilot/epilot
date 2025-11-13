/**
 * Hook pour récupérer les données d'évolution des revenus
 * Graphique ligne sur 12 mois
 * @module useRevenueChart
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { startOfMonth, subMonths, format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface RevenueChartData {
  month: string;
  revenue: number;
  subscriptions: number;
  label: string;
}

export const useRevenueChart = (months: number = 12) => {
  return useQuery({
    queryKey: ['revenue-chart', months],
    queryFn: async (): Promise<RevenueChartData[]> => {
      try {
        const now = new Date();
        const data: RevenueChartData[] = [];

        // Générer les données pour chaque mois
        for (let i = months - 1; i >= 0; i--) {
          const monthDate = subMonths(startOfMonth(now), i);
          const nextMonthDate = subMonths(startOfMonth(now), i - 1);

          // Récupérer les paiements du mois
          const { data: payments } = await supabase
            .from('payments')
            .select('amount')
            .eq('status', 'completed')
            .gte('created_at', monthDate.toISOString())
            .lt('created_at', nextMonthDate.toISOString());

          const monthRevenue = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);

          // Compter les abonnements actifs à la fin du mois
          const { count: subsCount } = await supabase
            .from('subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active')
            .lte('start_date', nextMonthDate.toISOString());

          data.push({
            month: format(monthDate, 'yyyy-MM'),
            revenue: monthRevenue,
            subscriptions: subsCount || 0,
            label: format(monthDate, 'MMM yyyy', { locale: fr }),
          });
        }

        return data;
      } catch (error) {
        console.error('Erreur lors de la récupération des données de revenus:', error);
        return [];
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
};

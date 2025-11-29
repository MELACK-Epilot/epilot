/**
 * Hook pour récupérer les KPIs financiers avancés
 * Utilise la fonction RPC get_financial_kpis sur Supabase
 * @module useFinancialKPIs
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface FinancialKPIs {
  arpu: number; // Average Revenue Per User
  conversionRate: number; // Taux de conversion (%)
  churnRate: number; // Taux d'attrition (%)
  ltv: number; // Lifetime Value
  activeSubscriptionsCount: number;
  totalGroupsCount: number;
  canceledSubscriptionsCount: number;
  monthlyRevenue: number;
}

export const useFinancialKPIs = (period: string = '30d') => {
  return useQuery({
    queryKey: ['financial-kpis', period],
    queryFn: async (): Promise<FinancialKPIs> => {
      try {
        // Appel de la fonction RPC sur Supabase
        const { data, error } = await supabase.rpc('get_financial_kpis');

        if (error) throw error;

        const kpis = data as any;

        // Mapping des données camelCase pour le frontend
        return {
          arpu: kpis?.arpu || 0,
          conversionRate: kpis?.conversion_rate || 0,
          churnRate: kpis?.churn_rate || 0,
          ltv: kpis?.ltv || 0,
          activeSubscriptionsCount: kpis?.active_subscriptions_count || 0,
          totalGroupsCount: kpis?.total_groups_count || 0,
          canceledSubscriptionsCount: kpis?.canceled_subscriptions_count || 0,
          monthlyRevenue: kpis?.monthly_revenue || 0,
        };
      } catch (error) {
        console.error('Erreur lors de la récupération des KPIs financiers:', error);
        return {
          arpu: 0,
          conversionRate: 0,
          churnRate: 0,
          ltv: 0,
          activeSubscriptionsCount: 0,
          totalGroupsCount: 0,
          canceledSubscriptionsCount: 0,
          monthlyRevenue: 0,
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

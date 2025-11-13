/**
 * Hook pour récupérer les KPIs financiers avancés
 * ARPU, Churn Rate, Conversion Rate, LTV
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
        // Calculer les dates selon la période
        const now = new Date();
        let startDate = new Date();
        
        switch (period) {
          case '7d':
            startDate.setDate(now.getDate() - 7);
            break;
          case '30d':
            startDate.setDate(now.getDate() - 30);
            break;
          case '3m':
            startDate.setMonth(now.getMonth() - 3);
            break;
          case '6m':
            startDate.setMonth(now.getMonth() - 6);
            break;
          case '1y':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
          default:
            startDate.setDate(now.getDate() - 30);
        }

        // 1. Compter tous les groupes
        const { count: totalGroups } = await supabase
          .from('school_groups')
          .select('*', { count: 'exact', head: true });

        // 2. Compter abonnements actifs
        const { count: activeSubscriptions } = await supabase
          .from('school_group_subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        // 3. Compter abonnements expirés/annulés dans la période
        const { count: canceledSubscriptions } = await supabase
          .from('school_group_subscriptions')
          .select('*', { count: 'exact', head: true })
          .in('status', ['expired', 'cancelled'])
          .gte('created_at', startDate.toISOString());

        // 4. Calculer revenus basés sur MRR (pas fee_payments)
        // Pour le Super Admin, les revenus = MRR × nombre de mois
        const { data: statsData } = await supabase
          .from('financial_stats')
          .select('mrr')
          .single();

        const mrr = (statsData as any)?.mrr || 0;
        const monthsInPeriod = period === '7d' ? 0.25 : period === '30d' ? 1 : period === '3m' ? 3 : period === '6m' ? 6 : 12;
        const totalRevenue = mrr * monthsInPeriod;

        // 5. Calculer les KPIs
        const activeSubsCount = activeSubscriptions || 0;
        const totalGroupsCount = totalGroups || 0;
        const canceledSubsCount = canceledSubscriptions || 0;

        // ARPU = Revenu total / Nombre d'abonnements actifs
        const arpu = activeSubsCount > 0 ? totalRevenue / activeSubsCount : 0;

        // Taux de conversion = (Abonnements actifs / Total groupes) * 100
        const conversionRate = totalGroupsCount > 0 
          ? (activeSubsCount / totalGroupsCount) * 100 
          : 0;

        // Churn Rate = (Abonnements annulés / Total abonnements) * 100
        const totalSubscriptions = activeSubsCount + canceledSubsCount;
        const churnRate = totalSubscriptions > 0 
          ? (canceledSubsCount / totalSubscriptions) * 100 
          : 0;

        // LTV = ARPU / (Churn Rate / 100)
        // Si churn rate est 0, on utilise une valeur par défaut de 5%
        const effectiveChurnRate = churnRate > 0 ? churnRate / 100 : 0.05;
        const ltv = arpu / effectiveChurnRate;

        return {
          arpu: Math.round(arpu),
          conversionRate: Math.round(conversionRate * 10) / 10,
          churnRate: Math.round(churnRate * 10) / 10,
          ltv: Math.round(ltv),
          activeSubscriptionsCount: activeSubsCount,
          totalGroupsCount,
          canceledSubscriptionsCount: canceledSubsCount,
          monthlyRevenue: totalRevenue,
        };
      } catch (error) {
        console.error('Erreur lors du calcul des KPIs financiers:', error);
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

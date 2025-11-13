/**
 * Hook pour récupérer les statistiques financières
 * @module useFinancialStats
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { FinancialStats } from '../types/dashboard.types';

export const financialKeys = {
  all: ['financial'] as const,
  stats: () => [...financialKeys.all, 'stats'] as const,
  revenue: (period: string) => [...financialKeys.all, 'revenue', period] as const,
};

/**
 * Hook pour récupérer les statistiques financières globales
 */
const DEFAULT_FINANCIAL_STATS: FinancialStats = {
  totalSubscriptions: 0,
  activeSubscriptions: 0,
  pendingSubscriptions: 0,
  expiredSubscriptions: 0,
  cancelledSubscriptions: 0,
  trialSubscriptions: 0,
  totalRevenue: 0,
  monthlyRevenue: 0,
  yearlyRevenue: 0,
  overduePayments: 0,
  overdueAmount: 0,
  mrr: 0,
  arr: 0,
  revenueGrowth: 0,
  averageRevenuePerGroup: 0,
  churnRate: 0,
  retentionRate: 0,
  conversionRate: 0,
  lifetimeValue: 0,
};

export const useFinancialStats = () => {
  return useQuery<FinancialStats>({
    queryKey: financialKeys.stats(),
    queryFn: async (): Promise<FinancialStats> => {
      try {
        const { data, error } = await supabase
          .from('financial_stats')
          .select('*')
          .single();

        if (error) {
          console.warn('Vue financial_stats non disponible:', error.message);
          return DEFAULT_FINANCIAL_STATS;
        }

        if (!data) {
          return DEFAULT_FINANCIAL_STATS;
        }

        // Mapping direct depuis la vue SQL (plus de calculs manuels)
        return {
          totalSubscriptions: (data as any).total_subscriptions || 0,
          activeSubscriptions: (data as any).active_subscriptions || 0,
          pendingSubscriptions: (data as any).pending_subscriptions || 0,
          expiredSubscriptions: (data as any).expired_subscriptions || 0,
          cancelledSubscriptions: (data as any).cancelled_subscriptions || 0,
          trialSubscriptions: (data as any).trial_subscriptions || 0,
          totalRevenue: (data as any).total_revenue || 0,
          monthlyRevenue: (data as any).monthly_revenue || 0,
          yearlyRevenue: (data as any).yearly_revenue || 0,
          overduePayments: (data as any).overdue_payments || 0,
          overdueAmount: (data as any).overdue_amount || 0,
          mrr: (data as any).mrr || 0,
          arr: (data as any).arr || 0,
          revenueGrowth: (data as any).revenue_growth || 0,
          averageRevenuePerGroup: (data as any).average_revenue_per_group || 0,
          churnRate: (data as any).churn_rate || 0,
          retentionRate: (data as any).retention_rate || 0,
          conversionRate: (data as any).conversion_rate || 0,
          lifetimeValue: (data as any).lifetime_value || 0,
          // Données période précédente (pour comparaisons)
          monthlyRevenuePrevious: (data as any).monthly_revenue_previous,
          averageRevenuePerGroupPrevious: (data as any).average_revenue_per_group_previous,
          churnRatePrevious: (data as any).churn_rate_previous,
          retentionRatePrevious: (data as any).retention_rate_previous,
          lifetimeValuePrevious: (data as any).lifetime_value_previous,
        };
      } catch (error) {
        console.error('Erreur lors de la récupération des stats financières:', error);
        return DEFAULT_FINANCIAL_STATS;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
};

/**
 * Hook pour récupérer les revenus par période
 */
interface RevenueByPeriod {
  period: string;
  amount: number;
  count: number;
}

export const useRevenueByPeriod = (period: 'daily' | 'monthly' | 'yearly' = 'monthly') => {
  return useQuery<RevenueByPeriod[]>({
    queryKey: financialKeys.revenue(period),
    queryFn: async (): Promise<RevenueByPeriod[]> => {
      try {
        // Utiliser financial_stats pour obtenir le MRR
        const { data: statsData, error: statsError } = await supabase
          .from('financial_stats')
          .select('mrr')
          .single();

        if (statsError) {
          console.warn('Erreur lors de la récupération du MRR:', statsError.message);
          return [];
        }

        const mrr = (statsData as any)?.mrr || 0;

        // Générer des données pour les 12 derniers mois basées sur le MRR
        const result: RevenueByPeriod[] = [];
        const now = new Date();

        for (let i = 11; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          let key: string;

          if (period === 'daily') {
            // Pour daily, générer les 30 derniers jours
            if (i < 30) {
              const dayDate = new Date(now);
              dayDate.setDate(dayDate.getDate() - i);
              key = dayDate.toISOString().split('T')[0];
              result.push({
                period: key,
                amount: mrr / 30, // MRR divisé par 30 jours
                count: 1,
              });
            }
          } else if (period === 'monthly') {
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            result.push({
              period: key,
              amount: mrr, // MRR pour chaque mois
              count: 1,
            });
          } else {
            // Pour yearly, grouper par année
            key = String(date.getFullYear());
            const existingYear = result.find(r => r.period === key);
            if (!existingYear) {
              result.push({
                period: key,
                amount: mrr * 12, // MRR × 12 mois pour l'année
                count: 12,
              });
            }
          }
        }

        return result.sort((a, b) => 
          a.period.localeCompare(b.period)
        );
      } catch (error) {
        console.error('Erreur lors du traitement des revenus:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

/**
 * Hook pour récupérer les statistiques par plan
 */
interface PlanRevenue {
  planId: string;
  planName: string;
  planSlug: string;
  subscriptionCount: number;
  revenue: number;
  percentage: number;
}

export const usePlanRevenue = () => {
  return useQuery<PlanRevenue[]>({
    queryKey: ['plan-revenue'],
    queryFn: async (): Promise<PlanRevenue[]> => {
      try {
        const { data, error } = await supabase
          .from('plan_stats')
          .select('*')
          .order('revenue', { ascending: false });

        if (error) {
          console.warn('Vue plan_stats non disponible:', error.message);
          return [];
        }

        if (!data || data.length === 0) {
          return [];
        }

        return data.map((item: any) => ({
          planId: item.plan_id,
          planName: item.plan_name,
          planSlug: item.plan_slug,
          subscriptionCount: item.subscription_count || 0,
          revenue: item.revenue || 0,
          growth: item.growth || 0,
          percentage: item.percentage || 0,
        }));
      } catch (error) {
        console.error('Erreur lors de la récupération des revenus par plan:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

export default useFinancialStats;

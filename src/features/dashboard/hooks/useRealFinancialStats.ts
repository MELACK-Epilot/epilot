/**
 * Hook pour récupérer les VRAIES statistiques financières
 * Depuis les tables existantes : school_groups, subscriptions, payments, plans
 * @module useRealFinancialStats
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const useRealFinancialStats = () => {
  return useQuery({
    queryKey: ['real-financial-stats'],
    queryFn: async () => {
      try {
        // 1. Compter groupes actifs
        const { count: activeGroups, error: groupsError } = await supabase
          .from('school_groups')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        if (groupsError) console.warn('Erreur groupes:', groupsError);

        // 2. Compter abonnements actifs
        const { count: activeSubscriptions, error: subsError } = await supabase
          .from('subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        if (subsError) console.warn('Erreur abonnements:', subsError);

        // 3. Calculer revenus du mois
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data: payments, error: paymentsError } = await supabase
          .from('payments')
          .select('amount')
          .eq('status', 'completed')
          .gte('created_at', startOfMonth.toISOString());

        if (paymentsError) console.warn('Erreur paiements:', paymentsError);

        const monthlyRevenue = (payments as any)?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;

        // 4. Compter plans actifs
        const { count: activePlans, error: plansError } = await supabase
          .from('subscription_plans')
          .select('*', { count: 'exact', head: true });

        if (plansError) console.warn('Erreur plans:', plansError);

        // 5. Calculer revenus mois précédent pour comparaison
        const startOfPreviousMonth = new Date(startOfMonth);
        startOfPreviousMonth.setMonth(startOfPreviousMonth.getMonth() - 1);
        
        const endOfPreviousMonth = new Date(startOfMonth);
        endOfPreviousMonth.setMilliseconds(-1);

        const { data: previousPayments } = await supabase
          .from('payments')
          .select('amount')
          .eq('status', 'completed')
          .gte('created_at', startOfPreviousMonth.toISOString())
          .lte('created_at', endOfPreviousMonth.toISOString());

        const previousMonthRevenue = (previousPayments as any)?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;

        // Calculer croissance
        const revenueGrowth = previousMonthRevenue > 0
          ? ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
          : 0;

        return {
          activeGroups: activeGroups || 0,
          activeSubscriptions: activeSubscriptions || 0,
          monthlyRevenue,
          activePlans: activePlans || 0,
          previousMonthRevenue,
          revenueGrowth,
        };
      } catch (error) {
        console.error('Erreur lors de la récupération des stats financières:', error);
        return {
          activeGroups: 0,
          activeSubscriptions: 0,
          monthlyRevenue: 0,
          activePlans: 0,
          previousMonthRevenue: 0,
          revenueGrowth: 0,
        };
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
};

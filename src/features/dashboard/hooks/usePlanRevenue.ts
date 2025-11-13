/**
 * Hook pour calculer les revenus des plans (MRR/ARR)
 * @module usePlanRevenue
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface PlanRevenueData {
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  totalSubscriptions: number;
  revenueByPlan: {
    planName: string;
    planSlug: string;
    subscriptions: number;
    mrr: number;
  }[];
}

export const usePlanRevenue = () => {
  return useQuery({
    queryKey: ['plan-revenue'],
    queryFn: async (): Promise<PlanRevenueData> => {
      // Retourner des données par défaut pour éviter les erreurs
      // TODO: Configurer correctement la table des abonnements
      console.warn('usePlanRevenue: Utilisation de données par défaut');
      
      return {
        mrr: 0,
        arr: 0,
        totalSubscriptions: 0,
        revenueByPlan: [],
      };
      
      /* Code original commenté jusqu'à configuration correcte de la BDD
      const { data: subscriptions, error } = await supabase
        .from('school_group_subscriptions')
        .select(`
          id,
          status,
          subscription_plans!inner(
            id,
            name,
            slug,
            price,
            billing_period
          )
        `)
        .eq('status', 'active');

      if (error) {
        console.error('Erreur récupération revenus:', error);
        throw error;
      }

      // Calculer MRR total
      let totalMRR = 0;
      const planRevenueMap = new Map<string, {
        planName: string;
        planSlug: string;
        subscriptions: number;
        mrr: number;
      }>();

      (subscriptions || []).forEach((sub: any) => {
        const plan = sub.subscription_plans;
        const price = plan.price || 0;
        
        // Convertir en MRR selon la période de facturation
        let monthlyPrice = price;
        switch (plan.billing_period) {
          case 'yearly':
            monthlyPrice = price / 12;
            break;
          case 'biannual':
            monthlyPrice = price / 6;
            break;
          case 'quarterly':
            monthlyPrice = price / 3;
            break;
          case 'monthly':
          default:
            monthlyPrice = price;
        }

        totalMRR += monthlyPrice;

        // Grouper par plan
        const planKey = plan.slug || plan.id;
        if (!planRevenueMap.has(planKey)) {
          planRevenueMap.set(planKey, {
            planName: plan.name,
            planSlug: plan.slug,
            subscriptions: 0,
            mrr: 0,
          });
        }

        const planData = planRevenueMap.get(planKey)!;
        planData.subscriptions += 1;
        planData.mrr += monthlyPrice;
      });

      return {
        mrr: Math.round(totalMRR),
        arr: Math.round(totalMRR * 12),
        totalSubscriptions: subscriptions?.length || 0,
        revenueByPlan: Array.from(planRevenueMap.values()).sort((a, b) => b.mrr - a.mrr),
      };
      */
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

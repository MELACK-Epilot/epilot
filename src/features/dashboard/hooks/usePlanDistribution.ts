/**
 * Hook pour récupérer la répartition des abonnements par plan
 * Graphique donut/pie
 * @module usePlanDistribution
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface PlanDistributionData {
  planName: string;
  planSlug: string;
  count: number;
  revenue: number;
  percentage: number;
  color: string;
}

const PLAN_COLORS: Record<string, string> = {
  gratuit: '#6B7280',
  premium: '#2A9D8F',
  pro: '#1D3557',
  institutionnel: '#E9C46A',
};

export const usePlanDistribution = () => {
  return useQuery({
    queryKey: ['plan-distribution'],
    queryFn: async (): Promise<PlanDistributionData[]> => {
      try {
        // Récupérer tous les abonnements actifs avec leur plan
        const { data: subscriptions, error } = await supabase
          .from('subscriptions')
          .select(`
            amount,
            subscription_plans!inner (
              id,
              name,
              slug,
              price,
              billing_period
            )
          `)
          .eq('status', 'active');

        if (error) throw error;

        // Grouper par plan
        const planMap = new Map<string, { name: string; slug: string; count: number; revenue: number }>();

        (subscriptions || []).forEach((sub: any) => {
          const plan = sub.subscription_plans;
          const planSlug = plan.slug || 'gratuit';
          
          // Calculer le revenu mensuel (MRR) pour cet abonnement
          let monthlyRevenue = 0;
          if (plan.billing_period === 'monthly') {
            monthlyRevenue = plan.price || 0;
          } else if (plan.billing_period === 'yearly') {
            monthlyRevenue = (plan.price || 0) / 12;
          }
          
          if (!planMap.has(planSlug)) {
            planMap.set(planSlug, {
              name: plan.name,
              slug: planSlug,
              count: 0,
              revenue: 0,
            });
          }

          const planData = planMap.get(planSlug)!;
          planData.count += 1;
          planData.revenue += monthlyRevenue;
        });

        // Calculer le total pour les pourcentages
        const totalCount = Array.from(planMap.values()).reduce((sum, p) => sum + p.count, 0);

        // Convertir en tableau avec pourcentages
        const result: PlanDistributionData[] = Array.from(planMap.entries()).map(([slug, data]) => ({
          planName: data.name,
          planSlug: slug,
          count: data.count,
          revenue: data.revenue,
          percentage: totalCount > 0 ? Math.round((data.count / totalCount) * 100) : 0,
          color: PLAN_COLORS[slug] || '#6B7280',
        }));

        // Trier par nombre d'abonnements (décroissant)
        return result.sort((a, b) => b.count - a.count);
      } catch (error) {
        console.error('Erreur lors de la récupération de la distribution des plans:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

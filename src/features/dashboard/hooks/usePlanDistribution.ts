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
              plan_type
            )
          `)
          .eq('status', 'active');

        if (error) throw error;

        // Grouper par plan
        const planMap = new Map<string, { name: string; slug: string; count: number; revenue: number }>();

        (subscriptions || []).forEach((sub: any) => {
          const plan = sub.subscription_plans;
          const planType = plan.plan_type || 'gratuit';
          
          if (!planMap.has(planType)) {
            planMap.set(planType, {
              name: plan.name,
              slug: planType,
              count: 0,
              revenue: 0,
            });
          }

          const planData = planMap.get(planType)!;
          planData.count += 1;
          planData.revenue += sub.amount || 0;
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

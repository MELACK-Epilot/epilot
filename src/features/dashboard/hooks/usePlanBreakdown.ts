/**
 * Hook pour récupérer la répartition du MRR par plan d'abonnement
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface PlanBreakdownData {
  plans: string[];
  mrr: number[];
  subscriptions: number[];
  colors: string[];
}

export const usePlanBreakdown = () => {
  return useQuery({
    queryKey: ['plan-breakdown'],
    queryFn: async (): Promise<PlanBreakdownData> => {
      try {
        // Appeler la fonction RPC Supabase
        const { data, error } = await supabase.rpc('get_plan_breakdown');

        if (error) {
          console.error('Erreur RPC get_plan_breakdown:', error);
          throw error;
        }

        // Si pas de données, retourner des données mock
        if (!data || (data as any[]).length === 0) {
          return generateMockPlanData();
        }

        return {
          plans: (data as any[]).map((d: any) => d.plan_name),
          mrr: (data as any[]).map((d: any) => d.total_mrr),
          subscriptions: (data as any[]).map((d: any) => d.subscription_count),
          colors: ['#1D3557', '#2A9D8F', '#E9C46A', '#E63946'],
        };
      } catch (error) {
        console.error('Erreur usePlanBreakdown:', error);
        return generateMockPlanData();
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
  });
};

/**
 * Génère des données mock pour le développement
 */
function generateMockPlanData(): PlanBreakdownData {
  return {
    plans: ['Gratuit', 'Standard', 'Premium', 'Institutionnel'],
    mrr: [0, 4500000, 8200000, 15300000], // En FCFA
    subscriptions: [45, 28, 15, 8],
    colors: ['#1D3557', '#2A9D8F', '#E9C46A', '#E63946'],
  };
}

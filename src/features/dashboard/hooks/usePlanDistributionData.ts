/**
 * Hook pour récupérer la distribution des abonnements par plan
 * Pour les graphiques
 * @module usePlanDistributionData
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface PlanDistribution {
  name: string;
  slug: string;
  value: number; // Nombre d'abonnements actifs
  percentage: number;
  color: string;
}

const PLAN_COLORS: Record<string, string> = {
  gratuit: '#6B7280',
  premium: '#2A9D8F',
  pro: '#1D3557',
  institutionnel: '#E9C46A',
};

export const usePlanDistributionData = () => {
  return useQuery({
    queryKey: ['plan-distribution-data'],
    queryFn: async (): Promise<PlanDistribution[]> => {
      // Retourner des données par défaut pour éviter les erreurs
      // TODO: Configurer correctement la table des abonnements
      console.warn('usePlanDistributionData: Utilisation de données par défaut');
      
      // Récupérer juste les plans sans les abonnements
      const { data: plans, error } = await supabase
        .from('subscription_plans')
        .select('id, name, slug, plan_type')
        .eq('is_active', true);

      if (error) {
        console.error('Erreur récupération distribution:', error);
        throw error;
      }

      // Retourner les plans avec valeur 0 en attendant la configuration BDD
      const distribution = (plans || []).map((plan: any) => {
        return {
          name: plan.name,
          slug: plan.slug || plan.plan_type,
          value: 0, // TODO: Compter les vrais abonnements
          percentage: 0,
          color: PLAN_COLORS[plan.plan_type] || PLAN_COLORS.gratuit,
        };
      });

      // Calculer les pourcentages
      const total = distribution.reduce((sum, item) => sum + item.value, 0);
      distribution.forEach(item => {
        item.percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
      });

      // Trier par nombre d'abonnements (décroissant)
      return distribution.sort((a, b) => b.value - a.value);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

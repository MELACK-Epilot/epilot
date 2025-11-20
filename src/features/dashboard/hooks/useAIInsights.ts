/**
 * Hook pour générer des insights IA basés sur les données réelles
 * Analyse les tendances et génère des recommandations intelligentes
 * ✅ REFACTORISÉ: Logique extraite dans utils/insights-generators.ts
 * @module useAIInsights
 */

import { useQuery } from '@tanstack/react-query';
import { useDashboardStats } from './useDashboardStats';
import { useMonthlyRevenue } from './useMonthlyRevenue';
import { useModuleAdoption } from './useModuleAdoption';
import {
  generateSubscriptionInsight,
  generateMRRInsight,
  generateCriticalAlertsInsight,
  generateRecommendation,
  generateRevenuePerformanceInsight,
  generateModuleAdoptionInsight,
} from '../utils/insights-generators';

export interface AIInsight {
  type: 'growth' | 'revenue' | 'alert' | 'recommendation';
  title: string;
  description: string;
  value?: string | number;
  trend?: number;
  color: string;
  icon: string;
  actionUrl?: string;
}

export const useAIInsights = () => {
  const { data: stats } = useDashboardStats();
  const { data: revenueData, isError: revenueError } = useMonthlyRevenue(6);
  const { data: moduleData } = useModuleAdoption();

  return useQuery({
    queryKey: ['ai-insights', stats, revenueData, moduleData],
    queryFn: async (): Promise<AIInsight[]> => {
      const insights: AIInsight[] = [];

      if (!stats) return insights;

      // Insight 1: Croissance des abonnements
      const subscriptionInsight = generateSubscriptionInsight(stats);
      if (subscriptionInsight) insights.push(subscriptionInsight);

      // Insight 2: Revenu mensuel (MRR)
      const mrrInsight = generateMRRInsight(stats);
      if (mrrInsight) insights.push(mrrInsight);

      // Insight 3: Alertes critiques
      insights.push(generateCriticalAlertsInsight(stats));

      // Insight 4: Recommandation
      insights.push(generateRecommendation(stats, moduleData));

      // Insight 5: Performance des revenus (si disponible et pas d'erreur)
      if (revenueData && !revenueError) {
        const revenueInsight = generateRevenuePerformanceInsight(revenueData);
        if (revenueInsight) insights.push(revenueInsight);
      }

      // Insight 6: Adoption des modules
      if (moduleData && moduleData.length > 0) {
        const moduleInsight = generateModuleAdoptionInsight(moduleData);
        if (moduleInsight) insights.push(moduleInsight);
      }

      // Limiter à 4 insights les plus pertinents
      return insights.slice(0, 4);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!stats,
  });
};

/**
 * Hook pour générer des insights IA basés sur les données réelles
 * Analyse les tendances et génère des recommandations intelligentes
 * @module useAIInsights
 */

import { useQuery } from '@tanstack/react-query';
import { useDashboardStats } from './useDashboardStats';
import { useMonthlyRevenue } from './useMonthlyRevenue';
import { useModuleAdoption } from './useModuleAdoption';

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
  const { data: revenueData } = useMonthlyRevenue(6);
  const { data: moduleData } = useModuleAdoption();

  return useQuery({
    queryKey: ['ai-insights', stats, revenueData, moduleData],
    queryFn: async (): Promise<AIInsight[]> => {
      const insights: AIInsight[] = [];

      if (!stats) return insights;

      // Insight 1: Croissance des abonnements
      const subscriptionTrend = stats.trends?.subscriptions ?? 0;
      if (subscriptionTrend !== 0) {
        insights.push({
          type: 'growth',
          title: subscriptionTrend >= 0 ? 'Croissance positive' : 'Croissance négative',
          description: `${Math.abs(subscriptionTrend).toFixed(1)}% ${subscriptionTrend >= 0 ? 'd\'augmentation' : 'de diminution'} des abonnements`,
          value: `${subscriptionTrend >= 0 ? '+' : ''}${subscriptionTrend.toFixed(1)}%`,
          trend: subscriptionTrend,
          color: subscriptionTrend >= 0 ? '#2A9D8F' : '#E63946',
          icon: 'TrendingUp',
        });
      }

      // Insight 2: Revenu mensuel (MRR)
      if (stats.estimatedMRR) {
        const mrrInMillions = stats.estimatedMRR / 1000000;
        const targetMRR = 2.0; // 2M FCFA objectif
        const achievement = (mrrInMillions / targetMRR) * 100;
        
        insights.push({
          type: 'revenue',
          title: 'Revenu mensuel',
          description: `MRR: ${mrrInMillions.toFixed(1)}M FCFA - Objectif: ${targetMRR}M FCFA (${achievement.toFixed(0)}%)`,
          value: `${mrrInMillions.toFixed(1)}M FCFA`,
          trend: achievement >= 100 ? 100 : achievement,
          color: '#E9C46A',
          icon: 'Download',
        });
      }

      // Insight 3: Alertes critiques
      if (stats.criticalSubscriptions && stats.criticalSubscriptions > 0) {
        insights.push({
          type: 'alert',
          title: 'Action urgente',
          description: `${stats.criticalSubscriptions} abonnements expirent sous 7 jours`,
          value: stats.criticalSubscriptions,
          color: '#E63946',
          icon: 'AlertCircle',
          actionUrl: '/dashboard/subscriptions?filter=critical',
        });
      } else {
        insights.push({
          type: 'alert',
          title: 'Tout va bien !',
          description: 'Aucun abonnement critique. Excellente gestion !',
          color: '#2A9D8F',
          icon: 'TrendingUp',
        });
      }

      // Insight 4: Recommandation basée sur les données
      let recommendation = '';
      if (stats.totalSchoolGroups < 10) {
        recommendation = 'Contactez 3 nouveaux groupes scolaires cette semaine';
      } else if (stats.totalSchoolGroups < 20) {
        recommendation = 'Proposez des formations aux groupes actifs';
      } else if (moduleData && moduleData.length > 0) {
        // Trouver le module avec la plus faible adoption
        const lowestAdoption = moduleData.reduce((min, m) => m.adoption < min.adoption ? m : min);
        if (lowestAdoption.adoption < 50) {
          recommendation = `Promouvoir le module "${lowestAdoption.name}" (${lowestAdoption.adoption}% adoption)`;
        } else {
          recommendation = 'Développez de nouveaux modules pour enrichir l\'offre';
        }
      } else {
        recommendation = 'Analysez les retours clients pour améliorer l\'expérience';
      }

      insights.push({
        type: 'recommendation',
        title: 'Recommandation',
        description: recommendation,
        color: '#1D3557',
        icon: 'Sparkles',
      });

      // Insight 5: Performance des revenus (si disponible)
      if (revenueData) {
        const { totalRevenue, totalExpenses, totalProfit, achievement } = revenueData;
        const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
        
        if (achievement < 80) {
          insights.push({
            type: 'alert',
            title: 'Objectif de revenus non atteint',
            description: `Seulement ${achievement.toFixed(0)}% de l'objectif atteint. Marge: ${profitMargin.toFixed(1)}%`,
            value: `${achievement.toFixed(0)}%`,
            color: '#F4A261',
            icon: 'AlertCircle',
          });
        } else if (profitMargin > 40) {
          insights.push({
            type: 'growth',
            title: 'Excellente rentabilité',
            description: `Marge bénéficiaire de ${profitMargin.toFixed(1)}% - Performance exceptionnelle`,
            value: `${profitMargin.toFixed(1)}%`,
            color: '#2A9D8F',
            icon: 'TrendingUp',
          });
        }
      }

      // Insight 6: Adoption des modules
      if (moduleData && moduleData.length > 0) {
        const avgAdoption = moduleData.reduce((sum, m) => sum + m.adoption, 0) / moduleData.length;
        const topModule = moduleData.reduce((max, m) => m.adoption > max.adoption ? m : max);
        
        if (avgAdoption < 60) {
          insights.push({
            type: 'recommendation',
            title: 'Adoption des modules faible',
            description: `Moyenne ${avgAdoption.toFixed(0)}%. Organisez des formations pour augmenter l'utilisation`,
            value: `${avgAdoption.toFixed(0)}%`,
            color: '#F4A261',
            icon: 'Package',
          });
        } else {
          insights.push({
            type: 'growth',
            title: 'Bonne adoption des modules',
            description: `"${topModule.name}" est le plus utilisé avec ${topModule.adoption}% d'adoption`,
            value: `${avgAdoption.toFixed(0)}%`,
            color: '#2A9D8F',
            icon: 'Package',
          });
        }
      }

      // Limiter à 4 insights les plus pertinents
      return insights.slice(0, 4);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!stats,
  });
};

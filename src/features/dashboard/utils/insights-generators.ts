/**
 * Générateurs d'insights IA pour le dashboard
 * Fonctions pures pour générer des insights basés sur les données
 * @module insights-generators
 */

import type { AIInsight } from '../hooks/useAIInsights';
import type { DashboardStats } from '../hooks/useDashboardStats';
import type { MonthlyRevenueStats } from '../hooks/useMonthlyRevenue';
import type { ModuleAdoptionData } from '../hooks/useModuleAdoption';

/**
 * Génère un insight sur la croissance des abonnements
 */
export const generateSubscriptionInsight = (stats: DashboardStats): AIInsight | null => {
  const subscriptionTrend = stats.trends?.subscriptions ?? 0;
  
  if (subscriptionTrend === 0) return null;

  return {
    type: 'growth',
    title: subscriptionTrend >= 0 ? 'Croissance positive' : 'Croissance négative',
    description: `${Math.abs(subscriptionTrend).toFixed(1)}% ${subscriptionTrend >= 0 ? 'd\'augmentation' : 'de diminution'} des abonnements`,
    value: `${subscriptionTrend >= 0 ? '+' : ''}${subscriptionTrend.toFixed(1)}%`,
    trend: subscriptionTrend,
    color: subscriptionTrend >= 0 ? '#2A9D8F' : '#E63946',
    icon: 'TrendingUp',
  };
};

/**
 * Génère un insight sur le revenu mensuel (MRR)
 */
export const generateMRRInsight = (stats: DashboardStats): AIInsight | null => {
  if (!stats.estimatedMRR) return null;

  const mrrInMillions = stats.estimatedMRR / 1000000;
  const targetMRR = 2.0; // 2M FCFA objectif
  const achievement = (mrrInMillions / targetMRR) * 100;
  
  return {
    type: 'revenue',
    title: 'Revenu mensuel',
    description: `MRR: ${mrrInMillions.toFixed(1)}M FCFA - Objectif: ${targetMRR}M FCFA (${achievement.toFixed(0)}%)`,
    value: `${mrrInMillions.toFixed(1)}M FCFA`,
    trend: achievement >= 100 ? 100 : achievement,
    color: '#E9C46A',
    icon: 'Download',
  };
};

/**
 * Génère un insight sur les alertes critiques
 */
export const generateCriticalAlertsInsight = (stats: DashboardStats): AIInsight => {
  if (stats.criticalSubscriptions && stats.criticalSubscriptions > 0) {
    return {
      type: 'alert',
      title: 'Action urgente',
      description: `${stats.criticalSubscriptions} abonnements expirent sous 7 jours`,
      value: stats.criticalSubscriptions,
      color: '#E63946',
      icon: 'AlertCircle',
      actionUrl: '/dashboard/subscriptions?filter=critical',
    };
  }

  return {
    type: 'alert',
    title: 'Tout va bien !',
    description: 'Aucun abonnement critique. Excellente gestion !',
    color: '#2A9D8F',
    icon: 'TrendingUp',
  };
};

/**
 * Génère une recommandation basée sur les données
 */
export const generateRecommendation = (
  stats: DashboardStats,
  moduleData?: ModuleAdoptionData[]
): AIInsight => {
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

  return {
    type: 'recommendation',
    title: 'Recommandation',
    description: recommendation,
    color: '#1D3557',
    icon: 'Sparkles',
  };
};

/**
 * Génère un insight sur la performance des revenus
 */
export const generateRevenuePerformanceInsight = (
  revenueData: MonthlyRevenueStats
): AIInsight | null => {
  const { totalRevenue, totalProfit, achievement } = revenueData;
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  
  if (achievement < 80) {
    return {
      type: 'alert',
      title: 'Objectif de revenus non atteint',
      description: `Seulement ${achievement.toFixed(0)}% de l'objectif atteint. Marge: ${profitMargin.toFixed(1)}%`,
      value: `${achievement.toFixed(0)}%`,
      color: '#F4A261',
      icon: 'AlertCircle',
    };
  }

  if (profitMargin > 40) {
    return {
      type: 'growth',
      title: 'Excellente rentabilité',
      description: `Marge bénéficiaire de ${profitMargin.toFixed(1)}% - Performance exceptionnelle`,
      value: `${profitMargin.toFixed(1)}%`,
      color: '#2A9D8F',
      icon: 'TrendingUp',
    };
  }

  return null;
};

/**
 * Génère un insight sur l'adoption des modules
 */
export const generateModuleAdoptionInsight = (
  moduleData: ModuleAdoptionData[]
): AIInsight | null => {
  if (!moduleData || moduleData.length === 0) return null;

  const avgAdoption = moduleData.reduce((sum, m) => sum + m.adoption, 0) / moduleData.length;
  const topModule = moduleData.reduce((max, m) => m.adoption > max.adoption ? m : max);
  
  if (avgAdoption < 60) {
    return {
      type: 'recommendation',
      title: 'Adoption des modules faible',
      description: `Moyenne ${avgAdoption.toFixed(0)}%. Organisez des formations pour augmenter l'utilisation`,
      value: `${avgAdoption.toFixed(0)}%`,
      color: '#F4A261',
      icon: 'Package',
    };
  }

  return {
    type: 'growth',
    title: 'Bonne adoption des modules',
    description: `"${topModule.name}" est le plus utilisé avec ${topModule.adoption}% d'adoption`,
    value: `${avgAdoption.toFixed(0)}%`,
    color: '#2A9D8F',
    icon: 'Package',
  };
};

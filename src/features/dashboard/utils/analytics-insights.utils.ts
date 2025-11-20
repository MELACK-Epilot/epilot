/**
 * Génération d'insights IA basés sur les métriques
 * @module analytics-insights.utils
 */

import type { PlanMetrics, Insight } from '../types/analytics.types';

/**
 * Génère des insights IA à partir des métriques des plans
 */
export const generateInsights = (planMetrics: PlanMetrics[]): Insight[] => {
  const insights: Insight[] = [];

  planMetrics.forEach(plan => {
    // Insight sur le churn élevé
    if (plan.churnRate > 15) {
      insights.push({
        type: 'warning',
        title: `Churn élevé sur ${plan.planName}`,
        description: `Le taux d'attrition de ${plan.churnRate}% est préoccupant et nécessite une attention immédiate.`,
        impact: 'high',
        actionable: true,
        recommendation: 'Analyser les raisons d\'annulation et améliorer l\'onboarding.',
      });
    }

    // Insight sur la croissance
    if (plan.growthRate30d > 20) {
      insights.push({
        type: 'success',
        title: `Forte croissance sur ${plan.planName}`,
        description: `Croissance de ${plan.growthRate30d}% ce mois. Excellent momentum !`,
        impact: 'high',
        actionable: true,
        recommendation: 'Capitaliser sur cette croissance en augmentant les efforts marketing.',
      });
    }

    // Insight sur les performances faibles
    if (plan.activeSubscriptions === 0) {
      insights.push({
        type: 'warning',
        title: `Aucun abonnement actif sur ${plan.planName}`,
        description: 'Ce plan n\'attire aucun client. Revoir la proposition de valeur.',
        impact: 'medium',
        actionable: true,
        recommendation: 'Analyser la concurrence et ajuster les fonctionnalités ou le prix.',
      });
    }
  });

  // Insight global sur la diversification
  const activePlans = planMetrics.filter(p => p.activeSubscriptions > 0).length;
  if (activePlans < 2) {
    insights.push({
      type: 'info',
      title: 'Diversification des revenus',
      description: 'La majorité des revenus provient d\'un seul plan. Risque de concentration.',
      impact: 'medium',
      actionable: true,
      recommendation: 'Développer et promouvoir d\'autres plans pour diversifier les revenus.',
    });
  }

  return insights.slice(0, 5); // Limiter à 5 insights max
};

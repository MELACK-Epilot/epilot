/**
 * Générateur de recommandations optimisé
 * Basé sur AnalyticsMetrics (vraies données)
 * @module recommendation-generator-optimized.utils
 */

import type { AnalyticsMetrics } from '../hooks/usePlanAnalyticsOptimized';
import type { Recommendation } from '../types/optimization.types';

export const generateRecommendationsOptimized = (analytics: AnalyticsMetrics): Recommendation[] => {
  const recommendations: Recommendation[] = [];

  // 1. Analyser chaque plan
  analytics.planDistribution.forEach(plan => {
    // CHURN ÉLEVÉ
    if (plan.churnRate > 5) {
      const savedClients = Math.max(1, Math.round(plan.count * (plan.churnRate / 100)));
      const mrrImpact = savedClients * plan.avgRevenuePerSub;

      recommendations.push({
        id: `churn-${plan.planId}`,
        type: 'retention',
        priority: 'high',
        planId: plan.planId,
        planName: plan.planName,
        title: `Alerte Churn : Plan ${plan.planName}`,
        description: `Le taux d'annulation de ${plan.churnRate.toFixed(1)}% est critique. Risque de perte de ${savedClients} clients.`,
        impact: `Sauver ${savedClients} clients (${(mrrImpact / 1000).toFixed(0)}K FCFA MRR)`,
        action: 'Lancer une campagne de rétention d\'urgence',
        estimatedMRRImpact: mrrImpact,
        estimatedChurnReduction: 5,
      });
    }

    // ARPU BAS (Opportunité Pricing)
    // Seuil arbitraire pour l'exemple, à ajuster selon le business
    if (plan.avgRevenuePerSub > 0 && plan.avgRevenuePerSub < 15000 && plan.planSlug !== 'gratuit') {
      const potentialIncrease = plan.count * 5000; // +5000 FCFA par client
      
      recommendations.push({
        id: `pricing-${plan.planId}`,
        type: 'pricing',
        priority: 'medium',
        planId: plan.planId,
        planName: plan.planName,
        title: `Optimisation Pricing : ${plan.planName}`,
        description: `L'ARPU est faible (${(plan.avgRevenuePerSub / 1000).toFixed(0)}K). Le marché accepte ~20K FCFA.`,
        impact: `+${(potentialIncrease / 1000).toFixed(0)}K FCFA MRR potentiel`,
        action: 'Proposer des modules additionnels ou augmenter le prix',
        estimatedMRRImpact: potentialIncrease,
      });
    }

    // CROISSANCE FORTE (Momentum)
    if (plan.growthRate > 10) {
      recommendations.push({
        id: `growth-${plan.planId}`,
        type: 'marketing',
        priority: 'high',
        planId: plan.planId,
        planName: plan.planName,
        title: `Momentum : ${plan.planName}`,
        description: `Croissance de ${plan.growthRate.toFixed(1)}% ce mois. C'est le moment d'accélérer.`,
        impact: 'Acquisition massive de clients',
        action: 'Doubler le budget publicitaire sur ce segment',
      });
    }
  });

  // 2. Recommandations Globales

  // MRR Global Faible
  if (analytics.totalMRR < 500000) {
    recommendations.push({
      id: 'global-acquisition',
      type: 'marketing',
      priority: 'high',
      title: 'Focus Acquisition Prioritaire',
      description: `Le MRR global est sous le seuil de viabilité. Il faut acquérir des clients payants.`,
      impact: 'Atteindre le seuil de rentabilité',
      action: 'Lancer une offre promotionnelle "Early Adopter"',
    });
  }

  // Rétention Excellente
  if (analytics.retentionRate > 95 && analytics.totalActiveSubscriptions > 10) {
    recommendations.push({
      id: 'referral-program',
      type: 'marketing',
      priority: 'medium',
      title: 'Lancer un programme de parrainage',
      description: `Rétention excellente (${analytics.retentionRate.toFixed(1)}%). Vos clients sont vos meilleurs vendeurs.`,
      impact: 'Acquisition à coût zéro (CAC = 0)',
      action: 'Activer le module de parrainage',
    });
  }

  return recommendations.sort((a, b) => {
    const p = { high: 3, medium: 2, low: 1 };
    return p[b.priority] - p[a.priority];
  });
};

/**
 * Générateur de recommandations basé sur analytics réels
 * @module recommendation-generator.utils
 */

import type { PlanAnalytics } from '../types/analytics.types';
import type { Recommendation } from '../types/optimization.types';

/**
 * Génère des recommandations intelligentes basées sur les analytics réels
 */
export const generateRecommendations = (analytics: PlanAnalytics): Recommendation[] => {
  const recommendations: Recommendation[] = [];

  analytics.planMetrics.forEach(plan => {
    // 1. CHURN ÉLEVÉ - Priorité haute
    if (plan.churnRate > 15) {
      const savedClients = Math.round(plan.activeSubscriptions * (plan.churnRate / 100));
      const mrrImpact = savedClients * plan.averageRevenuePerUser;

      recommendations.push({
        id: `churn-${plan.planId}`,
        type: 'retention',
        priority: 'high',
        planId: plan.planId,
        planName: plan.planName,
        title: `Réduire le churn de ${plan.planName}`,
        description: `Le taux de churn de ${plan.churnRate}% est préoccupant. ${savedClients} clients risquent de partir ce mois, représentant une perte potentielle de ${Math.round(mrrImpact / 1000)}K FCFA MRR.`,
        impact: `Sauver ${savedClients} clients (${Math.round(mrrImpact / 1000)}K FCFA MRR)`,
        action: 'Mettre en place un programme de rétention ciblé avec enquêtes de satisfaction',
        estimatedMRRImpact: mrrImpact,
        estimatedChurnReduction: plan.churnRate - 10,
      });
    }

    // 2. ARPU BAS - Opportunité pricing
    const marketARPU = 60000; // FCFA - À configurer selon marché
    if (plan.averageRevenuePerUser < marketARPU * 0.8 && plan.activeSubscriptions > 0) {
      const potentialIncrease = (marketARPU - plan.averageRevenuePerUser) * plan.activeSubscriptions;
      const percentBelow = Math.round((1 - plan.averageRevenuePerUser / marketARPU) * 100);

      recommendations.push({
        id: `arpu-${plan.planId}`,
        type: 'pricing',
        priority: 'medium',
        planId: plan.planId,
        planName: plan.planName,
        title: `Augmenter l'ARPU de ${plan.planName}`,
        description: `L'ARPU de ${Math.round(plan.averageRevenuePerUser / 1000)}K FCFA est ${percentBelow}% inférieur à la moyenne du marché (${Math.round(marketARPU / 1000)}K FCFA). Opportunité d'optimisation du pricing.`,
        impact: `+${Math.round(potentialIncrease / 1000)}K FCFA MRR (+${Math.round((potentialIncrease / (plan.monthlyRevenue || 1)) * 100)}%)`,
        action: 'Proposer des add-ons premium ou augmenter le prix de 10-15%',
        estimatedMRRImpact: potentialIncrease,
      });
    }

    // 3. CROISSANCE FORTE - Capitaliser
    if (plan.growthRate30d > 20) {
      const potentialNewClients = Math.round(plan.newSubscriptions30d * 0.5);
      const potentialMRR = potentialNewClients * plan.averageRevenuePerUser;

      recommendations.push({
        id: `growth-${plan.planId}`,
        type: 'marketing',
        priority: 'high',
        planId: plan.planId,
        planName: plan.planName,
        title: `Capitaliser sur la croissance de ${plan.planName}`,
        description: `Croissance exceptionnelle de ${plan.growthRate30d}% ce mois (${plan.newSubscriptions30d} nouveaux clients). Momentum fort à exploiter immédiatement.`,
        impact: `+${potentialNewClients} clients potentiels (+${Math.round(potentialMRR / 1000)}K FCFA MRR)`,
        action: 'Augmenter le budget marketing de 50% sur ce segment et optimiser le funnel',
        estimatedNewClients: potentialNewClients,
        estimatedMRRImpact: potentialMRR,
      });
    }

    // 4. CONVERSION FAIBLE - Optimisation funnel
    if (plan.conversionRate > 0 && plan.conversionRate < 5) {
      const targetConversion = 10; // %
      const potentialConversions = Math.round((targetConversion - plan.conversionRate) * plan.activeSubscriptions / plan.conversionRate);

      recommendations.push({
        id: `conversion-${plan.planId}`,
        type: 'marketing',
        priority: 'medium',
        planId: plan.planId,
        planName: plan.planName,
        title: `Améliorer la conversion de ${plan.planName}`,
        description: `Taux de conversion de ${plan.conversionRate}% est inférieur à la moyenne du secteur (8-12%). Opportunité d'optimisation du funnel d'acquisition.`,
        impact: `+${potentialConversions} conversions potentielles`,
        action: 'Optimiser l\'onboarding, proposer essai gratuit étendu et améliorer la proposition de valeur',
        estimatedNewClients: potentialConversions,
      });
    }

    // 5. PLAN INACTIF - Revoir offre
    if (plan.activeSubscriptions === 0) {
      recommendations.push({
        id: `inactive-${plan.planId}`,
        type: 'features',
        priority: 'low',
        planId: plan.planId,
        planName: plan.planName,
        title: `Revoir la proposition de valeur de ${plan.planName}`,
        description: `Aucun client actif sur ce plan. La proposition de valeur ou le pricing ne correspondent pas aux attentes du marché.`,
        impact: `Potentiel de nouveaux clients`,
        action: 'Analyser la concurrence, ajuster les fonctionnalités ou le prix, ou archiver le plan',
      });
    }

    // 6. RÉTENTION EXCELLENTE - Capitaliser
    if (plan.retentionRate > 95 && plan.activeSubscriptions > 10) {
      recommendations.push({
        id: `retention-${plan.planId}`,
        type: 'marketing',
        priority: 'low',
        planId: plan.planId,
        planName: plan.planName,
        title: `Capitaliser sur l'excellente rétention de ${plan.planName}`,
        description: `Taux de rétention exceptionnel de ${plan.retentionRate}%. Les clients sont très satisfaits.`,
        impact: `Opportunité de croissance par recommandations`,
        action: 'Lancer un programme de parrainage avec récompenses pour les clients actuels',
      });
    }
  });

  // 7. RECOMMANDATIONS GLOBALES

  // Diversification des revenus
  const activePlans = analytics.planMetrics.filter(p => p.activeSubscriptions > 0).length;
  const totalPlans = analytics.planMetrics.length;
  
  if (activePlans < totalPlans * 0.5 && totalPlans > 2) {
    recommendations.push({
      id: 'diversification',
      type: 'marketing',
      priority: 'medium',
      title: 'Diversifier les sources de revenus',
      description: `Seulement ${activePlans} plan(s) sur ${totalPlans} génère(nt) des revenus. Risque de concentration élevé.`,
      impact: `Réduction du risque business`,
      action: 'Promouvoir les plans inactifs ou créer de nouveaux plans intermédiaires',
    });
  }

  // MRR global faible
  if (analytics.mrr < 1000000) { // < 1M FCFA
    recommendations.push({
      id: 'mrr-growth',
      type: 'marketing',
      priority: 'high',
      title: 'Accélérer la croissance du MRR',
      description: `MRR actuel de ${Math.round(analytics.mrr / 1000)}K FCFA est en-dessous du seuil de rentabilité optimal.`,
      impact: `Atteindre 1M FCFA MRR`,
      action: 'Campagne d\'acquisition agressive et optimisation du pricing',
    });
  }

  // Tri par priorité puis par impact
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    
    if (priorityDiff !== 0) return priorityDiff;
    
    // Si même priorité, trier par impact MRR
    return (b.estimatedMRRImpact || 0) - (a.estimatedMRRImpact || 0);
  });
};

/**
 * Calcule les métriques agrégées des recommandations
 */
export const calculateOptimizationMetrics = (recommendations: Recommendation[]) => {
  return {
    mrrImpact: recommendations.reduce((sum, r) => sum + (r.estimatedMRRImpact || 0), 0),
    newClients: recommendations.reduce((sum, r) => sum + (r.estimatedNewClients || 0), 0),
    churnReduction: recommendations
      .filter(r => r.type === 'retention')
      .reduce((sum, r) => sum + (r.estimatedChurnReduction || 0), 0) / 
      Math.max(1, recommendations.filter(r => r.type === 'retention').length),
  };
};

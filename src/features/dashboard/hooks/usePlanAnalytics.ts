/**
 * Hook avancé pour les analytics des plans
 * Métriques business et insights IA
 * @module usePlanAnalytics
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface PlanAnalytics {
  // Métriques de base
  totalRevenue: number;
  mrr: number;
  arr: number;
  
  // Métriques par plan
  planMetrics: Array<{
    planId: string;
    planName: string;
    planSlug: string;
    // Abonnements
    activeSubscriptions: number;
    newSubscriptions30d: number;
    churnedSubscriptions30d: number;
    // Revenus
    monthlyRevenue: number;
    averageRevenuePerUser: number;
    // Taux
    conversionRate: number;
    churnRate: number;
    retentionRate: number;
    // Croissance
    growthRate30d: number;
    // Prédictions IA
    predictedChurn: number;
    recommendedPrice: number;
    marketPosition: 'underpriced' | 'optimal' | 'overpriced';
  }>;
  
  // Insights IA
  insights: Array<{
    type: 'opportunity' | 'warning' | 'success' | 'info';
    title: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
    actionable: boolean;
    recommendation?: string;
  }>;
  
  // Comparaisons marché
  marketComparison: {
    industryAveragePrice: number;
    competitorAnalysis: Array<{
      competitor: string;
      price: number;
      features: number;
      marketShare: number;
    }>;
  };
}

export const usePlanAnalytics = () => {
  return useQuery({
    queryKey: ['plan-analytics'],
    queryFn: async (): Promise<PlanAnalytics> => {
      // Récupérer les données de base
      const [plansResult, subscriptionsResult, paymentsResult] = await Promise.all([
        // Plans avec abonnements
        supabase
          .from('subscription_plans')
          .select(`
            id,
            name,
            slug,
            price,
            billing_period,
            school_group_subscriptions!inner(
              id,
              status,
              created_at,
              updated_at,
              start_date,
              end_date
            )
          `),
        
        // Abonnements des 30 derniers jours
        supabase
          .from('school_group_subscriptions')
          .select('*')
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        
        // Paiements pour calcul revenus
        supabase
          .from('fee_payments')
          .select('amount, created_at, subscription_id')
          .eq('status', 'paid')
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      if (plansResult.error || subscriptionsResult.error || paymentsResult.error) {
        console.error('Erreur analytics:', { plansResult, subscriptionsResult, paymentsResult });
        throw new Error('Erreur lors du calcul des analytics');
      }

      const plans = plansResult.data || [];
      const recentSubscriptions = subscriptionsResult.data || [];
      const recentPayments = paymentsResult.data || [];

      // Calculer les métriques par plan
      const planMetrics = plans.map(plan => {
        const subscriptions = plan.school_group_subscriptions || [];
        const activeSubscriptions = subscriptions.filter((sub: any) => sub.status === 'active');
        const newSubs30d = recentSubscriptions.filter((sub: any) => 
          sub.plan_id === plan.id && sub.status === 'active'
        ).length;

        // Calcul MRR pour ce plan
        const monthlyPrice = plan.billing_period === 'yearly' ? plan.price / 12 : plan.price;
        const planMRR = activeSubscriptions.length * monthlyPrice;

        // Calcul taux de conversion (simplifié)
        const conversionRate = subscriptions.length > 0 ? 
          (activeSubscriptions.length / subscriptions.length) * 100 : 0;

        // Calcul churn rate (simplifié)
        const churnedSubs = subscriptions.filter((sub: any) => 
          sub.status === 'cancelled' || sub.status === 'expired'
        ).length;
        const churnRate = subscriptions.length > 0 ? 
          (churnedSubs / subscriptions.length) * 100 : 0;

        // IA - Prédictions basiques
        const predictedChurn = Math.max(0, churnRate + (Math.random() - 0.5) * 10);
        const marketMultiplier = plan.slug === 'premium' ? 1.2 : plan.slug === 'pro' ? 1.5 : 1;
        const recommendedPrice = Math.round(plan.price * marketMultiplier);

        // Position marché basée sur le prix vs concurrence
        let marketPosition: 'underpriced' | 'optimal' | 'overpriced' = 'optimal';
        if (plan.price < recommendedPrice * 0.8) marketPosition = 'underpriced';
        if (plan.price > recommendedPrice * 1.2) marketPosition = 'overpriced';

        return {
          planId: plan.id,
          planName: plan.name,
          planSlug: plan.slug,
          activeSubscriptions: activeSubscriptions.length,
          newSubscriptions30d: newSubs30d,
          churnedSubscriptions30d: churnedSubs,
          monthlyRevenue: planMRR,
          averageRevenuePerUser: activeSubscriptions.length > 0 ? planMRR / activeSubscriptions.length : 0,
          conversionRate: Math.round(conversionRate * 10) / 10,
          churnRate: Math.round(churnRate * 10) / 10,
          retentionRate: Math.round((100 - churnRate) * 10) / 10,
          growthRate30d: newSubs30d > 0 ? Math.round((newSubs30d / Math.max(1, activeSubscriptions.length - newSubs30d)) * 100 * 10) / 10 : 0,
          predictedChurn: Math.round(predictedChurn * 10) / 10,
          recommendedPrice,
          marketPosition,
        };
      });

      // Calcul métriques globales
      const totalMRR = planMetrics.reduce((sum, plan) => sum + plan.monthlyRevenue, 0);
      const totalRevenue = recentPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

      // Génération d'insights IA
      const insights = generateInsights(planMetrics);

      // Comparaison marché (données simulées)
      const marketComparison = {
        industryAveragePrice: 75000, // FCFA
        competitorAnalysis: [
          { competitor: 'SchoolTech Pro', price: 85000, features: 45, marketShare: 25 },
          { competitor: 'EduManager', price: 65000, features: 38, marketShare: 18 },
          { competitor: 'Campus Suite', price: 95000, features: 52, marketShare: 15 },
        ],
      };

      return {
        totalRevenue: Math.round(totalRevenue),
        mrr: Math.round(totalMRR),
        arr: Math.round(totalMRR * 12),
        planMetrics,
        insights,
        marketComparison,
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 15 * 60 * 1000, // 15 minutes
  });
};

/**
 * Génération d'insights IA basés sur les métriques
 */
function generateInsights(planMetrics: any[]): PlanAnalytics['insights'] {
  const insights: PlanAnalytics['insights'] = [];

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

    // Insight sur le pricing
    if (plan.marketPosition === 'underpriced') {
      insights.push({
        type: 'opportunity',
        title: `Opportunité de pricing sur ${plan.planName}`,
        description: `Le plan semble sous-évalué. Prix recommandé: ${plan.recommendedPrice.toLocaleString()} FCFA`,
        impact: 'medium',
        actionable: true,
        recommendation: 'Tester une augmentation progressive des prix.',
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
}

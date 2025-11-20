/**
 * Hook avancé pour les analytics des plans
 * Métriques business et insights IA
 * @module usePlanAnalytics
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  calculateMonthlyConversionRate,
  calculateMonthlyChurnRate,
  calculateRetentionRate,
  calculateGrowthRate,
} from '../utils/analytics-metrics.utils';
import { isInLastNDays } from '../utils/analytics-dates.utils';
import { generateInsights } from '../utils/analytics-insights.utils';
import type { PlanAnalytics, Plan, PlanSubscription, Payment, PlanMetrics } from '../types/analytics.types';

export type { PlanAnalytics, PlanMetrics };

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

      // Vérifier les erreurs critiques (plans et subscriptions)
      if (plansResult.error || subscriptionsResult.error) {
        console.error('Erreur analytics (critique):', { plansResult, subscriptionsResult });
        throw new Error('Erreur lors du calcul des analytics');
      }

      // Gérer l'erreur payments de manière gracieuse (non critique)
      if (paymentsResult.error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Erreur payments (non bloquant):', paymentsResult.error);
          console.info('Les analytics continueront sans les données de paiements');
        }
      }

      const plans = (plansResult.data as Plan[]) || [];
      const recentSubscriptions = (subscriptionsResult.data as PlanSubscription[]) || [];
      const recentPayments = (paymentsResult.data as Payment[]) || [];

      // Calculer les métriques par plan
      const planMetrics: PlanMetrics[] = plans.map(plan => {
        const subscriptions = plan.school_group_subscriptions || [];
        const activeSubscriptions = subscriptions.filter((sub: any) => sub.status === 'active');
        const newSubs30d = recentSubscriptions.filter((sub: any) => 
          sub.plan_id === plan.id && sub.status === 'active'
        ).length;

        // Calcul MRR pour ce plan
        const monthlyPrice = plan.billing_period === 'yearly' ? plan.price / 12 : plan.price;
        const planMRR = activeSubscriptions.length * monthlyPrice;

        // Calcul taux de conversion (méthode SaaS correcte)
        const conversionRate = calculateMonthlyConversionRate(subscriptions);

        // Calcul churn rate (méthode SaaS correcte)
        const churnRate = calculateMonthlyChurnRate(subscriptions);
        
        // Calcul taux de rétention
        const retentionRate = calculateRetentionRate(churnRate);
        
        // Calcul taux de croissance sur 30 jours
        const growthRate30d = calculateGrowthRate(subscriptions, 30);
        
        // Abonnements annulés ce mois
        const churnedSubs = subscriptions.filter((sub: any) => 
          (sub.status === 'cancelled' || sub.status === 'expired') &&
          isInLastNDays(sub.updated_at || sub.end_date, 30)
        ).length;

        // Note: Prédictions IA et recommandations de prix retirées
        // Nécessite un modèle ML réel pour être fiable
        // TODO: Implémenter un vrai modèle de prédiction basé sur l'historique

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
          retentionRate: Math.round(retentionRate * 10) / 10,
          growthRate30d: Math.round(growthRate30d * 10) / 10,
        };
      });

      // Calcul métriques globales
      const totalMRR = planMetrics.reduce((sum, plan) => sum + plan.monthlyRevenue, 0);
      const totalRevenue = recentPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

      // Génération d'insights IA
      const insights = generateInsights(planMetrics);

      // Comparaison marché retirée (données fictives)
      // TODO: Intégrer une vraie API de market intelligence
      const marketComparison = null;

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


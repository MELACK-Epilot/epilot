/**
 * Hook Analytics Optimisé - Données Réelles
 * Utilise la vue matérialisée subscriptions_enriched pour performance maximale
 * @module usePlanAnalyticsOptimized
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface AnalyticsMetrics {
  // Revenus
  totalMRR: number;
  totalARR: number;
  mrrGrowth: number; // % croissance MRR vs mois dernier
  
  // Abonnements
  totalActiveSubscriptions: number;
  newSubscriptionsThisMonth: number;
  cancelledThisMonth: number;
  expiringThisMonth: number;
  
  // Métriques Business
  arpu: number; // Average Revenue Per User
  churnRate: number; // Taux d'annulation mensuel
  retentionRate: number; // 100 - churnRate
  
  // Distribution par plan
  planDistribution: {
    planId: string;
    planName: string;
    planSlug: string;
    count: number;
    mrr: number;
    percentage: number;
    avgRevenuePerSub: number;
    churnRate: number;
    growthRate: number;
  }[];
  
  // Tendances (30 derniers jours)
  trends: {
    newSubs: number;
    cancelled: number;
    netGrowth: number; // newSubs - cancelled
    mrrChange: number;
  };
  
  // Insights automatiques
  insights: {
    type: 'success' | 'warning' | 'info' | 'danger';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
  }[];
}

export const usePlanAnalyticsOptimized = () => {
  return useQuery<AnalyticsMetrics>({
    queryKey: ['plan-analytics-optimized'],
    queryFn: async () => {
      // 1. Récupérer les abonnements actifs avec MRR pré-calculé
      const { data: activeSubscriptions, error: activeError } = await supabase
        .from('subscriptions_enriched')
        .select('*')
        .eq('status', 'active');

      if (activeError) throw activeError;

      // 2. Récupérer les abonnements des 30 derniers jours
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentSubs, error: recentError } = await supabase
        .from('subscriptions')
        .select('id, plan_id, status, created_at, subscription_plans(name, slug)')
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (recentError) throw recentError;

      // 3. Récupérer les annulations du mois
      const { data: cancelledSubs, error: cancelledError } = await supabase
        .from('subscriptions')
        .select('id, cancelled_at, plan_id, subscription_plans(name)')
        .eq('status', 'cancelled')
        .gte('cancelled_at', thirtyDaysAgo.toISOString());

      if (cancelledError) throw cancelledError;

      // 4. Calculer les métriques
      const totalMRR = activeSubscriptions?.reduce((sum, sub) => sum + (sub.mrr_contribution || 0), 0) || 0;
      const totalARR = totalMRR * 12;
      const totalActive = activeSubscriptions?.length || 0;
      const arpu = totalActive > 0 ? totalMRR / totalActive : 0;

      // Nouveaux abonnements ce mois
      const newThisMonth = recentSubs?.filter(s => s.status === 'active').length || 0;
      const cancelledThisMonth = cancelledSubs?.length || 0;
      const netGrowth = newThisMonth - cancelledThisMonth;

      // Churn rate (annulations / total actif)
      const churnRate = totalActive > 0 ? (cancelledThisMonth / totalActive) * 100 : 0;
      const retentionRate = 100 - churnRate;

      // Abonnements expirant ce mois
      const expiringThisMonth = activeSubscriptions?.filter(
        sub => sub.expiry_status === 'expiring_soon' || sub.expiry_status === 'expiring_this_month'
      ).length || 0;

      // 5. Distribution par plan
      const planMap = new Map<string, any>();
      activeSubscriptions?.forEach(sub => {
        const key = sub.plan_id;
        if (!planMap.has(key)) {
          planMap.set(key, {
            planId: sub.plan_id,
            planName: sub.plan_name,
            planSlug: sub.plan_slug,
            count: 0,
            mrr: 0,
            newSubs: 0,
            cancelledSubs: 0,
          });
        }
        const plan = planMap.get(key);
        plan.count += 1;
        plan.mrr += sub.mrr_contribution || 0;
      });

      // Calculer les métriques par plan
      recentSubs?.forEach(sub => {
        if (sub.status === 'active' && planMap.has(sub.plan_id)) {
          planMap.get(sub.plan_id).newSubs += 1;
        }
      });

      cancelledSubs?.forEach(sub => {
        if (sub.plan_id && planMap.has(sub.plan_id)) {
          planMap.get(sub.plan_id).cancelledSubs += 1;
        }
      });

      const planDistribution = Array.from(planMap.values()).map(plan => {
        const growth = plan.count > 0 ? (plan.newSubs / plan.count) * 100 : 0;
        // Churn par plan : (annulations / total actif) * 100
        const churn = plan.count > 0 ? (plan.cancelledSubs / plan.count) * 100 : 0; 
        
        return {
          planId: plan.planId,
          planName: plan.planName,
          planSlug: plan.planSlug,
          count: plan.count,
          mrr: plan.mrr,
          percentage: totalActive > 0 ? (plan.count / totalActive) * 100 : 0,
          avgRevenuePerSub: plan.count > 0 ? plan.mrr / plan.count : 0,
          churnRate: churn,
          growthRate: growth,
        };
      }).sort((a, b) => b.mrr - a.mrr);

      // 6. Croissance MRR (simulée pour l'instant, nécessite historique)
      // TODO: Créer une table d'historique MRR pour calcul réel
      const mrrGrowth = netGrowth > 0 ? ((netGrowth / totalActive) * 100) : 0;

      // 7. Générer des insights automatiques
      const insights: AnalyticsMetrics['insights'] = [];

      // Insight: Churn élevé
      if (churnRate > 5) {
        insights.push({
          type: 'danger',
          title: 'Taux d\'annulation élevé',
          description: `${churnRate.toFixed(1)}% des abonnements ont été annulés ce mois. Cela dépasse le seuil acceptable de 5%.`,
          impact: 'high',
        });
      } else if (churnRate > 2) {
        insights.push({
          type: 'warning',
          title: 'Taux d\'annulation à surveiller',
          description: `${churnRate.toFixed(1)}% d'annulations ce mois. Restez vigilant.`,
          impact: 'medium',
        });
      }

      // Insight: Croissance positive
      if (netGrowth > 0) {
        insights.push({
          type: 'success',
          title: 'Croissance positive',
          description: `+${netGrowth} abonnements nets ce mois (${newThisMonth} nouveaux, ${cancelledThisMonth} annulés).`,
          impact: 'high',
        });
      }

      // Insight: Abonnements expirant
      if (expiringThisMonth > 0) {
        insights.push({
          type: 'warning',
          title: 'Abonnements expirant bientôt',
          description: `${expiringThisMonth} abonnements expirent dans les 30 prochains jours. Contactez les clients pour renouvellement.`,
          impact: 'high',
        });
      }

      // Insight: Plan dominant
      if (planDistribution.length > 0) {
        const topPlan = planDistribution[0];
        if (topPlan.percentage > 60) {
          insights.push({
            type: 'info',
            title: 'Concentration sur un plan',
            description: `${topPlan.percentage.toFixed(0)}% des abonnements sont sur le plan "${topPlan.planName}". Diversifiez votre base client.`,
            impact: 'medium',
          });
        }
      }

      // Insight: ARPU faible
      if (arpu < 10000) {
        insights.push({
          type: 'info',
          title: 'ARPU à améliorer',
          description: `L'ARPU actuel est de ${(arpu / 1000).toFixed(0)}K FCFA. Envisagez des stratégies d'upsell.`,
          impact: 'medium',
        });
      }

      return {
        totalMRR,
        totalARR,
        mrrGrowth,
        totalActiveSubscriptions: totalActive,
        newSubscriptionsThisMonth: newThisMonth,
        cancelledThisMonth,
        expiringThisMonth,
        arpu,
        churnRate,
        retentionRate,
        planDistribution,
        trends: {
          newSubs: newThisMonth,
          cancelled: cancelledThisMonth,
          netGrowth,
          mrrChange: mrrGrowth,
        },
        insights,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
};

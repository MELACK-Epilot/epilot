/**
 * Hook optimisé pour gérer les abonnements actifs par plan
 * Utilise la vue matérialisée subscriptions_enriched pour éliminer les N+1 queries
 * @module usePlanSubscriptionsOptimized
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useEffect } from 'react';

export interface PlanSubscription {
  id: string;
  school_group_id: string;
  school_group_name: string;
  school_group_logo?: string;
  school_group_code?: string;
  school_group_region?: string;
  school_group_city?: string;
  plan_id: string;
  plan_name: string;
  plan_price?: number;
  plan_currency?: string;
  plan_billing_period?: string;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  created_at: string;
  schools_count?: number;
  users_count?: number;
  students_count?: number;
  days_until_expiry?: number;
  expiry_status?: string;
  mrr_contribution?: number;
  trial_end_date?: string;
  cancellation_reason?: string;
  cancelled_at?: string;
  renewal_count?: number;
}

export interface PlanSubscriptionStats {
  total: number;
  active: number;
  trial: number;
  cancelled: number;
  expired: number;
  expiring_soon: number;  // Expire dans 7 jours
  expiring_this_month: number;  // Expire dans 30 jours
  mrr: number;
  arr: number;
}

/**
 * Récupère tous les abonnements pour un plan (VERSION OPTIMISÉE)
 * Utilise subscriptions_enriched si disponible, sinon fallback sur l'ancienne méthode
 */
export const usePlanSubscriptionsOptimized = (planId?: string) => {
  return useQuery({
    queryKey: ['plan-subscriptions-optimized', planId],
    queryFn: async () => {
      if (!planId) return [];

      // Essayer d'abord la vue matérialisée
      const { data: enrichedData, error: enrichedError } = await supabase
        .from('subscriptions_enriched')
        .select('*')
        .eq('plan_id', planId)
        .order('created_at', { ascending: false });

      // Si la vue existe, l'utiliser
      if (!enrichedError && enrichedData) {
        return enrichedData.map((sub: any) => ({
          id: sub.id,
          school_group_id: sub.school_group_id,
          school_group_name: sub.school_group_name || 'N/A',
          school_group_logo: sub.school_group_logo,
          school_group_code: sub.school_group_code,
          school_group_region: sub.school_group_region,
          school_group_city: sub.school_group_city,
          plan_id: sub.plan_id,
          plan_name: sub.plan_name || 'N/A',
          plan_price: sub.plan_price || 0,
          plan_currency: sub.plan_currency || 'FCFA',
          plan_billing_period: sub.plan_billing_period || 'monthly',
          status: sub.status,
          start_date: sub.start_date,
          end_date: sub.end_date,
          auto_renew: sub.auto_renew,
          created_at: sub.created_at,
          schools_count: sub.schools_count || 0,
          users_count: sub.users_count || 0,
          students_count: sub.students_count || 0,
          days_until_expiry: sub.days_until_expiry,
          expiry_status: sub.expiry_status,
          mrr_contribution: sub.mrr_contribution || 0,
        })) as PlanSubscription[];
      }

      // Fallback: méthode classique si la vue n'existe pas
      console.warn('Vue subscriptions_enriched non disponible, utilisation de la méthode classique');
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          id,
          school_group_id,
          school_groups (name, logo, code, region, city),
          plan_id,
          subscription_plans (name, price, currency, billing_period),
          status,
          start_date,
          end_date,
          auto_renew,
          created_at
        `)
        .eq('plan_id', planId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrichir avec compteurs (N+1 queries - à éviter)
      const enrichedData2 = await Promise.all(
        (data || []).map(async (sub: any) => {
          const { count: schoolsCount } = await supabase
            .from('schools')
            .select('*', { count: 'exact', head: true })
            .eq('school_group_id', sub.school_group_id);

          const { count: usersCount } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('school_group_id', sub.school_group_id);

          // Calculer days_until_expiry
          const daysUntilExpiry = sub.end_date 
            ? Math.ceil((new Date(sub.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : null;

          return {
            id: sub.id,
            school_group_id: sub.school_group_id,
            school_group_name: sub.school_groups?.name || 'N/A',
            school_group_logo: sub.school_groups?.logo,
            school_group_code: sub.school_groups?.code,
            school_group_region: sub.school_groups?.region,
            school_group_city: sub.school_groups?.city,
            plan_id: sub.plan_id,
            plan_name: sub.subscription_plans?.name || 'N/A',
            plan_price: sub.subscription_plans?.price || 0,
            plan_currency: sub.subscription_plans?.currency || 'FCFA',
            plan_billing_period: sub.subscription_plans?.billing_period || 'monthly',
            status: sub.status,
            start_date: sub.start_date,
            end_date: sub.end_date,
            auto_renew: sub.auto_renew,
            created_at: sub.created_at,
            schools_count: schoolsCount || 0,
            users_count: usersCount || 0,
            days_until_expiry: daysUntilExpiry,
          };
        })
      );

      return enrichedData2 as PlanSubscription[];
    },
    enabled: !!planId,
    staleTime: 2 * 60 * 1000, // 2 min
  });
};

/**
 * Récupère les statistiques d'abonnements pour un plan (VERSION OPTIMISÉE)
 */
export const usePlanSubscriptionStatsOptimized = (planId?: string) => {
  return useQuery({
    queryKey: ['plan-subscription-stats-optimized', planId],
    queryFn: async () => {
      if (!planId) return null;

      // Essayer la vue matérialisée
      const { data: enrichedData, error: enrichedError } = await supabase
        .from('subscriptions_enriched')
        .select('status, expiry_status, mrr_contribution')
        .eq('plan_id', planId);

      if (!enrichedError && enrichedData) {
        const total = enrichedData.length;
        const active = enrichedData.filter(s => s.status === 'active').length;
        const trial = enrichedData.filter(s => s.status === 'trial').length;
        const cancelled = enrichedData.filter(s => s.status === 'cancelled').length;
        const expired = enrichedData.filter(s => s.status === 'expired').length;
        const expiring_soon = enrichedData.filter(s => s.expiry_status === 'expiring_soon').length;
        const expiring_this_month = enrichedData.filter(s => s.expiry_status === 'expiring_this_month').length;
        
        const mrr = enrichedData
          .filter(s => s.status === 'active')
          .reduce((sum, sub) => sum + (sub.mrr_contribution || 0), 0);

        return {
          total,
          active,
          trial,
          cancelled,
          expired,
          expiring_soon,
          expiring_this_month,
          mrr: Math.round(mrr),
          arr: Math.round(mrr * 12),
        } as PlanSubscriptionStats;
      }

      // Fallback
      const { data: subscriptions, error: subsError } = await supabase
        .from('subscriptions')
        .select(`
          id,
          status,
          end_date,
          subscription_plans (price, billing_period)
        `)
        .eq('plan_id', planId);

      if (subsError) throw subsError;

      const total = subscriptions?.length || 0;
      const active = subscriptions?.filter(s => s.status === 'active').length || 0;
      const trial = subscriptions?.filter(s => s.status === 'trial').length || 0;
      const cancelled = subscriptions?.filter(s => s.status === 'cancelled').length || 0;
      const expired = subscriptions?.filter(s => s.status === 'expired').length || 0;

      // Calculer expiring_soon et expiring_this_month
      const now = Date.now();
      const expiring_soon = subscriptions?.filter(s => {
        if (s.status !== 'active' || !s.end_date) return false;
        const daysUntil = Math.ceil((new Date(s.end_date).getTime() - now) / (1000 * 60 * 60 * 24));
        return daysUntil > 0 && daysUntil <= 7;
      }).length || 0;

      const expiring_this_month = subscriptions?.filter(s => {
        if (s.status !== 'active' || !s.end_date) return false;
        const daysUntil = Math.ceil((new Date(s.end_date).getTime() - now) / (1000 * 60 * 60 * 24));
        return daysUntil > 7 && daysUntil <= 30;
      }).length || 0;

      const mrr = subscriptions
        ?.filter(s => s.status === 'active')
        .reduce((sum, sub: any) => {
          const price = sub.subscription_plans?.price || 0;
          const period = sub.subscription_plans?.billing_period || 'monthly';
          const monthlyPrice = period === 'yearly' ? price / 12 : price;
          return sum + monthlyPrice;
        }, 0) || 0;

      return {
        total,
        active,
        trial,
        cancelled,
        expired,
        expiring_soon,
        expiring_this_month,
        mrr: Math.round(mrr),
        arr: Math.round(mrr * 12),
      } as PlanSubscriptionStats;
    },
    enabled: !!planId,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Hook pour afficher des alertes proactives
 */
export const useSubscriptionAlerts = (subscriptions?: PlanSubscription[]) => {
  useEffect(() => {
    if (!subscriptions || subscriptions.length === 0) return;

    // Abonnements expirant dans 7 jours
    const expiringSoon = subscriptions.filter(s => {
      if (!s.days_until_expiry) return false;
      return s.days_until_expiry > 0 && s.days_until_expiry <= 7;
    });

    if (expiringSoon.length > 0) {
      toast.warning(`${expiringSoon.length} abonnement(s) expirent bientôt`, {
        description: 'Certains abonnements arrivent à expiration dans les 7 prochains jours',
        duration: 5000,
      });
    }

    // Abonnements en période d'essai se terminant bientôt
    const trialsEnding = subscriptions.filter(s => {
      if (s.status !== 'trial' || !s.trial_end_date) return false;
      const daysUntil = Math.ceil((new Date(s.trial_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return daysUntil > 0 && daysUntil <= 3;
    });

    if (trialsEnding.length > 0) {
      toast.info(`${trialsEnding.length} période(s) d'essai se terminent bientôt`, {
        description: 'Contactez ces groupes pour les convertir en abonnements payants',
        duration: 5000,
      });
    }
  }, [subscriptions]);
};

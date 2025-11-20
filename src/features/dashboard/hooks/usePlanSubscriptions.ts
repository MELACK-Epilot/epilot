/**
 * Hooks pour gérer les abonnements actifs par plan
 * @module usePlanSubscriptions
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface PlanSubscription {
  id: string;
  school_group_id: string;
  school_group_name: string;
  school_group_logo?: string;
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
}

export interface PlanSubscriptionStats {
  total: number;
  active: number;
  trial: number;
  cancelled: number;
  expired: number;
  mrr: number;  // Monthly Recurring Revenue
  arr: number;  // Annual Recurring Revenue
}

/**
 * Récupère tous les abonnements pour un plan
 */
export const usePlanSubscriptions = (planId?: string) => {
  return useQuery({
    queryKey: ['plan-subscriptions', planId],
    queryFn: async () => {
      if (!planId) return [];

      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          id,
          school_group_id,
          school_groups (
            name,
            logo
          ),
          plan_id,
          subscription_plans (
            name,
            price,
            currency,
            billing_period
          ),
          status,
          start_date,
          end_date,
          auto_renew,
          created_at
        `)
        .eq('plan_id', planId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrichir avec compteurs écoles et utilisateurs
      const enrichedData = await Promise.all(
        (data || []).map(async (sub: any) => {
          // Compter les écoles du groupe
          const { count: schoolsCount } = await supabase
            .from('schools')
            .select('*', { count: 'exact', head: true })
            .eq('school_group_id', sub.school_group_id);

          // Compter les utilisateurs du groupe
          const { count: usersCount } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('school_group_id', sub.school_group_id);

          return {
            id: sub.id,
            school_group_id: sub.school_group_id,
            school_group_name: sub.school_groups?.name || 'N/A',
            school_group_logo: sub.school_groups?.logo || null,
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
          };
        })
      );

      return enrichedData as PlanSubscription[];
    },
    enabled: !!planId,
    staleTime: 2 * 60 * 1000, // 2 min
  });
};

/**
 * Récupère les statistiques d'abonnements pour un plan
 */
export const usePlanSubscriptionStats = (planId?: string) => {
  return useQuery({
    queryKey: ['plan-subscription-stats', planId],
    queryFn: async () => {
      if (!planId) return null;

      // Récupérer tous les abonnements
      const { data: subscriptions, error: subsError } = await supabase
        .from('subscriptions')
        .select(`
          id,
          status,
          subscription_plans (
            price,
            billing_period
          )
        `)
        .eq('plan_id', planId);

      if (subsError) throw subsError;

      // Calculer les stats
      const total = subscriptions?.length || 0;
      const active = subscriptions?.filter(s => s.status === 'active').length || 0;
      const trial = subscriptions?.filter(s => s.status === 'trial').length || 0;
      const cancelled = subscriptions?.filter(s => s.status === 'cancelled').length || 0;
      const expired = subscriptions?.filter(s => s.status === 'expired').length || 0;

      // Calculer MRR (Monthly Recurring Revenue)
      const mrr = subscriptions
        ?.filter(s => s.status === 'active')
        .reduce((sum, sub: any) => {
          const price = sub.subscription_plans?.price || 0;
          const period = sub.subscription_plans?.billing_period || 'monthly';
          
          // Normaliser en MRR
          const monthlyPrice = period === 'yearly' ? price / 12 :
                              period === 'quarterly' ? price / 3 :
                              period === 'biannual' ? price / 6 :
                              price;
          
          return sum + monthlyPrice;
        }, 0) || 0;

      const arr = mrr * 12;

      return {
        total,
        active,
        trial,
        cancelled,
        expired,
        mrr: Math.round(mrr),
        arr: Math.round(arr),
      } as PlanSubscriptionStats;
    },
    enabled: !!planId,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Récupère tous les abonnements actifs (tous plans)
 */
export const useAllActiveSubscriptions = () => {
  return useQuery({
    queryKey: ['all-active-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          id,
          school_group_id,
          school_groups (
            name
          ),
          plan_id,
          subscription_plans (
            name,
            slug,
            price,
            currency,
            billing_period
          ),
          status,
          start_date,
          end_date,
          created_at
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((sub: any) => {
        const price = sub.subscription_plans?.price || 0;
        const period = sub.subscription_plans?.billing_period || 'monthly';
        
        // Normaliser en prix mensuel
        const monthlyPrice = period === 'yearly' ? price / 12 :
                            period === 'quarterly' ? price / 3 :
                            period === 'biannual' ? price / 6 :
                            price;

        return {
          id: sub.id,
          school_group_id: sub.school_group_id,
          school_group_name: sub.school_groups?.name || 'N/A',
          plan_id: sub.plan_id,
          plan_name: sub.subscription_plans?.name || 'N/A',
          plan_slug: sub.subscription_plans?.slug || 'N/A',
          price: monthlyPrice,
          currency: sub.subscription_plans?.currency || 'FCFA',
          status: sub.status,
          start_date: sub.start_date,
          end_date: sub.end_date,
          created_at: sub.created_at,
        };
      });
    },
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Hook pour gérer les Abonnements
 * Version optimisée React 19 avec meilleures pratiques
 * @module useSubscriptions
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Subscription } from '../types/dashboard.types';

/**
 * Clés de requête pour React Query
 */
export const subscriptionKeys = {
  all: ['subscriptions'] as const,
  lists: () => [...subscriptionKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...subscriptionKeys.lists(), filters] as const,
  details: () => [...subscriptionKeys.all, 'detail'] as const,
  detail: (id: string) => [...subscriptionKeys.details(), id] as const,
  stats: () => [...subscriptionKeys.all, 'stats'] as const,
};

/**
 * Interface pour les filtres de recherche
 */
export interface SubscriptionFilters {
  query?: string;
  status?: 'active' | 'expired' | 'cancelled' | 'pending';
  schoolGroupId?: string;
  planId?: string;
  planSlug?: string;
}

/**
 * Hook pour récupérer la liste des abonnements
 */
export const useSubscriptions = (filters?: SubscriptionFilters) => {
  return useQuery({
    queryKey: subscriptionKeys.list(filters || {}),
    queryFn: async () => {
      try {
        // Construire la requête de base
        let query = supabase
          .from('subscriptions')
          .select(`
            *,
            school_groups!inner (
              id,
              name,
              code
            ),
            subscription_plans!inner (
              id,
              name,
              slug
            )
          `)
          .order('created_at', { ascending: false });
        
        // Appliquer les filtres AVANT d'exécuter la requête
        if (filters?.status) {
          query = query.eq('status', filters.status);
        }

        if (filters?.schoolGroupId) {
          query = query.eq('school_group_id', filters.schoolGroupId);
        }

        if (filters?.planId) {
          query = query.eq('plan_id', filters.planId);
        }

        // Exécuter la requête
        const { data, error } = await query;

        if (error) {
          console.error('Erreur récupération abonnements:', error);
          throw error;
        }

        console.log('📊 Abonnements récupérés:', data?.length || 0);

        // Récupérer le nombre d'écoles par groupe
        const { data: schoolCounts } = await supabase
          .from('schools')
          .select('school_group_id')
          .eq('status', 'active');
        
        const schoolCountMap = new Map<string, number>();
        (schoolCounts || []).forEach((school: any) => {
          const count = schoolCountMap.get(school.school_group_id) || 0;
          schoolCountMap.set(school.school_group_id, count + 1);
        });

        // Transformer les données
        const subscriptions = (data || []).map((sub: any) => ({
          id: sub.id,
          schoolGroupId: sub.school_group_id,
          schoolGroupName: sub.school_groups?.name || 'N/A',
          schoolGroupCode: sub.school_groups?.code || '',
          planId: sub.plan_id,
          planName: sub.subscription_plans?.name || 'N/A',
          planSlug: sub.subscription_plans?.slug || '',
          status: sub.status,
          startDate: sub.start_date,
          endDate: sub.end_date,
          autoRenew: sub.auto_renew,
          amount: sub.amount,
          currency: sub.currency,
          billingPeriod: sub.billing_period,
          paymentMethod: sub.payment_method,
          paymentStatus: sub.payment_status,
          lastPaymentDate: sub.last_payment_date,
          nextPaymentDate: sub.next_payment_date,
          schoolsCount: schoolCountMap.get(sub.school_group_id) || 0,
          createdAt: sub.created_at,
          updatedAt: sub.updated_at,
        })) as Subscription[];

        // Filtrer côté client pour la recherche (car ilike sur jointure ne fonctionne pas toujours)
        if (filters?.query) {
          const searchLower = filters.query.toLowerCase();
          return subscriptions.filter(sub => 
            sub.schoolGroupName.toLowerCase().includes(searchLower) ||
            sub.schoolGroupCode.toLowerCase().includes(searchLower) ||
            sub.planName.toLowerCase().includes(searchLower)
          );
        }

        // Filtrer par slug de plan côté client
        if (filters?.planSlug) {
          return subscriptions.filter(sub => sub.planSlug === filters.planSlug);
        }

        return subscriptions;
      } catch (error) {
        console.error('Erreur dans useSubscriptions:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook pour récupérer un abonnement par ID
 */
export const useSubscription = (id: string) => {
  return useQuery({
    queryKey: subscriptionKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          school_groups!inner (
            id,
            name,
            code
          ),
          subscription_plans!inner (
            id,
            name,
            slug
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        schoolGroupId: data.school_group_id,
        schoolGroupName: data.school_groups?.name || 'N/A',
        planId: data.plan_id,
        planName: data.subscription_plans?.name || 'N/A',
        status: data.status,
        startDate: data.start_date,
        endDate: data.end_date,
        autoRenew: data.auto_renew,
        amount: data.amount,
        currency: data.currency,
        paymentMethod: data.payment_method,
        lastPaymentDate: data.last_payment_date,
        nextPaymentDate: data.next_payment_date,
      } as Subscription;
    },
    enabled: !!id,
  });
};

/**
 * Interface pour créer un abonnement
 */
export interface CreateSubscriptionInput {
  schoolGroupId: string;
  planId: string;
  startDate: string;
  endDate: string;
  autoRenew?: boolean;
  amount: number;
  currency?: 'FCFA';
  paymentMethod: string;
}

/**
 * Hook pour créer un abonnement
 */
export const useCreateSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSubscriptionInput) => {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          school_group_id: input.schoolGroupId,
          plan_id: input.planId,
          start_date: input.startDate,
          end_date: input.endDate,
          auto_renew: input.autoRenew ?? true,
          amount: input.amount,
          currency: input.currency || 'FCFA',
          payment_method: input.paymentMethod,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.stats() });
    },
  });
};

/**
 * Interface pour mettre à jour un abonnement
 */
export interface UpdateSubscriptionInput {
  id: string;
  status?: 'active' | 'expired' | 'cancelled' | 'pending';
  endDate?: string;
  autoRenew?: boolean;
  amount?: number;
  paymentMethod?: string;
}

/**
 * Hook pour mettre à jour un abonnement
 */
export const useUpdateSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateSubscriptionInput) => {
      const { id, ...updates } = input;

      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          status: updates.status,
          end_date: updates.endDate,
          auto_renew: updates.autoRenew,
          amount: updates.amount,
          payment_method: updates.paymentMethod,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.stats() });
    },
  });
};

/**
 * Hook pour annuler un abonnement
 */
export const useCancelSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          auto_renew: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.stats() });
    },
  });
};

/**
 * Hook pour obtenir les statistiques des abonnements
 */
export const useSubscriptionStats = () => {
  return useQuery({
    queryKey: subscriptionKeys.stats(),
    queryFn: async () => {
      // Total abonnements
      const { count: total, error: totalError } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;

      // Abonnements actifs
      const { count: active, error: activeError } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (activeError) throw activeError;

      // Abonnements expirés
      const { count: expired, error: expiredError } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'expired');

      if (expiredError) throw expiredError;

      // Abonnements annulés
      const { count: cancelled, error: cancelledError } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'cancelled');

      if (cancelledError) throw cancelledError;

      // Revenu total
      const { data: revenueData, error: revenueError } = await supabase
        .from('subscriptions')
        .select('amount')
        .eq('status', 'active');

      if (revenueError) throw revenueError;

      const totalRevenue = revenueData?.reduce((sum, sub) => sum + (sub.amount || 0), 0) || 0;

      return {
        total: total || 0,
        active: active || 0,
        expired: expired || 0,
        cancelled: cancelled || 0,
        totalRevenue,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};

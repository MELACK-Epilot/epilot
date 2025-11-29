/**
 * Hooks pour la gestion des paiements
 * Utilise les vues SQL pour les données enrichies
 * AVEC TEMPS RÉEL SUPABASE
 * @module usePayments
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Payment } from '../types/dashboard.types';

export const paymentKeys = {
  all: ['payments'] as const,
  lists: () => [...paymentKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...paymentKeys.lists(), filters] as const,
  details: () => [...paymentKeys.all, 'detail'] as const,
  detail: (id: string) => [...paymentKeys.details(), id] as const,
  history: (subscriptionId: string) => [...paymentKeys.all, 'history', subscriptionId] as const,
};

interface PaymentFilters {
  query?: string;
  status?: string;
  subscriptionId?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Hook pour récupérer la liste des paiements
 */
export const usePayments = (filters?: PaymentFilters) => {
  return useQuery({
    queryKey: paymentKeys.list(filters || {}),
    queryFn: async () => {
      // Utiliser la vue enrichie avec toutes les relations
      let query = supabase
        .from('payments_enriched')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.query) {
        query = query.or(`invoice_number.ilike.%${filters.query}%,transaction_id.ilike.%${filters.query}%`);
      }

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.subscriptionId) {
        query = query.eq('subscription_id', filters.subscriptionId);
      }

      if (filters?.startDate) {
        query = query.gte('paid_at', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('paid_at', filters.endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Erreur lors de la récupération des paiements:', error);
        return [];
      }

      return data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook pour récupérer un paiement par ID
 */
export const usePayment = (id: string) => {
  return useQuery({
    queryKey: paymentKeys.detail(id),
    queryFn: async () => {
      // @ts-expect-error - Table payments sera créée par les scripts SQL
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          subscription:subscriptions(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

/**
 * Hook pour récupérer l'historique des paiements d'un abonnement
 */
export const usePaymentHistory = (subscriptionId: string) => {
  return useQuery({
    queryKey: paymentKeys.history(subscriptionId),
    queryFn: async () => {
      // @ts-expect-error - Table payments sera créée par les scripts SQL
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('subscription_id', subscriptionId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Erreur lors de la récupération de l\'historique:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!subscriptionId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook pour créer un paiement
 */
export const useCreatePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payment: Partial<Payment>) => {
      // @ts-expect-error - Table payments sera créée par les scripts SQL
      const { data, error } = await supabase
        .from('payments')
        .insert([payment])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['financial'] });
    },
  });
};

/**
 * Hook pour marquer un paiement comme remboursé
 */
export const useRefundPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      // @ts-expect-error - Table payments sera créée par les scripts SQL
      const { data, error } = await supabase
        .from('payments')
        .update({
          status: 'refunded',
          refunded_at: new Date().toISOString(),
          notes,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
      queryClient.invalidateQueries({ queryKey: ['financial'] });
    },
  });
};

/**
 * Hook pour les statistiques de paiements (depuis la vue SQL)
 */
export const usePaymentStats = () => {
  return useQuery({
    queryKey: ['payment-stats'],
    queryFn: async () => {
      // @ts-expect-error - Vue payment_statistics créée par les scripts SQL
      const { data, error } = await supabase
        .from('payment_statistics')
        .select('*')
        .single();

      if (error) {
        console.warn('Erreur lors de la récupération des stats:', error);
        return {
          total: 0,
          completed: 0,
          pending: 0,
          failed: 0,
          refunded: 0,
          overdue: 0,
          totalAmount: 0,
          completedAmount: 0,
          pendingAmount: 0,
          overdueAmount: 0,
        };
      }

      const stats: any = data;
      return {
        total: stats?.total_payments || 0,
        completed: stats?.completed_count || 0,
        pending: stats?.pending_count || 0,
        failed: stats?.failed_count || 0,
        refunded: stats?.refunded_count || 0,
        overdue: stats?.overdue_count || 0,
        totalAmount: parseFloat(stats?.total_amount || 0),
        completedAmount: parseFloat(stats?.completed_amount || 0),
        pendingAmount: parseFloat(stats?.pending_amount || 0),
        overdueAmount: parseFloat(stats?.overdue_amount || 0),
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook pour écouter les changements en temps réel sur les paiements
 * Invalide automatiquement toutes les queries liées aux paiements
 */
export const usePaymentsRealtime = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('payments-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        (payload) => {
          console.log('🔄 Changement détecté sur payments:', payload);
          
          // Invalider toutes les queries liées aux paiements
          queryClient.invalidateQueries({ queryKey: paymentKeys.all });
          queryClient.invalidateQueries({ queryKey: ['payment-stats'] });
          queryClient.invalidateQueries({ queryKey: ['payment-monthly-stats'] });
          
          // Invalider aussi les stats financières globales
          queryClient.invalidateQueries({ queryKey: ['financial'] });
          queryClient.invalidateQueries({ queryKey: ['real-financial-stats'] });
          queryClient.invalidateQueries({ queryKey: ['revenue-chart'] });
          queryClient.invalidateQueries({ queryKey: ['financial-kpis'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};

export default usePayments;

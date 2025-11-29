/**
 * Hook pour récupérer l'historique d'un abonnement
 * @module useSubscriptionHistory
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface SubscriptionHistoryItem {
  id: string;
  subscriptionId: string;
  action: string;
  previousValue: any;
  newValue: any;
  reason: string | null;
  performedBy: string | null;
  createdAt: string;
}

export const useSubscriptionHistory = (subscriptionId: string | undefined) => {
  return useQuery({
    queryKey: ['subscription-history', subscriptionId],
    queryFn: async () => {
      if (!subscriptionId) return [];

      const { data, error } = await supabase
        .from('subscription_history')
        .select('*')
        .eq('subscription_id', subscriptionId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        subscriptionId: item.subscription_id,
        action: item.action,
        previousValue: item.previous_value,
        newValue: item.new_value,
        reason: item.reason,
        performedBy: item.performed_by,
        createdAt: item.created_at,
      })) as SubscriptionHistoryItem[];
    },
    enabled: !!subscriptionId,
    staleTime: 30 * 1000, // 30 secondes
  });
};

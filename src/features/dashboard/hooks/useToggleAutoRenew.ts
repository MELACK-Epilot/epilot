/**
 * Hook pour activer/désactiver l'auto-renouvellement d'un abonnement
 * @module useToggleAutoRenew
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface ToggleAutoRenewParams {
  subscriptionId: string;
  autoRenew: boolean;
}

interface PlanSubscription {
  id: string;
  school_group_id: string;
  school_group_name: string;
  plan_id: string;
  price: number;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  created_at: string;
  schools_count?: number;
  users_count?: number;
}

export const useToggleAutoRenew = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ subscriptionId, autoRenew }: ToggleAutoRenewParams) => {
      // Appeler la fonction RPC Supabase
      const { data, error } = await supabase.rpc('toggle_auto_renew', {
        p_subscription_id: subscriptionId,
        p_auto_renew: autoRenew,
      });

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Erreur toggle auto-renew:', error);
        }
        throw error;
      }

      return data;
    },
    onMutate: async ({ subscriptionId, autoRenew }) => {
      // Annuler les requêtes en cours
      await queryClient.cancelQueries({ queryKey: ['plan-subscriptions'] });

      // Sauvegarder l'état précédent
      const previousData = queryClient.getQueriesData({ queryKey: ['plan-subscriptions'] });

      // Update optimiste
      queryClient.setQueriesData<PlanSubscription[]>({ queryKey: ['plan-subscriptions'] }, (old) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map((sub) =>
          sub.id === subscriptionId ? { ...sub, auto_renew: autoRenew } : sub
        );
      });

      return { previousData };
    },
    onError: (error, variables, context) => {
      // Rollback en cas d'erreur
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      toast.error('Erreur lors de la modification du renouvellement automatique');
      if (process.env.NODE_ENV === 'development') {
        console.error('Erreur toggle auto-renew:', error);
      }
    },
    onSuccess: (data, variables) => {
      // Revalider les données
      queryClient.invalidateQueries({ queryKey: ['plan-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['plan-subscription-stats'] });

      // Afficher un message de succès
      if (variables.autoRenew) {
        toast.success('Renouvellement automatique activé', {
          description: 'L\'abonnement sera renouvelé automatiquement à l\'expiration',
        });
      } else {
        toast.success('Renouvellement automatique désactivé', {
          description: 'Vous devrez renouveler l\'abonnement manuellement',
        });
      }
    },
  });
};

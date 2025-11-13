/**
 * Hook pour supprimer un abonnement
 * Invalide le cache et affiche une notification
 * @module useDeleteSubscription
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export const useDeleteSubscription = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      // Supprimer l'abonnement
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', subscriptionId);

      if (error) throw error;

      return subscriptionId;
    },
    onSuccess: (subscriptionId) => {
      // Invalider le cache pour recharger la liste
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-hub-kpis'] });
      
      console.log('✅ Abonnement supprimé:', subscriptionId);
      
      toast({
        title: '✅ Abonnement supprimé',
        description: 'L\'abonnement a été supprimé avec succès.',
      });
    },
    onError: (error: any) => {
      console.error('❌ Erreur suppression abonnement:', error);
      
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de supprimer l\'abonnement.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook: Refuser une inscription
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { inscriptionKeys } from '../keys';

export function useRejectInscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase
        .from('inscriptions')
        .update({
          status: 'rejected',
          rejection_reason: reason,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: inscriptionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inscriptionKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: inscriptionKeys.stats() });
    },
  });
}

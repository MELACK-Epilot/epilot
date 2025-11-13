/**
 * Hook: Supprimer une inscription
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { inscriptionKeys } from '../keys';

export function useDeleteInscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('inscriptions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inscriptionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inscriptionKeys.stats() });
    },
  });
}

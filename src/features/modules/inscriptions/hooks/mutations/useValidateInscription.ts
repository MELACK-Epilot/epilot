/**
 * Hook: Valider une inscription
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { inscriptionKeys } from '../keys';

export function useValidateInscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Utiliser update au lieu de RPC pour l'instant
      const { error } = await supabase
        .from('inscriptions')
        .update({
          status: 'validated' as const,
          validated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: inscriptionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inscriptionKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: inscriptionKeys.stats() });
    },
  });
}

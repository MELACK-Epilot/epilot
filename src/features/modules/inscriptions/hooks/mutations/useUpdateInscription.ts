/**
 * Hook: Mettre à jour une inscription
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Inscription } from '../../types/inscriptions.types';
import type { SupabaseInscriptionUpdate } from '../types';
import { inscriptionKeys } from '../keys';
import { transformInscription } from '../transformers';

export function useUpdateInscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Inscription> & { id: string }) => {
      const updateData: SupabaseInscriptionUpdate = {};

      if (updates.studentFirstName !== undefined) updateData.student_first_name = updates.studentFirstName;
      if (updates.studentLastName !== undefined) updateData.student_last_name = updates.studentLastName;
      if (updates.requestedLevel !== undefined) updateData.requested_level = updates.requestedLevel;
      if (updates.notes !== undefined) updateData.notes = updates.notes;

      const { data, error } = await supabase
        .from('inscriptions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Échec de la mise à jour');

      return transformInscription(data);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: inscriptionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inscriptionKeys.detail(id) });
    },
  });
}

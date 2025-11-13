/**
 * Hook: Créer une inscription
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { CreateInscriptionInput } from '../../types/inscriptions.types';
import type { SupabaseInscriptionInsert } from '../types';
import { inscriptionKeys } from '../keys';
import { transformInscription } from '../transformers';

export function useCreateInscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: any) => {
      // Utiliser directement les données du formulaire (déjà en snake_case)
      const insertData = {
        ...input,
        // S'assurer que les champs obligatoires sont présents
        status: input.status || 'pending',
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('inscriptions')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Échec de la création');

      return transformInscription(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inscriptionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inscriptionKeys.stats() });
    },
  });
}

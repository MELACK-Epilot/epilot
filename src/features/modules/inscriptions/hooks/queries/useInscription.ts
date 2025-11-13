/**
 * Hook: Récupère une inscription par ID
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { inscriptionKeys } from '../keys';
import { transformInscription } from '../transformers';

export function useInscription(id: string) {
  return useQuery({
    queryKey: inscriptionKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inscriptions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Inscription non trouvée');

      return transformInscription(data);
    },
    enabled: !!id,
  });
}

/**
 * Hook: Liste toutes les inscriptions
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { inscriptionKeys } from '../keys';
import { transformInscription } from '../transformers';

export function useInscriptions(filters?: { academicYear?: string }) {
  return useQuery({
    queryKey: inscriptionKeys.list(filters),
    queryFn: async () => {
      let query = supabase
        .from('inscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      // Appliquer le filtre année académique si fourni
      if (filters?.academicYear) {
        query = query.eq('academic_year', filters.academicYear);
      }

      const { data, error } = await query;

      if (error) throw error;
      if (!data) return [];

      return data.map(transformInscription);
    },
  });
}

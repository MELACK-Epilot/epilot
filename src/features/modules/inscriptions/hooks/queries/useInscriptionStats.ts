/**
 * Hook: Statistiques des inscriptions
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { inscriptionKeys } from '../keys';
import { createEmptyStats, calculateStats } from '../utils/stats';

export function useInscriptionStats(academicYear?: string) {
  return useQuery({
    queryKey: [...inscriptionKeys.stats(), academicYear],
    queryFn: async () => {
      let query = supabase
        .from('inscriptions')
        .select('status, created_at, requested_level');

      if (academicYear) {
        query = query.eq('academic_year', academicYear);
      }

      const { data, error } = await query;

      if (error) throw error;
      if (!data) return createEmptyStats();

      // Adapter les données pour calculateStats
      const adaptedData = data.map(item => ({
        status: item.status,
        submitted_at: item.created_at, // Utiliser created_at au lieu de submitted_at
        requested_level: item.requested_level,
      }));

      return calculateStats(adaptedData);
    },
  });
}

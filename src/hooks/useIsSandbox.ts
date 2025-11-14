/**
 * Hook pour détecter si l'utilisateur est dans l'environnement sandbox
 * @module useIsSandbox
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSchoolGroupId } from '@/providers/AppContextProvider';

/**
 * Hook pour vérifier si le contexte actuel est sandbox
 * @returns {boolean} true si sandbox, false sinon
 */
export function useIsSandbox(): boolean {
  const schoolGroupId = useSchoolGroupId();

  const { data: schoolGroup } = useQuery({
    queryKey: ['school-group-sandbox', schoolGroupId],
    queryFn: async () => {
      if (!schoolGroupId) return null;

      const { data, error } = await supabase
        .from('school_groups')
        .select('is_sandbox')
        .eq('id', schoolGroupId)
        .single();

      if (error) {
        console.error('Erreur lors de la vérification sandbox:', error);
        return null;
      }

      return data;
    },
    enabled: !!schoolGroupId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return schoolGroup?.is_sandbox || false;
}

/**
 * Hook pour obtenir les statistiques sandbox
 */
export function useSandboxStats() {
  return useQuery({
    queryKey: ['sandbox-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('count_sandbox_data');

      if (error) throw error;

      // Transformer en objet
      const stats: Record<string, number> = {};
      data?.forEach((item: any) => {
        stats[item.entity_type] = parseInt(item.count);
      });

      return stats;
    },
    staleTime: 30 * 1000, // 30 secondes
  });
}

/**
 * Hook pour charger les utilisateurs assignables
 * Optimisé pour 8900+ utilisateurs avec recherche serveur
 * @module assign-profile/hooks/useAssignableUsers
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { SimpleUser } from '../types';
import { EXCLUDED_ROLES, MAX_USERS_LIMIT, USERS_STALE_TIME } from '../constants';

/** Query keys pour React Query */
export const assignableUsersKeys = {
  all: ['assignable-users'] as const,
  byGroup: (groupId: string, search: string) => 
    ['assignable-users', groupId, search] as const,
};

/**
 * Récupère les utilisateurs assignables d'un groupe
 * @param schoolGroupId - ID du groupe scolaire
 * @param enabled - Activer/désactiver la requête
 * @param searchQuery - Recherche (côté serveur)
 */
export const useAssignableUsers = (
  schoolGroupId: string | undefined,
  enabled: boolean,
  searchQuery: string = ''
) => {
  return useQuery({
    queryKey: assignableUsersKeys.byGroup(schoolGroupId || '', searchQuery),
    queryFn: async (): Promise<SimpleUser[]> => {
      if (!schoolGroupId) return [];

      // Construire la requête de base
      let query = supabase
        .from('users')
        .select('id, first_name, last_name, email, role, avatar, access_profile_code')
        .eq('school_group_id', schoolGroupId)
        .eq('status', 'active')
        .not('role', 'in', `(${EXCLUDED_ROLES.join(',')})`)
        .order('last_name', { ascending: true });

      // Ajouter la recherche côté serveur si query présente
      if (searchQuery.trim()) {
        query = query.or(
          `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`
        );
      }

      // Limiter pour éviter surcharge mémoire
      query = query.limit(MAX_USERS_LIMIT);

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: enabled && !!schoolGroupId,
    staleTime: USERS_STALE_TIME,
    placeholderData: (previousData) => previousData,
  });
};

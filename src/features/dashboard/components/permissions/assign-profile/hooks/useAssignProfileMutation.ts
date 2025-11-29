/**
 * Mutation pour assigner un profil en masse
 * Optimisé avec batch updates
 * @module assign-profile/hooks/useAssignProfileMutation
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { AssignProfileMutationParams, AssignProfileMutationResult } from '../types';
import { BATCH_SIZE } from '../constants';

/**
 * Mutation pour assigner/retirer un profil à plusieurs utilisateurs
 * Utilise des batches de 100 pour éviter les timeouts
 */
export const useAssignProfileMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<AssignProfileMutationResult, Error, AssignProfileMutationParams>({
    mutationFn: async ({ profileCode, toAdd, toRemove }) => {
      // Assigner le profil par batches
      if (toAdd.length > 0) {
        for (let i = 0; i < toAdd.length; i += BATCH_SIZE) {
          const batch = toAdd.slice(i, i + BATCH_SIZE);
          const { error } = await supabase
            .from('users')
            .update({ access_profile_code: profileCode })
            .in('id', batch);
          
          if (error) throw new Error(error.message);
        }
      }

      // Retirer le profil par batches
      if (toRemove.length > 0) {
        for (let i = 0; i < toRemove.length; i += BATCH_SIZE) {
          const batch = toRemove.slice(i, i + BATCH_SIZE);
          const { error } = await supabase
            .from('users')
            .update({ access_profile_code: null })
            .in('id', batch);
          
          if (error) throw new Error(error.message);
        }
      }

      return { added: toAdd.length, removed: toRemove.length };
    },
    onSuccess: () => {
      // Invalider tous les caches liés
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['assignable-users'] });
      queryClient.invalidateQueries({ queryKey: ['role-stats'] });
      queryClient.invalidateQueries({ queryKey: ['access-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['profile-stats'] });
    },
  });
};

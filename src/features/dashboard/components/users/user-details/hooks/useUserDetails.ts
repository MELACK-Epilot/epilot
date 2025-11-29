/**
 * Hook principal pour le modal UserDetails
 * Combine tous les hooks et mutations
 * @module user-details/hooks/useUserDetails
 */

import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useUserModules } from './useUserModules';
import { useUserActivity } from './useUserActivity';
import { useAccessProfiles } from '../../../../hooks/useAccessProfiles';
import { calculateUserStats } from '../utils';
import type { User } from '../../../../types/dashboard.types';

interface UseUserDetailsOptions {
  user: User | null;
  open: boolean;
}

export const useUserDetails = ({ user, open }: UseUserDetailsOptions) => {
  const queryClient = useQueryClient();

  // Hooks de données
  const { data: profiles = [] } = useAccessProfiles();
  const {
    data: userModules = [],
    isLoading: modulesLoading,
    refetch: refetchModules,
  } = useUserModules(user?.id);
  const { data: activityLogs = [] } = useUserActivity(user?.id);

  // Mutation: Changer le profil
  const updateProfileMutation = useMutation({
    mutationFn: async ({ userId, profileCode }: { userId: string; profileCode: string | null }) => {
      const { error } = await supabase
        .from('users')
        .update({ access_profile_code: profileCode })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-modules-detail'] });
      queryClient.invalidateQueries({ queryKey: ['profile-stats'] });
      toast.success('Profil mis à jour', {
        description: 'Les modules ont été synchronisés automatiquement.',
      });
    },
    onError: (error: Error) => {
      toast.error('Erreur', { description: error.message });
    },
  });

  // Mutation: Activer/Désactiver
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ userId, newStatus }: { userId: string; newStatus: 'active' | 'inactive' }) => {
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(variables.newStatus === 'active' ? 'Compte activé' : 'Compte désactivé');
    },
    onError: (error: Error) => {
      toast.error('Erreur', { description: error.message });
    },
  });

  // Realtime subscription
  useEffect(() => {
    if (!user?.id || !open) return;

    const channel = supabase
      .channel(`user-detail:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_modules',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          console.log('🔔 Modules changed for user');
          refetchModules();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, open, refetchModules]);

  // Stats calculées
  const stats = user
    ? calculateUserStats(activityLogs, userModules.length, user.lastLogin)
    : { totalLogins: 0, lastLoginDays: -1, modulesCount: 0, activityScore: 0 };

  return {
    // Data
    profiles,
    userModules,
    activityLogs,
    stats,
    modulesLoading,

    // Mutations
    updateProfileMutation,
    toggleStatusMutation,

    // Handlers
    handleProfileChange: (profileCode: string) => {
      if (!user?.id) return;
      updateProfileMutation.mutate({
        userId: user.id,
        profileCode: profileCode === 'none' ? null : profileCode,
      });
    },

    handleToggleStatus: () => {
      if (!user?.id) return;
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      toggleStatusMutation.mutate({ userId: user.id, newStatus });
    },
  };
};

/**
 * Hook pour les statistiques des profils d'accès
 * Compte les utilisateurs par access_profile_code avec temps réel
 * 
 * @module useProfileStats
 */

import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/store/auth.store';

// ============================================
// TYPES
// ============================================

export interface ProfileStat {
  profile_code: string;
  user_count: number;
  module_count: number;
}

export interface ProfileStatsResult {
  /** Stats par code de profil: { 'chef_etablissement': 5, 'comptable': 3 } */
  stats: Record<string, number>;
  /** Nombre de modules par profil */
  modulesCounts: Record<string, number>;
  /** Total d'utilisateurs avec un profil */
  totalWithProfile: number;
  /** Total d'utilisateurs sans profil */
  totalWithoutProfile: number;
  /** Chargement */
  isLoading: boolean;
  /** Erreur */
  error: Error | null;
  /** Rafraîchir */
  refresh: () => void;
}

// ============================================
// QUERY KEYS
// ============================================

export const profileStatsKeys = {
  all: ['profile-stats'] as const,
  group: (groupId: string) => [...profileStatsKeys.all, groupId] as const,
};

// ============================================
// HOOK
// ============================================

export const useProfileStats = (): ProfileStatsResult => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const schoolGroupId = user?.schoolGroupId;

  // ============================================
  // QUERY: Récupérer les stats
  // ============================================

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: profileStatsKeys.group(schoolGroupId || ''),
    queryFn: async () => {
      if (!schoolGroupId) {
        return { stats: [], withoutProfile: 0, modulesMap: {} };
      }

      // Utiliser la RPC optimisée (indexes + agrégation côté serveur)
      const { data: rpcData, error: rpcError } = await (supabase.rpc as any)(
        'get_profile_stats_optimized',
        { p_school_group_id: schoolGroupId }
      );

      if (rpcError) {
        console.error('Erreur RPC get_profile_stats_optimized:', rpcError);
        throw rpcError;
      }

      // Compter les utilisateurs sans profil (requête légère avec index)
      const { count: withoutProfile } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('school_group_id', schoolGroupId)
        .is('access_profile_code', null)
        .eq('status', 'active')
        .not('role', 'in', '(super_admin,admin_groupe)');

      // Construire la map des modules
      const modulesMap: Record<string, number> = {};
      (rpcData || []).forEach((s: any) => {
        modulesMap[s.profile_code] = s.module_count || 0;
      });

      return {
        stats: (rpcData || []).map((s: any) => ({
          profile_code: s.profile_code,
          user_count: Number(s.user_count),
          module_count: s.module_count || 0,
        })),
        withoutProfile: withoutProfile || 0,
        modulesMap,
      };
    },
    enabled: !!schoolGroupId,
    staleTime: 30 * 1000, // 30 secondes (rafraîchissement fréquent)
  });

  // ============================================
  // REALTIME: Écouter les changements
  // ============================================

  useEffect(() => {
    if (!schoolGroupId) return;

    console.log('🔌 Configuration temps réel pour profile-stats...');

    const channel = supabase
      .channel(`profile-stats:${schoolGroupId}`)
      // Écouter les changements sur users.access_profile_code
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `school_group_id=eq.${schoolGroupId}`,
        },
        (payload) => {
          const oldProfile = (payload.old as any)?.access_profile_code;
          const newProfile = (payload.new as any)?.access_profile_code;

          // Si le profil a changé, invalider le cache
          if (oldProfile !== newProfile || payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
            console.log('🔔 Stats profils: changement détecté');
            queryClient.invalidateQueries({ 
              queryKey: profileStatsKeys.group(schoolGroupId) 
            });
          }
        }
      )
      // Écouter les changements sur access_profiles (permissions modifiées)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'access_profiles',
          filter: `school_group_id=eq.${schoolGroupId}`,
        },
        () => {
          console.log('🔔 Stats profils: permissions changées');
          queryClient.invalidateQueries({ 
            queryKey: profileStatsKeys.group(schoolGroupId) 
          });
          // Invalider aussi les profils pour rafraîchir les cartes
          queryClient.invalidateQueries({ 
            queryKey: ['access-profiles'] 
          });
        }
      )
      .subscribe((status) => {
        console.log('📡 Statut temps réel profile-stats:', status);
      });

    return () => {
      console.log('🔌 Déconnexion temps réel profile-stats');
      channel.unsubscribe();
    };
  }, [schoolGroupId, queryClient]);

  // ============================================
  // COMPUTED
  // ============================================

  const stats = useMemo(() => {
    const map: Record<string, number> = {};
    (data?.stats || []).forEach((s: ProfileStat) => {
      map[s.profile_code] = s.user_count;
    });
    return map;
  }, [data?.stats]);

  const modulesCounts = useMemo(() => {
    return data?.modulesMap || {};
  }, [data?.modulesMap]);

  const totalWithProfile = useMemo(() => {
    return Object.values(stats).reduce((sum, count) => sum + count, 0);
  }, [stats]);

  // ============================================
  // RETURN
  // ============================================

  return {
    stats,
    modulesCounts,
    totalWithProfile,
    totalWithoutProfile: data?.withoutProfile || 0,
    isLoading,
    error: error as Error | null,
    refresh: () => refetch(),
  };
};

/**
 * Hook pour obtenir le count d'un profil spécifique
 */
export const useProfileUserCount = (profileCode: string): number => {
  const { stats } = useProfileStats();
  return stats[profileCode] || 0;
};

/**
 * Hook pour obtenir le count de modules d'un profil
 */
export const useProfileModuleCount = (profileCode: string): number => {
  const { modulesCounts } = useProfileStats();
  return modulesCounts[profileCode] || 0;
};

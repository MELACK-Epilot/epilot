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
        return { stats: [], withoutProfile: 0 };
      }

      // 1. Compter les utilisateurs par profil
      const { data: profileCounts, error: countError } = await supabase
        .from('users')
        .select('access_profile_code')
        .eq('school_group_id', schoolGroupId)
        .not('role', 'in', '(super_admin,admin_groupe)');

      if (countError) throw countError;

      // Agréger les counts
      const statsMap: Record<string, number> = {};
      let withoutProfile = 0;

      (profileCounts || []).forEach((u: any) => {
        if (u.access_profile_code) {
          statsMap[u.access_profile_code] = (statsMap[u.access_profile_code] || 0) + 1;
        } else {
          withoutProfile++;
        }
      });

      // 2. Compter les modules par profil (filtré par groupe)
      const { data: moduleCounts, error: moduleError } = await supabase
        .from('access_profile_modules')
        .select('access_profile_code')
        .eq('school_group_id', schoolGroupId);

      if (moduleError) {
        console.warn('Table access_profile_modules non disponible:', moduleError);
      }

      const modulesMap: Record<string, number> = {};
      (moduleCounts || []).forEach((m: any) => {
        if (m.access_profile_code) {
          modulesMap[m.access_profile_code] = (modulesMap[m.access_profile_code] || 0) + 1;
        }
      });

      return {
        stats: Object.entries(statsMap).map(([code, count]) => ({
          profile_code: code,
          user_count: count,
          module_count: modulesMap[code] || 0,
        })),
        withoutProfile,
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
      // Écouter les changements sur access_profile_modules
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'access_profile_modules',
        },
        () => {
          console.log('🔔 Stats profils: modules changés');
          queryClient.invalidateQueries({ 
            queryKey: profileStatsKeys.group(schoolGroupId) 
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

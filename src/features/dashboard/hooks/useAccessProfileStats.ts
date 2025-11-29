/**
 * Hook pour récupérer les statistiques des profils d'accès
 * Compte les utilisateurs par access_profile_code (pas par role)
 * @module useAccessProfileStats
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/store/auth.store';

/** Statistique d'un profil d'accès */
export interface AccessProfileStat {
  profile_code: string;
  profile_name: string;
  user_count: number;
}

/** Résultat agrégé des statistiques */
export interface AccessProfileStatsResult {
  /** Statistiques par profil */
  stats: AccessProfileStat[];
  /** Nombre total d'utilisateurs avec un profil d'accès */
  totalUsersWithProfile: number;
  /** Profil le plus utilisé */
  mostUsedProfile: AccessProfileStat | null;
  /** Map pour accès rapide par code */
  byCode: Record<string, number>;
}

/**
 * Hook pour récupérer les statistiques d'utilisation des profils d'accès
 * Utilisé dans la page "Gestion des Accès" pour les KPIs
 */
export const useAccessProfileStats = () => {
  const { user } = useAuth();
  const schoolGroupId = user?.schoolGroupId;

  return useQuery<AccessProfileStatsResult>({
    queryKey: ['access-profile-stats', schoolGroupId],
    queryFn: async (): Promise<AccessProfileStatsResult> => {
      if (!schoolGroupId) {
        return {
          stats: [],
          totalUsersWithProfile: 0,
          mostUsedProfile: null,
          byCode: {},
        };
      }

      // Appeler la fonction RPC
      const { data, error } = await (supabase.rpc as any)('get_access_profile_stats', {
        p_school_group_id: schoolGroupId,
      }) as { data: AccessProfileStat[] | null; error: any };

      if (error) {
        console.error('Erreur récupération stats profils:', error);
        throw error;
      }

      const stats = data || [];
      
      // Calculer le total
      const totalUsersWithProfile = stats.reduce((sum, s) => sum + Number(s.user_count), 0);
      
      // Trouver le profil le plus utilisé (déjà trié par user_count DESC)
      const mostUsedProfile = stats.length > 0 ? stats[0] : null;
      
      // Créer une map pour accès rapide
      const byCode: Record<string, number> = {};
      stats.forEach((s) => {
        byCode[s.profile_code] = Number(s.user_count);
      });

      return {
        stats,
        totalUsersWithProfile,
        mostUsedProfile,
        byCode,
      };
    },
    enabled: !!schoolGroupId,
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
  });
};

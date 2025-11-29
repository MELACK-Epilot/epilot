import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/store/auth.store';

export const useRoleStats = () => {
  const { user } = useAuth();
  const schoolGroupId = user?.schoolGroupId;

  return useQuery({
    queryKey: ['role-stats', schoolGroupId],
    queryFn: async () => {
      // Utilise la RPC optimisée qu'on a créée précédemment
      // @ts-ignore - La fonction RPC est dynamique
      const { data, error } = await supabase.rpc('get_user_distribution_stats', {
        p_school_group_id: schoolGroupId
      });

      if (error) throw error;
      
      // Convertir le tableau en objet pour un accès rapide par rôle
      // ex: { 'enseignant': 12, 'eleve': 150 }
      const statsMap: Record<string, number> = {};
      (data as any[]).forEach((item: { role: string; count: number }) => {
        statsMap[item.role] = item.count;
      });

      return statsMap;
    },
    enabled: !!schoolGroupId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

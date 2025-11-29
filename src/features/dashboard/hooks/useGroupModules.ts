/**
 * @deprecated Utilisez useGroupAvailableModules à la place
 * Ce hook est conservé pour la rétrocompatibilité
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/features/auth/store/auth.store';

export interface GroupModule {
  id: string;
  name: string;
  description: string;
  icon: string;
  slug: string;
  status: string;
  is_active: boolean;
}

export interface ModuleCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  modules: GroupModule[];
}

/**
 * Hook optimisé pour récupérer les modules disponibles pour un groupe
 * Utilise la fonction RPC get_available_modules_for_group qui filtre par plan d'abonnement
 */
export const useGroupModules = () => {
  const { user } = useAuthStore();
  const groupId = user?.schoolGroupId || (user as any)?.school_group_id;

  return useQuery({
    queryKey: ['group-modules', groupId],
    queryFn: async () => {
      if (!groupId) {
        console.warn('⚠️ [useGroupModules] Aucun groupId disponible');
        return [];
      }

      console.log('🔍 [useGroupModules] Chargement des modules pour le groupe:', groupId);

      // Appeler la fonction RPC avec le bon nom de paramètre
      // @ts-ignore - La fonction RPC est dynamique
      const { data, error } = await supabase.rpc('get_available_modules_for_group', {
        p_school_group_id: groupId
      }) as { data: any; error: any };

      if (error) {
        console.error('❌ [useGroupModules] Erreur RPC:', error);
        throw error;
      }

      console.log('✅ [useGroupModules] Modules récupérés:', data?.length || 0, 'catégories');
      return (data || []) as ModuleCategory[];
    },
    enabled: !!groupId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
};

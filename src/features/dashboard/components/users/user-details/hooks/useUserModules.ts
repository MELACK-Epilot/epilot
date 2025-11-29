/**
 * Hook pour récupérer les modules d'un utilisateur
 * @module user-details/hooks/useUserModules
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { UserModule } from '../types';

export const useUserModules = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['user-modules-detail', userId],
    queryFn: async (): Promise<UserModule[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_modules')
        .select(`
          id,
          module_id,
          can_read,
          can_write,
          can_delete,
          can_export,
          assigned_by_profile,
          modules!inner(
            name,
            slug,
            icon,
            business_categories(name)
          )
        `)
        .eq('user_id', userId)
        .eq('is_enabled', true);

      if (error) throw error;

      return (data || []).map((um: any) => ({
        id: um.id,
        module_id: um.module_id,
        module_name: um.modules?.name || 'Module',
        module_slug: um.modules?.slug || '',
        module_icon: um.modules?.icon,
        category_name: um.modules?.business_categories?.name || 'Autre',
        can_read: um.can_read,
        can_write: um.can_write,
        can_delete: um.can_delete,
        can_export: um.can_export,
        assigned_by_profile: um.assigned_by_profile,
      }));
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
};

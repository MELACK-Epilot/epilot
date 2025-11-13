/**
 * Hook pour récupérer l'utilisateur connecté
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface CurrentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  schoolId?: string;
  schoolGroupId?: string;
  avatar?: string;
  status: string;
}

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      // 1. Récupérer l'utilisateur Auth
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        throw new Error('Non authentifié');
      }

      // 2. Récupérer les données complètes depuis la table users
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          first_name,
          last_name,
          role,
          school_id,
          school_group_id,
          avatar,
          status
        `)
        .eq('id', authUser.id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Utilisateur non trouvé');

      // Cast explicite pour éviter les erreurs TypeScript
      const userData = data as any;

      return {
        id: userData.id,
        email: userData.email,
        firstName: userData.first_name,
        lastName: userData.last_name,
        role: userData.role,
        schoolId: userData.school_id,
        schoolGroupId: userData.school_group_id,
        avatar: userData.avatar,
        status: userData.status,
      } as CurrentUser;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

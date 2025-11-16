/**
 * Hook pour récupérer les informations du groupe scolaire
 * Utilisé par les utilisateurs d'école pour voir leur groupe
 * 
 * @module useSchoolGroup
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from './useCurrentUser';

interface SchoolGroup {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
  status: string;
  created_at: string;
  // Statistiques
  total_schools: number;
  total_users: number;
  active_subscriptions: number;
  plan_name?: string;
}

export const useSchoolGroup = () => {
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: ['school-group', user?.schoolGroupId, user?.schoolId],
    queryFn: async () => {
      let schoolGroupId = user?.schoolGroupId;

      // Si pas de school_group_id direct, le récupérer depuis l'école
      if (!schoolGroupId && user?.schoolId) {
        const { data: schoolData, error: schoolError } = await supabase
          .from('schools')
          .select('school_group_id')
          .eq('id', user.schoolId)
          .single();

        if (schoolError) throw schoolError;
        schoolGroupId = (schoolData as any)?.school_group_id;
      }

      if (!schoolGroupId) {
        throw new Error('Aucun groupe scolaire associé');
      }

      // Récupérer les informations du groupe
      const { data, error } = await supabase
        .from('school_groups')
        .select(`
          id,
          name,
          description,
          status,
          created_at
        `)
        .eq('id', schoolGroupId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Groupe scolaire non trouvé');

      // Compter les utilisateurs du groupe
      const { count: userCount } = await supabase
        .from('users')
        .select('id', { count: 'exact' })
        .eq('school_group_id', schoolGroupId)
        .eq('status', 'active');

      // Compter les écoles
      const { count: schoolCount } = await supabase
        .from('schools')
        .select('id', { count: 'exact' })
        .eq('school_group_id', schoolGroupId)
        .eq('status', 'active');

      // Récupérer l'abonnement actif
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select(`
          id,
          status,
          plans(name)
        `)
        .eq('school_group_id', schoolGroupId)
        .eq('status', 'active')
        .single();

      // Cast explicite pour éviter les erreurs TypeScript
      const groupData = data as any;
      const subscriptionData = subscription as any;

      return {
        id: groupData.id,
        name: groupData.name,
        description: groupData.description,
        address: undefined,
        phone: undefined,
        email: undefined,
        website: undefined,
        logo: undefined,
        status: groupData.status,
        created_at: groupData.created_at,
        total_schools: schoolCount || 0,
        total_users: userCount || 0,
        active_subscriptions: subscriptionData ? 1 : 0,
        plan_name: subscriptionData?.plans?.name || 'Aucun plan',
      } as SchoolGroup;
    },
    enabled: !!(user?.schoolGroupId || user?.schoolId),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};

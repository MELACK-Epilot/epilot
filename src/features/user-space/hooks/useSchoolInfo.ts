/**
 * Hook pour récupérer les informations complètes de l'école
 * Inclut: école, groupe scolaire, proviseur
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from './useCurrentUser';

export interface SchoolInfo {
  // École
  school: {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    logo?: string;
  };
  // Groupe scolaire
  schoolGroup: {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    logo?: string;
  };
  // Proviseur/Directeur
  director: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

export const useSchoolInfo = () => {
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: ['school-info', user?.schoolId, user?.schoolGroupId],
    enabled: !!user?.schoolId && !!user?.schoolGroupId,
    staleTime: 10 * 60 * 1000, // Cache 10 minutes
    queryFn: async (): Promise<SchoolInfo> => {
      if (!user?.schoolId || !user?.schoolGroupId) {
        throw new Error('Informations utilisateur incomplètes');
      }

      // 1. Récupérer les infos de l'école
      const { data: school, error: schoolError } = await supabase
        .from('schools')
        .select('id, name, address, phone, email, logo')
        .eq('id', user.schoolId)
        .single();

      if (schoolError || !school) throw schoolError || new Error('École non trouvée');

      // 2. Récupérer les infos du groupe scolaire
      const { data: schoolGroup, error: groupError } = await supabase
        .from('school_groups')
        .select('id, name, address, phone, email, logo')
        .eq('id', user.schoolGroupId)
        .single();

      if (groupError || !schoolGroup) throw groupError || new Error('Groupe non trouvé');

      // Cast explicite pour TypeScript
      const schoolData = school as any;
      const groupData = schoolGroup as any;

      // 3. Récupérer le proviseur/directeur de l'école
      const { data: director } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, phone')
        .eq('school_id', user.schoolId)
        .in('role', ['proviseur', 'directeur'])
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

      // Si pas de proviseur trouvé, utiliser l'utilisateur actuel
      const directorInfo = director || {
        id: user.id,
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
        phone: undefined,
      };

      return {
        school: {
          id: schoolData.id,
          name: schoolData.name,
          address: schoolData.address,
          phone: schoolData.phone,
          email: schoolData.email,
          logo: schoolData.logo,
        },
        schoolGroup: {
          id: groupData.id,
          name: groupData.name,
          address: groupData.address,
          phone: groupData.phone,
          email: groupData.email,
          logo: groupData.logo,
        },
        director: {
          id: directorInfo.id,
          firstName: directorInfo.first_name,
          lastName: directorInfo.last_name,
          email: directorInfo.email,
          phone: directorInfo.phone,
        },
      };
    },
  });
};

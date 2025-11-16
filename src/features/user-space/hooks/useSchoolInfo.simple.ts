/**
 * Hook SIMPLIFIÉ pour récupérer les informations de l'école
 * Version qui fonctionne à coup sûr
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from './useCurrentUser';

export interface SchoolInfo {
  school: {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    logo?: string;
  };
  schoolGroup: {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    logo?: string;
  };
  director: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

export const useSchoolInfoSimple = () => {
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: ['school-info-simple'],
    enabled: true,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<SchoolInfo> => {
      console.log('🚀 SIMPLE - Starting fetch...');
      console.log('👤 User:', user);

      // 1. Récupérer le premier groupe scolaire
      const { data: groups, error: groupsError } = await supabase
        .from('school_groups')
        .select('*')
        .limit(1);

      console.log('📦 Groups query result:', { groups, groupsError });

      if (groupsError) {
        console.error('❌ Groups error:', groupsError);
        throw groupsError;
      }

      const group = groups?.[0];
      if (!group) {
        console.error('❌ No school group found');
        throw new Error('Aucun groupe scolaire trouvé');
      }

      console.log('✅ Group found:', group);

      // 2. Récupérer la première école de ce groupe
      const { data: schools, error: schoolsError } = await supabase
        .from('schools')
        .select('*')
        .eq('school_group_id', (group as any).id)
        .limit(1);

      console.log('🏫 Schools query result:', { schools, schoolsError });

      if (schoolsError) {
        console.error('❌ Schools error:', schoolsError);
        throw schoolsError;
      }

      const school = schools?.[0];
      if (!school) {
        console.error('❌ No school found');
        throw new Error('Aucune école trouvée');
      }

      console.log('✅ School found:', school);

      // 3. Récupérer le proviseur/directeur
      const { data: directors, error: directorsError } = await supabase
        .from('users')
        .select('*')
        .eq('school_id', (school as any).id)
        .in('role', ['proviseur', 'directeur', 'directeur_etudes'])
        .limit(1);

      console.log('👨‍💼 Directors query result:', { directors, directorsError });

      const director = directors?.[0] || user;

      const schoolData = school as any;
      const groupData = group as any;
      const directorData = director as any;

      const result: SchoolInfo = {
        school: {
          id: schoolData.id,
          name: schoolData.name || 'École',
          address: schoolData.address,
          phone: schoolData.phone,
          email: schoolData.email,
          logo: schoolData.logo_url || schoolData.logo, // Essayer logo_url puis logo
        },
        schoolGroup: {
          id: groupData.id,
          name: groupData.name || 'Groupe Scolaire',
          address: groupData.address,
          phone: groupData.phone,
          email: groupData.email,
          logo: groupData.logo_url || groupData.logo, // Essayer logo_url puis logo
        },
        director: {
          id: directorData?.id || user?.id || 'default',
          firstName: directorData?.first_name || user?.firstName || 'Directeur',
          lastName: directorData?.last_name || user?.lastName || '',
          email: directorData?.email || user?.email || '',
          phone: directorData?.phone,
        },
      };

      console.log('✅✅✅ FINAL RESULT:', result);
      return result;
    },
  });
};

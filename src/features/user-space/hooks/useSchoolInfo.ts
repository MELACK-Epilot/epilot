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

  console.log('🏫 useSchoolInfo - User data:', {
    userId: user?.id,
    schoolId: user?.schoolId,
    schoolGroupId: user?.schoolGroupId,
  });

  return useQuery({
    queryKey: ['school-info', user?.id],
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // Cache 10 minutes
    queryFn: async (): Promise<SchoolInfo> => {
      console.log('🔍 Fetching school info...');
      
      // Si pas de schoolId, récupérer la première école du premier groupe
      let schoolId = user?.schoolId;
      let schoolGroupId = user?.schoolGroupId;
      
      if (!schoolGroupId) {
        console.log('⚠️ No schoolGroupId, fetching first school group...');
        const { data: groups } = await supabase
          .from('school_groups')
          .select('id')
          .limit(1)
          .maybeSingle();
        
        if (groups) {
          schoolGroupId = (groups as any).id;
          console.log('✅ Using first school group:', schoolGroupId);
        }
      }
      
      if (!schoolId && schoolGroupId) {
        console.log('⚠️ No schoolId, fetching first school from group...');
        const { data: schools } = await supabase
          .from('schools')
          .select('id')
          .eq('school_group_id', schoolGroupId)
          .limit(1)
          .maybeSingle();
        
        if (schools) {
          schoolId = (schools as any).id;
          console.log('✅ Using first school:', schoolId);
        }
      }
      
      if (!schoolId || !schoolGroupId) {
        console.error('❌ Still missing schoolId or schoolGroupId after fallback');
        // Retourner des données par défaut
        return {
          school: {
            id: 'default',
            name: 'École',
            address: undefined,
            phone: undefined,
            email: undefined,
            logo: undefined,
          },
          schoolGroup: {
            id: 'default',
            name: 'Groupe Scolaire',
            address: undefined,
            phone: undefined,
            email: undefined,
            logo: undefined,
          },
          director: {
            id: user?.id || 'default',
            firstName: user?.firstName || 'Directeur',
            lastName: user?.lastName || '',
            email: user?.email || '',
            phone: undefined,
          },
        };
      }

      // 1. Récupérer les infos de l'école
      const { data: school, error: schoolError } = await supabase
        .from('schools')
        .select('id, name, address, phone, email, logo')
        .eq('id', schoolId)
        .single();

      if (schoolError || !school) {
        console.error('❌ School error:', schoolError);
        throw schoolError || new Error('École non trouvée');
      }
      
      console.log('✅ School data:', school);

      // 2. Récupérer les infos du groupe scolaire
      const { data: schoolGroup, error: groupError } = await supabase
        .from('school_groups')
        .select('id, name, address, phone, email, logo')
        .eq('id', schoolGroupId)
        .single();

      if (groupError || !schoolGroup) {
        console.error('❌ School group error:', groupError);
        throw groupError || new Error('Groupe non trouvé');
      }
      
      console.log('✅ School group data:', schoolGroup);

      // Cast explicite pour TypeScript
      const schoolData = school as any;
      const groupData = schoolGroup as any;

      // 3. Récupérer le proviseur/directeur de l'école
      const { data: director } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, phone')
        .eq('school_id', schoolId)
        .in('role', ['proviseur', 'directeur'])
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

      // Si pas de proviseur trouvé, utiliser l'utilisateur actuel
      const directorInfo = director || {
        id: user?.id || 'default',
        first_name: user?.firstName || 'Directeur',
        last_name: user?.lastName || '',
        email: user?.email || '',
        phone: undefined,
      };

      const result = {
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
      
      console.log('✅ Final school info:', result);
      return result;
    },
  });
};

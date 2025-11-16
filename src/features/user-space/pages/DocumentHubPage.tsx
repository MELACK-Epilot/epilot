/**
 * Page Hub Documentaire
 * Wrapper pour le composant DocumentHub
 */

import { DocumentHub } from '@/features/document-hub';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const useSchools = (schoolGroupId?: string) => {
  return useQuery({
    queryKey: ['schools', schoolGroupId],
    queryFn: async () => {
      if (!schoolGroupId) return [];
      
      const { data, error } = await supabase
        .from('schools')
        .select('id, name')
        .eq('school_group_id', schoolGroupId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!schoolGroupId,
  });
};

export const DocumentHubPage = () => {
  const { data: user } = useCurrentUser();
  const { data: schools = [] } = useSchools(user?.schoolGroupId);

  if (!user) {
    return <div>Chargement...</div>;
  }

  return (
    <DocumentHub
      schoolGroupId={user.schoolGroupId || ''}
      currentUserId={user.id}
      schools={schools}
      userRole={user.role || 'proviseur'}
    />
  );
};

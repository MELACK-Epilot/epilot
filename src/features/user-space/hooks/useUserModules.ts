/**
 * Hook pour récupérer les modules disponibles pour l'utilisateur
 * React 19 Best Practices
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from './useCurrentUser';

interface Module {
  id: string;
  name: string;
  slug: string;
  description: string;
  category_id: string;
  icon: string;
  color: string;
  version: string;
  plan_required: string;
  status: string;
  is_core: boolean;
  category?: {
    id: string;
    name: string;
    slug: string;
    icon: string;
    color: string;
  };
}

export const useUserModules = () => {
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: ['user-assigned-modules', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('Utilisateur non authentifié');
      }

      console.log('🔍 Chargement des modules assignés à l\'utilisateur:', user.id);

      // Récupérer les modules assignés à l'utilisateur via user_modules
      const { data, error } = await supabase
        .from('user_modules')
        .select(`
          module_id,
          is_enabled,
          assigned_at,
          assigned_by,
          settings,
          last_accessed_at,
          access_count,
          modules!inner(
            id,
            name,
            slug,
            description,
            category_id,
            icon,
            color,
            version,
            plan_required,
            status,
            is_core,
            category:business_categories(
              id,
              name,
              slug,
              icon,
              color
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('is_enabled', true)
        .eq('modules.status', 'active')
        .order('modules(name)');

      if (error) {
        console.error('❌ Erreur récupération modules assignés:', error);
        throw error;
      }

      console.log('✅ Modules assignés trouvés:', data?.length || 0);

      // Mapper les données pour retourner les modules
      const modules = (data || []).map((um: any) => ({
        ...um.modules,
        user_module_id: um.module_id,
        is_enabled: um.is_enabled,
        assigned_at: um.assigned_at,
        assigned_by: um.assigned_by,
        settings: um.settings,
        last_accessed_at: um.last_accessed_at,
        access_count: um.access_count,
      }));

      return modules as Module[];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};

/**
 * Hook pour récupérer un module spécifique
 */
export const useModuleDetails = (moduleId?: string) => {
  return useQuery({
    queryKey: ['module-details', moduleId],
    queryFn: async () => {
      if (!moduleId) throw new Error('Module ID requis');

      const { data, error } = await supabase
        .from('modules')
        .select(`
          *,
          category:business_categories(*)
        `)
        .eq('id', moduleId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!moduleId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook pour filtrer les modules
 */
export const useFilteredModules = (filters: {
  search?: string;
  categoryId?: string;
  planRequired?: string;
}) => {
  const { data: modules, ...rest } = useUserModules();

  const filteredModules = modules?.filter((module) => {
    // Filtre recherche
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchName = module.name.toLowerCase().includes(searchLower);
      const matchDesc = module.description?.toLowerCase().includes(searchLower);
      if (!matchName && !matchDesc) return false;
    }

    // Filtre catégorie
    if (filters.categoryId && module.category_id !== filters.categoryId) {
      return false;
    }

    // Filtre plan
    if (filters.planRequired && module.plan_required !== filters.planRequired) {
      return false;
    }

    return true;
  });

  return {
    data: filteredModules,
    ...rest,
  };
};

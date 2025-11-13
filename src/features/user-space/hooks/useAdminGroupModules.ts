/**
 * Hook pour récupérer les modules disponibles pour un Admin Groupe
 * Filtre selon l'abonnement et les modules assignés au groupe
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/store/auth.store';

interface AdminGroupModule {
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
  is_enabled: boolean; // Statut dans group_module_configs
  category?: {
    id: string;
    name: string;
    slug: string;
    icon: string;
    color: string;
  };
}

/**
 * Récupère les modules disponibles pour l'Admin Groupe
 * Basé sur l'abonnement et les configurations du groupe
 */
export const useAdminGroupModules = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['admin-group-modules', user?.schoolGroupId],
    queryFn: async () => {
      if (!user?.schoolGroupId) {
        throw new Error('schoolGroupId manquant');
      }

      console.log('🔍 [Admin Groupe] Récupération modules pour groupe:', user.schoolGroupId);

      // Récupérer les modules assignés au groupe via group_module_configs
      const { data: groupModules, error } = await supabase
        .from('group_module_configs')
        .select(`
          is_enabled,
          module:modules(
            id,
            name,
            slug,
            description,
            category_id,
            icon,
            color,
            version,
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
        .eq('school_group_id', user.schoolGroupId)
        .eq('module.status', 'active'); // Jointure avec filtre

      if (error) {
        console.error('❌ Erreur récupération modules groupe:', error);
        throw error;
      }

      // Transformer les données
      const modules: AdminGroupModule[] = (groupModules || [])
        .filter(item => item.module) // Vérifier que le module existe
        .map(item => ({
          ...item.module,
          is_enabled: item.is_enabled,
        }));

      console.log('✅ [Admin Groupe] Modules trouvés:', modules.length);
      
      return modules;
    },
    enabled: !!user?.schoolGroupId && user?.role === 'admin_groupe',
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

/**
 * Récupère les statistiques des modules pour l'Admin Groupe
 */
export const useAdminGroupModuleStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['admin-group-module-stats', user?.schoolGroupId],
    queryFn: async () => {
      if (!user?.schoolGroupId) {
        throw new Error('schoolGroupId manquant');
      }

      // Compter les modules par statut
      const { data: stats, error } = await supabase
        .from('group_module_configs')
        .select(`
          is_enabled,
          module:business_modules(status)
        `)
        .eq('school_group_id', user.schoolGroupId)
        .eq('module.status', 'active');

      if (error) {
        console.error('❌ Erreur stats modules:', error);
        throw error;
      }

      const totalModules = stats?.length || 0;
      const enabledModules = stats?.filter(s => s.is_enabled).length || 0;
      const disabledModules = totalModules - enabledModules;

      return {
        totalModules,
        enabledModules,
        disabledModules,
        enabledPercentage: totalModules > 0 ? Math.round((enabledModules / totalModules) * 100) : 0,
      };
    },
    enabled: !!user?.schoolGroupId && user?.role === 'admin_groupe',
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Hook pour activer/désactiver un module
 */
export const useToggleGroupModule = () => {
  const { user } = useAuth();

  const toggleModule = async (moduleId: string, isEnabled: boolean) => {
    if (!user?.schoolGroupId) {
      throw new Error('schoolGroupId manquant');
    }

    const { error } = await supabase
      .from('group_module_configs')
      .update({ is_enabled: isEnabled })
      .eq('school_group_id', user.schoolGroupId)
      .eq('module_id', moduleId);

    if (error) {
      console.error('❌ Erreur toggle module:', error);
      throw error;
    }

    console.log(`✅ Module ${isEnabled ? 'activé' : 'désactivé'}:`, moduleId);
  };

  return { toggleModule };
};

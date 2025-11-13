/**
 * Hook pour récupérer les catégories disponibles pour un Admin Groupe
 * Filtre selon l'abonnement et les modules assignés au groupe
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/store/auth.store';

interface AdminGroupCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  status: string;
  module_count: number; // Nombre de modules du groupe dans cette catégorie
  enabled_module_count: number; // Nombre de modules activés dans cette catégorie
}

/**
 * Récupère les catégories avec modules assignés au groupe
 */
export const useAdminGroupCategories = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['admin-group-categories', user?.schoolGroupId],
    queryFn: async () => {
      if (!user?.schoolGroupId) {
        throw new Error('schoolGroupId manquant');
      }

      console.log('🔍 [Admin Groupe] Récupération catégories pour groupe:', user.schoolGroupId);

      // 1. Récupérer les catégories qui ont des modules assignés au groupe
      const { data: groupModules, error: modulesError } = await supabase
        .from('group_module_configs')
        .select(`
          is_enabled,
          module:modules(
            category_id,
            category:business_categories(
              id,
              name,
              slug,
              description,
              icon,
              color,
              status
            )
          )
        `)
        .eq('school_group_id', user.schoolGroupId)
        .eq('module.status', 'active');

      if (modulesError) {
        console.error('❌ Erreur récupération catégories groupe:', modulesError);
        throw modulesError;
      }

      // 2. Grouper par catégorie et compter les modules
      const categoryMap = new Map<string, AdminGroupCategory>();

      (groupModules || []).forEach(item => {
        if (item.module?.category) {
          const category = item.module.category;
          const categoryId = category.id;

          if (!categoryMap.has(categoryId)) {
            categoryMap.set(categoryId, {
              ...category,
              module_count: 0,
              enabled_module_count: 0,
            });
          }

          const cat = categoryMap.get(categoryId)!;
          cat.module_count += 1;
          if (item.is_enabled) {
            cat.enabled_module_count += 1;
          }
        }
      });

      // 3. Convertir en array et trier
      const categories = Array.from(categoryMap.values())
        .filter(cat => cat.status === 'active') // Seulement les catégories actives
        .sort((a, b) => a.name.localeCompare(b.name));

      console.log('✅ [Admin Groupe] Catégories trouvées:', categories.length);
      
      return categories;
    },
    enabled: !!user?.schoolGroupId && user?.role === 'admin_groupe',
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

/**
 * Récupère les statistiques des catégories pour l'Admin Groupe
 */
export const useAdminGroupCategoryStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['admin-group-category-stats', user?.schoolGroupId],
    queryFn: async () => {
      if (!user?.schoolGroupId) {
        throw new Error('schoolGroupId manquant');
      }

      // Récupérer toutes les catégories avec modules du groupe
      const { data: groupModules, error } = await supabase
        .from('group_module_configs')
        .select(`
          is_enabled,
          module:business_modules(
            category_id,
            category:business_categories(id, name)
          )
        `)
        .eq('school_group_id', user.schoolGroupId)
        .eq('module.status', 'active');

      if (error) {
        console.error('❌ Erreur stats catégories:', error);
        throw error;
      }

      // Compter les catégories uniques
      const uniqueCategories = new Set();
      let totalModules = 0;
      let enabledModules = 0;

      (groupModules || []).forEach(item => {
        if (item.module?.category) {
          uniqueCategories.add(item.module.category.id);
          totalModules += 1;
          if (item.is_enabled) {
            enabledModules += 1;
          }
        }
      });

      return {
        totalCategories: uniqueCategories.size,
        totalModules,
        enabledModules,
        enabledPercentage: totalModules > 0 ? Math.round((enabledModules / totalModules) * 100) : 0,
      };
    },
    enabled: !!user?.schoolGroupId && user?.role === 'admin_groupe',
    staleTime: 2 * 60 * 1000,
  });
};

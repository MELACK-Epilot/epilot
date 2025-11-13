/**
 * Hook pour récupérer les modules disponibles pour un groupe scolaire
 * Basé sur le plan d'abonnement du groupe
 * @module useSchoolGroupModules
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Module } from '../types/dashboard.types';

/**
 * Type pour un module avec sa catégorie
 */
export interface ModuleWithCategory extends Module {
  category: {
    id: string;
    name: string;
    slug: string;
    color: string;
  } | null;
}

/**
 * Hiérarchie des plans (du plus bas au plus haut)
 */
const PLAN_HIERARCHY: Record<string, number> = {
  gratuit: 1,
  premium: 2,
  pro: 3,
  institutionnel: 4,
};

/**
 * Hook pour récupérer les modules disponibles pour un groupe scolaire
 */
export const useSchoolGroupModules = (schoolGroupId?: string) => {
  return useQuery({
    queryKey: ['school-group-modules', schoolGroupId],
    queryFn: async () => {
      if (!schoolGroupId) {
        console.warn('⚠️ useSchoolGroupModules: schoolGroupId manquant');
        throw new Error('School group ID is required');
      }

      console.log('🔍 Chargement des modules pour le groupe:', schoolGroupId);

      // 1. Récupérer le groupe scolaire avec son plan DYNAMIQUE depuis subscription
      const { data: schoolGroup, error: groupError } = await supabase
        .from('school_groups')
        .select(`
          id,
          name,
          plan,
          subscriptions!inner(
            plan_id,
            status,
            subscription_plans!inner(
              id,
              name,
              slug
            )
          )
        `)
        .eq('id', schoolGroupId)
        .eq('subscriptions.status', 'active')
        .single();

      if (groupError) {
        console.error('❌ Erreur récupération groupe:', groupError);
        throw groupError;
      }

      if (!schoolGroup) {
        throw new Error('School group not found');
      }

      // ✅ Utiliser le plan DYNAMIQUE depuis la subscription active
      const activePlan = (schoolGroup as any).subscriptions?.[0]?.subscription_plans?.slug || schoolGroup.plan;
      const planName = (schoolGroup as any).subscriptions?.[0]?.subscription_plans?.name || schoolGroup.plan;

      console.log('✅ Groupe trouvé:', schoolGroup.name);
      console.log('📋 Plan statique (school_groups.plan):', schoolGroup.plan);
      console.log('📋 Plan dynamique (subscription active):', activePlan);
      console.log('📋 Nom du plan:', planName);

      // 2. Récupérer le plan_id depuis la subscription active
      const planId = (schoolGroup as any).subscriptions?.[0]?.plan_id;
      
      if (!planId) {
        console.warn('⚠️ Aucun plan_id trouvé dans la subscription');
        console.warn('💡 Conseil : Vérifiez que le groupe a un abonnement actif dans subscriptions');
        return {
          schoolGroup,
          availableModules: [],
          totalModules: 0,
          error: 'NO_ACTIVE_SUBSCRIPTION',
          message: 'Aucun abonnement actif trouvé pour ce groupe',
        };
      }

      console.log('📋 Plan ID:', planId);

      // 3. Récupérer les modules assignés au plan via plan_modules
      const { data: planModules, error: planModulesError } = await supabase
        .from('plan_modules')
        .select(`
          module_id,
          modules!inner(
            id,
            name,
            slug,
            description,
            icon,
            required_plan,
            status,
            category_id,
            business_categories(
              id,
              name,
              slug,
              color
            )
          )
        `)
        .eq('plan_id', planId)
        .eq('modules.status', 'active');

      if (planModulesError) {
        console.error('❌ Erreur récupération plan_modules:', planModulesError);
        throw planModulesError;
      }

      console.log('📦 Modules du plan trouvés:', planModules?.length || 0);

      // 4. Mapper les modules avec leurs catégories
      const availableModules = (planModules || []).map((pm: any) => ({
        ...pm.modules,
        category: pm.modules.business_categories,
      }));

      console.log('✅ Modules disponibles:', availableModules.length);

      // 5. Vérifier si le plan a des modules assignés
      if (availableModules.length === 0) {
        console.warn('⚠️ Aucun module assigné au plan');
        console.warn('💡 Conseil : Modifiez le plan via /dashboard/plans et assignez des modules');
        return {
          schoolGroup,
          availableModules: [],
          totalModules: 0,
          error: 'NO_MODULES_ASSIGNED',
          message: `Le plan "${planName}" n'a aucun module assigné`,
        };
      }

      return {
        schoolGroup,
        availableModules: availableModules as ModuleWithCategory[],
        totalModules: availableModules.length,
      };
    },
    enabled: !!schoolGroupId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook pour récupérer les catégories disponibles pour un groupe scolaire
 */
export const useSchoolGroupCategories = (schoolGroupId?: string) => {
  return useQuery({
    queryKey: ['school-group-categories', schoolGroupId],
    queryFn: async () => {
      if (!schoolGroupId) {
        throw new Error('School group ID is required');
      }

      // 1. Récupérer le groupe scolaire avec son plan DYNAMIQUE depuis subscription
      const { data: schoolGroup, error: groupError } = await supabase
        .from('school_groups')
        .select(`
          id,
          name,
          plan,
          subscriptions!inner(
            plan_id,
            status,
            subscription_plans!inner(
              id,
              name,
              slug
            )
          )
        `)
        .eq('id', schoolGroupId)
        .eq('subscriptions.status', 'active')
        .single();

      if (groupError) throw groupError;
      if (!schoolGroup) throw new Error('School group not found');

      // 2. Récupérer le plan_id depuis la subscription active
      const planId = (schoolGroup as any).subscriptions?.[0]?.plan_id;
      
      if (!planId) {
        console.warn('⚠️ Aucun plan_id trouvé dans la subscription');
        console.warn('💡 Conseil : Vérifiez que le groupe a un abonnement actif dans subscriptions');
        return {
          schoolGroup,
          categories: [],
          totalCategories: 0,
          error: 'NO_ACTIVE_SUBSCRIPTION',
          message: 'Aucun abonnement actif trouvé pour ce groupe',
        };
      }

      console.log('📋 Plan ID pour catégories:', planId);

      // 3. Récupérer les catégories assignées au plan via plan_categories
      const { data: planCategories, error: categoriesError } = await supabase
        .from('plan_categories')
        .select(`
          category_id,
          business_categories!inner(
            id,
            name,
            slug,
            description,
            icon,
            color,
            status
          )
        `)
        .eq('plan_id', planId)
        .eq('business_categories.status', 'active');

      if (categoriesError) throw categoriesError;

      console.log('🏷️ Catégories du plan trouvées:', planCategories?.length || 0);

      // Vérifier si le plan a des catégories assignées
      if (!planCategories || planCategories.length === 0) {
        console.warn('⚠️ Aucune catégorie assignée au plan');
        console.warn('💡 Conseil : Modifiez le plan via /dashboard/plans et assignez des catégories');
        return {
          schoolGroup,
          categories: [],
          totalCategories: 0,
          error: 'NO_CATEGORIES_ASSIGNED',
          message: 'Le plan n\'a aucune catégorie assignée',
        };
      }

      // 4. Pour chaque catégorie, récupérer ses modules assignés au plan
      const categoriesWithModules = await Promise.all(
        (planCategories || []).map(async (pc: any) => {
          const category = pc.business_categories;
          
          // Récupérer les modules de cette catégorie assignés au plan
          const { data: categoryModules } = await supabase
            .from('plan_modules')
            .select(`
              modules!inner(
                id,
                name,
                category_id
              )
            `)
            .eq('plan_id', planId)
            .eq('modules.category_id', category.id)
            .eq('modules.status', 'active');

          const availableModules = (categoryModules || []).map((cm: any) => cm.modules);

          return {
            ...category,
            availableModules,
            availableModulesCount: availableModules.length,
          };
        })
      );

      return {
        schoolGroup,
        categories: categoriesWithModules,
        totalCategories: categoriesWithModules.length,
      };
    },
    enabled: !!schoolGroupId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook pour vérifier si un module est disponible pour un groupe
 */
export const useIsModuleAvailable = (
  schoolGroupId?: string,
  moduleRequiredPlan?: string
) => {
  return useQuery({
    queryKey: ['module-availability', schoolGroupId, moduleRequiredPlan],
    queryFn: async () => {
      if (!schoolGroupId || !moduleRequiredPlan) {
        return false;
      }

      // Récupérer le plan du groupe
      const { data: schoolGroup, error } = await supabase
        .from('school_groups')
        .select('plan')
        .eq('id', schoolGroupId)
        .single();

      if (error || !schoolGroup) return false;

      // Comparer les niveaux de plan
      const groupPlanLevel = PLAN_HIERARCHY[(schoolGroup as any).plan] || 1;
      const modulePlanLevel = PLAN_HIERARCHY[moduleRequiredPlan] || 1;

      return modulePlanLevel <= groupPlanLevel;
    },
    enabled: !!schoolGroupId && !!moduleRequiredPlan,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook pour récupérer les statistiques des modules par plan
 */
export const useModuleStatsByPlan = () => {
  return useQuery({
    queryKey: ['module-stats-by-plan'],
    queryFn: async () => {
      const { data: modules, error } = await supabase
        .from('modules')
        .select('required_plan, status')
        .eq('status', 'active');

      if (error) throw error;

      // Compter les modules par plan
      const stats = {
        gratuit: 0,
        premium: 0,
        pro: 0,
        institutionnel: 0,
      };

      (modules || []).forEach((module: any) => {
        if (module.required_plan in stats) {
          stats[module.required_plan as keyof typeof stats]++;
        }
      });

      // Calculer les totaux cumulatifs
      return {
        gratuit: stats.gratuit,
        premium: stats.gratuit + stats.premium,
        pro: stats.gratuit + stats.premium + stats.pro,
        institutionnel: stats.gratuit + stats.premium + stats.pro + stats.institutionnel,
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

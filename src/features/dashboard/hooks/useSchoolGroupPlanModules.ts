/**
 * Hook pour récupérer les modules du plan d'abonnement d'un groupe
 * ⚠️ LOGIQUE MÉTIER E-PILOT:
 * - Admin Groupe ne peut assigner QUE les modules de son plan
 * - Filtrage automatique selon le plan
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface SchoolGroup {
  id: string;
  subscription_plan_id: string | null;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  module_ids: string[];
}

export const useSchoolGroupPlanModules = (schoolGroupId: string | undefined) => {
  return useQuery({
    queryKey: ['school-group-plan-modules', schoolGroupId],
    queryFn: async () => {
      if (!schoolGroupId) return [];

      // 1. Récupérer le groupe scolaire avec son plan
      const { data: group, error: groupError } = await supabase
        .from('school_groups')
        .select('id, subscription_plan_id')
        .eq('id', schoolGroupId)
        .single();

      if (groupError) {
        console.error('❌ Erreur récupération groupe:', groupError);
        throw groupError;
      }

      if (!group || !group.subscription_plan_id) {
        console.warn('⚠️ Groupe sans plan d\'abonnement');
        return [];
      }

      // 2. Récupérer les modules via la table de liaison plan_modules
      const { data: planModules, error: planModulesError } = await supabase
        .from('plan_modules')
        .select(`
          module_id,
          modules (
            id,
            name,
            description,
            icon,
            color,
            category_id,
            status,
            business_categories (
              id,
              name,
              icon,
              color,
              code
            )
          )
        `)
        .eq('plan_id', group.subscription_plan_id);

      if (planModulesError) {
        console.error('❌ Erreur récupération modules du plan:', planModulesError);
        throw planModulesError;
      }

      // 3. Extraire et filtrer les modules actifs
      const modules = (planModules || [])
        .map((pm: any) => pm.modules)
        .filter((m: any) => m && m.status === 'active');

      console.log(`✅ ${modules.length} modules du plan chargés pour le groupe`);

      return modules;
    },
    enabled: !!schoolGroupId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

/**
 * Hook pour vérifier si un module est dans le plan
 */
export const useIsModuleInPlan = (schoolGroupId: string | undefined, moduleId: string | undefined) => {
  const { data: planModules } = useSchoolGroupPlanModules(schoolGroupId);

  if (!planModules || !moduleId) return false;

  return planModules.some((m: any) => m.id === moduleId);
};

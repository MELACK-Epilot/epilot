/**
 * Hook Restrictions de Plan - Temps Réel
 * Vérifie les limites du plan (écoles, élèves, personnel, stockage)
 * Met à jour automatiquement quand le plan change
 * Utilise RPC Functions pour performance
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/store/auth.store';

export interface PlanRestriction {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
  usagePercent: number;
}

export interface AllPlanRestrictions {
  schools: PlanRestriction;
  students: PlanRestriction;
  staff: PlanRestriction;
  storage: PlanRestriction;
}

/**
 * Hook pour récupérer toutes les restrictions du plan
 */
export const usePlanRestrictions = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['plan-restrictions', user?.schoolGroupId],
    queryFn: async () => {
      if (!user?.schoolGroupId) {
        throw new Error('School group ID required');
      }

      // Appel RPC pour obtenir toutes les restrictions
      const { data, error } = await supabase.rpc('get_all_plan_restrictions', {
        p_school_group_id: user.schoolGroupId,
      });

      if (error) {
        console.error('❌ Erreur récupération restrictions:', error);
        throw error;
      }

      // Calculer les pourcentages
      const restrictions: AllPlanRestrictions = {
        schools: {
          ...data.schools,
          usagePercent: Math.round((data.schools.current / data.schools.limit) * 100),
        },
        students: {
          ...data.students,
          usagePercent: Math.round((data.students.current / data.students.limit) * 100),
        },
        staff: {
          ...data.staff,
          usagePercent: Math.round((data.staff.current / data.staff.limit) * 100),
        },
        storage: {
          ...data.storage,
          usagePercent: Math.round((data.storage.current / data.storage.limit) * 100),
        },
      };

      console.log('📊 Restrictions du plan:', restrictions);

      return restrictions;
    },
    enabled: !!user?.schoolGroupId,
    staleTime: 30 * 1000, // 30 secondes (rafraîchissement fréquent)
    refetchInterval: 60 * 1000, // Rafraîchir toutes les minutes
  });
};

/**
 * Hook pour vérifier une restriction spécifique
 */
export const useCheckRestriction = (restrictionType: 'schools' | 'students' | 'staff' | 'storage') => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['plan-restriction', user?.schoolGroupId, restrictionType],
    queryFn: async () => {
      if (!user?.schoolGroupId) {
        throw new Error('School group ID required');
      }

      const { data, error } = await supabase.rpc('check_plan_restrictions', {
        p_school_group_id: user.schoolGroupId,
        p_restriction_type: restrictionType,
      });

      if (error) throw error;

      return {
        ...data,
        usagePercent: Math.round((data.current / data.limit) * 100),
      } as PlanRestriction;
    },
    enabled: !!user?.schoolGroupId,
    staleTime: 30 * 1000,
  });
};

/**
 * Hook pour vérifier si un module est accessible
 */
export const useCanAccessModule = (moduleId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['can-access-module', user?.schoolGroupId, moduleId],
    queryFn: async () => {
      if (!user?.schoolGroupId || !moduleId) {
        return false;
      }

      const { data, error } = await supabase.rpc('can_access_module', {
        p_school_group_id: user.schoolGroupId,
        p_module_id: moduleId,
      });

      if (error) {
        console.error('❌ Erreur vérification accès module:', error);
        return false;
      }

      return data as boolean;
    },
    enabled: !!user?.schoolGroupId && !!moduleId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook pour vérifier si une catégorie est accessible
 */
export const useCanAccessCategory = (categoryId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['can-access-category', user?.schoolGroupId, categoryId],
    queryFn: async () => {
      if (!user?.schoolGroupId || !categoryId) {
        return false;
      }

      const { data, error } = await supabase.rpc('can_access_category', {
        p_school_group_id: user.schoolGroupId,
        p_category_id: categoryId,
      });

      if (error) {
        console.error('❌ Erreur vérification accès catégorie:', error);
        return false;
      }

      return data as boolean;
    },
    enabled: !!user?.schoolGroupId && !!categoryId,
    staleTime: 5 * 60 * 1000,
  });
};

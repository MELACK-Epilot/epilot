/**
 * Hook universel pour vérifier les limites du plan d'abonnement
 * Utilise les limites DYNAMIQUES définies dans subscription_plans
 * @module useCheckPlanLimit
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

/**
 * Résultat de la vérification de limite
 */
export interface PlanLimitCheckResult {
  allowed: boolean;
  currentCount: number;
  maxLimit: number;
  remaining: number;
  planName: string;
  message: string;
}

/**
 * Hook pour vérifier une limite avant création
 */
export const useCheckPlanLimit = (
  schoolGroupId: string | undefined,
  resourceType: 'schools' | 'users' | 'storage' | 'modules'
) => {
  return useQuery({
    queryKey: ['plan-limit', schoolGroupId, resourceType],
    queryFn: async (): Promise<PlanLimitCheckResult> => {
      if (!schoolGroupId) {
        throw new Error('School group ID requis');
      }

      const { data, error } = await supabase.rpc('check_plan_limit', {
        p_school_group_id: schoolGroupId,
        p_resource_type: resourceType,
      });

      if (error) {
        console.error('❌ Erreur vérification limite:', error);
        throw error;
      }

      // La fonction retourne un tableau avec 1 élément
      const result = Array.isArray(data) ? data[0] : data;

      return {
        allowed: result.allowed,
        currentCount: result.current_count,
        maxLimit: result.max_limit,
        remaining: result.remaining,
        planName: result.plan_name,
        message: result.message,
      };
    },
    enabled: !!schoolGroupId,
    staleTime: 30 * 1000, // 30 secondes (les limites changent fréquemment)
  });
};

/**
 * Hook pour vérifier et bloquer si limite atteinte
 */
export const useEnforcePlanLimit = () => {
  return useMutation({
    mutationFn: async ({
      schoolGroupId,
      resourceType,
    }: {
      schoolGroupId: string;
      resourceType: 'schools' | 'users' | 'storage' | 'modules';
    }): Promise<PlanLimitCheckResult> => {
      const { data, error } = await supabase.rpc('check_plan_limit', {
        p_school_group_id: schoolGroupId,
        p_resource_type: resourceType,
      });

      if (error) throw error;

      const result = Array.isArray(data) ? data[0] : data;

      // Si limite atteinte, lancer une erreur
      if (!result.allowed) {
        throw new Error(result.message);
      }

      return {
        allowed: result.allowed,
        currentCount: result.current_count,
        maxLimit: result.max_limit,
        remaining: result.remaining,
        planName: result.plan_name,
        message: result.message,
      };
    },
  });
};

/**
 * Hook pour incrémenter un compteur de ressources
 */
export const useIncrementResourceCount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      schoolGroupId,
      resourceType,
      increment = 1,
    }: {
      schoolGroupId: string;
      resourceType: 'schools' | 'students' | 'staff';
      increment?: number;
    }) => {
      const { error } = await supabase.rpc('increment_resource_count', {
        p_school_group_id: schoolGroupId,
        p_resource_type: resourceType,
        p_increment: increment,
      });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      // Invalider les caches de limites
      queryClient.invalidateQueries({ 
        queryKey: ['plan-limit', variables.schoolGroupId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['current-user-group'] 
      });
    },
  });
};

/**
 * Hook pour décrémenter un compteur de ressources
 */
export const useDecrementResourceCount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      schoolGroupId,
      resourceType,
      decrement = 1,
    }: {
      schoolGroupId: string;
      resourceType: 'schools' | 'students' | 'staff';
      decrement?: number;
    }) => {
      const { error } = await supabase.rpc('decrement_resource_count', {
        p_school_group_id: schoolGroupId,
        p_resource_type: resourceType,
        p_decrement: decrement,
      });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      // Invalider les caches de limites
      queryClient.invalidateQueries({ 
        queryKey: ['plan-limit', variables.schoolGroupId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['current-user-group'] 
      });
    },
  });
};

/**
 * Hook helper pour afficher un toast si limite atteinte
 */
export const useCheckLimitWithToast = () => {
  const enforcePlanLimit = useEnforcePlanLimit();

  const checkLimit = async (
    schoolGroupId: string,
    resourceType: 'schools' | 'users' | 'storage' | 'modules'
  ): Promise<boolean> => {
    try {
      await enforcePlanLimit.mutateAsync({ schoolGroupId, resourceType });
      return true;
    } catch (error: any) {
      toast.error('Limite atteinte', {
        description: error.message,
        action: {
          label: 'Mettre à niveau',
          onClick: () => {
            window.location.href = '/dashboard/plans';
          },
        },
      });
      return false;
    }
  };

  return { checkLimit, isChecking: enforcePlanLimit.isPending };
};

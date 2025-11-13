/**
 * Hook pour gérer la suppression sécurisée des plans
 * Utilise le système de suppression backend avec vérification des dépendances
 * @module usePlanDeletion
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

/**
 * Interface pour les dépendances d'un plan
 */
export interface PlanDependency {
  dependencyType: string;
  count: number;
  canDelete: boolean;
  message: string;
}

/**
 * Interface pour le résultat de suppression
 */
export interface DeletionResult {
  success: boolean;
  deletionType: 'soft' | 'hard' | 'blocked' | 'error';
  message: string;
  dependenciesRemoved?: number;
}

/**
 * Hook pour vérifier les dépendances d'un plan
 */
export const useCheckPlanDependencies = (planId?: string) => {
  return useQuery({
    queryKey: ['plan-dependencies', planId],
    queryFn: async (): Promise<PlanDependency[]> => {
      if (!planId) return [];

      const { data, error } = await supabase.rpc('check_plan_dependencies', {
        p_plan_id: planId,
      });

      if (error) {
        console.error('Erreur vérification dépendances:', error);
        throw error;
      }

      return (data || []).map((dep: any) => ({
        dependencyType: dep.dependency_type,
        count: dep.count,
        canDelete: dep.can_delete,
        message: dep.message,
      }));
    },
    enabled: !!planId,
    staleTime: 0, // Toujours récupérer les dernières données
  });
};

/**
 * Hook pour supprimer un plan de manière sécurisée
 */
export const useDeletePlanSafely = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      planId,
      force = false,
      reason,
    }: {
      planId: string;
      force?: boolean;
      reason?: string;
    }): Promise<DeletionResult> => {
      if (!user?.id) {
        throw new Error('Utilisateur non authentifié');
      }

      const { data, error } = await supabase.rpc('delete_plan_safely', {
        p_plan_id: planId,
        p_user_id: user.id,
        p_force: force,
        p_reason: reason || null,
      });

      if (error) {
        console.error('Erreur suppression plan:', error);
        throw error;
      }

      const result = data?.[0];
      if (!result) {
        throw new Error('Aucun résultat retourné');
      }

      return {
        success: result.success,
        deletionType: result.deletion_type,
        message: result.message,
        dependenciesRemoved: result.dependencies_removed,
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['plan-stats'] });
      queryClient.invalidateQueries({ queryKey: ['all-plans-with-content'] });

      if (result.success) {
        toast({
          title: 'Suppression réussie',
          description: result.message,
          variant: 'default',
        });
      } else {
        toast({
          title: 'Suppression bloquée',
          description: result.message,
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue lors de la suppression',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour archiver un plan (soft delete)
 */
export const useArchivePlan = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      planId,
      reason,
    }: {
      planId: string;
      reason?: string;
    }): Promise<DeletionResult> => {
      if (!user?.id) {
        throw new Error('Utilisateur non authentifié');
      }

      const { data, error } = await supabase.rpc('archive_plan', {
        p_plan_id: planId,
        p_user_id: user.id,
        p_reason: reason || null,
      });

      if (error) {
        console.error('Erreur archivage plan:', error);
        throw error;
      }

      const result = data?.[0];
      if (!result) {
        throw new Error('Aucun résultat retourné');
      }

      return {
        success: result.success,
        deletionType: 'soft',
        message: result.message,
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['plan-stats'] });
      queryClient.invalidateQueries({ queryKey: ['all-plans-with-content'] });

      toast({
        title: result.success ? 'Archivage réussi' : 'Erreur',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue lors de l\'archivage',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour restaurer un plan archivé
 */
export const useRestorePlan = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (planId: string): Promise<DeletionResult> => {
      if (!user?.id) {
        throw new Error('Utilisateur non authentifié');
      }

      const { data, error } = await supabase.rpc('restore_plan', {
        p_plan_id: planId,
        p_user_id: user.id,
      });

      if (error) {
        console.error('Erreur restauration plan:', error);
        throw error;
      }

      const result = data?.[0];
      if (!result) {
        throw new Error('Aucun résultat retourné');
      }

      return {
        success: result.success,
        deletionType: 'soft',
        message: result.message,
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['plan-stats'] });
      queryClient.invalidateQueries({ queryKey: ['all-plans-with-content'] });

      toast({
        title: result.success ? 'Restauration réussie' : 'Erreur',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue lors de la restauration',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour récupérer l'historique des suppressions
 */
export const useDeletionLogs = (tableName: string = 'subscription_plans') => {
  return useQuery({
    queryKey: ['deletion-logs', tableName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deletion_logs')
        .select(`
          id,
          table_name,
          record_id,
          record_data,
          deleted_by,
          deleted_at,
          deletion_type,
          reason,
          dependencies_count
        `)
        .eq('table_name', tableName)
        .order('deleted_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Erreur récupération logs:', error);
        throw error;
      }

      return data || [];
    },
    staleTime: 60 * 1000, // 1 minute
  });
};

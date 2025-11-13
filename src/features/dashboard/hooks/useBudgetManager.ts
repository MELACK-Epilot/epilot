/**
 * Hook pour la gestion des budgets
 * @module useBudgetManager
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  alertCreated,
  alertUpdated,
  alertDeleted,
  alertOperationFailed,
} from '@/lib/alerts';

interface Budget {
  id?: string;
  school_group_id: string;
  category: string;
  amount: number;
  year: number;
}

export const useBudgetManager = (schoolGroupId?: string) => {
  const queryClient = useQueryClient();

  // Récupérer les budgets
  const { data: budgets, isLoading } = useQuery({
    queryKey: ['budgets', schoolGroupId],
    queryFn: async () => {
      let query = supabase
        .from('budgets')
        .select('*')
        .eq('year', new Date().getFullYear());

      if (schoolGroupId) {
        query = query.eq('school_group_id', schoolGroupId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!schoolGroupId,
  });

  // Créer un budget
  const createBudget = useMutation({
    mutationFn: async (budget: Budget) => {
      const { data, error } = await supabase
        .from('budgets')
        .insert(budget)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      alertCreated('Budget', `Budget ${(data as any).category || 'Budget'}`);
    },
    onError: (error: any) => {
      alertOperationFailed('créer', 'le budget', error.message);
    },
  });

  // Mettre à jour un budget
  const updateBudget = useMutation({
    mutationFn: async ({ id, ...budget }: Budget & { id: string }) => {
      const { data, error } = await supabase
        .from('budgets')
        .update(budget)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      alertUpdated('Budget', `Budget ${(data as any).category || 'Budget'}`);
    },
    onError: (error: any) => {
      alertOperationFailed('modifier', 'le budget', error.message);
    },
  });

  // Supprimer un budget
  const deleteBudget = useMutation({
    mutationFn: async (budgetId: string) => {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', budgetId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      alertDeleted('Budget', 'Budget');
    },
    onError: (error: any) => {
      alertOperationFailed('supprimer', 'le budget', error.message);
    },
  });

  // Calculer les alertes
  const calculateAlerts = (budgets: Budget[], expenses: any[]) => {
    const alerts: Array<{ category: string; percentage: number; message: string }> = [];

    budgets.forEach(budget => {
      const spent = expenses
        .filter(e => e.category === budget.category)
        .reduce((sum, e) => sum + e.amount, 0);

      const percentage = (spent / budget.amount) * 100;

      if (percentage >= 100) {
        alerts.push({
          category: budget.category,
          percentage,
          message: `Budget dépassé de ${(percentage - 100).toFixed(0)}%`,
        });
      } else if (percentage >= 80) {
        alerts.push({
          category: budget.category,
          percentage,
          message: `Attention : ${percentage.toFixed(0)}% du budget utilisé`,
        });
      }
    });

    return alerts;
  };

  // Obtenir des recommandations
  const getRecommendations = (budgets: Budget[], expenses: any[]) => {
    const recommendations: string[] = [];

    budgets.forEach(budget => {
      const spent = expenses
        .filter(e => e.category === budget.category)
        .reduce((sum, e) => sum + e.amount, 0);

      const percentage = (spent / budget.amount) * 100;

      if (percentage >= 90) {
        recommendations.push(
          `Envisagez d'augmenter le budget ${budget.category} pour l'année prochaine`
        );
      } else if (percentage < 50) {
        recommendations.push(
          `Le budget ${budget.category} semble surestimé, vous pourriez le réduire`
        );
      }
    });

    return recommendations;
  };

  return {
    budgets,
    isLoading,
    createBudget: createBudget.mutateAsync,
    updateBudget: updateBudget.mutateAsync,
    deleteBudget: deleteBudget.mutateAsync,
    calculateAlerts,
    getRecommendations,
    isPending: createBudget.isPending || updateBudget.isPending || deleteBudget.isPending,
  };
};

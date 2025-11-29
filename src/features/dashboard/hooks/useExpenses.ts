/**
 * Hooks pour la gestion des dépenses
 * Données dynamiques et temps réel
 * @module useExpenses
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export const expenseKeys = {
  all: ['expenses'] as const,
  lists: () => [...expenseKeys.all, 'list'] as const,
  list: (filters: any) => [...expenseKeys.lists(), filters] as const,
  stats: () => [...expenseKeys.all, 'stats'] as const,
  categories: () => [...expenseKeys.all, 'categories'] as const,
  monthly: () => [...expenseKeys.all, 'monthly'] as const,
};

/**
 * Hook pour écouter les changements en temps réel sur les dépenses
 */
export const useExpensesRealtime = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('expenses-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses' },
        () => {
          // Invalider toutes les queries liées aux dépenses
          queryClient.invalidateQueries({ queryKey: expenseKeys.all });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};

/**
 * Hook pour récupérer la liste des dépenses
 */
interface UseExpensesFilters {
  query?: string;
  category?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export const useExpenses = (filters: UseExpensesFilters = {}) => {
  return useQuery({
    queryKey: expenseKeys.list(filters),
    queryFn: async () => {
      // @ts-expect-error - Vue expenses_enriched créée par les scripts SQL
      let query = supabase
        .from('expenses_enriched')
        .select('*')
        .order('date', { ascending: false });

      // Filtre par recherche
      if (filters.query) {
        query = query.or(`description.ilike.%${filters.query}%,reference.ilike.%${filters.query}%`);
      }

      // Filtre par catégorie
      if (filters.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }

      // Filtre par statut
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // Filtre par date de début
      if (filters.startDate) {
        query = query.gte('date', filters.startDate);
      }

      // Filtre par date de fin
      if (filters.endDate) {
        query = query.lte('date', filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook pour récupérer les statistiques des dépenses
 */
export const useExpenseStats = () => {
  return useQuery({
    queryKey: expenseKeys.stats(),
    queryFn: async () => {
      // @ts-expect-error - Vue expense_statistics créée par les scripts SQL
      const { data, error } = await supabase
        .from('expense_statistics')
        .select('*')
        .single();

      if (error) {
        console.warn('Erreur récupération stats dépenses:', error);
        return {
          total: 0,
          pending: 0,
          paid: 0,
          cancelled: 0,
          count: 0,
          thisMonth: 0,
        };
      }

      return {
        total: data?.total_amount || 0,
        pending: data?.pending_amount || 0,
        paid: data?.paid_amount || 0,
        cancelled: data?.cancelled_amount || 0,
        count: data?.total_expenses || 0,
        thisMonth: data?.current_month_amount || 0,
        pendingCount: data?.pending_count || 0,
        paidCount: data?.paid_count || 0,
        cancelledCount: data?.cancelled_count || 0,
        overdueCount: data?.overdue_count || 0,
        averageExpense: data?.average_expense || 0,
        paymentRate: data?.payment_rate || 0,
      };
    },
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Hook pour créer une dépense
 */
export const useCreateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expense: any) => {
      const { data, error } = await supabase
        .from('expenses')
        .insert([{
          school_group_id: expense.schoolGroupId,
          amount: expense.amount,
          category: expense.category,
          description: expense.description,
          date: expense.date,
          payment_method: expense.paymentMethod,
          status: expense.status || 'pending',
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
    },
  });
};

/**
 * Hook pour mettre à jour une dépense
 */
export const useUpdateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...expense }: any) => {
      const { data, error } = await supabase
        .from('expenses')
        .update({
          amount: expense.amount,
          category: expense.category,
          description: expense.description,
          date: expense.date,
          payment_method: expense.paymentMethod,
          status: expense.status,
          notes: expense.notes,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
    },
  });
};

/**
 * Hook pour supprimer une dépense
 */
export const useDeleteExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
    },
  });
};

/**
 * Hook pour récupérer les dépenses par catégorie (dynamique)
 */
export const useExpensesByCategory = () => {
  return useQuery({
    queryKey: expenseKeys.categories(),
    queryFn: async () => {
      // @ts-expect-error - Vue expenses_by_category créée par SQL
      const { data, error } = await supabase
        .from('expenses_by_category')
        .select('*');

      if (error) {
        console.warn('Erreur récupération catégories:', error);
        return [];
      }

      return data || [];
    },
    staleTime: 30 * 1000, // 30 secondes pour données plus fraîches
  });
};

/**
 * Hook pour récupérer les dépenses mensuelles (dynamique)
 */
export const useExpensesMonthly = () => {
  return useQuery({
    queryKey: expenseKeys.monthly(),
    queryFn: async () => {
      // @ts-expect-error - Vue expenses_monthly créée par SQL
      const { data, error } = await supabase
        .from('expenses_monthly')
        .select('*')
        .order('month', { ascending: false })
        .limit(6);

      if (error) {
        console.warn('Erreur récupération mensuel:', error);
        return [];
      }

      return (data || []).reverse();
    },
    staleTime: 30 * 1000, // 30 secondes
  });
};

export default useExpenses;

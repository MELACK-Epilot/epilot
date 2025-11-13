/**
 * Hook pour récupérer les statistiques de l'année précédente (N-1)
 * Permet la comparaison avec l'année en cours
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface PreviousYearStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  totalOverdue: number;
  globalRecoveryRate: number;
  totalSchools: number;
}

/**
 * Récupère les statistiques financières de l'année précédente pour le groupe
 */
export const usePreviousYearGroupStats = () => {
  return useQuery({
    queryKey: ['previousYearGroupStats'],
    queryFn: async (): Promise<PreviousYearStats> => {
      // Calculer les dates pour l'année N-1
      const now = new Date();
      const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
      const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);

      // Récupérer les paiements de l'année N-1
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount, payment_date, status')
        .gte('payment_date', lastYearStart.toISOString())
        .lte('payment_date', lastYearEnd.toISOString());

      if (paymentsError) throw paymentsError;

      // Récupérer les dépenses de l'année N-1
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('amount, expense_date')
        .gte('expense_date', lastYearStart.toISOString())
        .lte('expense_date', lastYearEnd.toISOString());

      if (expensesError) throw expensesError;

      // Calculer les totaux
      const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      const totalExpenses = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      // Calculer les retards
      const overduePayments = payments?.filter(p => p.status === 'overdue') || [];
      const totalOverdue = overduePayments.reduce((sum, p) => sum + (p.amount || 0), 0);

      // Calculer le taux de recouvrement
      const paidPayments = payments?.filter(p => p.status === 'paid') || [];
      const totalPaid = paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const globalRecoveryRate = totalRevenue > 0 ? (totalPaid / totalRevenue) * 100 : 0;

      // Compter les écoles actives
      const { count: schoolsCount } = await supabase
        .from('schools')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      return {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        totalOverdue,
        globalRecoveryRate,
        totalSchools: schoolsCount || 0,
      };
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 heure
  });
};

/**
 * Récupère les statistiques financières de l'année précédente pour une école
 */
export const usePreviousYearSchoolStats = (schoolId: string) => {
  return useQuery({
    queryKey: ['previousYearSchoolStats', schoolId],
    queryFn: async (): Promise<PreviousYearStats> => {
      const now = new Date();
      const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
      const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);

      // Récupérer les paiements de l'école pour N-1
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount, payment_date, status')
        .eq('school_id', schoolId)
        .gte('payment_date', lastYearStart.toISOString())
        .lte('payment_date', lastYearEnd.toISOString());

      if (paymentsError) throw paymentsError;

      // Récupérer les dépenses de l'école pour N-1
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('amount, expense_date')
        .eq('school_id', schoolId)
        .gte('expense_date', lastYearStart.toISOString())
        .lte('expense_date', lastYearEnd.toISOString());

      if (expensesError) throw expensesError;

      const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      const totalExpenses = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      const overduePayments = payments?.filter(p => p.status === 'overdue') || [];
      const totalOverdue = overduePayments.reduce((sum, p) => sum + (p.amount || 0), 0);

      const paidPayments = payments?.filter(p => p.status === 'paid') || [];
      const totalPaid = paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const globalRecoveryRate = totalRevenue > 0 ? (totalPaid / totalRevenue) * 100 : 0;

      return {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        totalOverdue,
        globalRecoveryRate,
        totalSchools: 1,
      };
    },
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    enabled: !!schoolId,
  });
};

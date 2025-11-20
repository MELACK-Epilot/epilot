/**
 * Hook pour récupérer les revenus mensuels réels
 * Utilise la vue financial_stats et fee_payments
 * @module useMonthlyRevenue
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface MonthlyRevenueData {
  month: string;
  revenue: number;
  target: number;
  expenses: number;
  profit: number;
}

export interface MonthlyRevenueStats {
  data: MonthlyRevenueData[];
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  achievement: number;
}

export const useMonthlyRevenue = (months: number = 6) => {
  return useQuery({
    queryKey: ['monthly-revenue', months],
    queryFn: async (): Promise<MonthlyRevenueStats> => {
      try {
        // Récupérer les revenus mensuels depuis fee_payments
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);

        const { data: payments, error: paymentsError } = await supabase
          .from('fee_payments')
          .select('amount, payment_date, status')
          .gte('payment_date', startDate.toISOString())
          .in('status', ['completed', 'pending']);

        if (paymentsError) throw paymentsError;

        // Récupérer les dépenses mensuelles depuis expenses
        const { data: expenses, error: expensesError } = await supabase
          .from('expenses')
          .select('amount, date, status')
          .gte('date', startDate.toISOString())
          .in('status', ['paid', 'pending']);

        if (expensesError) throw expensesError;

        // Organiser par mois
        const monthsData: { [key: string]: MonthlyRevenueData } = {};
        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        
        // Initialiser les mois
        for (let i = 0; i < months; i++) {
          const date = new Date();
          date.setMonth(date.getMonth() - months + i + 1);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const monthName = monthNames[date.getMonth()];
          
          monthsData[monthKey] = {
            month: monthName,
            revenue: 0,
            target: 12000000, // 12M FCFA par mois (objectif)
            expenses: 0,
            profit: 0,
          };
        }

        // Agréger les revenus
        payments?.forEach((payment: any) => {
          const date = new Date(payment.payment_date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (monthsData[monthKey]) {
            monthsData[monthKey].revenue += payment.amount || 0;
          }
        });

        // Agréger les dépenses
        expenses?.forEach((expense: any) => {
          const date = new Date(expense.date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (monthsData[monthKey]) {
            monthsData[monthKey].expenses += expense.amount || 0;
          }
        });

        // Calculer les profits
        Object.values(monthsData).forEach(month => {
          month.profit = month.revenue - month.expenses;
        });

        // Convertir en tableau
        const data = Object.values(monthsData);

        // Calculer les totaux
        const totalRevenue = data.reduce((sum, m) => sum + m.revenue, 0);
        const totalExpenses = data.reduce((sum, m) => sum + m.expenses, 0);
        const totalProfit = data.reduce((sum, m) => sum + m.profit, 0);
        const totalTarget = data.reduce((sum, m) => sum + m.target, 0);
        const achievement = totalTarget > 0 ? (totalRevenue / totalTarget) * 100 : 0;

        return {
          data,
          totalRevenue,
          totalExpenses,
          totalProfit,
          achievement,
        };
      } catch (error) {
        console.error('❌ Erreur lors de la récupération des revenus mensuels:', error);
        
        // ✅ CORRECTION: Laisser React Query gérer l'erreur au lieu de retourner des données mockées
        // Cela permettra d'afficher un message d'erreur clair à l'utilisateur
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
};

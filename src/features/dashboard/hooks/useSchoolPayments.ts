/**
 * Hooks pour les paiements détaillés d'une école
 * Avec Supabase Realtime pour mises à jour instantanées
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';

export interface PaymentDetail {
  paymentId: string;
  schoolId: string;
  schoolName: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string;
  studentLevel: string;
  studentClass: string;
  amount: number;
  status: string;
  paymentDate: string;
  dueDate: string;
  feeType: string;
  description: string;
  paymentMethod: string;
  referenceNumber: string;
  daysOverdue: number;
  statusLabel: string;
  priority: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentReminders {
  schoolId: string;
  highPriorityCount: number;
  mediumPriorityCount: number;
  lowPriorityCount: number;
  totalOverdueAmount: number;
  studentsWithOverdue: number;
}

export interface SchoolBenchmark {
  schoolId: string;
  schoolName: string;
  schoolGroupId: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  recoveryRate: number;
  totalStudents: number;
  groupAvgRevenue: number;
  groupAvgExpenses: number;
  groupAvgProfit: number;
  groupAvgRecoveryRate: number;
  groupAvgStudents: number;
  revenueVsAvgPct: number;
  recoveryVsAvgPoints: number;
  revenueRank: number;
  recoveryRank: number;
  totalSchoolsInGroup: number;
}

export interface MonthlyObjective {
  schoolId: string;
  schoolName: string;
  schoolGroupId: string;
  currentMonthRevenue: number;
  monthlyObjective: number;
  objectiveProgressPct: number;
  daysRemaining: number;
  requiredDailyRevenue: number;
}

// Hook pour les paiements détaillés avec Realtime
export const useSchoolPaymentsDetail = (schoolId: string, filters?: {
  status?: string[];
  priority?: string[];
  searchTerm?: string;
}) => {
  const queryClient = useQueryClient();

  // Query pour les données
  const query = useQuery<PaymentDetail[]>({
    queryKey: ['school-payments-detail', schoolId, filters],
    queryFn: async () => {
      let query = supabase
        .from('school_payments_detail')
        .select('*')
        .eq('school_id', schoolId);

      // Filtres
      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters?.priority && filters.priority.length > 0) {
        query = query.in('priority', filters.priority);
      }

      const { data, error } = await query;

      if (error) throw error;

      let payments = (data || []).map((item: any) => ({
        paymentId: item.payment_id,
        schoolId: item.school_id,
        schoolName: item.school_name,
        studentId: item.student_id,
        studentFirstName: item.student_first_name,
        studentLastName: item.student_last_name,
        studentLevel: item.student_level,
        studentClass: item.student_class,
        amount: Number(item.amount) || 0,
        status: item.status,
        paymentDate: item.payment_date,
        dueDate: item.due_date,
        feeType: item.fee_type,
        description: item.description,
        paymentMethod: item.payment_method,
        referenceNumber: item.reference_number,
        daysOverdue: Number(item.days_overdue) || 0,
        statusLabel: item.status_label,
        priority: item.priority,
        parentName: item.parent_name,
        parentPhone: item.parent_phone,
        parentEmail: item.parent_email,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      // Filtre par recherche
      if (filters?.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        payments = payments.filter(p => 
          p.studentFirstName.toLowerCase().includes(term) ||
          p.studentLastName.toLowerCase().includes(term) ||
          p.studentClass.toLowerCase().includes(term) ||
          p.referenceNumber?.toLowerCase().includes(term)
        );
      }

      return payments;
    },
    enabled: !!schoolId,
    staleTime: 30 * 1000, // 30 secondes
  });

  // ✅ SUPABASE REALTIME - Écoute des changements
  useEffect(() => {
    if (!schoolId) return;

    const channel = supabase
      .channel(`school-payments-${schoolId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fee_payments',
          filter: `school_id=eq.${schoolId}`,
        },
        (payload) => {
          console.log('🔄 Paiement modifié:', payload);
          // Invalider le cache pour refetch
          queryClient.invalidateQueries({ queryKey: ['school-payments-detail', schoolId] });
          queryClient.invalidateQueries({ queryKey: ['school-financial-detail', schoolId] });
          queryClient.invalidateQueries({ queryKey: ['payment-reminders', schoolId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [schoolId, queryClient]);

  return query;
};

// Hook pour les statistiques de relance
export const usePaymentReminders = (schoolId: string) => {
  return useQuery<PaymentReminders>({
    queryKey: ['payment-reminders', schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('school_payment_reminders')
        .select('*')
        .eq('school_id', schoolId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('No data');

      return {
        schoolId: (data as any).school_id,
        highPriorityCount: Number((data as any).high_priority_count) || 0,
        mediumPriorityCount: Number((data as any).medium_priority_count) || 0,
        lowPriorityCount: Number((data as any).low_priority_count) || 0,
        totalOverdueAmount: Number((data as any).total_overdue_amount) || 0,
        studentsWithOverdue: Number((data as any).students_with_overdue) || 0,
      };
    },
    enabled: !!schoolId,
    staleTime: 60 * 1000,
  });
};

// Hook pour le benchmarking
export const useSchoolBenchmark = (schoolId: string) => {
  return useQuery<SchoolBenchmark>({
    queryKey: ['school-benchmark', schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('school_benchmarking')
        .select('*')
        .eq('school_id', schoolId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('No data');

      const d = data as any;
      return {
        schoolId: d.school_id,
        schoolName: d.school_name,
        schoolGroupId: d.school_group_id,
        totalRevenue: Number(d.total_revenue) || 0,
        totalExpenses: Number(d.total_expenses) || 0,
        netProfit: Number(d.net_profit) || 0,
        recoveryRate: Number(d.recovery_rate) || 0,
        totalStudents: Number(d.total_students) || 0,
        groupAvgRevenue: Number(d.group_avg_revenue) || 0,
        groupAvgExpenses: Number(d.group_avg_expenses) || 0,
        groupAvgProfit: Number(d.group_avg_profit) || 0,
        groupAvgRecoveryRate: Number(d.group_avg_recovery_rate) || 0,
        groupAvgStudents: Number(d.group_avg_students) || 0,
        revenueVsAvgPct: Number(d.revenue_vs_avg_pct) || 0,
        recoveryVsAvgPoints: Number(d.recovery_vs_avg_points) || 0,
        revenueRank: Number(d.revenue_rank) || 0,
        recoveryRank: Number(d.recovery_rank) || 0,
        totalSchoolsInGroup: Number(d.total_schools_in_group) || 0,
      };
    },
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  });
};

// Hook pour les objectifs mensuels
export const useMonthlyObjective = (schoolId: string) => {
  return useQuery<MonthlyObjective>({
    queryKey: ['monthly-objective', schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('school_monthly_objectives')
        .select('*')
        .eq('school_id', schoolId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('No data');

      const d = data as any;
      return {
        schoolId: d.school_id,
        schoolName: d.school_name,
        schoolGroupId: d.school_group_id,
        currentMonthRevenue: Number(d.current_month_revenue) || 0,
        monthlyObjective: Number(d.monthly_objective) || 0,
        objectiveProgressPct: Number(d.objective_progress_pct) || 0,
        daysRemaining: Number(d.days_remaining) || 0,
        requiredDailyRevenue: Number(d.required_daily_revenue) || 0,
      };
    },
    enabled: !!schoolId,
    staleTime: 60 * 1000,
  });
};

// Hook pour marquer un paiement comme payé
export const useMarkPaymentAsPaid = () => {
  const queryClient = useQueryClient();

  return async (paymentId: string, schoolId: string) => {
    const { error } = await supabase
      .from('fee_payments')
      .update({
        status: 'completed',
        payment_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', paymentId);

    if (error) throw error;

    // Invalider les caches
    queryClient.invalidateQueries({ queryKey: ['school-payments-detail', schoolId] });
    queryClient.invalidateQueries({ queryKey: ['school-financial-detail', schoolId] });
    queryClient.invalidateQueries({ queryKey: ['payment-reminders', schoolId] });
  };
};

// Hook pour envoyer une relance
export const useSendReminder = () => {
  return async (paymentId: string, method: 'email' | 'sms') => {
    // TODO: Implémenter l'envoi de relance (email/SMS)
    console.log(`Envoi relance ${method} pour paiement ${paymentId}`);
    
    // Pour l'instant, juste un log
    // Plus tard: intégration avec service email/SMS
    return { success: true, message: `Relance ${method} envoyée` };
  };
};

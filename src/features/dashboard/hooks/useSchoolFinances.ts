/**
 * Hooks pour les finances d'une école spécifique
 * Utilisé par Admin Groupe pour voir les détails d'une école
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface SchoolFinancialDetail {
  schoolId: string;
  schoolName: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  overdueAmount: number;
  pendingAmount: number;
  recoveryRate: number;
  totalStudents: number;
}

export interface LevelFinancialDetail {
  schoolId: string;
  schoolName: string;
  level: string;
  totalRevenue: number;
  overdueAmount: number;
  overdueCount: number;
  recoveryRate: number;
  totalStudents: number;
  revenuePerStudent: number;
}

export const useSchoolFinancialDetail = (schoolId: string) => {
  return useQuery<SchoolFinancialDetail>({
    queryKey: ['school-financial-detail', schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('school_financial_stats')
        .select('*')
        .eq('school_id', schoolId)
        .single();

      if (error) throw error;

      return {
        schoolId: data.school_id,
        schoolName: data.school_name,
        totalRevenue: Number(data.total_revenue) || 0,
        totalExpenses: Number(data.total_expenses) || 0,
        netProfit: Number(data.net_profit) || 0,
        overdueAmount: Number(data.overdue_amount) || 0,
        pendingAmount: Number(data.pending_amount) || 0,
        recoveryRate: Number(data.recovery_rate) || 0,
        totalStudents: Number(data.total_students) || 0,
      };
    },
    enabled: !!schoolId,
    staleTime: 60 * 1000,
  });
};

export const useSchoolLevelStats = (schoolId: string) => {
  return useQuery<LevelFinancialDetail[]>({
    queryKey: ['school-level-stats', schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('level_financial_stats')
        .select('*')
        .eq('school_id', schoolId)
        .order('level');

      if (error) throw error;

      return (data || []).map((item: any) => ({
        schoolId: item.school_id,
        schoolName: item.school_name,
        level: item.level,
        totalRevenue: Number(item.total_revenue) || 0,
        overdueAmount: Number(item.overdue_amount) || 0,
        overdueCount: Number(item.overdue_count) || 0,
        recoveryRate: Number(item.recovery_rate) || 0,
        totalStudents: Number(item.total_students) || 0,
        revenuePerStudent: Number(item.revenue_per_student) || 0,
      }));
    },
    enabled: !!schoolId,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Hook pour récupérer les statistiques réelles de l'école
 * Connecté aux vraies tables Supabase
 * React 19 Best Practices + React Query
 * 
 * @module useRealSchoolStats
 */

import { useQuery, useQueries } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from './useCurrentUser';

/**
 * Type pour les statistiques globales
 */
export interface SchoolStats {
  total_students: number;
  active_students: number;
  total_teachers: number;
  active_teachers: number;
  total_classes: number;
  active_classes: number;
  total_revenue: number;
  monthly_revenue: number;
  pending_payments: number;
  overdue_payments: number;
  satisfaction_rate: number;
  last_updated: string;
}

/**
 * Hook pour les statistiques globales de l'école
 */
export const useSchoolStats = () => {
  const { data: user } = useCurrentUser();
  
  return useQuery({
    queryKey: ['school-stats', user?.schoolId],
    queryFn: async (): Promise<SchoolStats> => {
      if (!user?.schoolId) {
        throw new Error('School ID required');
      }

      // Récupérer les statistiques depuis la vue matérialisée
      const { data, error } = await supabase
        .from('school_statistics')
        .select('*')
        .eq('school_id', user.schoolId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('No statistics found');

      return {
        total_students: data.total_students || 0,
        active_students: data.active_students || 0,
        total_teachers: data.total_teachers || 0,
        active_teachers: data.active_teachers || 0,
        total_classes: data.total_classes || 0,
        active_classes: data.active_classes || 0,
        total_revenue: data.total_revenue || 0,
        monthly_revenue: data.monthly_revenue || 0,
        pending_payments: data.pending_payments || 0,
        overdue_payments: data.overdue_payments || 0,
        satisfaction_rate: data.satisfaction_rate || 0,
        last_updated: data.last_updated || new Date().toISOString()
      };
    },
    enabled: !!user?.schoolId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Type pour les revenus
 */
export interface RevenueStats {
  total_amount: number;
  this_month: number;
  last_month: number;
  growth_rate: number;
  pending_amount: number;
  overdue_amount: number;
}

/**
 * Hook pour les statistiques financières
 */
export const useRevenueStats = () => {
  const { data: user } = useCurrentUser();
  
  return useQuery({
    queryKey: ['revenue-stats', user?.schoolId],
    queryFn: async (): Promise<RevenueStats> => {
      if (!user?.schoolId) {
        throw new Error('School ID required');
      }

      // Récupérer depuis la vue financière
      const { data, error } = await supabase
        .from('financial_overview')
        .select('*')
        .eq('school_id', user.schoolId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('No financial data found');

      return {
        total_amount: data.total_amount || 0,
        this_month: data.this_month || 0,
        last_month: data.last_month || 0,
        growth_rate: data.growth_rate || 0,
        pending_amount: data.pending_amount || 0,
        overdue_amount: data.overdue_amount || 0
      };
    },
    enabled: !!user?.schoolId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Type pour les élèves
 */
export interface StudentStats {
  total: number;
  active: number;
  new_this_month: number;
  average_grade: number;
  attendance_rate: number;
}

/**
 * Hook pour les statistiques élèves
 */
export const useStudentStats = () => {
  const { data: user } = useCurrentUser();
  
  return useQuery({
    queryKey: ['student-stats', user?.schoolId],
    queryFn: async (): Promise<StudentStats> => {
      if (!user?.schoolId) {
        throw new Error('School ID required');
      }

      // Récupérer depuis la vue élèves
      const { data, error } = await supabase
        .from('student_overview')
        .select('*')
        .eq('school_id', user.schoolId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('No student data found');

      return {
        total: data.total || 0,
        active: data.active || 0,
        new_this_month: data.new_this_month || 0,
        average_grade: data.average_grade || 0,
        attendance_rate: data.attendance_rate || 0
      };
    },
    enabled: !!user?.schoolId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Type pour le personnel
 */
export interface StaffStats {
  total: number;
  active: number;
  new_this_month: number;
  average_satisfaction: number;
}

/**
 * Hook pour les statistiques personnel
 */
export const useStaffStats = () => {
  const { data: user } = useCurrentUser();
  
  return useQuery({
    queryKey: ['staff-stats', user?.schoolId],
    queryFn: async (): Promise<StaffStats> => {
      if (!user?.schoolId) {
        throw new Error('School ID required');
      }

      // Récupérer depuis la vue personnel
      const { data, error } = await supabase
        .from('staff_overview')
        .select('*')
        .eq('school_id', user.schoolId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('No staff data found');

      return {
        total: data.total || 0,
        active: data.active || 0,
        new_this_month: data.new_this_month || 0,
        average_satisfaction: data.average_satisfaction || 0
      };
    },
    enabled: !!user?.schoolId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook combiné pour toutes les statistiques
 * Optimisé avec useQueries pour parallélisation
 */
export const useAllSchoolStats = () => {
  const { data: user } = useCurrentUser();
  
  const queries = [
    {
      queryKey: ['school-stats', user?.schoolId],
      queryFn: async () => {
        if (!user?.schoolId) throw new Error('School ID required');
        
        const { data, error } = await supabase
          .from('school_statistics')
          .select('*')
          .eq('school_id', user.schoolId)
          .single();
        
        if (error) throw error;
        return data;
      },
      enabled: !!user?.schoolId
    },
    {
      queryKey: ['revenue-stats', user?.schoolId],
      queryFn: async () => {
        if (!user?.schoolId) throw new Error('School ID required');
        
        const { data, error } = await supabase
          .from('financial_overview')
          .select('*')
          .eq('school_id', user.schoolId)
          .single();
        
        if (error) throw error;
        return data;
      },
      enabled: !!user?.schoolId
    },
    {
      queryKey: ['student-stats', user?.schoolId],
      queryFn: async () => {
        if (!user?.schoolId) throw new Error('School ID required');
        
        const { data, error } = await supabase
          .from('student_overview')
          .select('*')
          .eq('school_id', user.schoolId)
          .single();
        
        if (error) throw error;
        return data;
      },
      enabled: !!user?.schoolId
    },
    {
      queryKey: ['staff-stats', user?.schoolId],
      queryFn: async () => {
        if (!user?.schoolId) throw new Error('School ID required');
        
        const { data, error } = await supabase
          .from('staff_overview')
          .select('*')
          .eq('school_id', user.schoolId)
          .single();
        
        if (error) throw error;
        return data;
      },
      enabled: !!user?.schoolId
    }
  ];
  
  return useQueries({ queries });
};

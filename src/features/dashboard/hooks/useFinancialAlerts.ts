/**
 * Hooks pour le système d'alertes financières
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/store/auth.store';

export interface FinancialAlert {
  id: string;
  schoolGroupId: string;
  schoolId: string | null;
  alertType: 'critical' | 'warning' | 'info';
  category: 'treasury' | 'overdue' | 'margin' | 'expense' | 'revenue' | 'trend';
  title: string;
  message: string;
  severity: number;
  thresholdValue: number | null;
  currentValue: number | null;
  isRead: boolean;
  isResolved: boolean;
  resolvedAt: string | null;
  createdAt: string;
}

/**
 * Hook pour récupérer les alertes financières
 */
export const useFinancialAlerts = (options?: { resolved?: boolean; schoolId?: string }) => {
  const { user } = useAuth();

  return useQuery<FinancialAlert[]>({
    queryKey: ['financial-alerts', user?.schoolGroupId, options],
    queryFn: async () => {
      if (!user?.schoolGroupId) return [];

      let query = supabase
        .from('financial_alerts')
        .select('*')
        .eq('school_group_id', user.schoolGroupId)
        .order('severity', { ascending: false })
        .order('created_at', { ascending: false });

      if (options?.resolved !== undefined) {
        query = query.eq('is_resolved', options.resolved);
      }

      if (options?.schoolId) {
        query = query.eq('school_id', options.schoolId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((alert: any) => ({
        id: alert.id,
        schoolGroupId: alert.school_group_id,
        schoolId: alert.school_id,
        alertType: alert.alert_type,
        category: alert.category,
        title: alert.title,
        message: alert.message,
        severity: alert.severity,
        thresholdValue: alert.threshold_value,
        currentValue: alert.current_value,
        isRead: alert.is_read,
        isResolved: alert.is_resolved,
        resolvedAt: alert.resolved_at,
        createdAt: alert.created_at,
      }));
    },
    enabled: !!user?.schoolGroupId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook pour marquer une alerte comme lue
 */
export const useMarkAlertAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('financial_alerts')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-alerts'] });
    },
  });
};

/**
 * Hook pour résoudre une alerte
 */
export const useResolveAlert = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ alertId, notes }: { alertId: string; notes?: string }) => {
      const { data, error } = await supabase.rpc('resolve_financial_alert', {
        p_alert_id: alertId,
        p_resolved_by: user?.id,
        p_resolution_notes: notes || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-alerts'] });
    },
  });
};

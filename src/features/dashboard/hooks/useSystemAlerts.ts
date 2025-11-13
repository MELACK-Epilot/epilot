/**
 * Hook pour gérer les alertes système
 * @module useSystemAlerts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const alertKeys = {
  all: ['alerts'] as const,
  lists: () => [...alertKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...alertKeys.lists(), filters] as const,
  unread: () => [...alertKeys.all, 'unread'] as const,
  count: () => [...alertKeys.all, 'count'] as const,
};

interface AlertFilters {
  type?: string;
  severity?: string;
  isRead?: boolean;
}

/**
 * Hook pour récupérer toutes les alertes
 */
export const useSystemAlerts = (filters?: AlertFilters) => {
  return useQuery({
    queryKey: alertKeys.list(filters || {}),
    queryFn: async () => {
      let query = supabase
        .from('system_alerts')
        .select('*')
        .is('resolved_at', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (filters?.type) {
        query = query.eq('alert_type', filters.type);
      }

      if (filters?.severity) {
        query = query.eq('severity', filters.severity);
      }

      if (filters?.isRead !== undefined) {
        query = query.eq('is_read', filters.isRead);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Erreur lors de la récupération des alertes:', error);
        return [];
      }

      return data || [];
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Refetch toutes les 2 minutes
  });
};

/**
 * Hook pour récupérer les alertes non lues
 */
export const useUnreadAlerts = () => {
  return useQuery({
    queryKey: alertKeys.unread(),
    queryFn: async () => {
      // @ts-ignore - Vue unread_alerts sera créée par les scripts SQL
      const { data, error } = await supabase
        .from('unread_alerts')
        .select('*');

      if (error) {
        console.warn('Vue unread_alerts non disponible:', error);
        return [];
      }

      return data || [];
    },
    staleTime: 30 * 1000, // 30 secondes
    refetchInterval: 60 * 1000, // Refetch toutes les minutes
  });
};

/**
 * Hook pour compter les alertes non lues
 */
export const useUnreadAlertsCount = () => {
  return useQuery({
    queryKey: alertKeys.count(),
    queryFn: async () => {
      // @ts-ignore - Table system_alerts sera créée par les scripts SQL
      const { count, error } = await supabase
        .from('system_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
        .is('resolved_at', null);

      if (error) {
        console.warn('Erreur lors du comptage des alertes:', error);
        return 0;
      }

      return count || 0;
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
};

/**
 * Hook pour marquer une alerte comme lue
 */
export const useMarkAlertAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { data, error } = await supabase
        .from('system_alerts')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', alertId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertKeys.all });
    },
  });
};

/**
 * Hook pour marquer toutes les alertes comme lues
 */
export const useMarkAllAlertsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // @ts-ignore - Table system_alerts sera créée par les scripts SQL
      const { error } = await supabase
        .from('system_alerts')
        // @ts-ignore
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertKeys.all });
    },
  });
};

/**
 * Hook pour résoudre une alerte
 */
export const useResolveAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      // @ts-ignore - Table system_alerts sera créée par les scripts SQL
      const { data, error } = await supabase
        .from('system_alerts')
        // @ts-ignore
        .update({
          resolved_at: new Date().toISOString(),
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', alertId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertKeys.all });
    },
  });
};

/**
 * Hook pour créer une alerte manuelle
 */
export const useCreateAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alert: {
      type: string;
      severity: string;
      title: string;
      message: string;
      entity_type?: string;
      entity_id?: string;
      entity_name?: string;
      action_required?: boolean;
      action_url?: string;
    }) => {
      // @ts-ignore - Table system_alerts sera créée par les scripts SQL
      const { data, error } = await supabase
        .from('system_alerts')
        // @ts-ignore
        .insert([alert])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertKeys.all });
    },
  });
};

export default useSystemAlerts;

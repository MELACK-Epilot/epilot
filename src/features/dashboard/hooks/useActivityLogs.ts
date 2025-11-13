/**
 * Hook pour gérer les Logs d'Activité
 * Version optimisée React 19 avec meilleures pratiques
 * @module useActivityLogs
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ActivityLog } from '../types/dashboard.types';

/**
 * Clés de requête pour React Query
 */
export const activityLogKeys = {
  all: ['activity-logs'] as const,
  lists: () => [...activityLogKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...activityLogKeys.lists(), filters] as const,
  details: () => [...activityLogKeys.all, 'detail'] as const,
  detail: (id: string) => [...activityLogKeys.details(), id] as const,
  stats: () => [...activityLogKeys.all, 'stats'] as const,
};

/**
 * Interface pour les filtres de recherche
 */
export interface ActivityLogFilters {
  query?: string;
  userId?: string;
  action?: string;
  entity?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Hook pour récupérer la liste des logs d'activité
 */
export const useActivityLogs = (filters?: ActivityLogFilters) => {
  return useQuery({
    queryKey: activityLogKeys.list(filters || {}),
    queryFn: async () => {
      // @ts-ignore - Supabase types are strict, but this works at runtime
      let query = supabase
        .from('activity_logs')
        .select(`
          *,
          user:user_id (
            id,
            first_name,
            last_name,
            role
          )
        `)
        .order('timestamp', { ascending: false })
        .limit(100); // Limiter à 100 logs récents

      // Filtres
      if (filters?.query) {
        query = query.or(`action.ilike.%${filters.query}%,entity.ilike.%${filters.query}%,details.ilike.%${filters.query}%`);
      }

      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters?.action) {
        query = query.eq('action', filters.action);
      }

      if (filters?.entity) {
        query = query.eq('entity', filters.entity);
      }

      if (filters?.dateFrom) {
        query = query.gte('timestamp', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('timestamp', filters.dateTo);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transformer les données
      return (data || []).map((log: any) => ({
        id: log.id,
        userId: log.user_id,
        userName: log.user ? `${log.user.first_name} ${log.user.last_name}` : 'Système',
        userRole: log.user?.role || 'system',
        action: log.action,
        entity: log.entity,
        entityId: log.entity_id,
        details: log.details,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        timestamp: log.timestamp,
      })) as ActivityLog[];
    },
    staleTime: 1 * 60 * 1000, // 1 minute (logs changent souvent)
  });
};

/**
 * Hook pour récupérer un log par ID
 */
export const useActivityLog = (id: string) => {
  return useQuery({
    queryKey: activityLogKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select(`
          *,
          user:user_id (
            id,
            first_name,
            last_name,
            role
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        userId: data.user_id,
        userName: data.user ? `${data.user.first_name} ${data.user.last_name}` : 'Système',
        userRole: data.user?.role || 'system',
        action: data.action,
        entity: data.entity,
        entityId: data.entity_id,
        details: data.details,
        ipAddress: data.ip_address,
        userAgent: data.user_agent,
        timestamp: data.timestamp,
      } as ActivityLog;
    },
    enabled: !!id,
  });
};

/**
 * Interface pour créer un log d'activité
 */
export interface CreateActivityLogInput {
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Hook pour créer un log d'activité
 */
export const useCreateActivityLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateActivityLogInput) => {
      // @ts-ignore - Supabase types are strict, but this works at runtime
      const { data, error } = await supabase
        .from('activity_logs')
        .insert({
          user_id: input.userId,
          action: input.action,
          entity: input.entity,
          entity_id: input.entityId,
          details: input.details,
          ip_address: input.ipAddress,
          user_agent: input.userAgent,
          timestamp: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityLogKeys.lists() });
      queryClient.invalidateQueries({ queryKey: activityLogKeys.stats() });
    },
  });
};

/**
 * Hook pour supprimer les anciens logs (cleanup)
 */
export const useDeleteOldLogs = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (daysOld: number = 90) => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { data, error } = await supabase
        .from('activity_logs')
        .delete()
        .lt('timestamp', cutoffDate.toISOString());

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityLogKeys.lists() });
      queryClient.invalidateQueries({ queryKey: activityLogKeys.stats() });
    },
  });
};

/**
 * Hook pour obtenir les statistiques des logs
 */
export const useActivityLogStats = () => {
  return useQuery({
    queryKey: activityLogKeys.stats(),
    queryFn: async () => {
      // Total logs
      const { count: total, error: totalError } = await supabase
        .from('activity_logs')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;

      // Logs aujourd'hui
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count: todayCount, error: todayError } = await supabase
        .from('activity_logs')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', today.toISOString());

      if (todayError) throw todayError;

      // Actions par type
      const { data: actionsData, error: actionsError } = await supabase
        .from('activity_logs')
        .select('action');

      if (actionsError) throw actionsError;

      const actionCounts: Record<string, number> = {};
      actionsData?.forEach((log: any) => {
        actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      });

      return {
        total: total || 0,
        today: todayCount || 0,
        actionCounts,
      };
    },
    staleTime: 1 * 60 * 1000,
  });
};

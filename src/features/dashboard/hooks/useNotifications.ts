/**
 * Hook pour gérer les notifications
 * Notifications automatiques pour quotas, paiements, etc.
 * @module useNotifications
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (userId: string) => [...notificationKeys.lists(), userId] as const,
  unreadCount: (userId: string) => [...notificationKeys.all, 'unread-count', userId] as const,
};

/**
 * Interface pour une notification
 */
export interface Notification {
  id: string;
  userId?: string;
  schoolGroupId?: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, any>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

/**
 * Hook pour récupérer les notifications d'un utilisateur
 */
export const useNotifications = (userId: string, limit: number = 50) => {
  return useQuery({
    queryKey: notificationKeys.list(userId),
    queryFn: async () => {
      // @ts-expect-error - Table notifications sera créée par le script SQL
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`user_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((notif: any) => ({
        id: notif.id,
        userId: notif.user_id,
        schoolGroupId: notif.school_group_id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        data: notif.data || {},
        isRead: notif.is_read,
        readAt: notif.read_at,
        createdAt: notif.created_at,
      })) as Notification[];
    },
    // Rafraîchir toutes les 30 secondes
    refetchInterval: 30000,
    staleTime: 10000, // 10 secondes
  });
};

/**
 * Hook pour compter les notifications non lues
 */
export const useUnreadNotificationsCount = (userId: string) => {
  return useQuery({
    queryKey: notificationKeys.unreadCount(userId),
    queryFn: async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });
};

/**
 * Hook pour marquer une notification comme lue
 */
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

/**
 * Hook pour marquer toutes les notifications comme lues
 */
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .or(`user_id.eq.${userId},school_group_id.in.(SELECT id FROM school_groups WHERE admin_id = '${userId}')`)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

/**
 * Hook pour supprimer une notification
 */
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

/**
 * Hook pour créer une notification manuellement
 */
export const useCreateNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notification: {
      type: string;
      title: string;
      message: string;
      userId?: string;
      schoolGroupId?: string;
      data?: Record<string, any>;
    }) => {
      const { data, error } = await supabase.rpc('create_notification', {
        p_type: notification.type,
        p_title: notification.title,
        p_message: notification.message,
        p_user_id: notification.userId || null,
        p_school_group_id: notification.schoolGroupId || null,
        p_data: notification.data || {},
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

/**
 * Helper pour obtenir l'icône selon le type de notification
 */
export const getNotificationIcon = (type: string) => {
  const icons = {
    quota_warning: '⚠️',
    quota_critical: '🚨',
    payment_due: '💳',
    payment_success: '✅',
    payment_failed: '❌',
    plan_upgraded: '🎉',
    plan_downgraded: '📉',
    new_feature: '🆕',
    maintenance: '🔧',
    security: '🔒',
  };
  return icons[type as keyof typeof icons] || '📢';
};

/**
 * Helper pour obtenir la couleur selon le type de notification
 */
export const getNotificationColor = (type: string) => {
  const colors = {
    quota_warning: 'text-orange-600 bg-orange-50 border-orange-200',
    quota_critical: 'text-red-600 bg-red-50 border-red-200',
    payment_due: 'text-blue-600 bg-blue-50 border-blue-200',
    payment_success: 'text-green-600 bg-green-50 border-green-200',
    payment_failed: 'text-red-600 bg-red-50 border-red-200',
    plan_upgraded: 'text-green-600 bg-green-50 border-green-200',
    plan_downgraded: 'text-gray-600 bg-gray-50 border-gray-200',
    new_feature: 'text-purple-600 bg-purple-50 border-purple-200',
    maintenance: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    security: 'text-red-600 bg-red-50 border-red-200',
  };
  return colors[type as keyof typeof colors] || 'text-gray-600 bg-gray-50 border-gray-200';
};

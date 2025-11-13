/**
 * Hook moderne pour les notifications - React 19
 * Gestion temps réel avec optimisations avancées
 */

import { useState, useCallback, useMemo, startTransition } from 'react';

export interface Notification {
  readonly id: string;
  readonly title: string;
  readonly message: string;
  readonly type: 'info' | 'success' | 'warning' | 'error';
  readonly timestamp: Date;
  readonly isRead: boolean;
  readonly priority: 'low' | 'medium' | 'high' | 'urgent';
  readonly category: 'system' | 'message' | 'grade' | 'payment' | 'schedule';
  readonly actionUrl?: string;
}

interface NotificationsState {
  readonly notifications: readonly Notification[];
  readonly unreadCount: number;
  readonly isLoading: boolean;
}

export function useNotifications() {
  const [state, setState] = useState<NotificationsState>({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
  });

  // Données simulées modernes
  const mockNotifications: readonly Notification[] = useMemo(() => [
    {
      id: 'notif-001',
      title: 'Nouveau message',
      message: 'Vous avez reçu un message de Marie Dubois',
      type: 'info',
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
      isRead: false,
      priority: 'medium',
      category: 'message',
      actionUrl: '/user/messages',
    },
    {
      id: 'notif-002',
      title: 'Notes saisies',
      message: '25 nouvelles notes ont été ajoutées en Mathématiques',
      type: 'success',
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 min ago
      isRead: false,
      priority: 'low',
      category: 'grade',
      actionUrl: '/user/grades',
    },
    {
      id: 'notif-003',
      title: 'Paiement reçu',
      message: 'Paiement de 150€ reçu pour l\'élève Pierre Martin',
      type: 'success',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
      isRead: true,
      priority: 'medium',
      category: 'payment',
      actionUrl: '/user/payments',
    },
    {
      id: 'notif-004',
      title: 'Réunion programmée',
      message: 'Conseil de classe prévu demain à 14h00',
      type: 'warning',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h ago
      isRead: false,
      priority: 'high',
      category: 'schedule',
      actionUrl: '/user/schedule',
    },
  ] as const, []);

  // Chargement avec startTransition
  const loadNotifications = useCallback(() => {
    startTransition(() => {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // Simulation API
      setTimeout(() => {
        const unreadCount = mockNotifications.filter(n => !n.isRead).length;
        setState(prev => ({
          ...prev,
          notifications: mockNotifications,
          unreadCount,
          isLoading: false,
        }));
      }, 300);
    });
  }, [mockNotifications]);

  // Marquer comme lu
  const markAsRead = useCallback((notificationId: string) => {
    startTransition(() => {
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => 
          n.id === notificationId ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1),
      }));
    });
  }, []);

  // Marquer tout comme lu
  const markAllAsRead = useCallback(() => {
    startTransition(() => {
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    });
  }, []);

  // Supprimer notification
  const removeNotification = useCallback((notificationId: string) => {
    startTransition(() => {
      setState(prev => {
        const notification = prev.notifications.find(n => n.id === notificationId);
        const wasUnread = notification && !notification.isRead;
        
        return {
          ...prev,
          notifications: prev.notifications.filter(n => n.id !== notificationId),
          unreadCount: wasUnread ? prev.unreadCount - 1 : prev.unreadCount,
        };
      });
    });
  }, []);

  // Statistiques calculées
  const stats = useMemo(() => {
    const byType = state.notifications.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byPriority = state.notifications.reduce((acc, n) => {
      acc[n.priority] = (acc[n.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.freeze({
      total: state.notifications.length,
      unread: state.unreadCount,
      byType: Object.freeze(byType),
      byPriority: Object.freeze(byPriority),
      hasUrgent: state.notifications.some(n => n.priority === 'urgent' && !n.isRead),
    });
  }, [state.notifications, state.unreadCount]);

  // API publique immutable
  return useMemo(() => Object.freeze({
    // État
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    isLoading: state.isLoading,
    stats,
    
    // Actions
    loadNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
    
    // Utilitaires
    getUnreadNotifications: () => state.notifications.filter(n => !n.isRead),
    getNotificationsByType: (type: Notification['type']) => 
      state.notifications.filter(n => n.type === type),
    getUrgentNotifications: () => 
      state.notifications.filter(n => n.priority === 'urgent' && !n.isRead),
  }), [
    state.notifications,
    state.unreadCount,
    state.isLoading,
    stats,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
  ]);
}

/**
 * Hook pour les notifications en temps réel des plans
 * Alertes automatiques sur événements critiques
 * @module usePlanNotifications
 */

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface PlanNotification {
  id: string;
  type: 'subscription_created' | 'subscription_cancelled' | 'limit_reached' | 'payment_failed' | 'upgrade_request' | 'churn_risk';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  planId?: string;
  planName?: string;
  groupId?: string;
  groupName?: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export const usePlanNotifications = () => {
  const [notifications, setNotifications] = useState<PlanNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Récupérer les notifications initiales
  const { data: initialNotifications } = useQuery({
    queryKey: ['plan-notifications'],
    queryFn: async () => {
      // Simuler des notifications (à remplacer par vraies données)
      const mockNotifications: PlanNotification[] = [
        {
          id: '1',
          type: 'subscription_created',
          priority: 'medium',
          title: 'Nouvel abonnement Premium',
          message: 'École Saint-Joseph a souscrit au plan Premium',
          planId: 'plan-premium',
          planName: 'Premium',
          groupId: 'group-1',
          groupName: 'École Saint-Joseph',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          read: false,
          actionUrl: '/dashboard/subscriptions',
        },
        {
          id: '2',
          type: 'limit_reached',
          priority: 'high',
          title: 'Limite atteinte - Plan Gratuit',
          message: 'Groupe Éducation Plus a atteint 80% de sa limite d\'élèves',
          planId: 'plan-gratuit',
          planName: 'Gratuit',
          groupId: 'group-2',
          groupName: 'Éducation Plus',
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          read: false,
          actionUrl: '/dashboard/school-groups',
        },
        {
          id: '3',
          type: 'upgrade_request',
          priority: 'high',
          title: 'Demande d\'upgrade',
          message: 'Complexe Scolaire Moderne demande un upgrade vers Pro',
          planId: 'plan-pro',
          planName: 'Pro',
          groupId: 'group-3',
          groupName: 'Complexe Scolaire Moderne',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          read: false,
          actionUrl: '/dashboard/plan-change-requests',
        },
        {
          id: '4',
          type: 'churn_risk',
          priority: 'critical',
          title: 'Risque de churn élevé',
          message: 'Institut Technique n\'a pas utilisé la plateforme depuis 15 jours',
          planId: 'plan-premium',
          planName: 'Premium',
          groupId: 'group-4',
          groupName: 'Institut Technique',
          timestamp: new Date(Date.now() - 60 * 60 * 1000),
          read: false,
          actionUrl: '/dashboard/school-groups',
        },
      ];

      return mockNotifications;
    },
    staleTime: 30 * 1000, // 30 secondes
    refetchInterval: 60 * 1000, // Rafraîchir toutes les minutes
  });

  // Écouter les changements en temps réel (Supabase Realtime)
  useEffect(() => {
    // Abonnements créés
    const subscriptionChannel = supabase
      .channel('subscription_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'school_group_subscriptions',
        },
        (payload) => {
          const newNotification: PlanNotification = {
            id: `notif-${Date.now()}`,
            type: 'subscription_created',
            priority: 'medium',
            title: 'Nouvel abonnement',
            message: `Un nouveau groupe a souscrit à un plan`,
            timestamp: new Date(),
            read: false,
            actionUrl: '/dashboard/subscriptions',
          };
          
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'school_group_subscriptions',
          filter: 'status=eq.cancelled',
        },
        (payload) => {
          const newNotification: PlanNotification = {
            id: `notif-${Date.now()}`,
            type: 'subscription_cancelled',
            priority: 'high',
            title: 'Abonnement annulé',
            message: `Un groupe a annulé son abonnement`,
            timestamp: new Date(),
            read: false,
            actionUrl: '/dashboard/subscriptions',
          };
          
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      subscriptionChannel.unsubscribe();
    };
  }, []);

  // Initialiser les notifications
  useEffect(() => {
    if (initialNotifications) {
      setNotifications(initialNotifications);
      setUnreadCount(initialNotifications.filter(n => !n.read).length);
    }
  }, [initialNotifications]);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  };
};

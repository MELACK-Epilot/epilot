/**
 * Hook pour récupérer l'activité en temps réel depuis Supabase
 * @module useRealtimeActivity
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/store/auth.store';
import type { RealtimeActivity } from '../types/widget.types';

interface ActivityLog {
  id: string;
  action_type: string;
  user_id: string;
  user_name: string;
  description: string;
  created_at: string;
}

const fetchRecentActivity = async (
  isSuperAdmin: boolean,
  schoolGroupId?: string
): Promise<RealtimeActivity[]> => {
  try {
    let query = supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    // ADMIN GROUPE : Filtrer par groupe uniquement
    if (!isSuperAdmin && schoolGroupId) {
      query = query.eq('school_group_id', schoolGroupId);
    }

    const { data, error } = await query;

    if (error) throw error;
    
    // Debug en développement
    if (import.meta.env.DEV) {
      console.log('🔍 Flux d\'activité:', {
        role: isSuperAdmin ? 'super_admin' : 'admin_groupe',
        groupId: schoolGroupId,
        count: data?.length || 0,
        filter: !isSuperAdmin && schoolGroupId ? 'Filtré par groupe' : 'Toutes les activités'
      });
    }

    return (data || []).map((log: ActivityLog) => ({
      id: log.id,
      type: mapActionType(log.action_type),
      user: log.user_name || 'Système',
      action: log.description,
      timestamp: log.created_at,
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'activité:', error);
    return [];
  }
};

const mapActionType = (actionType: string): RealtimeActivity['type'] => {
  const mapping: Record<string, RealtimeActivity['type']> = {
    // Authentification
    'user.login': 'login',
    'user.logout': 'login',
    
    // Groupes & Écoles
    'school_group.created': 'school_added',
    'school_group.updated': 'school_added',
    'school.created': 'school_added',
    'school.updated': 'school_added',
    
    // Utilisateurs
    'user.created': 'user_created',
    'user.updated': 'user_created',
    'user.deleted': 'user_created',
    
    // Abonnements
    'subscription.created': 'subscription_updated',
    'subscription.updated': 'subscription_updated',
    'subscription.cancelled': 'subscription_updated',
    
    // Modules
    'module.assigned': 'user_created',
    'module.unassigned': 'user_created',
    
    // Paiements
    'payment.created': 'subscription_updated',
    'payment.completed': 'subscription_updated',
    'payment.failed': 'subscription_updated',
  };
  
  // Retourner 'login' par défaut (type générique)
  return mapping[actionType] || 'login';
};

export const useRealtimeActivity = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const schoolGroupId = user?.schoolGroupId;

  // Temps réel avec Supabase Realtime
  useEffect(() => {
    // Construire le filtre pour Admin Groupe
    const realtimeFilter = !isSuperAdmin && schoolGroupId
      ? `school_group_id=eq.${schoolGroupId}`
      : undefined;

    const channel = supabase
      .channel('activity_logs_changes')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'activity_logs',
          filter: realtimeFilter
        },
        (payload) => {
          // Ajouter la nouvelle activité en temps réel
          queryClient.setQueryData<RealtimeActivity[]>(['realtime-activity', user?.role, schoolGroupId], (old = []) => {
            const newActivity: RealtimeActivity = {
              id: payload.new.id,
              type: mapActionType(payload.new.action_type),
              user: payload.new.user_name || 'Système',
              action: payload.new.description,
              timestamp: payload.new.created_at,
            };
            return [newActivity, ...old].slice(0, 50); // Garder max 50
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, isSuperAdmin, schoolGroupId, user?.role]);

  return useQuery({
    queryKey: ['realtime-activity', user?.role, schoolGroupId],
    queryFn: () => fetchRecentActivity(isSuperAdmin, schoolGroupId),
    staleTime: 10 * 1000, // 10 secondes
    refetchInterval: 30 * 1000, // 30 secondes
    refetchOnWindowFocus: true,
    enabled: !!user,
  });
};

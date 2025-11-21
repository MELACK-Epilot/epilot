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
  action: string;
  entity: string;
  entity_id: string;
  details: string;
  user_id: string;
  created_at: string;
  school_group_id?: string;
}

const fetchRecentActivity = async (
  isSuperAdmin: boolean,
  schoolGroupId?: string
): Promise<RealtimeActivity[]> => {
  try {
    let query = supabase
      .from('activity_logs')
      .select(`
        *,
        users!activity_logs_user_id_fkey (
          first_name,
          last_name,
          email
        )
      `)
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

    return (data || []).map((log: any) => {
      const user = log.users;
      const userName = user 
        ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
        : 'Système';

      return {
        id: log.id,
        type: mapActionToType(log.action, log.entity),
        user: userName,
        action: log.details || `${log.action} ${log.entity}`,
        timestamp: log.created_at,
      };
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'activité:', error);
    return [];
  }
};

const mapActionToType = (action: string, entity: string): RealtimeActivity['type'] => {
  // Mapper selon action + entity
  const key = `${action}.${entity}`;
  
  const mapping: Record<string, RealtimeActivity['type']> = {
    // Authentification
    'login.user': 'login',
    'logout.user': 'login',
    
    // Groupes & Écoles
    'create.school_group': 'school_added',
    'update.school_group': 'school_added',
    'create.school': 'school_added',
    'update.school': 'school_added',
    
    // Utilisateurs
    'create.user': 'user_created',
    'update.user': 'user_created',
    'delete.user': 'user_created',
    
    // Abonnements
    'create.subscription': 'subscription_updated',
    'update.subscription': 'subscription_updated',
    'cancel.subscription': 'subscription_updated',
    
    // Modules
    'assign.module': 'user_created',
    'unassign.module': 'user_created',
    
    // Paiements
    'create.payment': 'subscription_updated',
    'complete.payment': 'subscription_updated',
    'fail.payment': 'subscription_updated',
  };
  
  // Retourner le mapping ou 'login' par défaut
  return mapping[key] || 'login';
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
              type: mapActionToType(payload.new.action, payload.new.entity),
              user: 'Utilisateur', // On ne peut pas récupérer le nom en temps réel facilement
              action: payload.new.details || `${payload.new.action} ${payload.new.entity}`,
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

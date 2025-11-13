/**
 * Hook pour récupérer l'activité récente du groupe
 * Utilise activity_logs de Supabase
 * @module useRecentActivity
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/store/auth.store';

export interface Activity {
  id: string;
  type: 'school' | 'user' | 'payment' | 'alert' | 'report';
  title: string;
  description: string;
  time: string;
  status: 'success' | 'warning' | 'info' | 'error';
  created_at: string;
}

export const useRecentActivity = () => {
  const { user } = useAuth();

  return useQuery<Activity[]>({
    queryKey: ['recent-activity', user?.schoolGroupId],
    queryFn: async (): Promise<Activity[]> => {
      if (!user?.schoolGroupId) {
        return [];
      }

      try {
        // Récupérer les logs d'activité des dernières 24h
        const { data: logs, error } = await supabase
          .from('activity_logs')
          .select('*')
          .eq('school_group_id', user.schoolGroupId)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Erreur récupération activité:', error);
          return [];
        }

        if (!logs || logs.length === 0) {
          return [];
        }

        // Transformer les logs en activités
        return logs.map((log: any) => {
          const timeAgo = getTimeAgo(new Date(log.created_at));
          
          return {
            id: log.id,
            type: mapActionToType(log.action),
            title: formatTitle(log.action, log.entity_type),
            description: log.description || formatDescription(log),
            time: timeAgo,
            status: mapActionToStatus(log.action),
            created_at: log.created_at,
          };
        });
      } catch (error) {
        console.error('Erreur useRecentActivity:', error);
        return [];
      }
    },
    enabled: !!user?.schoolGroupId && user?.role === 'admin_groupe',
    staleTime: 30 * 1000, // 30 secondes
    refetchInterval: 60 * 1000, // Rafraîchir toutes les minutes
  });
};

// Mapper l'action vers un type d'activité
function mapActionToType(action: string): Activity['type'] {
  if (action.includes('school') || action.includes('école')) return 'school';
  if (action.includes('user') || action.includes('utilisateur')) return 'user';
  if (action.includes('payment') || action.includes('paiement')) return 'payment';
  if (action.includes('alert') || action.includes('alerte')) return 'alert';
  if (action.includes('report') || action.includes('rapport')) return 'report';
  return 'report';
}

// Mapper l'action vers un statut
function mapActionToStatus(action: string): Activity['status'] {
  if (action.includes('create') || action.includes('créer') || action.includes('add')) return 'success';
  if (action.includes('delete') || action.includes('supprimer')) return 'error';
  if (action.includes('update') || action.includes('modifier')) return 'info';
  if (action.includes('alert') || action.includes('warning')) return 'warning';
  return 'info';
}

// Formater le titre
function formatTitle(action: string, entityType?: string): string {
  const entity = entityType || 'élément';
  
  if (action.includes('create')) return `Nouveau ${entity} ajouté`;
  if (action.includes('update')) return `${entity} modifié`;
  if (action.includes('delete')) return `${entity} supprimé`;
  if (action.includes('login')) return 'Connexion';
  if (action.includes('logout')) return 'Déconnexion';
  
  return action;
}

// Formater la description
function formatDescription(log: any): string {
  if (log.entity_name) return log.entity_name;
  if (log.user_email) return `Par ${log.user_email}`;
  return 'Action effectuée';
}

// Calculer le temps écoulé
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  return date.toLocaleDateString('fr-FR');
}

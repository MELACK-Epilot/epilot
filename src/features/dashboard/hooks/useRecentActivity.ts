/**
 * Hook pour récupérer l'activité récente du groupe
 * Utilise la fonction RPC get_recent_activity qui agrège plusieurs tables
 * @module useRecentActivity
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/store/auth.store';

/** Types d'activité supportés */
export type ActivityType = 'school' | 'user' | 'payment' | 'alert' | 'report';

/** Statuts d'activité */
export type ActivityStatus = 'success' | 'warning' | 'info' | 'error';

/** Interface d'une activité */
export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  time: string;
  status: ActivityStatus;
  created_at: string;
  action?: string;
}

/** Options du hook */
export interface UseRecentActivityOptions {
  /** Limite du nombre d'activités (défaut: 15) */
  limit?: number;
  /** Période en heures (défaut: 168 = 7 jours) */
  hours?: number;
  /** Filtrer par type d'activité */
  filterType?: ActivityType | 'all';
  /** Filtrer par statut */
  filterStatus?: ActivityStatus | 'all';
  /** Activer le hook */
  enabled?: boolean;
}

/** Réponse brute de la RPC */
interface RawActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  created_at: string;
  status: string;
  action: string;
}

/**
 * Hook pour récupérer l'activité récente du groupe scolaire
 * Agrège les données de: users, schools, students, payments, notifications
 */
export const useRecentActivity = (options: UseRecentActivityOptions = {}) => {
  const { user } = useAuth();
  const {
    limit = 15,
    hours = 168, // 7 jours par défaut
    filterType = 'all',
    filterStatus = 'all',
    enabled = true,
  } = options;

  return useQuery<Activity[]>({
    queryKey: ['recent-activity', user?.schoolGroupId, limit, hours, filterType, filterStatus],
    queryFn: async (): Promise<Activity[]> => {
      if (!user?.schoolGroupId) {
        return [];
      }

      try {
        // Appeler la fonction RPC (cast nécessaire car la fonction n'est pas dans les types générés)
        const { data, error } = await (supabase.rpc as any)('get_recent_activity', {
          p_school_group_id: user.schoolGroupId,
          p_limit: limit,
          p_hours: hours,
        }) as { data: RawActivity[] | null; error: any };

        if (error) {
          console.error('Erreur récupération activité:', error);
          return [];
        }

        if (!data || data.length === 0) {
          return [];
        }

        // Transformer et filtrer les activités
        let activities: Activity[] = (data as RawActivity[]).map((item) => ({
          id: item.id,
          type: mapToActivityType(item.type),
          title: item.title,
          description: item.description || '',
          time: getTimeAgo(new Date(item.created_at)),
          status: mapToActivityStatus(item.status),
          created_at: item.created_at,
          action: item.action,
        }));

        // Appliquer les filtres côté client
        if (filterType !== 'all') {
          activities = activities.filter((a) => a.type === filterType);
        }
        if (filterStatus !== 'all') {
          activities = activities.filter((a) => a.status === filterStatus);
        }

        return activities;
      } catch (error) {
        console.error('Erreur useRecentActivity:', error);
        return [];
      }
    },
    enabled: enabled && !!user?.schoolGroupId && user?.role === 'admin_groupe',
    staleTime: 30 * 1000, // 30 secondes
    refetchInterval: 60 * 1000, // Rafraîchir toutes les minutes
  });
};

/** Mapper le type brut vers ActivityType */
function mapToActivityType(type: string): ActivityType {
  const typeMap: Record<string, ActivityType> = {
    school: 'school',
    user: 'user',
    payment: 'payment',
    alert: 'alert',
    report: 'report',
  };
  return typeMap[type] || 'report';
}

/** Mapper le statut brut vers ActivityStatus */
function mapToActivityStatus(status: string): ActivityStatus {
  const statusMap: Record<string, ActivityStatus> = {
    success: 'success',
    warning: 'warning',
    info: 'info',
    error: 'error',
  };
  return statusMap[status] || 'info';
}

/** Calculer le temps écoulé depuis une date */
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

/** Labels pour les types d'activité */
export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  school: 'Écoles',
  user: 'Utilisateurs',
  payment: 'Paiements',
  alert: 'Alertes',
  report: 'Rapports',
};

/** Labels pour les statuts */
export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
  success: 'Succès',
  warning: 'Attention',
  info: 'Information',
  error: 'Erreur',
};

/** Options de période prédéfinies */
export const PERIOD_OPTIONS = [
  { value: 24, label: 'Dernières 24h' },
  { value: 72, label: '3 derniers jours' },
  { value: 168, label: '7 derniers jours' },
  { value: 720, label: '30 derniers jours' },
] as const;

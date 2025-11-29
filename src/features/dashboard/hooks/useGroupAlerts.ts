/**
 * Hook pour récupérer les alertes du groupe
 * Utilise system_alerts et données financières
 * Inclut: useGroupAlerts, useDismissAlert, useAlertHistory
 * @module useGroupAlerts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/store/auth.store';

export interface GroupAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  icon: string;
  title: string;
  description: string;
  action: string;
  href: string;
}

export const useGroupAlerts = () => {
  const { user } = useAuth();

  return useQuery<GroupAlert[]>({
    queryKey: ['group-alerts', user?.schoolGroupId],
    queryFn: async (): Promise<GroupAlert[]> => {
      if (!user?.schoolGroupId) {
        return [];
      }

      const alerts: GroupAlert[] = [];

      try {
        // 1. Vérifier les paiements en retard
        const { data: overduePayments, error: paymentError } = await (supabase as any)
          .from('fee_payments')
          .select('amount, school_id')
          .eq('status', 'pending')
          .lt('due_date', new Date().toISOString());

        if (!paymentError && overduePayments && overduePayments.length > 0) {
          const totalOverdue = overduePayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
          alerts.push({
            id: 'overdue-payments',
            type: 'critical',
            icon: 'DollarSign',
            title: `${overduePayments.length} paiement(s) en retard`,
            description: `Total: ${(totalOverdue / 1000000).toFixed(2)}M FCFA`,
            action: 'Voir détails',
            href: '/dashboard/finances-groupe',
          });
        }

        // 2. Vérifier les utilisateurs inactifs
        const { data: inactiveUsers, error: userError } = await supabase
          .from('users')
          .select('id, email')
          .eq('school_group_id', user.schoolGroupId)
          .eq('status', 'inactive');

        if (!userError && inactiveUsers && inactiveUsers.length > 0) {
          alerts.push({
            id: 'inactive-users',
            type: 'warning',
            icon: 'Users',
            title: `${inactiveUsers.length} compte(s) utilisateur inactif(s)`,
            description: 'Pas de connexion depuis 30 jours',
            action: 'Gérer',
            href: '/dashboard/users',
          });
        }

        // 3. Vérifier les alertes système non résolues
        const { data: systemAlerts, error: alertError } = await (supabase as any)
          .from('system_alerts')
          .select('*')
          .eq('school_group_id', user.schoolGroupId)
          .is('resolved_at', null)
          .order('created_at', { ascending: false })
          .limit(5);

        if (!alertError && systemAlerts && systemAlerts.length > 0) {
          systemAlerts.forEach((alert: any) => {
            alerts.push({
              id: alert.id,
              type: mapSeverityToType(alert.severity),
              icon: 'AlertCircle',
              title: alert.title,
              description: alert.message,
              action: alert.action_label || 'Consulter',
              href: alert.action_url || '/dashboard/schools',
            });
          });
        }

        return alerts;
      } catch (error) {
        console.error('Erreur useGroupAlerts:', error);
        return [];
      }
    },
    enabled: !!user?.schoolGroupId && user?.role === 'admin_groupe',
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Rafraîchir toutes les 2 minutes
  });
};

// Mapper la sévérité vers un type
function mapSeverityToType(severity: string): GroupAlert['type'] {
  if (severity === 'critical' || severity === 'error') return 'critical';
  if (severity === 'warning') return 'warning';
  return 'info';
}

/**
 * Hook pour supprimer (résoudre) une alerte
 */
export const useDismissAlert = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await (supabase as any)
        .from('system_alerts')
        .update({ resolved_at: new Date().toISOString() })
        .eq('id', alertId);

      if (error) throw error;
      return alertId;
    },
    onSuccess: () => {
      // Invalider les alertes pour rafraîchir
      queryClient.invalidateQueries({ queryKey: ['group-alerts', user?.schoolGroupId] });
      queryClient.invalidateQueries({ queryKey: ['alert-history', user?.schoolGroupId] });
    },
  });
};

/**
 * Hook pour récupérer l'historique des alertes résolues
 */
export const useAlertHistory = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['alert-history', user?.schoolGroupId],
    queryFn: async () => {
      if (!user?.schoolGroupId) return [];

      const { data, error } = await (supabase as any)
        .from('system_alerts')
        .select('id, title, message, severity, resolved_at, created_at')
        .eq('school_group_id', user.schoolGroupId)
        .not('resolved_at', 'is', null)
        .order('resolved_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Erreur useAlertHistory:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!user?.schoolGroupId && user?.role === 'admin_groupe',
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook pour récupérer les alertes du groupe
 * Utilise system_alerts et données financières
 * @module useGroupAlerts
 */

import { useQuery } from '@tanstack/react-query';
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
        const { data: overduePayments, error: paymentError } = await supabase
          .from('fee_payments')
          .select('amount, school_id')
          .eq('status', 'pending')
          .lt('due_date', new Date().toISOString());

        if (!paymentError && overduePayments && overduePayments.length > 0) {
          const totalOverdue = overduePayments.reduce((sum, p) => sum + (p.amount || 0), 0);
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

        // 3. Vérifier les alertes système
        const { data: systemAlerts, error: alertError } = await supabase
          .from('system_alerts')
          .select('*')
          .eq('school_group_id', user.schoolGroupId)
          .eq('is_read', false)
          .order('created_at', { ascending: false })
          .limit(3);

        if (!alertError && systemAlerts && systemAlerts.length > 0) {
          systemAlerts.forEach((alert: any) => {
            alerts.push({
              id: alert.id,
              type: mapSeverityToType(alert.severity),
              icon: 'AlertCircle',
              title: alert.title,
              description: alert.message,
              action: 'Consulter',
              href: '/dashboard/activity-logs',
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

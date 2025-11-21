/**
 * Hook pour récupérer les alertes plateforme du Super Admin
 * Alertes pertinentes: abonnements expirants, faible adoption, groupes inactifs
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface SuperAdminAlert {
  id: string;
  type: 'subscription_expiring' | 'payment_failed' | 'low_adoption' | 'inactive_group';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  entity_type: 'school_group' | 'subscription' | 'platform';
  entity_id?: string;
  entity_name?: string;
  action_url?: string;
  action_label?: string;
  created_at: string;
  metadata?: any;
}

const fetchSuperAdminAlerts = async (): Promise<SuperAdminAlert[]> => {
  try {
    const alerts: SuperAdminAlert[] = [];

    // 1. Abonnements expirant dans 7 jours
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const { data: expiringSubscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select(`
        id,
        end_date,
        status,
        school_group:school_groups!inner(id, name)
      `)
      .eq('status', 'active')
      .lte('end_date', sevenDaysFromNow.toISOString())
      .order('end_date', { ascending: true })
      .limit(10);

    if (subError) {
      console.error('Erreur récupération abonnements expirants:', subError);
    }

    // Créer alertes pour abonnements expirants
    expiringSubscriptions?.forEach((sub: any) => {
      const daysUntilExpiry = Math.ceil(
        (new Date(sub.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilExpiry >= 0) {
        alerts.push({
          id: `sub-${sub.id}`,
          type: 'subscription_expiring',
          severity: daysUntilExpiry <= 3 ? 'critical' : 'warning',
          title: `Abonnement expire dans ${daysUntilExpiry} jour${daysUntilExpiry > 1 ? 's' : ''}`,
          message: `Le groupe scolaire ${sub.school_group?.name || 'Inconnu'} doit renouveler son abonnement.`,
          entity_type: 'school_group',
          entity_id: sub.school_group?.id,
          entity_name: sub.school_group?.name,
          action_url: `/dashboard/school-groups/${sub.school_group?.id}`,
          action_label: 'Voir le groupe',
          created_at: new Date().toISOString(),
          metadata: { 
            days_until_expiry: daysUntilExpiry, 
            end_date: sub.end_date,
            subscription_id: sub.id,
          },
        });
      }
    });

    // 2. Groupes avec faible adoption (< 50% utilisateurs actifs)
    const { data: allGroups, error: groupsError } = await supabase
      .from('school_groups')
      .select('id, name')
      .limit(100);

    if (groupsError) {
      console.error('Erreur récupération groupes:', groupsError);
    }

    // Pour chaque groupe, calculer le taux d'adoption
    if (allGroups) {
      for (const group of allGroups) {
        const { count: totalUsers } = await supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('school_group_id', group.id);

        const { count: activeUsers } = await supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('school_group_id', group.id)
          .eq('status', 'active');

        const adoptionRate = totalUsers && totalUsers > 0 
          ? ((activeUsers || 0) / totalUsers) * 100 
          : 0;

        // Alerte si adoption < 50%
        if (totalUsers && totalUsers > 0 && adoptionRate < 50) {
          alerts.push({
            id: `adoption-${group.id}`,
            type: 'low_adoption',
            severity: adoptionRate < 25 ? 'critical' : 'warning',
            title: `Faible adoption: ${adoptionRate.toFixed(0)}%`,
            message: `Le groupe ${group.name} a seulement ${activeUsers}/${totalUsers} utilisateurs actifs.`,
            entity_type: 'school_group',
            entity_id: group.id,
            entity_name: group.name,
            action_url: `/dashboard/school-groups/${group.id}`,
            action_label: 'Analyser le groupe',
            created_at: new Date().toISOString(),
            metadata: { 
              adoption_rate: adoptionRate, 
              active_users: activeUsers, 
              total_users: totalUsers,
            },
          });
        }

        // Limiter à 5 alertes d'adoption max
        if (alerts.filter(a => a.type === 'low_adoption').length >= 5) {
          break;
        }
      }
    }

    // 3. Groupes inactifs (aucune connexion depuis 30 jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: inactiveGroups, error: inactiveError } = await supabase
      .from('school_groups')
      .select('id, name, updated_at')
      .lt('updated_at', thirtyDaysAgo.toISOString())
      .limit(5);

    if (inactiveError) {
      console.error('Erreur récupération groupes inactifs:', inactiveError);
    }

    inactiveGroups?.forEach((group: any) => {
      const daysSinceActivity = Math.ceil(
        (Date.now() - new Date(group.updated_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      alerts.push({
        id: `inactive-${group.id}`,
        type: 'inactive_group',
        severity: 'warning',
        title: `Groupe inactif depuis ${daysSinceActivity} jours`,
        message: `Le groupe ${group.name} n'a eu aucune activité récente.`,
        entity_type: 'school_group',
        entity_id: group.id,
        entity_name: group.name,
        action_url: `/dashboard/school-groups/${group.id}`,
        action_label: 'Contacter le groupe',
        created_at: group.updated_at,
        metadata: { days_since_activity: daysSinceActivity },
      });
    });

    // Trier par sévérité puis date
    return alerts.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  } catch (error) {
    console.error('Erreur récupération alertes Super Admin:', error);
    return [];
  }
};

export const useSuperAdminAlerts = () => {
  return useQuery({
    queryKey: ['super-admin-alerts'],
    queryFn: fetchSuperAdminAlerts,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
};

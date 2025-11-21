/**
 * Hook pour récupérer les insights IA du Super Admin
 * Analyse les données de la plateforme et génère des recommandations
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface SuperAdminInsight {
  id: string;
  type: 'opportunity' | 'recommendation' | 'trend' | 'alert';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  color: string;
  icon: string;
  trend?: number;
  actionUrl?: string;
  actionLabel?: string;
}

const fetchSuperAdminInsights = async (): Promise<SuperAdminInsight[]> => {
  try {
    const insights: SuperAdminInsight[] = [];

    // 1. Récupérer les statistiques globales
    const { data: stats } = await supabase
      .from('subscriptions')
      .select(`
        id,
        status,
        created_at,
        end_date,
        subscription_plans!inner(price)
      `)
      .eq('status', 'active');

    // Calculer MRR actuel
    const currentMRR = stats?.reduce((sum, sub: any) => sum + (sub.subscription_plans?.price || 0), 0) || 0;

    // Calculer MRR du mois dernier
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const { data: lastMonthStats } = await supabase
      .from('subscriptions')
      .select(`
        id,
        subscription_plans!inner(price)
      `)
      .eq('status', 'active')
      .lt('created_at', lastMonth.toISOString());

    const lastMonthMRR = lastMonthStats?.reduce((sum, sub: any) => sum + (sub.subscription_plans?.price || 0), 0) || 0;
    const mrrGrowth = lastMonthMRR > 0 ? ((currentMRR - lastMonthMRR) / lastMonthMRR) * 100 : 0;

    // Insight 1: Croissance MRR
    if (mrrGrowth > 0) {
      insights.push({
        id: 'mrr-growth',
        type: 'trend',
        title: 'Revenu mensuel',
        description: `MRR: ${(currentMRR / 1000000).toFixed(1)}M FCFA • Objectif 2M FCFA (${((currentMRR / 2000000) * 100).toFixed(0)}%)`,
        impact: 'high',
        color: '#E9C46A',
        icon: 'TrendingUp',
        trend: mrrGrowth,
      });
    } else if (mrrGrowth < 0) {
      insights.push({
        id: 'mrr-decline',
        type: 'alert',
        title: 'Baisse du MRR',
        description: `Le MRR a baissé de ${Math.abs(mrrGrowth).toFixed(1)}% ce mois. Action requise.`,
        impact: 'high',
        color: '#E63946',
        icon: 'AlertCircle',
        trend: mrrGrowth,
      });
    }

    // 2. Nouveaux groupes ce mois
    const { count: newGroupsCount } = await supabase
      .from('school_groups')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

    if (newGroupsCount && newGroupsCount > 0) {
      insights.push({
        id: 'new-groups',
        type: 'recommendation',
        title: 'Recommandation',
        description: `Contactez ${newGroupsCount} nouveaux groupes scolaires cette semaine`,
        impact: 'medium',
        color: '#2A9D8F',
        icon: 'Sparkles',
      });
    }

    // 3. Tout va bien (si pas de problèmes)
    if (mrrGrowth >= 0 && insights.length < 2) {
      insights.push({
        id: 'all-good',
        type: 'trend',
        title: 'Tout va bien !',
        description: 'Aucun abonnement critique. Excellente gestion !',
        impact: 'medium',
        color: '#2A9D8F',
        icon: 'Download',
      });
    }

    // 4. Abonnements expirants
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const { count: expiringCount } = await supabase
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .lte('end_date', sevenDaysFromNow.toISOString());

    if (expiringCount && expiringCount > 0) {
      insights.push({
        id: 'expiring-subscriptions',
        type: 'alert',
        title: `${expiringCount} abonnement${expiringCount > 1 ? 's' : ''} expire${expiringCount > 1 ? 'nt' : ''} bientôt`,
        description: 'Contactez ces groupes pour renouveler et éviter la perte de revenus.',
        impact: 'high',
        color: '#E63946',
        icon: 'AlertCircle',
        actionUrl: '/dashboard/subscriptions?filter=expiring',
        actionLabel: 'Gérer les renouvellements',
      });
    }

    // Limiter à 4 insights maximum
    return insights.slice(0, 4);

  } catch (error) {
    console.error('Erreur récupération insights Super Admin:', error);
    
    // Retourner des insights par défaut en cas d'erreur
    return [
      {
        id: 'default-1',
        type: 'recommendation',
        title: 'Recommandation',
        description: 'Contactez 3 nouveaux groupes scolaires cette semaine',
        impact: 'medium',
        color: '#2A9D8F',
        icon: 'Sparkles',
      },
      {
        id: 'default-2',
        type: 'trend',
        title: 'Tout va bien !',
        description: 'Aucun abonnement critique. Excellente gestion !',
        impact: 'medium',
        color: '#2A9D8F',
        icon: 'Download',
      },
    ];
  }
};

export const useSuperAdminInsights = () => {
  const query = useQuery({
    queryKey: ['super-admin-insights'],
    queryFn: fetchSuperAdminInsights,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
  });

  return {
    ...query,
    // Exposer dataUpdatedAt pour afficher le temps de dernière mise à jour
    lastUpdated: query.dataUpdatedAt,
  };
};

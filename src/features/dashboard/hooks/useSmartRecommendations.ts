/**
 * Hook de Recommandations Intelligentes pour Admin Groupe
 * Analyse les données en temps réel pour fournir des conseils actionnables
 * @module useSmartRecommendations
 */

import { useMemo } from 'react';
import { useAdminGroupStats } from './useAdminGroupStats';
import { useGroupAlerts } from './useGroupAlerts';
import { TrendingUp, UserPlus, DollarSign, ShieldAlert, Zap } from 'lucide-react';

export interface Recommendation {
  id: string;
  type: 'critical' | 'warning' | 'growth' | 'optimization' | 'success';
  title: string;
  message: string;
  icon: any;
  action: string;
  route: string;
  metric: string;
}

export const useSmartRecommendations = (): Recommendation | undefined => {
  const { data: stats } = useAdminGroupStats();
  const { data: alerts } = useGroupAlerts();

  return useMemo(() => {
    const recommendations: Recommendation[] = [];

    if (!stats) return undefined;

    // 1. Analyse Croissance Écoles
    if (stats.totalSchools === 0) {
      recommendations.push({
        id: 'add-first-school',
        type: 'critical',
        title: 'Commencez votre aventure',
        message: 'Ajoutez votre première école pour activer toutes les fonctionnalités.',
        icon: Zap,
        action: 'Ajouter École',
        route: '/dashboard/schools?action=create',
        metric: '0 écoles',
      });
    } else if (stats.totalSchools < 3) {
      recommendations.push({
        id: 'grow-network',
        type: 'growth',
        title: 'Développez votre réseau',
        message: 'Vous avez un excellent début ! Ajoutez d\'autres écoles pour centraliser votre gestion.',
        icon: TrendingUp,
        action: 'Ajouter École',
        route: '/dashboard/schools?action=create',
        metric: `${stats.totalSchools} écoles`,
      });
    }

    // 2. Analyse Remplissage Élèves
    const studentsPerSchool = stats.totalSchools > 0 ? stats.totalStudents / stats.totalSchools : 0;
    if (stats.totalSchools > 0 && studentsPerSchool < 50) {
      recommendations.push({
        id: 'boost-enrollment',
        type: 'optimization',
        title: 'Optimisez vos effectifs',
        message: 'La moyenne d\'élèves par école est faible. Lancez une campagne d\'inscription.',
        icon: UserPlus,
        action: 'Gérer Inscriptions',
        route: '/dashboard/students',
        metric: `${Math.round(studentsPerSchool)} élèves/école`,
      });
    }

    // 3. Analyse Financière (basée sur les alertes)
    const financialAlert = alerts?.find(a => a.type === 'critical' && a.icon === 'DollarSign');
    if (financialAlert) {
      recommendations.push({
        id: 'financial-health',
        type: 'critical',
        title: 'Santé Financière à surveiller',
        message: 'Des paiements importants sont en retard. Une action rapide est recommandée.',
        icon: DollarSign,
        action: 'Voir Finances',
        route: '/dashboard/finances-groupe',
        metric: 'Action requise',
      });
    }

    // 4. Analyse Staffing
    const staffRatio = stats.totalStaff > 0 ? stats.totalStudents / stats.totalStaff : 0;
    if (staffRatio > 40) {
      recommendations.push({
        id: 'hire-staff',
        type: 'warning',
        title: 'Renforcez vos équipes',
        message: 'Le ratio élèves/personnel est élevé (>40). Pensez à recruter.',
        icon: ShieldAlert,
        action: 'Recruter',
        route: '/dashboard/users?action=create',
        metric: `1:${Math.round(staffRatio)} ratio`,
      });
    } else if (staffRatio < 10 && stats.totalStudents > 100) {
      recommendations.push({
        id: 'optimize-staff',
        type: 'optimization',
        title: 'Optimisation RH',
        message: 'Votre ratio d\'encadrement est très confortable. Vous pouvez accueillir plus d\'élèves.',
        icon: TrendingUp,
        action: 'Voir RH',
        route: '/dashboard/users',
        metric: `1:${Math.round(staffRatio)} ratio`,
      });
    }

    // Défaut si tout va bien
    if (recommendations.length === 0) {
      recommendations.push({
        id: 'all-good',
        type: 'success',
        title: 'Excellente Performance',
        message: 'Tous vos indicateurs sont au vert. Continuez comme ça !',
        icon: Zap,
        action: 'Voir Rapports',
        route: '/dashboard/reports',
        metric: '100% Optimal',
      });
    }

    // Trier par priorité (critical > warning > growth > optimization > success)
    const priorityOrder = { critical: 0, warning: 1, growth: 2, optimization: 3, success: 4 };
    return recommendations.sort((a, b) => priorityOrder[a.type as keyof typeof priorityOrder] - priorityOrder[b.type as keyof typeof priorityOrder])[0];

  }, [stats, alerts]);
};

/**
 * Hook pour gérer les restrictions de plan
 * Vérifie les limites et permissions selon le plan d'abonnement
 * @module usePlanRestrictions
 */

import { useMemo } from 'react';
import { useCurrentUserGroup } from './useCurrentUserGroup';
import {
  PLAN_RESTRICTIONS,
  canPerformAction,
  hasReachedLimit,
  getLimitUsagePercentage,
  getRemainingLimit,
  getRecommendedPlan,
  getLimitErrorMessage,
  type PlanLimits,
} from '../config/planRestrictions';

export const usePlanRestrictions = () => {
  const { data: currentGroup, isLoading } = useCurrentUserGroup();

  const planSlug = currentGroup?.plan || 'gratuit';
  const planLimits = PLAN_RESTRICTIONS[planSlug];

  // Utilisation actuelle
  const currentUsage = useMemo(
    () => ({
      schools: currentGroup?.schoolCount || 0,
      users: (currentGroup?.studentCount || 0) + (currentGroup?.staffCount || 0),
      storage: 0, // TODO: Implémenter avec table files
      modules: currentGroup?.modulesCount || 0, // Nombre de modules actifs
    }),
    [currentGroup]
  );

  // Vérifier si une action est autorisée
  const can = (action: keyof PlanLimits['features']): boolean => {
    return canPerformAction(planSlug, action);
  };

  // Vérifier si une limite est atteinte
  const isLimitReached = (limitType: 'schools' | 'users' | 'storage' | 'modules'): boolean => {
    return hasReachedLimit(planSlug, limitType, currentUsage[limitType]);
  };

  // Obtenir le pourcentage d'utilisation
  const getUsagePercentage = (limitType: 'schools' | 'users' | 'storage' | 'modules'): number => {
    return getLimitUsagePercentage(planSlug, limitType, currentUsage[limitType]);
  };

  // Obtenir les limites restantes
  const getRemaining = (limitType: 'schools' | 'users' | 'storage' | 'modules'): number | null => {
    return getRemainingLimit(planSlug, limitType, currentUsage[limitType]);
  };

  // Obtenir le plan recommandé
  const recommendedPlan = useMemo(() => {
    return getRecommendedPlan(planSlug, currentUsage);
  }, [planSlug, currentUsage]);

  // Obtenir le message d'erreur
  const getErrorMessage = (limitType: 'schools' | 'users' | 'storage' | 'modules'): string => {
    return getLimitErrorMessage(planSlug, limitType);
  };

  // Vérifier si un upgrade est nécessaire
  const needsUpgrade = useMemo(() => {
    return recommendedPlan !== null;
  }, [recommendedPlan]);

  // Obtenir les alertes de limite
  const limitAlerts = useMemo(() => {
    const alerts: Array<{
      type: 'schools' | 'users' | 'storage' | 'modules';
      percentage: number;
      remaining: number | null;
      message: string;
    }> = [];

    (['schools', 'users', 'storage', 'modules'] as const).forEach((limitType) => {
      const percentage = getUsagePercentage(limitType);
      const remaining = getRemaining(limitType);

      if (percentage >= 80 && remaining !== null) {
        alerts.push({
          type: limitType,
          percentage,
          remaining,
          message: `${percentage.toFixed(0)}% utilisé - ${remaining} restant(s)`,
        });
      }
    });

    return alerts;
  }, [currentUsage, planSlug]);

  return {
    // État
    isLoading,
    planSlug,
    planLimits,
    currentUsage,

    // Fonctions de vérification
    can,
    isLimitReached,
    getUsagePercentage,
    getRemaining,
    getErrorMessage,

    // Recommandations
    needsUpgrade,
    recommendedPlan,
    limitAlerts,
  };
};

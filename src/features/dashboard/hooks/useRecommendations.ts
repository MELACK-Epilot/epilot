/**
 * Hook pour générer et gérer les recommandations d'optimisation
 * @module useRecommendations
 */

import { useMemo } from 'react';
import { usePlanAnalytics } from './usePlanAnalytics';
import { generateRecommendations, calculateOptimizationMetrics } from '../utils/recommendation-generator.utils';

export const useRecommendations = () => {
  const { data: analytics, isLoading, error } = usePlanAnalytics();

  const recommendations = useMemo(() => {
    if (!analytics) return [];
    return generateRecommendations(analytics);
  }, [analytics]);

  const metrics = useMemo(() => {
    if (recommendations.length === 0) {
      return { mrrImpact: 0, newClients: 0, churnReduction: 0 };
    }
    return calculateOptimizationMetrics(recommendations);
  }, [recommendations]);

  return {
    recommendations,
    metrics,
    isLoading,
    error,
  };
};

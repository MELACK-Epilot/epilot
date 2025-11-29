/**
 * Hook Recommandations Optimisé
 * @module useRecommendationsOptimized
 */

import { useMemo } from 'react';
import { usePlanAnalyticsOptimized } from './usePlanAnalyticsOptimized';
import { generateRecommendationsOptimized } from '../utils/recommendation-generator-optimized.utils';
import { calculateOptimizationMetrics } from '../utils/recommendation-generator.utils'; // Réutiliser la fonction utilitaire

export const useRecommendationsOptimized = () => {
  const { data: analytics, isLoading, error } = usePlanAnalyticsOptimized();

  const recommendations = useMemo(() => {
    if (!analytics) return [];
    return generateRecommendationsOptimized(analytics);
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

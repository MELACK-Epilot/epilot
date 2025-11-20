/**
 * Types pour le moteur d'optimisation et recommandations
 * @module optimization.types
 */

export type RecommendationType = 'pricing' | 'features' | 'marketing' | 'retention';
export type RecommendationPriority = 'high' | 'medium' | 'low';

export interface Recommendation {
  id: string;
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  description: string;
  impact: string;
  action: string;
  planId?: string;
  planName?: string;
  estimatedMRRImpact?: number;
  estimatedNewClients?: number;
  estimatedChurnReduction?: number;
}

export interface OptimizationMetrics {
  mrrImpact: number;
  newClients: number;
  churnReduction: number;
}

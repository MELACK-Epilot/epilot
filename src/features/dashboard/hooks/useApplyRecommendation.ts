/**
 * Hook pour appliquer une recommandation et tracker son impact
 * @module useApplyRecommendation
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/store/auth.store';
import { toast } from 'sonner';
import type { Recommendation } from '../types/optimization.types';

interface ApplyRecommendationParams {
  recommendation: Recommendation;
  configuration: any;
}

export const useApplyRecommendation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ recommendation, configuration }: ApplyRecommendationParams) => {
      // Insérer dans la table applied_recommendations
      const { data, error } = await supabase
        .from('applied_recommendations')
        .insert({
          recommendation_id: recommendation.id,
          recommendation_type: recommendation.type,
          recommendation_title: recommendation.title,
          recommendation_description: recommendation.description,
          plan_id: recommendation.planId || null,
          plan_name: recommendation.planName || null,
          estimated_mrr_impact: recommendation.estimatedMRRImpact || null,
          estimated_new_clients: recommendation.estimatedNewClients || null,
          estimated_churn_reduction: recommendation.estimatedChurnReduction || null,
          configuration: configuration,
          applied_by: user?.id,
          status: 'applied',
          effective_date: configuration.effectiveDate || new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (error) {
        console.error('Erreur application recommandation:', error);
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: (data, variables) => {
      toast.success('Recommandation appliquée avec succès!', {
        description: `${variables.recommendation.title} - Le suivi de l'impact a commencé.`,
      });

      // Invalider les queries pour rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ['plan-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['applied-recommendations'] });
    },
    onError: (error: any) => {
      toast.error('Erreur lors de l\'application', {
        description: error.message || 'Une erreur est survenue',
      });
    },
  });
};

/**
 * Hook pour récupérer les recommandations appliquées
 */
export const useAppliedRecommendations = () => {
  return useQuery({
    queryKey: ['applied-recommendations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applied_recommendations')
        .select('*')
        .order('applied_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook pour calculer l'impact réel d'une recommandation
 */
export const useCalculateActualImpact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recommendationId, daysAfter = 30 }: { recommendationId: string; daysAfter?: number }) => {
      const { data, error } = await supabase
        .rpc('calculate_actual_impact', {
          p_recommendation_id: recommendationId,
          p_days_after: daysAfter,
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applied-recommendations'] });
      toast.success('Impact réel calculé avec succès');
    },
    onError: (error: any) => {
      toast.error('Erreur calcul impact', {
        description: error.message,
      });
    },
  });
};

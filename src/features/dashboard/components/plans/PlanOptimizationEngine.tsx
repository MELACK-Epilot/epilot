/**
 * Moteur d'optimisation des plans avec recommandations intelligentes
 * Utilise les VRAIES données analytics pour générer des recommandations
 * @module PlanOptimizationEngine
 */

import { useState } from 'react';
import { AlertCircle, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OptimizationHeader } from './components/OptimizationHeader';
import { OptimizationMetrics } from './components/OptimizationMetrics';
import { RecommendationCard } from './components/RecommendationCard';
import { ApplyRecommendationDialog } from './components/ApplyRecommendationDialog';
import { useRecommendations } from '../../hooks/useRecommendations';
import { useApplyRecommendation } from '../../hooks/useApplyRecommendation';
import type { Recommendation } from '../../types/optimization.types';

export const PlanOptimizationEngine = () => {
  const { recommendations, metrics, isLoading, error } = useRecommendations();
  const applyRecommendation = useApplyRecommendation();
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);

  const handleApplyRecommendation = async (recommendation: Recommendation, configuration: any) => {
    await applyRecommendation.mutateAsync({
      recommendation,
      configuration,
    });
  };

  // Gestion du loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Génération des recommandations...</span>
      </div>
    );
  }

  // Gestion des erreurs
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
        <p className="text-red-600 font-medium">Erreur de chargement des recommandations</p>
        <p className="text-sm text-gray-500 mt-1">
          {error.message || 'Une erreur est survenue'}
        </p>
        <Button 
          onClick={() => window.location.reload()} 
          className="mt-4"
          variant="outline"
        >
          Réessayer
        </Button>
      </div>
    );
  }

  // Aucune recommandation
  if (recommendations.length === 0) {
    return (
      <div className="space-y-6">
        <OptimizationHeader count={0} />
        <div className="text-center py-12">
          <Lightbulb className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <div className="text-slate-500">
            Aucune recommandation pour le moment
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Les recommandations apparaîtront lorsque suffisamment de données seront disponibles
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <OptimizationHeader count={recommendations.length} />
      
      <OptimizationMetrics metrics={metrics} />

      <div className="space-y-4">
        {recommendations.map((rec, index) => (
          <RecommendationCard
            key={rec.id}
            recommendation={rec}
            index={index}
            onApply={() => setSelectedRecommendation(rec)}
          />
        ))}
      </div>

      {/* Modal d'application */}
      <ApplyRecommendationDialog
        recommendation={selectedRecommendation}
        open={!!selectedRecommendation}
        onClose={() => setSelectedRecommendation(null)}
        onApply={handleApplyRecommendation}
      />
    </div>
  );
};

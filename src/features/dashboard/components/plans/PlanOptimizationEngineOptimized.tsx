/**
 * Moteur d'optimisation Optimisé - Design "Cockpit IA Futuriste"
 * @module PlanOptimizationEngineOptimized
 */

import { useState } from 'react';
import { AlertCircle, Lightbulb, Sparkles, Rocket, ArrowRight, Check, Zap, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRecommendationsOptimized } from '../../hooks/useRecommendationsOptimized';
import { useApplyRecommendation } from '../../hooks/useApplyRecommendation';
import type { Recommendation } from '../../types/optimization.types';
import { ApplyRecommendationDialog } from './components/ApplyRecommendationDialog';
import { AnimatedContainer, AnimatedItem } from '../AnimatedCard';

export const PlanOptimizationEngineOptimized = () => {
  const { recommendations, metrics, isLoading, error } = useRecommendationsOptimized();
  const applyRecommendation = useApplyRecommendation();
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);

  const handleApplyRecommendation = async (recommendation: Recommendation, configuration: any) => {
    await applyRecommendation.mutateAsync({
      recommendation,
      configuration,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">L'IA analyse vos données...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
        <p className="text-red-600 font-medium">Erreur d'analyse IA</p>
        <p className="text-sm text-gray-500 mt-1">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Futuriste */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f172a] to-[#1e293b] rounded-2xl p-6 text-white shadow-xl border border-slate-700">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-purple-500 rounded-full blur-[80px] opacity-20"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-cyan-500 rounded-full blur-[80px] opacity-20"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-md">
                <Brain className="h-6 w-6 text-purple-400" />
              </div>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
                Moteur d'Optimisation IA
              </span>
            </h2>
            <p className="text-slate-400 mt-2 flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-amber-400" />
              {recommendations.length} opportunités de croissance détectées
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-white/5 rounded-full backdrop-blur-md border border-white/10 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-medium text-slate-300">Impact Potentiel:</span>
              <span className="text-sm font-bold text-green-400">+{(metrics.mrrImpact / 1000).toFixed(0)}K MRR</span>
            </div>
          </div>
        </div>
      </div>

      {/* Métriques d'Impact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase">Gain MRR Potentiel</p>
            <p className="text-2xl font-bold text-green-600">+{(metrics.mrrImpact / 1000).toFixed(0)}K</p>
          </div>
          <div className="p-2 bg-green-50 rounded-lg">
            <Rocket className="h-5 w-5 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase">Clients Sauvés</p>
            <p className="text-2xl font-bold text-blue-600">+{metrics.churnReduction.toFixed(0)}</p>
          </div>
          <div className="p-2 bg-blue-50 rounded-lg">
            <Check className="h-5 w-5 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase">Nouveaux Clients</p>
            <p className="text-2xl font-bold text-purple-600">+{metrics.newClients}</p>
          </div>
          <div className="p-2 bg-purple-50 rounded-lg">
            <Zap className="h-5 w-5 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Liste des Recommandations */}
      <AnimatedContainer className="space-y-4" stagger={0.1}>
        {recommendations.length > 0 ? (
          recommendations.map((rec, index) => {
            const priorityColors = {
              high: { border: 'border-l-red-500', bg: 'bg-red-50/30', badge: 'bg-red-100 text-red-700' },
              medium: { border: 'border-l-amber-500', bg: 'bg-amber-50/30', badge: 'bg-amber-100 text-amber-700' },
              low: { border: 'border-l-blue-500', bg: 'bg-blue-50/30', badge: 'bg-blue-100 text-blue-700' },
            }[rec.priority];

            return (
              <AnimatedItem key={rec.id}>
                <div className={`group relative bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-slate-200 border-l-4 ${priorityColors.border} ${priorityColors.bg}`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${priorityColors.badge}`}>
                          Priorité {rec.priority}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                          {rec.title}
                        </h3>
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        {rec.description}
                      </p>
                      
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded border border-green-100">
                          <Rocket className="h-3 w-3" />
                          Impact: {rec.impact}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 min-w-[200px]">
                      <Button 
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-lg hover:shadow-xl transition-all group-hover:translate-x-1"
                        onClick={() => setSelectedRecommendation(rec)}
                      >
                        <Zap className="w-4 h-4 mr-2 text-yellow-400 fill-current" />
                        Appliquer l'action
                        <ArrowRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Button>
                      <p className="text-xs text-center text-slate-400 italic">
                        Action IA automatisée
                      </p>
                    </div>
                  </div>
                </div>
              </AnimatedItem>
            );
          })
        ) : (
          <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
            <Lightbulb className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">Tout est optimisé !</h3>
            <p className="text-slate-500 max-w-md mx-auto mt-2">
              L'IA n'a détecté aucune nouvelle opportunité d'optimisation pour le moment. Continuez comme ça !
            </p>
          </div>
        )}
      </AnimatedContainer>

      {/* Modal d'application (inchangé car fonctionnel) */}
      <ApplyRecommendationDialog
        recommendation={selectedRecommendation}
        open={!!selectedRecommendation}
        onClose={() => setSelectedRecommendation(null)}
        onApply={handleApplyRecommendation}
      />
    </div>
  );
};

/**
 * Widget Insights IA Super Admin
 * Recommandations stratégiques pour la plateforme E-Pilot
 */

import { Zap, TrendingUp, Target, Sparkles, ArrowRight, Download, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useSuperAdminInsights, type SuperAdminInsight } from '../../hooks/useSuperAdminInsights';

const SuperAdminInsightsWidget = () => {
  const navigate = useNavigate();

  // Récupérer les insights depuis le hook
  const { data: insights = [], isLoading } = useSuperAdminInsights();

  const getImpactColor = (impact: SuperAdminInsight['impact']) => {
    switch (impact) {
      case 'high':
        return 'from-green-500 to-emerald-600';
      case 'medium':
        return 'from-blue-500 to-cyan-600';
      case 'low':
        return 'from-gray-400 to-gray-500';
    }
  };

  const getTypeIcon = (type: SuperAdminInsight['type']) => {
    switch (type) {
      case 'opportunity':
        return <Target className="h-5 w-5" />;
      case 'recommendation':
        return <Sparkles className="h-5 w-5" />;
      case 'trend':
        return <TrendingUp className="h-5 w-5" />;
      case 'alert':
        return <Zap className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-purple-200 rounded w-1/3" />
          <div className="h-20 bg-purple-100 rounded" />
          <div className="h-20 bg-purple-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 rounded-xl border border-purple-200 p-6 hover:shadow-xl transition-shadow">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl shadow-lg">
          <Zap className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Insights & Recommandations</h3>
          <p className="text-sm text-gray-600">Propulsé par l'IA</p>
        </div>
        <span className="ml-auto px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full animate-pulse">
          IA
        </span>
      </div>

      {/* Liste des insights */}
      <div className="space-y-4">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className="bg-white rounded-lg p-4 border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all"
          >
            <div className="flex items-start gap-3">
              {/* Icône */}
              <div className={`p-2 bg-gradient-to-br ${getImpactColor(insight.impact)} rounded-lg text-white flex-shrink-0`}>
                {getTypeIcon(insight.type)}
              </div>

              {/* Contenu */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">
                  {insight.title}
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  {insight.description}
                </p>

                {/* Tendance */}
                {insight.trend !== undefined && insight.trend !== 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`flex items-center gap-1 text-sm font-medium ${
                      insight.trend > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <TrendingUp className={`h-4 w-4 ${insight.trend < 0 ? 'rotate-180' : ''}`} />
                      {Math.abs(insight.trend).toFixed(1)}%
                    </div>
                  </div>
                )}

                {/* Action */}
                {insight.actionUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => navigate(insight.actionUrl!)}
                  >
                    {insight.actionLabel || 'En savoir plus'}
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>

              {/* Badge impact */}
              <div className={`px-2 py-1 rounded text-xs font-bold ${
                insight.impact === 'high'
                  ? 'bg-green-100 text-green-700'
                  : insight.impact === 'medium'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {insight.impact === 'high' ? 'Priorité' : insight.impact === 'medium' ? 'Important' : 'Info'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-purple-200">
        <p className="text-xs text-gray-500 text-center">
          Mis à jour il y a quelques instants • Basé sur l'analyse de vos données
        </p>
      </div>
    </div>
  );
};

export default SuperAdminInsightsWidget;

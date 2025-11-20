/**
 * Card individuelle pour une recommandation
 */

import { TrendingUp, Zap, Lightbulb, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Recommendation } from '../../../types/optimization.types';

interface RecommendationCardProps {
  recommendation: Recommendation;
  index: number;
  onApply: () => void;
}

export const RecommendationCard = ({ recommendation, index, onApply }: RecommendationCardProps) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' };
      case 'medium':
        return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' };
      case 'low':
        return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' };
      default:
        return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pricing':
        return TrendingUp;
      case 'features':
        return Zap;
      case 'marketing':
        return Lightbulb;
      case 'retention':
        return CheckCircle2;
      default:
        return AlertTriangle;
    }
  };

  const priorityColor = getPriorityColor(recommendation.priority);
  const TypeIcon = getTypeIcon(recommendation.type);

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        {/* Numéro */}
        <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center font-bold text-slate-700 flex-shrink-0">
          {index + 1}
        </div>

        {/* Contenu */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <TypeIcon className="w-4 h-4 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{recommendation.title}</h3>
            </div>
            <Badge 
              variant="outline" 
              className={`${priorityColor.bg} ${priorityColor.text} border ${priorityColor.border}`}
            >
              {recommendation.priority === 'high' ? '🔴 Haute' :
               recommendation.priority === 'medium' ? '🟠 Moyenne' :
               '🔵 Basse'}
            </Badge>
          </div>

          <p className="text-slate-600 mb-4">{recommendation.description}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <div className="text-xs text-slate-500">Impact Estimé</div>
                <div className="font-semibold text-green-600">{recommendation.impact}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Action Recommandée</div>
                <div className="font-medium text-slate-900">{recommendation.action}</div>
              </div>
            </div>

            <Button
              size="sm"
              onClick={onApply}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              Appliquer
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

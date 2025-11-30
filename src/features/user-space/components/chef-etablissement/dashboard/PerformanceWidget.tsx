/**
 * PerformanceWidget - Widget des performances académiques
 * Affiche le taux de réussite et les tendances
 * 
 * @module ChefEtablissement/Components
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown,
  Minus,
  ChevronRight,
  Award,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { PerformanceWidgetData, TrendDirection } from '../../../types/chef-etablissement.types';

interface PerformanceWidgetProps {
  readonly data: PerformanceWidgetData;
  readonly onViewDetails?: () => void;
}

/**
 * Icône de tendance
 */
const TrendIcon = ({ trend, className }: { trend: TrendDirection; className?: string }) => {
  switch (trend) {
    case 'up':
      return <TrendingUp className={className} />;
    case 'down':
      return <TrendingDown className={className} />;
    default:
      return <Minus className={className} />;
  }
};

/**
 * Couleur de tendance
 */
const getTrendColor = (trend: TrendDirection): string => {
  switch (trend) {
    case 'up':
      return 'text-green-600';
    case 'down':
      return 'text-red-600';
    default:
      return 'text-gray-500';
  }
};

/**
 * Widget des performances
 */
export const PerformanceWidget = memo<PerformanceWidgetProps>(({
  data,
  onViewDetails,
}) => {
  // Couleur du taux de réussite
  const successColor = data.successRate >= 80 
    ? 'text-green-600' 
    : data.successRate >= 60 
      ? 'text-amber-600' 
      : 'text-red-600';

  return (
    <Card className="border-0 shadow-lg h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="p-1.5 bg-green-100 rounded-lg">
              <BarChart3 className="h-4 w-4 text-green-600" />
            </div>
            Performances
          </CardTitle>
          <Badge 
            variant="secondary" 
            className="bg-green-100 text-green-700"
          >
            {data.averageGrade.toFixed(1)}/20
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Taux de réussite principal */}
        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
          <p className="text-sm text-gray-600 mb-1">Taux de réussite</p>
          <p className={`text-4xl font-bold ${successColor}`}>
            {data.successRate.toFixed(1)}%
          </p>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-2 gap-3">
          {/* Top performers */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-green-50 rounded-lg text-center"
          >
            <Award className="h-5 w-5 text-green-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-green-600">{data.topPerformers}</p>
            <p className="text-xs text-gray-500">Excellents</p>
          </motion.div>

          {/* À risque */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-3 bg-amber-50 rounded-lg text-center"
          >
            <AlertTriangle className="h-5 w-5 text-amber-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-amber-600">{data.atRisk}</p>
            <p className="text-xs text-gray-500">À surveiller</p>
          </motion.div>
        </div>

        {/* Performances par matière */}
        {data.bySubject.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Par matière
            </p>
            <div className="space-y-2">
              {data.bySubject.slice(0, 3).map((subject, index) => (
                <motion.div
                  key={subject.subjectId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm font-medium text-gray-700">
                    {subject.subjectName}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">
                      {subject.average.toFixed(1)}
                    </span>
                    <TrendIcon 
                      trend={subject.trend} 
                      className={`h-4 w-4 ${getTrendColor(subject.trend)}`} 
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Mini graphique de tendance */}
        {data.monthlyTrend.length > 0 && (
          <div className="pt-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Évolution
            </p>
            <div className="flex items-end justify-between h-12 gap-1">
              {data.monthlyTrend.map((month, index) => {
                const height = (month.rate / 100) * 100;
                return (
                  <motion.div
                    key={month.month}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    className="flex-1 bg-green-500 rounded-t-sm relative group"
                    title={`${month.month}: ${month.rate}%`}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      {month.rate}%
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <div className="flex justify-between mt-1">
              {data.monthlyTrend.map(month => (
                <span key={month.month} className="text-xs text-gray-400 flex-1 text-center">
                  {month.month}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bouton voir plus */}
        {onViewDetails && (
          <Button
            variant="ghost"
            className="w-full text-green-600 hover:text-green-700 hover:bg-green-50"
            onClick={onViewDetails}
          >
            Voir les détails
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
});

PerformanceWidget.displayName = 'PerformanceWidget';

export default PerformanceWidget;

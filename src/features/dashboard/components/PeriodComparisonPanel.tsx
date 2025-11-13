/**
 * Panneau de comparaison entre périodes
 * Compare N vs N-1 avec évolution en %
 */

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';

interface PeriodData {
  revenue: number;
  expenses: number;
  profit: number;
  margin: number;
  overdue: number;
  recovery: number;
}

interface PeriodComparisonPanelProps {
  currentPeriod: PeriodData;
  previousPeriod: PeriodData;
  currentLabel?: string;
  previousLabel?: string;
}

export const PeriodComparisonPanel = ({
  currentPeriod,
  previousPeriod,
  currentLabel = 'Période actuelle',
  previousLabel = 'Période précédente',
}: PeriodComparisonPanelProps) => {
  
  const formatCurrency = (amount: number) => {
    return `${(amount / 1000000).toFixed(2)}M FCFA`;
  };

  const calculateEvolution = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const renderEvolution = (current: number, previous: number, isPositiveGood = true) => {
    const evolution = calculateEvolution(current, previous);
    const isPositive = evolution > 0;
    const isGood = isPositiveGood ? isPositive : !isPositive;
    
    if (Math.abs(evolution) < 0.1) {
      return (
        <div className="flex items-center gap-1 text-gray-600">
          <Minus className="w-4 h-4" />
          <span className="text-sm font-medium">Stable</span>
        </div>
      );
    }

    return (
      <div className={`flex items-center gap-1 ${isGood ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? (
          <TrendingUp className="w-4 h-4" />
        ) : (
          <TrendingDown className="w-4 h-4" />
        )}
        <span className="text-sm font-medium">
          {isPositive ? '+' : ''}{evolution.toFixed(1)}%
        </span>
      </div>
    );
  };

  const metrics = [
    {
      label: 'Revenus',
      current: currentPeriod.revenue,
      previous: previousPeriod.revenue,
      isPositiveGood: true,
      color: 'text-[#2A9D8F]',
    },
    {
      label: 'Dépenses',
      current: currentPeriod.expenses,
      previous: previousPeriod.expenses,
      isPositiveGood: false,
      color: 'text-[#E63946]',
    },
    {
      label: 'Profit',
      current: currentPeriod.profit,
      previous: previousPeriod.profit,
      isPositiveGood: true,
      color: 'text-blue-600',
    },
    {
      label: 'Marge',
      current: currentPeriod.margin,
      previous: previousPeriod.margin,
      isPositiveGood: true,
      color: 'text-purple-600',
      isPercentage: true,
    },
    {
      label: 'Retards',
      current: currentPeriod.overdue,
      previous: previousPeriod.overdue,
      isPositiveGood: false,
      color: 'text-orange-600',
    },
    {
      label: 'Recouvrement',
      current: currentPeriod.recovery,
      previous: previousPeriod.recovery,
      isPositiveGood: true,
      color: 'text-teal-600',
      isPercentage: true,
    },
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Comparaison Périodes</h3>
        <div className="flex items-center gap-3">
          <Badge variant="outline">{previousLabel}</Badge>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <Badge className="bg-blue-600">{currentLabel}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="p-4 hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">{metric.label}</span>
                {renderEvolution(metric.current, metric.previous, metric.isPositiveGood)}
              </div>

              <div className="space-y-2">
                {/* Période actuelle */}
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-gray-500">{currentLabel}</span>
                  <span className={`text-lg font-bold ${metric.color}`}>
                    {metric.isPercentage
                      ? `${metric.current.toFixed(1)}%`
                      : formatCurrency(metric.current)}
                  </span>
                </div>

                {/* Période précédente */}
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-gray-500">{previousLabel}</span>
                  <span className="text-sm text-gray-600">
                    {metric.isPercentage
                      ? `${metric.previous.toFixed(1)}%`
                      : formatCurrency(metric.previous)}
                  </span>
                </div>

                {/* Barre de progression */}
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      calculateEvolution(metric.current, metric.previous) > 0
                        ? metric.isPositiveGood
                          ? 'bg-green-500'
                          : 'bg-red-500'
                        : metric.isPositiveGood
                        ? 'bg-red-500'
                        : 'bg-green-500'
                    } transition-all`}
                    style={{
                      width: `${Math.min(
                        Math.abs(calculateEvolution(metric.current, metric.previous)),
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Résumé global */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Performance Globale</p>
            <div className="flex items-center justify-center gap-2">
              {calculateEvolution(currentPeriod.profit, previousPeriod.profit) > 0 ? (
                <>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="text-xl font-bold text-green-600">En hausse</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  <span className="text-xl font-bold text-red-600">En baisse</span>
                </>
              )}
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Écart Profit</p>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(Math.abs(currentPeriod.profit - previousPeriod.profit))}
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Évolution Marge</p>
            <p className={`text-xl font-bold ${
              currentPeriod.margin > previousPeriod.margin ? 'text-green-600' : 'text-red-600'
            }`}>
              {currentPeriod.margin > previousPeriod.margin ? '+' : ''}
              {(currentPeriod.margin - previousPeriod.margin).toFixed(1)} pts
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};

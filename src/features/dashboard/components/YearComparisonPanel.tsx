/**
 * Composant Comparaison Année N vs N-1
 * Affiche l'évolution des métriques financières
 */

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, CreditCard, PiggyBank, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useYearComparison } from '../hooks/useYearComparison';
import { formatCurrency } from '@/utils/formatters';

export function YearComparisonPanel() {
  const { data: comparison, isLoading } = useYearComparison();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#2A9D8F]" />
            Comparaison N vs N-1
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!comparison) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#2A9D8F]" />
            Comparaison N vs N-1
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            Données insuffisantes pour la comparaison
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  const metrics = [
    {
      label: 'Revenus',
      icon: DollarSign,
      current: comparison.current_revenue,
      previous: comparison.previous_revenue,
      growth: comparison.revenue_growth,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
    },
    {
      label: 'Dépenses',
      icon: CreditCard,
      current: comparison.current_expenses,
      previous: comparison.previous_expenses,
      growth: comparison.expenses_growth,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      invertGrowth: true, // Croissance négative = bon
    },
    {
      label: 'Profit Net',
      icon: PiggyBank,
      current: comparison.current_profit,
      previous: comparison.previous_profit,
      growth: comparison.profit_growth,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#2A9D8F]" />
          Comparaison {currentYear} vs {previousYear}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            const isPositiveGrowth = metric.invertGrowth 
              ? metric.growth < 0 
              : metric.growth > 0;
            const growthColor = isPositiveGrowth ? 'text-green-600' : 'text-red-600';
            const GrowthIcon = isPositiveGrowth ? TrendingUp : TrendingDown;

            return (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 ${metric.bgColor} rounded-xl border-2 border-transparent hover:border-gray-300 transition-all duration-300`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${metric.color}`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${isPositiveGrowth ? 'bg-green-100' : 'bg-red-100'}`}>
                    <GrowthIcon className={`w-4 h-4 ${growthColor}`} />
                    <span className={`text-xs font-bold ${growthColor}`}>
                      {Math.abs(metric.growth).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Label */}
                <p className="text-sm font-medium text-gray-600 mb-2">
                  {metric.label}
                </p>

                {/* Valeurs */}
                <div className="space-y-2">
                  {/* Année actuelle */}
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{currentYear}</span>
                      <span className={`text-lg font-bold ${metric.textColor}`}>
                        {formatCurrency(metric.current)}
                      </span>
                    </div>
                  </div>

                  {/* Séparateur */}
                  <div className="border-t border-gray-300" />

                  {/* Année précédente */}
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{previousYear}</span>
                      <span className="text-sm font-medium text-gray-600">
                        {formatCurrency(metric.previous)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Différence absolue */}
                <div className="mt-3 pt-3 border-t border-gray-300">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Différence</span>
                    <span className={`font-bold ${growthColor}`}>
                      {metric.current > metric.previous ? '+' : ''}
                      {formatCurrency(metric.current - metric.previous)}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Résumé global */}
        <div className="mt-6 p-4 bg-gradient-to-r from-[#2A9D8F]/10 to-[#1D3557]/10 rounded-xl border border-[#2A9D8F]/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Performance Globale</p>
              <p className="text-xs text-gray-500 mt-1">
                {comparison.current_payments} paiements complétés cette année
              </p>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold ${comparison.profit_growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {comparison.profit_growth >= 0 ? '+' : ''}{comparison.profit_growth.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500">Croissance du profit</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

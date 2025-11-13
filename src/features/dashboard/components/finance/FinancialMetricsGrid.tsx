/**
 * FinancialMetricsGrid - Grille de métriques financières avancées
 * ARPU, Churn Rate, Conversion Rate, LTV
 * @module FinancialMetricsGrid
 */

import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, DollarSign, Target, AlertCircle } from 'lucide-react';
import { FinancialKPIs } from '../../hooks/useFinancialKPIs';

interface FinancialMetricsGridProps {
  kpis?: FinancialKPIs;
  isLoading?: boolean;
}

export const FinancialMetricsGrid = ({ kpis, isLoading }: FinancialMetricsGridProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </Card>
        ))}
      </div>
    );
  }

  if (!kpis) return null;

  const metrics = [
    {
      title: 'ARPU',
      value: `${(kpis.arpu / 1000).toFixed(1)}K`,
      subtitle: 'Revenu moyen par utilisateur',
      icon: DollarSign,
      color: 'text-[#E9C46A]',
      bgColor: 'bg-[#E9C46A]/10',
      description: 'Revenu moyen généré par abonnement actif',
      trend: kpis.arpu > 0 ? 'up' : 'neutral',
    },
    {
      title: 'Taux de Conversion',
      value: `${kpis.conversionRate.toFixed(1)}%`,
      subtitle: 'Groupes avec abonnement',
      icon: Target,
      color: 'text-[#2A9D8F]',
      bgColor: 'bg-[#2A9D8F]/10',
      description: `${kpis.activeSubscriptionsCount} / ${kpis.totalGroupsCount} groupes`,
      trend: kpis.conversionRate > 50 ? 'up' : kpis.conversionRate > 25 ? 'neutral' : 'down',
    },
    {
      title: 'Churn Rate',
      value: `${kpis.churnRate.toFixed(1)}%`,
      subtitle: 'Taux d\'attrition',
      icon: AlertCircle,
      color: 'text-[#E63946]',
      bgColor: 'bg-[#E63946]/10',
      description: `${kpis.canceledSubscriptionsCount} annulations`,
      trend: kpis.churnRate < 5 ? 'up' : kpis.churnRate < 10 ? 'neutral' : 'down',
    },
    {
      title: 'LTV',
      value: `${(kpis.ltv / 1000).toFixed(1)}K`,
      subtitle: 'Lifetime Value',
      icon: Users,
      color: 'text-[#1D3557]',
      bgColor: 'bg-[#1D3557]/10',
      description: 'Valeur vie client estimée',
      trend: kpis.ltv > kpis.arpu * 10 ? 'up' : 'neutral',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-[#2A9D8F]" />
          Métriques Avancées
        </h2>
        <p className="text-sm text-gray-500">
          Indicateurs de performance financière
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          const TrendIcon = metric.trend === 'up' ? TrendingUp : metric.trend === 'down' ? TrendingDown : null;

          return (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow duration-300 group">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${metric.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`h-5 w-5 ${metric.color}`} />
                </div>
                {TrendIcon && (
                  <TrendIcon 
                    className={`h-4 w-4 ${
                      metric.trend === 'up' ? 'text-green-500' : 'text-red-500'
                    }`} 
                  />
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
                <p className="text-xs text-gray-500">{metric.subtitle}</p>
                <p className="text-xs text-gray-400 mt-2">{metric.description}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Explications des métriques */}
      <Card className="p-4 bg-blue-50/50 border-blue-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-700 space-y-1">
            <p className="font-medium text-gray-900">À propos des métriques :</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li><strong>ARPU</strong> : Revenu moyen par abonnement actif (plus c'est élevé, mieux c'est)</li>
              <li><strong>Taux de Conversion</strong> : Pourcentage de groupes qui ont un abonnement actif</li>
              <li><strong>Churn Rate</strong> : Pourcentage d'abonnements annulés (plus c'est bas, mieux c'est)</li>
              <li><strong>LTV</strong> : Valeur totale estimée d'un client sur toute sa durée de vie</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

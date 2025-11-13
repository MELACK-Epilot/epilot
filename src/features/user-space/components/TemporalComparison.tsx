/**
 * Composant de comparaisons temporelles
 * Affiche les évolutions et comparaisons entre différentes périodes
 */

import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Users,
  Target,
  DollarSign,
  BookOpen,
  ArrowRight,
  BarChart3
} from 'lucide-react';

interface PeriodData {
  period: string;
  label: string;
  data: {
    eleves: number;
    classes: number;
    enseignants: number;
    taux_reussite: number;
    revenus: number;
  };
}

interface TemporalComparisonProps {
  currentPeriod: PeriodData;
  previousPeriod: PeriodData;
  comparisonType: 'month' | 'quarter' | 'year';
  onComparisonTypeChange: (type: 'month' | 'quarter' | 'year') => void;
  className?: string;
}

const TemporalComparison = memo(({ 
  currentPeriod, 
  previousPeriod, 
  comparisonType,
  onComparisonTypeChange,
  className = '' 
}: TemporalComparisonProps) => {

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, percentage: 0 };
    const percentage = ((current - previous) / previous) * 100;
    const value = current - previous;
    return { value, percentage };
  };

  const metrics = [
    {
      key: 'eleves',
      label: 'Élèves',
      icon: Users,
      color: 'blue',
      format: (value: number) => value.toString(),
      current: currentPeriod.data.eleves,
      previous: previousPeriod.data.eleves
    },
    {
      key: 'classes',
      label: 'Classes',
      icon: BookOpen,
      color: 'green',
      format: (value: number) => value.toString(),
      current: currentPeriod.data.classes,
      previous: previousPeriod.data.classes
    },
    {
      key: 'enseignants',
      label: 'Enseignants',
      icon: Users,
      color: 'purple',
      format: (value: number) => value.toString(),
      current: currentPeriod.data.enseignants,
      previous: previousPeriod.data.enseignants
    },
    {
      key: 'taux_reussite',
      label: 'Taux Réussite',
      icon: Target,
      color: 'orange',
      format: (value: number) => `${value}%`,
      current: currentPeriod.data.taux_reussite,
      previous: previousPeriod.data.taux_reussite
    },
    {
      key: 'revenus',
      label: 'Revenus',
      icon: DollarSign,
      color: 'emerald',
      format: (value: number) => `${(value / 1000000).toFixed(1)}M`,
      current: currentPeriod.data.revenus,
      previous: previousPeriod.data.revenus
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600 bg-blue-500/20 text-blue-100',
      green: 'from-green-500 to-green-600 bg-green-500/20 text-green-100',
      purple: 'from-purple-500 to-purple-600 bg-purple-500/20 text-purple-100',
      orange: 'from-orange-500 to-orange-600 bg-orange-500/20 text-orange-100',
      emerald: 'from-emerald-500 to-emerald-600 bg-emerald-500/20 text-emerald-100'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getComparisonLabel = (type: 'month' | 'quarter' | 'year') => {
    switch (type) {
      case 'month': return 'mois précédent';
      case 'quarter': return 'trimestre précédent';
      case 'year': return 'année précédente';
      default: return 'période précédente';
    }
  };

  return (
    <Card className={`p-6 bg-white border-0 shadow-lg rounded-2xl ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-md">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Comparaisons Temporelles</h3>
            <p className="text-sm text-gray-600">
              {currentPeriod.label} vs {getComparisonLabel(comparisonType)}
            </p>
          </div>
        </div>
        
        {/* Sélecteur de type de comparaison */}
        <div className="flex items-center gap-2">
          {(['month', 'quarter', 'year'] as const).map((type) => (
            <Button
              key={type}
              variant={comparisonType === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => onComparisonTypeChange(type)}
              className={`gap-2 ${
                comparisonType === type 
                  ? 'bg-indigo-500 hover:bg-indigo-600 text-white' 
                  : 'text-gray-600 hover:text-indigo-600'
              }`}
            >
              <Calendar className="h-4 w-4" />
              {type === 'month' && 'Mois'}
              {type === 'quarter' && 'Trimestre'}
              {type === 'year' && 'Année'}
            </Button>
          ))}
        </div>
      </div>

      {/* Comparaisons par métrique */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric) => {
          const change = calculateChange(metric.current, metric.previous);
          const isPositive = change.percentage > 0;
          const isNegative = change.percentage < 0;
          const IconComponent = metric.icon;
          const colorClasses = getColorClasses(metric.color);
          const [gradient, iconBg, iconColor] = colorClasses.split(' ');

          return (
            <motion.div
              key={metric.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: metrics.indexOf(metric) * 0.1 }}
              className="bg-gradient-to-br from-gray-50 to-white p-5 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200"
            >
              {/* Header de la métrique */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-sm`}>
                    <IconComponent className={`h-5 w-5 ${iconColor}`} />
                  </div>
                  <span className="font-medium text-gray-900">{metric.label}</span>
                </div>
                
                {/* Indicateur de tendance */}
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  isPositive ? 'bg-green-100 text-green-700' :
                  isNegative ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {isPositive && <TrendingUp className="h-3 w-3" />}
                  {isNegative && <TrendingDown className="h-3 w-3" />}
                  {Math.abs(change.percentage).toFixed(1)}%
                </div>
              </div>

              {/* Comparaison des valeurs */}
              <div className="space-y-3">
                {/* Période actuelle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{currentPeriod.label}</span>
                  <span className="text-lg font-bold text-gray-900">
                    {metric.format(metric.current)}
                  </span>
                </div>

                {/* Flèche de comparaison */}
                <div className="flex items-center justify-center">
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>

                {/* Période précédente */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{previousPeriod.label}</span>
                  <span className="text-sm font-medium text-gray-600">
                    {metric.format(metric.previous)}
                  </span>
                </div>

                {/* Différence absolue */}
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Différence</span>
                    <span className={`text-sm font-medium ${
                      isPositive ? 'text-green-600' :
                      isNegative ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {isPositive ? '+' : ''}{metric.key === 'revenus' 
                        ? `${(change.value / 1000000).toFixed(1)}M`
                        : metric.key === 'taux_reussite'
                        ? `${change.value.toFixed(1)}%`
                        : change.value.toString()
                      }
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Résumé global */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-white" />
          </div>
          <h4 className="font-semibold text-blue-900">Résumé de la période</h4>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <p className="text-blue-600 font-medium">Métriques en hausse</p>
            <p className="text-2xl font-bold text-blue-900">
              {metrics.filter(m => calculateChange(m.current, m.previous).percentage > 0).length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-blue-600 font-medium">Métriques stables</p>
            <p className="text-2xl font-bold text-blue-900">
              {metrics.filter(m => calculateChange(m.current, m.previous).percentage === 0).length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-blue-600 font-medium">Métriques en baisse</p>
            <p className="text-2xl font-bold text-blue-900">
              {metrics.filter(m => calculateChange(m.current, m.previous).percentage < 0).length}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
});

TemporalComparison.displayName = 'TemporalComparison';

export default TemporalComparison;

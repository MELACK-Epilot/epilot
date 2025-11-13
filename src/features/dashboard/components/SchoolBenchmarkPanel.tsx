/**
 * Panel de benchmarking - Comparaison avec autres écoles du groupe
 * Affiche la position, les écarts, et les classements
 */

import { TrendingUp, TrendingDown, Award, Target, Users, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSchoolBenchmark } from '../hooks/useSchoolPayments';

interface SchoolBenchmarkPanelProps {
  schoolId: string;
}

export const SchoolBenchmarkPanel = ({ schoolId }: SchoolBenchmarkPanelProps) => {
  const { data: benchmark, isLoading } = useSchoolBenchmark(schoolId);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (!benchmark) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return `${(amount / 1000000).toFixed(2)}M FCFA`;
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getPerformanceColor = (value: number) => {
    if (value >= 10) return 'text-green-600';
    if (value >= 0) return 'text-blue-600';
    if (value >= -10) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPerformanceBg = (value: number) => {
    if (value >= 10) return 'bg-green-50 border-green-200';
    if (value >= 0) return 'bg-blue-50 border-blue-200';
    if (value >= -10) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              Benchmarking
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Comparaison avec les {benchmark.totalSchoolsInGroup - 1} autres écoles du groupe
            </p>
          </div>
        </div>

        {/* Classements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Classement Revenus */}
          <div className={`p-4 rounded-lg border-2 ${getPerformanceBg(benchmark.revenueVsAvgPct)}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-900">Revenus</span>
              </div>
              <Badge variant="outline" className="text-lg font-bold">
                #{benchmark.revenueRank}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">
                  {formatCurrency(benchmark.totalRevenue)}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">vs moyenne groupe :</span>
                <span className={`font-semibold ${getPerformanceColor(benchmark.revenueVsAvgPct)}`}>
                  {formatPercentage(benchmark.revenueVsAvgPct)}
                </span>
                {benchmark.revenueVsAvgPct >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
              </div>

              <div className="text-xs text-gray-600">
                Moyenne groupe : {formatCurrency(benchmark.groupAvgRevenue)}
              </div>
            </div>
          </div>

          {/* Classement Recouvrement */}
          <div className={`p-4 rounded-lg border-2 ${getPerformanceBg(benchmark.recoveryVsAvgPoints)}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-900">Recouvrement</span>
              </div>
              <Badge variant="outline" className="text-lg font-bold">
                #{benchmark.recoveryRank}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">
                  {benchmark.recoveryRate.toFixed(1)}%
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">vs moyenne groupe :</span>
                <span className={`font-semibold ${getPerformanceColor(benchmark.recoveryVsAvgPoints)}`}>
                  {benchmark.recoveryVsAvgPoints >= 0 ? '+' : ''}
                  {benchmark.recoveryVsAvgPoints.toFixed(1)} points
                </span>
                {benchmark.recoveryVsAvgPoints >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
              </div>

              <div className="text-xs text-gray-600">
                Moyenne groupe : {benchmark.groupAvgRecoveryRate.toFixed(1)}%
              </div>

              <Progress 
                value={benchmark.recoveryRate} 
                className="h-2"
              />
            </div>
          </div>
        </div>

        {/* Comparaisons détaillées */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Comparaison détaillée</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Profit */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Profit Net</div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(benchmark.netProfit)}
                </span>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Moy. groupe : {formatCurrency(benchmark.groupAvgProfit)}
              </div>
            </div>

            {/* Dépenses */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Dépenses</div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(benchmark.totalExpenses)}
                </span>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Moy. groupe : {formatCurrency(benchmark.groupAvgExpenses)}
              </div>
            </div>

            {/* Élèves */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                <Users className="w-3 h-3" />
                Élèves
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-gray-900">
                  {benchmark.totalStudents}
                </span>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Moy. groupe : {Math.round(benchmark.groupAvgStudents)}
              </div>
            </div>
          </div>
        </div>

        {/* Message de performance */}
        <div className={`p-4 rounded-lg border-2 ${
          benchmark.revenueRank === 1 && benchmark.recoveryRank === 1
            ? 'bg-green-50 border-green-200'
            : benchmark.revenueRank <= 3 || benchmark.recoveryRank <= 3
            ? 'bg-blue-50 border-blue-200'
            : 'bg-orange-50 border-orange-200'
        }`}>
          <div className="flex items-start gap-3">
            {benchmark.revenueRank === 1 && benchmark.recoveryRank === 1 ? (
              <>
                <Award className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-gray-900">🏆 École Leader du Groupe !</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Félicitations ! Vous êtes 1er en revenus ET en recouvrement. 
                    Continuez sur cette lancée !
                  </p>
                </div>
              </>
            ) : benchmark.revenueRank <= 3 || benchmark.recoveryRank <= 3 ? (
              <>
                <TrendingUp className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-gray-900">📈 Bonne Performance</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Vous êtes dans le top 3 du groupe. 
                    {benchmark.revenueRank > 1 && ' Améliorez vos revenus pour atteindre la 1ère place.'}
                    {benchmark.recoveryRank > 1 && ' Optimisez votre recouvrement pour progresser.'}
                  </p>
                </div>
              </>
            ) : (
              <>
                <Target className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-gray-900">🎯 Marge de Progression</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Vous êtes en position {benchmark.revenueRank}/{benchmark.totalSchoolsInGroup}. 
                    Analysez les meilleures pratiques des écoles leaders pour améliorer vos résultats.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

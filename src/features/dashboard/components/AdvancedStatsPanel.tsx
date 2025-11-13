/**
 * Panneau de statistiques avancées
 * Métriques détaillées et comparaisons
 * UTILISE LES VRAIES DONNÉES depuis advanced_financial_stats
 */

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  School, 
  Target,
  Award,
  AlertCircle
} from 'lucide-react';
import { useAdvancedStats } from '../hooks/useAdvancedStats';

interface AdvancedStatsPanelProps {
  stats: {
    totalSchools: number;
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
    totalOverdue: number;
    globalRecoveryRate: number;
    monthlyRevenue: number;
    monthlyExpenses: number;
  };
  schools: Array<{
    schoolName: string;
    totalRevenue: number;
    netProfit: number;
    recoveryRate: number;
  }>;
}

export const AdvancedStatsPanel = ({ stats, schools }: AdvancedStatsPanelProps) => {
  // ✅ UTILISER LES VRAIES DONNÉES depuis la vue SQL
  const { data: advancedStats } = useAdvancedStats();

  const formatCurrency = (amount: number) => {
    return `${(amount / 1000000).toFixed(2)}M FCFA`;
  };

  // ✅ CALCULS DEPUIS LA VUE SQL (données réelles)
  const revenuePerSchool = advancedStats?.revenue_per_school || (stats.totalRevenue / stats.totalSchools);
  const monthlyGrowth = advancedStats?.monthly_growth_rate || 0;
  const globalRecoveryRate = advancedStats?.global_recovery_rate || stats.globalRecoveryRate;
  const overdueToRevenueRatio = advancedStats?.overdue_to_revenue_ratio || 
    (stats.totalRevenue > 0 ? (stats.totalOverdue / stats.totalRevenue) * 100 : 0);
  
  // Top 3 écoles
  const topSchools = [...schools]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 3);

  // École la plus performante (meilleur taux recouvrement)
  const bestPerformer = [...schools]
    .sort((a, b) => b.recoveryRate - a.recoveryRate)[0];

  // École nécessitant attention (pire taux recouvrement)
  const needsAttention = [...schools]
    .sort((a, b) => a.recoveryRate - b.recoveryRate)[0];

  const statCards = [
    {
      title: 'Revenus par École',
      value: formatCurrency(revenuePerSchool),
      icon: School,
      color: 'bg-blue-100 text-blue-600',
      trend: null,
    },
    {
      title: 'Croissance Mensuelle',
      value: `${monthlyGrowth >= 0 ? '+' : ''}${monthlyGrowth.toFixed(1)}%`,
      icon: monthlyGrowth >= 0 ? TrendingUp : TrendingDown,
      color: monthlyGrowth >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600',
      trend: monthlyGrowth >= 0 ? 'up' : 'down',
    },
    {
      title: 'Taux de Recouvrement',
      value: `${globalRecoveryRate.toFixed(1)}%`,
      icon: Target,
      color: globalRecoveryRate >= 80 
        ? 'bg-green-100 text-green-600' 
        : globalRecoveryRate >= 60
        ? 'bg-orange-100 text-orange-600'
        : 'bg-red-100 text-red-600',
      trend: null,
    },
    {
      title: 'Retards / Revenus',
      value: `${overdueToRevenueRatio.toFixed(1)}%`,
      icon: AlertCircle,
      color: overdueToRevenueRatio < 15
        ? 'bg-green-100 text-green-600'
        : overdueToRevenueRatio > 0
        ? 'bg-red-100 text-red-600'
        : 'bg-green-100 text-green-600',
      trend: null,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Statistiques Avancées */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <Card key={idx} className="p-4 hover:shadow-lg transition-all hover:scale-105">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Top Performers & Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 3 Écoles */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Award className="w-6 h-6 text-yellow-600" />
            <h3 className="text-lg font-semibold text-gray-900">Top 3 Écoles (Revenus)</h3>
          </div>
          <div className="space-y-3">
            {topSchools.map((school, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                    idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : 'bg-orange-600'
                  }`}>
                    {idx + 1}
                  </div>
                  <span className="font-medium text-gray-900">{school.schoolName}</span>
                </div>
                <span className="text-lg font-bold text-[#2A9D8F]">
                  {formatCurrency(school.totalRevenue)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Performance & Attention */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Performance</h3>
          </div>
          <div className="space-y-4">
            {/* Meilleure performance */}
            {bestPerformer && (
              <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <Badge className="bg-green-600">Meilleure Performance</Badge>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <p className="font-semibold text-gray-900 mb-1">{bestPerformer.schoolName}</p>
                <p className="text-sm text-gray-600">
                  Taux de recouvrement: <span className="font-bold text-green-600">{bestPerformer.recoveryRate.toFixed(1)}%</span>
                </p>
              </div>
            )}

            {/* Nécessite attention */}
            {needsAttention && needsAttention.recoveryRate < 70 && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="destructive">Nécessite Attention</Badge>
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <p className="font-semibold text-gray-900 mb-1">{needsAttention.schoolName}</p>
                <p className="text-sm text-gray-600">
                  Taux de recouvrement: <span className="font-bold text-red-600">{needsAttention.recoveryRate.toFixed(1)}%</span>
                </p>
                <p className="text-xs text-red-700 mt-2">
                  ⚠️ Action requise: Intensifier les relances
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Objectifs & Benchmarks */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Objectifs & Benchmarks</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Marge bénéficiaire */}
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Marge Bénéficiaire</p>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-2xl font-bold text-gray-900">{stats.profitMargin.toFixed(1)}%</span>
              <span className="text-sm text-gray-500 mb-1">/ 20% objectif</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  stats.profitMargin >= 20 ? 'bg-green-500' : stats.profitMargin >= 15 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min((stats.profitMargin / 20) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Taux recouvrement */}
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Taux de Recouvrement</p>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-2xl font-bold text-gray-900">{globalRecoveryRate.toFixed(1)}%</span>
              <span className="text-sm text-gray-500 mb-1">/ 85% objectif</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  globalRecoveryRate >= 85 ? 'bg-green-500' : globalRecoveryRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min((globalRecoveryRate / 85) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Retards */}
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Retards / Revenus</p>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-2xl font-bold text-gray-900">
                {overdueToRevenueRatio.toFixed(1)}%
              </span>
              <span className="text-sm text-gray-500 mb-1">/ 10% max</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  overdueToRevenueRatio <= 10 ? 'bg-green-500' : overdueToRevenueRatio <= 15 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min((overdueToRevenueRatio / 20) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

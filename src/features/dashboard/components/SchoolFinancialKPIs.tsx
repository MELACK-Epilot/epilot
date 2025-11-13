/**
 * KPIs Financiers pour une École
 * Design uniforme avec les autres pages (glassmorphism)
 */

import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  AlertCircle,
  Target,
  CreditCard,
  Percent,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SchoolFinancialKPIsProps {
  stats: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    overdueAmount: number;
    recoveryRate: number;
    totalStudents?: number;
  };
  schoolDetails: {
    nombreElevesActuels: number;
    nombreEnseignants: number;
    nombreClasses: number;
    couleurPrincipale: string;
  };
  isLoading?: boolean;
}

export const SchoolFinancialKPIs = ({
  stats,
  schoolDetails,
  isLoading = false,
}: SchoolFinancialKPIsProps) => {
  const profitMargin = stats.totalRevenue > 0
    ? ((stats.netProfit / stats.totalRevenue) * 100)
    : 0;

  const revenuePerStudent = schoolDetails.nombreElevesActuels > 0
    ? stats.totalRevenue / schoolDetails.nombreElevesActuels
    : 0;

  const expensePerStudent = schoolDetails.nombreElevesActuels > 0
    ? stats.totalExpenses / schoolDetails.nombreElevesActuels
    : 0;

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(2)}M FCFA`;
    }
    return `${(amount / 1000).toFixed(0)}K FCFA`;
  };

  const kpis = [
    {
      title: 'Revenus Totaux',
      value: formatCurrency(stats.totalRevenue),
      subtitle: `${formatCurrency(revenuePerStudent)}/élève`,
      icon: DollarSign,
      gradient: 'from-emerald-500 to-teal-600',
      iconBg: 'bg-emerald-500/20',
      trend: '+12.5%',
      trendPositive: true,
    },
    {
      title: 'Dépenses Totales',
      value: formatCurrency(stats.totalExpenses),
      subtitle: `${formatCurrency(expensePerStudent)}/élève`,
      icon: CreditCard,
      gradient: 'from-rose-500 to-red-600',
      iconBg: 'bg-rose-500/20',
      trend: '+8.2%',
      trendPositive: false,
    },
    {
      title: 'Profit Net',
      value: formatCurrency(stats.netProfit),
      subtitle: `Marge: ${profitMargin.toFixed(1)}%`,
      icon: stats.netProfit >= 0 ? TrendingUp : TrendingDown,
      gradient: stats.netProfit >= 0 ? 'from-blue-500 to-indigo-600' : 'from-orange-500 to-red-600',
      iconBg: stats.netProfit >= 0 ? 'bg-blue-500/20' : 'bg-orange-500/20',
      trend: stats.netProfit >= 0 ? 'Bénéfice' : 'Déficit',
      trendPositive: stats.netProfit >= 0,
    },
    {
      title: 'Élèves',
      value: schoolDetails.nombreElevesActuels.toString(),
      subtitle: `${schoolDetails.nombreClasses} classes • ${schoolDetails.nombreEnseignants} enseignants`,
      icon: Users,
      gradient: 'from-purple-500 to-pink-600',
      iconBg: 'bg-purple-500/20',
      trend: `${(schoolDetails.nombreElevesActuels / schoolDetails.nombreClasses).toFixed(0)} élèves/classe`,
      trendPositive: true,
    },
    {
      title: 'Retards de Paiement',
      value: formatCurrency(stats.overdueAmount),
      subtitle: `${((stats.overdueAmount / stats.totalRevenue) * 100).toFixed(1)}% du CA`,
      icon: AlertCircle,
      gradient: 'from-amber-500 to-orange-600',
      iconBg: 'bg-amber-500/20',
      trend: stats.overdueAmount > 0 ? 'À recouvrer' : 'Aucun retard',
      trendPositive: stats.overdueAmount === 0,
    },
    {
      title: 'Taux de Recouvrement',
      value: `${stats.recoveryRate.toFixed(1)}%`,
      subtitle: 'Performance de collecte',
      icon: Target,
      gradient: 'from-cyan-500 to-blue-600',
      iconBg: 'bg-cyan-500/20',
      trend: stats.recoveryRate >= 80 ? 'Excellent' : stats.recoveryRate >= 60 ? 'Bon' : 'À améliorer',
      trendPositive: stats.recoveryRate >= 80,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-40 bg-gray-100 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon;

        return (
          <Card
            key={kpi.title}
            className="relative overflow-hidden backdrop-blur-xl bg-white/80 border border-gray-200/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
          >
            {/* Gradient Background Glassmorphism */}
            <div className={`absolute inset-0 bg-gradient-to-br ${kpi.gradient} opacity-10`} />
            <div className="absolute inset-0 bg-white/40 backdrop-blur-sm" />

            <div className="relative p-6">
              {/* Icon + Badge */}
              <div className="flex items-start justify-between mb-4">
                <div 
                  className="p-3 rounded-2xl shadow-lg"
                  style={{ 
                    background: `linear-gradient(135deg, ${schoolDetails.couleurPrincipale}20, ${schoolDetails.couleurPrincipale}10)`,
                    border: `1px solid ${schoolDetails.couleurPrincipale}30`
                  }}
                >
                  <Icon 
                    className="w-7 h-7" 
                    style={{ color: schoolDetails.couleurPrincipale }} 
                  />
                </div>
                
                {kpi.trend && (
                  <Badge
                    variant={kpi.trendPositive ? 'default' : 'secondary'}
                    className={`text-xs font-semibold ${
                      kpi.trendPositive 
                        ? 'bg-green-100 text-green-700 border-green-200' 
                        : 'bg-orange-100 text-orange-700 border-orange-200'
                    }`}
                  >
                    {kpi.trend}
                  </Badge>
                )}
              </div>

              {/* Title */}
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                {kpi.title}
              </p>

              {/* Value */}
              <p className="text-3xl font-bold text-gray-900 mb-2 leading-none">
                {kpi.value}
              </p>

              {/* Subtitle */}
              <p className="text-sm text-gray-600 font-medium">
                {kpi.subtitle}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

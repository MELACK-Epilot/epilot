/**
 * KPIs Financiers pour Admin Groupe
 * 5 indicateurs clés + Sélecteur École Interactif
 * @module FinancialKPIs
 */

import { TrendingUp, TrendingDown, DollarSign, CreditCard, Wallet, AlertCircle, TrendingDown as TrendDown } from 'lucide-react';
import { AnimatedContainer, AnimatedItem } from './AnimatedCard';
import { SchoolQuickSelector } from './SchoolQuickSelector';
import type { GroupFinancialStats } from '../hooks/useGroupFinances';

interface SchoolSummary {
  schoolId: string;
  schoolName: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  overdueAmount: number;
  recoveryRate: number;
}

interface FinancialKPIsProps {
  stats: GroupFinancialStats | undefined;
  isLoading: boolean;
  schools?: SchoolSummary[];
}

export const FinancialKPIs = ({ stats, isLoading, schools = [] }: FinancialKPIsProps) => {
  const kpis = [
    {
      title: 'Revenus Totaux',
      value: `${((stats?.totalRevenue || 0) / 1000000).toFixed(1)}M`,
      suffix: 'FCFA',
      trend: stats?.revenueGrowth || 12,
      icon: DollarSign,
      gradient: 'from-[#2A9D8F] to-[#238b7e]',
      iconBg: 'bg-[#2A9D8F]/20',
      iconColor: 'text-white',
    },
    {
      title: 'Dépenses Totales',
      value: `${((stats?.totalExpenses || 0) / 1000000).toFixed(1)}M`,
      suffix: 'FCFA',
      trend: -(stats?.expensesGrowth || 8),
      icon: CreditCard,
      gradient: 'from-[#E63946] to-[#c72f3a]',
      iconBg: 'bg-[#E63946]/20',
      iconColor: 'text-white',
    },
    {
      title: 'Solde',
      value: `${((stats?.balance || 0) / 1000000).toFixed(1)}M`,
      suffix: 'FCFA',
      trend: 18,
      icon: Wallet,
      gradient: 'from-[#1D3557] to-[#0F1F35]',
      iconBg: 'bg-[#1D3557]/20',
      iconColor: 'text-white',
    },
    {
      title: 'Marge Bénéficiaire',
      value: `${(stats?.profitMargin || 0).toFixed(1)}%`,
      trend: 2,
      icon: TrendingUp,
      gradient: 'from-[#E9C46A] to-[#D4AF37]',
      iconBg: 'bg-[#E9C46A]/20',
      iconColor: 'text-white',
    },
    {
      title: 'Paiements en Retard',
      value: `${((stats?.totalOverdue || 0) / 1000000).toFixed(1)}M`,
      suffix: 'FCFA',
      trend: -5,
      icon: AlertCircle,
      gradient: 'from-[#E63946] to-[#c72f3a]',
      iconBg: 'bg-[#E63946]/20',
      iconColor: 'text-white',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <AnimatedContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" stagger={0.05}>
      {/* KPIs Classiques */}
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const isPositive = kpi.trend >= 0;
        
        return (
          <AnimatedItem key={kpi.title}>
            <div className={`relative overflow-hidden bg-gradient-to-br ${kpi.gradient} rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.03] cursor-pointer border border-white/10`}>
              {/* Cercles décoratifs animés */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 group-hover:scale-150 transition-transform duration-700" />
              
              {/* Contenu */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 ${kpi.iconBg} backdrop-blur-sm rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-7 w-7 ${kpi.iconColor}`} />
                  </div>
                  {kpi.trend !== 0 && (
                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm shadow-lg">
                      {isPositive ? (
                        <TrendingUp className="h-3.5 w-3.5 text-white/90" />
                      ) : (
                        <TrendDown className="h-3.5 w-3.5 text-white/90" />
                      )}
                      <span className="text-xs font-bold text-white/90">
                        {isPositive ? '+' : ''}{kpi.trend}%
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-white/70 text-sm font-semibold mb-2 tracking-wide uppercase">{kpi.title}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-white drop-shadow-lg">{kpi.value}</span>
                  {kpi.suffix && <span className="text-sm font-medium text-white/70">{kpi.suffix}</span>}
                </div>
              </div>
            </div>
          </AnimatedItem>
        );
      })}

      {/* Sélecteur École Interactif */}
      {schools.length > 0 && (
        <AnimatedItem>
          <SchoolQuickSelector schools={schools} />
        </AnimatedItem>
      )}
    </AnimatedContainer>
  );
};

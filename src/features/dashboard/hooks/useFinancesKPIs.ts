/**
 * 🎯 Hook KPIs Finances
 * Calcul et formatage des indicateurs clés
 * @module useFinancesKPIs
 */

import { useMemo } from 'react';
import { DollarSign, TrendingUp, AlertCircle, type LucideIcon } from 'lucide-react';
import { EPILOT_COLORS } from '@/styles/palette';
import type { GroupFinancialStats } from './useGroupFinances';

export interface KPI {
  title: string;
  value: string;
  trend: number;
  color: string;
  icon: LucideIcon;
}

/**
 * Génère les 4 KPIs essentiels à partir des stats financières
 */
export const useFinancesKPIs = (stats: GroupFinancialStats | undefined): KPI[] => {
  return useMemo(() => [
    {
      title: 'Revenus Totaux',
      value: `${((stats?.totalRevenue || 0) / 1000000).toFixed(1)}M`,
      trend: stats?.revenueGrowth || 0,
      color: EPILOT_COLORS.primary.teal,
      icon: DollarSign,
    },
    {
      title: 'Solde Net',
      value: `${((stats?.balance || 0) / 1000000).toFixed(1)}M`,
      trend: 15, // Valeur par défaut en attendant balanceGrowth
      color: EPILOT_COLORS.primary.blue,
      icon: TrendingUp,
    },
    {
      title: 'Marge',
      value: `${(stats?.profitMargin || 0).toFixed(1)}%`,
      trend: 2, // Valeur par défaut en attendant marginGrowth
      color: EPILOT_COLORS.primary.gold,
      icon: TrendingUp,
    },
    {
      title: 'Retards',
      value: `${((stats?.totalOverdue || 0) / 1000000).toFixed(1)}M`,
      trend: -5, // Valeur par défaut en attendant overdueGrowth
      color: EPILOT_COLORS.primary.red,
      icon: AlertCircle,
    },
  ], [stats]);
};

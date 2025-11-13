/**
 * Graphique d'évolution financière
 * Affiche Revenus vs Dépenses sur 12 mois
 */

import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { MonthlyFinancialData } from '../hooks/useFinancialHistory';

interface FinancialEvolutionChartProps {
  data: MonthlyFinancialData[];
  isLoading?: boolean;
  title?: string;
  selectedPeriod?: number;
  onPeriodChange?: (period: number) => void;
}

export const FinancialEvolutionChart = ({ 
  data, 
  isLoading = false,
  title = "Évolution Financière",
  selectedPeriod = 12,
  onPeriodChange
}: FinancialEvolutionChartProps) => {
  
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="h-80 bg-gray-100 animate-pulse rounded" />
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="h-80 flex items-center justify-center text-gray-500">
          <p>Pas assez de données historiques</p>
        </div>
      </Card>
    );
  }

  // Calculer les tendances
  const firstMonth = data[0];
  const lastMonth = data[data.length - 1];
  const revenueGrowth = firstMonth.revenue > 0 
    ? ((lastMonth.revenue - firstMonth.revenue) / firstMonth.revenue) * 100 
    : 0;
  const expensesGrowth = firstMonth.expenses > 0
    ? ((lastMonth.expenses - firstMonth.expenses) / firstMonth.expenses) * 100
    : 0;

  const formatCurrency = (value: number) => {
    return `${(value / 1000000).toFixed(1)}M`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{payload[0].payload.monthLabel}</p>
          <div className="space-y-1">
            <p className="text-sm text-[#2A9D8F]">
              Revenus: {formatCurrency(payload[0].value)} FCFA
            </p>
            <p className="text-sm text-[#E63946]">
              Dépenses: {formatCurrency(payload[1].value)} FCFA
            </p>
            <p className="text-sm text-gray-700 font-semibold">
              Profit: {formatCurrency(payload[0].payload.profit)} FCFA
            </p>
            <p className="text-sm text-gray-600">
              Marge: {payload[0].payload.margin.toFixed(1)}%
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center gap-4">
          {/* Sélecteur de période */}
          {onPeriodChange && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <Select value={selectedPeriod.toString()} onValueChange={(v) => onPeriodChange(parseInt(v))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 mois</SelectItem>
                  <SelectItem value="6">6 mois</SelectItem>
                  <SelectItem value="12">12 mois</SelectItem>
                  <SelectItem value="24">24 mois</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {/* Tendances */}
          <div className="flex gap-4">
          <div className="flex items-center gap-2">
            {revenueGrowth >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
            <span className={`text-sm font-medium ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Revenus {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            {expensesGrowth >= 0 ? (
              <TrendingUp className="w-4 h-4 text-orange-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-green-600" />
            )}
            <span className={`text-sm font-medium ${expensesGrowth >= 0 ? 'text-orange-600' : 'text-green-600'}`}>
              Dépenses {expensesGrowth >= 0 ? '+' : ''}{expensesGrowth.toFixed(1)}%
            </span>
          </div>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="monthLabel" 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tickFormatter={formatCurrency}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          <Line 
            type="monotone" 
            dataKey="revenue" 
            stroke="#2A9D8F" 
            strokeWidth={3}
            name="Revenus"
            dot={{ fill: '#2A9D8F', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="expenses" 
            stroke="#E63946" 
            strokeWidth={3}
            name="Dépenses"
            dot={{ fill: '#E63946', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Légende personnalisée */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-600">Revenus Moyens</p>
            <p className="text-lg font-bold text-[#2A9D8F]">
              {formatCurrency(data.reduce((sum, d) => sum + d.revenue, 0) / data.length)} FCFA
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Dépenses Moyennes</p>
            <p className="text-lg font-bold text-[#E63946]">
              {formatCurrency(data.reduce((sum, d) => sum + d.expenses, 0) / data.length)} FCFA
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Marge Moyenne</p>
            <p className="text-lg font-bold text-gray-900">
              {(data.reduce((sum, d) => sum + d.margin, 0) / data.length).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};

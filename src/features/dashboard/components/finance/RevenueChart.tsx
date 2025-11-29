/**
 * RevenueChart - Graphique d'évolution des revenus
 * Ligne sur 12 mois
 * @module RevenueChart
 */

import { Card } from '@/components/ui/card';
import { TrendingUp, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { RevenueChartData } from '../../hooks/useRevenueChart';

interface RevenueChartProps {
  data?: RevenueChartData[];
  isLoading?: boolean;
}

export const RevenueChart = ({ data, isLoading }: RevenueChartProps) => {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-[300px] bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#2A9D8F]" />
          Évolution des Revenus
        </h3>
        <div className="h-[300px] flex items-center justify-center text-gray-500">
          <div className="text-center">
            <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Aucune donnée disponible</p>
          </div>
        </div>
      </Card>
    );
  }

  // Calculer les statistiques
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const avgRevenue = totalRevenue / data.length;
  const lastMonthRevenue = data[data.length - 1]?.revenue || 0;
  const previousMonthRevenue = data[data.length - 2]?.revenue || 0;
  const growth = previousMonthRevenue > 0 
    ? ((lastMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
    : 0;

  // Formater les valeurs pour l'affichage
  const formatRevenue = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#2A9D8F]" />
            Évolution des Revenus
          </h3>
          <p className="text-sm text-gray-500">12 derniers mois</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">
            {formatRevenue(lastMonthRevenue)} FCFA
          </p>
          <p className={`text-sm flex items-center gap-1 justify-end ${
            growth >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            <TrendingUp className={`w-4 h-4 ${growth < 0 ? 'rotate-180' : ''}`} />
            {growth >= 0 ? '+' : ''}{growth.toFixed(1)}% vs mois dernier
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="label" 
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
            tickFormatter={formatRevenue}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              padding: '12px',
            }}
            formatter={(value: number) => [`${value.toLocaleString()} FCFA`, 'Revenus']}
            labelStyle={{ fontWeight: 'bold', marginBottom: '8px' }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          <Line 
            type="monotone" 
            dataKey="revenue" 
            stroke="#2A9D8F" 
            strokeWidth={3}
            dot={{ fill: '#2A9D8F', r: 4 }}
            activeDot={{ r: 6 }}
            name="Revenus"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Statistiques supplémentaires */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Total 12 Mois</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatRevenue(totalRevenue)} FCFA
          </p>
          <p className="text-xs text-gray-400">Paiements reçus</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Moyenne Mensuelle</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatRevenue(avgRevenue)} FCFA
          </p>
          <p className="text-xs text-gray-400">Sur 12 mois</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Mois en Cours</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatRevenue(lastMonthRevenue)} FCFA
          </p>
          <p className="text-xs text-gray-400">Paiements reçus</p>
        </div>
      </div>
    </Card>
  );
};

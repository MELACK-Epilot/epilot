/**
 * Composant TrendChart - Graphiques de tendances pour le dashboard directeur
 * Utilise Recharts pour des graphiques interactifs et responsives
 */

import { memo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Calendar, BarChart3 } from 'lucide-react';

interface TrendData {
  period: string;
  eleves: number;
  taux_reussite: number;
  revenus: number;
  enseignants: number;
}

interface TrendChartProps {
  data: TrendData[];
  title: string;
  period: 'month' | 'quarter' | 'year';
  onPeriodChange: (period: 'month' | 'quarter' | 'year') => void;
  className?: string;
}

const TrendChart = memo(({ 
  data, 
  title, 
  period, 
  onPeriodChange, 
  className = '' 
}: TrendChartProps) => {
  
  // Calcul des tendances
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const latestData = data[data.length - 1];
  const previousData = data[data.length - 2];
  
  const trends = {
    eleves: calculateTrend(latestData?.eleves || 0, previousData?.eleves || 0),
    taux_reussite: calculateTrend(latestData?.taux_reussite || 0, previousData?.taux_reussite || 0),
    revenus: calculateTrend(latestData?.revenus || 0, previousData?.revenus || 0)
  };

  const formatPeriod = (period: string) => {
    const date = new Date(period);
    return date.toLocaleDateString('fr-FR', { 
      month: 'short', 
      year: period === 'year' ? 'numeric' : undefined 
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{formatPeriod(label)}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-600">{entry.name}:</span>
              <span className="font-medium text-gray-900">
                {entry.name === 'Revenus' 
                  ? `${(entry.value / 1000000).toFixed(1)}M FCFA`
                  : entry.name === 'Taux Réussite'
                  ? `${entry.value}%`
                  : entry.value
                }
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={`p-6 bg-white border-0 shadow-lg rounded-2xl ${className}`}>
      {/* Header avec contrôles */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-md">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">Évolution sur les derniers mois</p>
          </div>
        </div>
        
        {/* Sélecteur de période */}
        <div className="flex items-center gap-2">
          {(['month', 'quarter', 'year'] as const).map((p) => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPeriodChange(p)}
              className={`gap-2 ${
                period === p 
                  ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <Calendar className="h-4 w-4" />
              {p === 'month' && 'Mois'}
              {p === 'quarter' && 'Trimestre'}
              {p === 'year' && 'Année'}
            </Button>
          ))}
        </div>
      </div>

      {/* Indicateurs de tendance */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <div className={`p-2 rounded-lg ${trends.eleves >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
            {trends.eleves >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </div>
          <div>
            <p className="text-sm text-gray-600">Élèves</p>
            <p className={`font-semibold ${trends.eleves >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trends.eleves >= 0 ? '+' : ''}{trends.eleves.toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <div className={`p-2 rounded-lg ${trends.taux_reussite >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
            {trends.taux_reussite >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </div>
          <div>
            <p className="text-sm text-gray-600">Taux Réussite</p>
            <p className={`font-semibold ${trends.taux_reussite >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trends.taux_reussite >= 0 ? '+' : ''}{trends.taux_reussite.toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <div className={`p-2 rounded-lg ${trends.revenus >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
            {trends.revenus >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </div>
          <div>
            <p className="text-sm text-gray-600">Revenus</p>
            <p className={`font-semibold ${trends.revenus >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trends.revenus >= 0 ? '+' : ''}{trends.revenus.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Graphique principal */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorEleves" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorTaux" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorRevenus" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="period" 
              tickFormatter={formatPeriod}
              stroke="#6B7280"
              fontSize={12}
            />
            <YAxis stroke="#6B7280" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            <Area
              type="monotone"
              dataKey="eleves"
              stroke="#3B82F6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorEleves)"
              name="Élèves"
            />
            <Area
              type="monotone"
              dataKey="taux_reussite"
              stroke="#10B981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorTaux)"
              name="Taux Réussite"
            />
            <Area
              type="monotone"
              dataKey="revenus"
              stroke="#F59E0B"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRevenus)"
              name="Revenus"
              yAxisId="right"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
});

TrendChart.displayName = 'TrendChart';

export default TrendChart;

/**
 * Panneau de prévisions financières avec IA
 * Affiche les prévisions et recommandations
 */

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, Lightbulb, AlertTriangle, CheckCircle2, Brain } from 'lucide-react';
import { forecastFinancials, generateRecommendations, detectAnomalies } from '@/utils/financialForecasting';
import { MonthlyFinancialData } from '../hooks/useFinancialHistory';
import { useState } from 'react';

interface FinancialForecastPanelProps {
  historicalData: MonthlyFinancialData[];
  currentStats: {
    totalRevenue: number;
    totalExpenses: number;
    profitMargin: number;
  };
}

export const FinancialForecastPanel = ({ historicalData, currentStats }: FinancialForecastPanelProps) => {
  const [forecastMonths, setForecastMonths] = useState(3);
  
  if (!historicalData || historicalData.length < 3) {
    return (
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Prévisions IA</h3>
        </div>
        <p className="text-sm text-gray-600">
          Pas assez de données historiques pour générer des prévisions.
          <br />
          Minimum 3 mois requis.
        </p>
      </Card>
    );
  }

  const forecasts = forecastFinancials(historicalData, forecastMonths);
  const recommendations = generateRecommendations(forecasts, currentStats);
  const anomalies = detectAnomalies(historicalData);

  // Combiner données historiques et prévisions pour le graphique
  const chartData = [
    ...historicalData.slice(-6).map(d => ({
      month: d.monthLabel,
      revenue: d.revenue,
      expenses: d.expenses,
      type: 'historical',
    })),
    ...forecasts.map(f => ({
      month: f.monthLabel,
      forecastRevenue: f.predictedRevenue,
      forecastExpenses: f.predictedExpenses,
      confidence: f.confidence,
      type: 'forecast',
    })),
  ];

  const formatCurrency = (value: number) => {
    return `${(value / 1000000).toFixed(1)}M`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border-2 border-purple-200 rounded-lg shadow-xl">
          <p className="font-semibold text-gray-900 mb-2">{data.month}</p>
          {data.type === 'historical' ? (
            <>
              <p className="text-sm text-[#2A9D8F]">Revenus: {formatCurrency(data.revenue)} FCFA</p>
              <p className="text-sm text-[#E63946]">Dépenses: {formatCurrency(data.expenses)} FCFA</p>
            </>
          ) : (
            <>
              <p className="text-sm text-purple-600">Prévision Revenus: {formatCurrency(data.forecastRevenue)} FCFA</p>
              <p className="text-sm text-orange-600">Prévision Dépenses: {formatCurrency(data.forecastExpenses)} FCFA</p>
              <p className="text-xs text-gray-600 mt-1">Confiance: {data.confidence.toFixed(0)}%</p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Graphique Prévisions */}
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Prévisions IA</h3>
          </div>
          <div className="flex gap-2">
            {[3, 6, 12].map((months) => (
              <Button
                key={months}
                size="sm"
                variant={forecastMonths === months ? 'default' : 'outline'}
                onClick={() => setForecastMonths(months)}
                className={forecastMonths === months ? 'bg-purple-600 hover:bg-purple-700' : ''}
              >
                {months} mois
              </Button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2A9D8F" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#2A9D8F" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#9333EA" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#9333EA" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '11px' }} />
            <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} tickFormatter={formatCurrency} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#2A9D8F"
              strokeWidth={2}
              fill="url(#colorRevenue)"
              name="Revenus Réels"
            />
            <Area
              type="monotone"
              dataKey="forecastRevenue"
              stroke="#9333EA"
              strokeWidth={2}
              strokeDasharray="5 5"
              fill="url(#colorForecast)"
              name="Prévisions"
            />
            <Line
              type="monotone"
              dataKey="expenses"
              stroke="#E63946"
              strokeWidth={2}
              name="Dépenses Réelles"
            />
            <Line
              type="monotone"
              dataKey="forecastExpenses"
              stroke="#F97316"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Prévisions Dépenses"
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Indicateurs prévisions */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-purple-200">
          {forecasts.slice(0, 3).map((forecast, idx) => (
            <div key={idx} className="text-center">
              <p className="text-xs text-gray-600 mb-1">{forecast.monthLabel}</p>
              <p className="text-lg font-bold text-purple-600">
                {formatCurrency(forecast.predictedRevenue)} FCFA
              </p>
              <div className="flex items-center justify-center gap-1 mt-1">
                {forecast.trend === 'up' ? (
                  <TrendingUp className="w-3 h-3 text-green-600" />
                ) : forecast.trend === 'down' ? (
                  <TrendingDown className="w-3 h-3 text-red-600" />
                ) : null}
                <span className="text-xs text-gray-500">
                  Confiance: {forecast.confidence.toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recommandations */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Lightbulb className="w-6 h-6 text-yellow-600" />
          <h3 className="text-lg font-semibold text-gray-900">Recommandations IA</h3>
        </div>
        <div className="space-y-3">
          {recommendations.map((rec, idx) => {
            const isPositive = rec.includes('✅');
            const isWarning = rec.includes('⚠️');
            const isCritical = rec.includes('🔴');

            return (
              <div
                key={idx}
                className={`p-4 rounded-lg border-l-4 ${
                  isCritical
                    ? 'bg-red-50 border-red-500'
                    : isWarning
                    ? 'bg-orange-50 border-orange-500'
                    : isPositive
                    ? 'bg-green-50 border-green-500'
                    : 'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="flex items-start gap-3">
                  {isCritical ? (
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  ) : isPositive ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <Lightbulb className="w-5 h-5 text-orange-600 mt-0.5" />
                  )}
                  <p className="text-sm text-gray-800 flex-1">{rec}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Anomalies détectées */}
      {anomalies.length > 0 && (
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Anomalies Détectées ({anomalies.length})
            </h3>
          </div>
          <div className="space-y-2">
            {anomalies.slice(0, 5).map((anomaly, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant={anomaly.severity === 'high' ? 'destructive' : 'secondary'}>
                    {anomaly.severity}
                  </Badge>
                  <span className="text-sm font-medium">{anomaly.month}</span>
                  <span className="text-sm text-gray-600">
                    {anomaly.type === 'revenue' ? 'Revenus' : 'Dépenses'}
                  </span>
                </div>
                <span className={`text-sm font-semibold ${anomaly.deviation > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {anomaly.deviation > 0 ? '+' : ''}{anomaly.deviation.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

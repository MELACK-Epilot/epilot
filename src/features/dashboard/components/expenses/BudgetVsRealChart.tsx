/**
 * Graphique comparaison Budget vs Réel par catégorie
 * @module BudgetVsRealChart
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Card } from '@/components/ui/card';

interface BudgetData {
  category: string;
  budget: number;
  real: number;
  color: string;
}

interface BudgetVsRealChartProps {
  data: BudgetData[];
  title?: string;
}

export const BudgetVsRealChart = ({ data, title = 'Budget vs Réel' }: BudgetVsRealChartProps) => {
  const chartData = data.map(item => ({
    name: item.category,
    Budget: item.budget,
    Réel: item.real,
    écart: item.real - item.budget,
    percentage: ((item.real / item.budget) * 100).toFixed(0),
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isOver = data.Réel > data.Budget;
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{data.name}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-blue-600">Budget:</span>
              <span className="font-medium">{data.Budget.toLocaleString()} FCFA</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className={isOver ? 'text-red-600' : 'text-green-600'}>Réel:</span>
              <span className="font-medium">{data.Réel.toLocaleString()} FCFA</span>
            </div>
            <div className="flex justify-between gap-4 pt-1 border-t">
              <span className="text-gray-600">Écart:</span>
              <span className={`font-medium ${isOver ? 'text-red-600' : 'text-green-600'}`}>
                {isOver ? '+' : ''}{data.écart.toLocaleString()} FCFA
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-600">Utilisation:</span>
              <span className={`font-medium ${parseFloat(data.percentage) > 100 ? 'text-red-600' : 'text-green-600'}`}>
                {data.percentage}%
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span className="text-gray-600">Budget</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span className="text-gray-600">Réel (OK)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-gray-600">Réel (Dépassé)</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={100}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="Budget" fill="#3B82F6" radius={[8, 8, 0, 0]} />
          <Bar dataKey="Réel" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.Réel > entry.Budget ? '#EF4444' : '#10B981'} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Résumé */}
      <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Budget Total</p>
          <p className="text-lg font-bold text-blue-600">
            {chartData.reduce((sum, item) => sum + item.Budget, 0).toLocaleString()} FCFA
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Dépensé</p>
          <p className="text-lg font-bold text-gray-900">
            {chartData.reduce((sum, item) => sum + item.Réel, 0).toLocaleString()} FCFA
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Écart Global</p>
          <p className={`text-lg font-bold ${chartData.reduce((sum, item) => sum + item.écart, 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {chartData.reduce((sum, item) => sum + item.écart, 0).toLocaleString()} FCFA
          </p>
        </div>
      </div>
    </Card>
  );
};

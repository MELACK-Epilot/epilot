/**
 * Graphiques Donut pour Revenus et Dépenses par catégorie
 * Design moderne avec animations
 */

import { Card } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { DollarSign, TrendingDown } from 'lucide-react';

interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
}

interface FinancialDonutChartsProps {
  revenueData: CategoryData[];
  expenseData: CategoryData[];
  isLoading?: boolean;
}

// ✅ COULEURS OFFICIELLES E-PILOT
const REVENUE_COLORS = ['#2A9D8F', '#1D3557', '#E9C46A', '#238b7e', '#457B9D'];
const EXPENSE_COLORS = ['#E63946', '#E9C46A', '#1D3557', '#c72f3a', '#457B9D'];

export const FinancialDonutCharts = ({ 
  revenueData, 
  expenseData, 
  isLoading = false 
}: FinancialDonutChartsProps) => {
  
  const formatCurrency = (value: number) => {
    return `${(value / 1000000).toFixed(1)}M FCFA`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border-2 border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{payload[0].name}</p>
          <p className="text-sm text-gray-600">{formatCurrency(payload[0].value)}</p>
          <p className="text-xs text-gray-500">{payload[0].payload.percentage.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
    if (percentage < 5) return null; // Ne pas afficher si < 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-bold"
      >
        {`${percentage.toFixed(0)}%`}
      </text>
    );
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i} className="p-6">
            <div className="h-80 bg-gray-100 animate-pulse rounded" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Revenus par Catégorie */}
      <Card className="p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <DollarSign className="w-5 h-5 text-[#2A9D8F]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Revenus par Catégorie</h3>
            <p className="text-sm text-gray-500">
              {formatCurrency(revenueData.reduce((sum, d) => sum + d.amount, 0))} total
            </p>
          </div>
        </div>

        {revenueData && revenueData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={revenueData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={90}
                  innerRadius={50}
                  fill="#8884d8"
                  dataKey="amount"
                  nameKey="category"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {revenueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={REVENUE_COLORS[index % REVENUE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Légende personnalisée */}
            <div className="mt-4 space-y-2">
              {revenueData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded transition-colors">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: REVENUE_COLORS[index % REVENUE_COLORS.length] }}
                    />
                    <span className="text-sm text-gray-700">{item.category}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.amount)}</p>
                    <p className="text-xs text-gray-500">{item.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            <p>Aucune donnée de revenus</p>
          </div>
        )}
      </Card>

      {/* Dépenses par Catégorie */}
      <Card className="p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-100 rounded-lg">
            <TrendingDown className="w-5 h-5 text-[#E63946]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Dépenses par Catégorie</h3>
            <p className="text-sm text-gray-500">
              {formatCurrency(expenseData.reduce((sum, d) => sum + d.amount, 0))} total
            </p>
          </div>
        </div>

        {expenseData && expenseData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={90}
                  innerRadius={50}
                  fill="#8884d8"
                  dataKey="amount"
                  nameKey="category"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Légende personnalisée */}
            <div className="mt-4 space-y-2">
              {expenseData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded transition-colors">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: EXPENSE_COLORS[index % EXPENSE_COLORS.length] }}
                    />
                    <span className="text-sm text-gray-700">{item.category}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.amount)}</p>
                    <p className="text-xs text-gray-500">{item.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            <p>Aucune donnée de dépenses</p>
          </div>
        )}
      </Card>
    </div>
  );
};
